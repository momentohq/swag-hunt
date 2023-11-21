const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
const { DynamoDBClient, DeleteItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const sfn = new SFNClient();
const ddb = new DynamoDBClient();
const secrets = new SecretsManagerClient();

exports.handler = async (event) => {
  try {
    const adminOverride = getMomentoAdminHeader(event.headers);
    const adminSecret = await getAdminSecret();
    if (!adminOverride || adminOverride !== adminSecret) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'You cannot access this endpoint' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }

    const { from, type } = event.pathParameters;
    const url = event.queryStringParameters?.imageUrl?.trim();

    const response = await ddb.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: marshall({
        ':pk': `${from.toLowerCase().trim()}#${type.toLowerCase().trim()}`
      })
    }));

    if (!response.Count) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'The swag could not be found' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }

    const items = response.Items.map(item => unmarshall(item));
    if (url) {
      const itemToDelete = items.find(i => i.url == url);
      if (!itemToDelete) {
        return {
          statusCode: 204,
          headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
        };
      }

      if (itemToDelete.sk.startsWith('additionalImage')) {
        // This is an additional item and can be deleted safely on its own
        await ddb.send(new DeleteItemCommand({
          TableName: process.env.TABLE_NAME,
          Key: marshall({
            pk: itemToDelete.pk,
            sk: itemToDelete.sk
          })
        }));


      } else {
        // This is a main swag image and things need to shuffle around
        await sfn.send(new StartExecutionCommand({
          stateMachineArn: process.env.ADJUST_SWAG_STATE_MACHINE,
          input: JSON.stringify({
            from,
            type,
            tags: itemToDelete.tags ?? ''
          })
        }));
      }

      return {
        statusCode: 204,
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    } else {
      const swagRecord = items.find(i => i.sk == 'swag');
      await sfn.send(new StartExecutionCommand({
        stateMachineArn: process.env.ADJUST_SWAG_STATE_MACHINE,
        input: JSON.stringify({
          from,
          type,
          tags: swagRecord.tags ?? ''
        })
      }));

      return {
        statusCode: 204,
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
};

const getAdminSecret = async () => {
  if (!cachedSecrets) {
    const secretResponse = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }));
    cachedSecrets = JSON.parse(secretResponse.SecretString);
  }

  return cachedSecrets.admin;
};

const getMomentoAdminHeader = (headers) => {
  for (let key in headers) {
    if (headers.hasOwnProperty(key)) {
      if (key.toLowerCase() === 'x-momento-admin-override') {
        return headers[key];
      }
    }
  }
};
