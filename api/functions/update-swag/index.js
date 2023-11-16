const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const Filter = require('bad-words');
const filter = new Filter({ placeHolder: '' });

const sfn = new SFNClient();
const secrets = new SecretsManagerClient();
let cachedSecrets;

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

    const { from, type} = event.pathParameters;
    const body = JSON.parse(event.body);

    const tags = body.tags?.map(tag => {
      if (!filter.isProfane(tag)) {
        return tag.toLowerCase();
      }
    })?.filter(t => t).join(',');

    const response = await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.UPDATE_SWAG_STATE_MACHINE,
      input: JSON.stringify({
        from: from.toLowerCase().trim(),
        type: type.toLowerCase().trim(),
        newFrom: body.from.toLowerCase().trim(),
        newType: body.type.toLowerCase().trim(),
        url: body.url.trim(),
        ...body.location && { location: filter.clean(body.location).trim() },
        tags
      })
    }));

    return {
      statusCode: 202,
      body: JSON.stringify({ id: response.executionArn.split(':').pop() }),
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
