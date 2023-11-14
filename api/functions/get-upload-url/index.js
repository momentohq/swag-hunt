const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { CredentialProvider, CacheClient, Configurations, CacheGet, CacheSet } = require('@gomomento/sdk');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const short = require('short-uuid');

const secrets = new SecretsManagerClient();
const s3 = new S3Client();
let cacheClient;
let cachedSecrets;

exports.handler = async (event) => {
  try {
    let { fileName, referenceNumber, adminOverride } = event.queryStringParameters ?? {};
    await setupCacheClient();
    if (!referenceNumber) {
      referenceNumber = short.generate();
    } else {
      let result = await cacheClient.get(process.env.CACHE_NAME, referenceNumber);
      if (result instanceof CacheGet.Error) {
        console.error('Error loading saved params from cache', result.errorCode(), result.message());
      } else if (result instanceof CacheGet.Hit) {
        return {
          statusCode: 200,
          body: result.value(),
          headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
        };
      }
    }

    const extension = fileName.split('.').pop().toLowerCase();

    const key = `quarantine/${referenceNumber}.${extension}`;
    const contentType = getContentType(extension);

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        referencenumber: referenceNumber,
        ...(adminOverride && adminOverride === cachedSecrets.admin) && { adminoverride: "momento" }
      },
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    const response = JSON.stringify({
      presignedUrl: presignedUrl,
      referenceNumber: referenceNumber,
    });

    result = await cacheClient.set(process.env.CACHE_NAME, referenceNumber, response);
    if (result instanceof CacheSet.Error) {
      console.error('Error caching value', result.errorCode(), result.message());
    }

    return {
      statusCode: 200,
      body: response,
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    }
  }
};

const getContentType = (extension) => {
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };

  return mimeTypes[extension];
};

const setupCacheClient = async () => {
  if (cacheClient) {
    return;
  }

  if (!cachedSecrets) {
    const secretResponse = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }));
    cachedSecrets = JSON.parse(secretResponse.SecretString);
  }

  cacheClient = await CacheClient.create({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString({ apiKey: cachedSecrets.momento }),
    defaultTtlSeconds: 300
  });
};
