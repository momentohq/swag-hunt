const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient, QueryCommand} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall} = require('@aws-sdk/util-dynamodb');
const { CredentialProvider, CacheClient, Configurations, CacheGet, CacheSet } = require('@gomomento/sdk');

const ddb = new DynamoDBClient();
const secrets = new SecretsManagerClient();
let cacheClient;

exports.handler = async (event) => {
  try {

  }catch(err){
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
}

const setupCacheClient = async () => {
  if (cacheClient) {
    return;
  }

  const secretResponse = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }));
  const secret = JSON.parse(secretResponse.SecretString);
  cacheClient = await CacheClient.create({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento }),
    defaultTtlSeconds: 60
  });
};
