const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { CredentialProvider, CacheClient, Configurations, CacheGet, CacheSet } = require('@gomomento/sdk');

const ddb = new DynamoDBClient();
const secrets = new SecretsManagerClient();
let cacheClient;

exports.handler = async (event) => {
  try {
    await setupCacheClient();
    const swagKey = `${event.pathParameters.from.toLowerCase().trim()}#${event.pathParameters.type.toLowerCase().trim()}`;
    const cacheResponse = await cacheClient.get(process.env.CACHE_NAME, swagKey);
    if (cacheResponse instanceof CacheGet.Hit) {
      const data = JSON.parse(cacheResponse.value());
      return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
    else if (cacheResponse instanceof CacheGet.Error) {
      console.error(cacheResponse.errorCode(), cacheResponse.message());
    }

    const response = await ddb.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: marshall({
        ':pk': swagKey
      })
    }));

    if (!response.Items?.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'That swag could not be found' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
    let swagResponse = { additionalImages: [] };
    for (const item of response.Items) {
      const data = unmarshall(item);
      if (data.sk == 'swag') {
        swagResponse = {
          ...swagResponse,
          from: data.from,
          type: data.swagType,
          url: data.url,
          upvotes: data.sort,
          ...data.location && { location: data.location }
        }
      } else {
        swagResponse.additionalImages.push(data.url);
      }
    }

    const setResponse = await cacheClient.set(process.env.CACHE_NAME, swagKey, JSON.stringify(swagResponse));
    if (setResponse instanceof CacheSet.Error) {
      console.error(setResponse.errorCode(), setResponse.message());
    }

    return {
      statusCode: 200,
      body: JSON.stringify(swagResponse),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
};

const setupCacheClient = async () => {
  if (cacheClient) {
    return;
  }

  const secretResponse = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }));
  const secret = JSON.parse(secretResponse.SecretString);
  cacheClient = await CacheClient.create({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento }),
    defaultTtlSeconds: 90
  });
};
