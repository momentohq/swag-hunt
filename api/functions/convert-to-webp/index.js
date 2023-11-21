const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { CredentialProvider, CacheClient, Configurations, CacheSet } = require('@gomomento/sdk');
const sharp = require("sharp");

const s3 = new S3Client();
const secrets = new SecretsManagerClient();
let cacheClient;

exports.handler = async (state) => {
  try {
    const image = await loadImageBuffer(state.key);
    const metadata = await sharp(image).metadata();

    let resizeOptions;
    if (metadata.width > metadata.height) {
      resizeOptions = { width: 1920, height: 1280 };
    } else {
      resizeOptions = { width: 1280, height: 1920 };
    }

    const webpBuffer = await sharp(image)
      .rotate()
      .resize({
        width: resizeOptions.width,
        height: resizeOptions.height,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 80,
        reductionEffort: 4
      })
      .toBuffer();

    const referenceNumber = getReferenceNumber(state.key);
    const convertedKey = `public/${referenceNumber}.webp`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: convertedKey,
      Body: webpBuffer,
      ContentType: 'image/webp',
      Metadata: {
        referencenumber: referenceNumber,
      },
    }));

    try {
      await setupCacheClient();
      const cacheResponse = await cacheClient.set(process.env.CACHE_NAME, convertedKey, webpBuffer, { ttl: 2505600000 });
      if (cacheResponse instanceof CacheSet.Error) {
        console.error(cacheResponse.errorCode(), cacheResponse.message());
      }
    } catch (err) {
      console.warn(err);
    }

    return { key: convertedKey };
  } catch (error) {
    console.error("Error: ", error);
    return { statusCode: 500, body: 'Failed to convert the image' };
  }
};

const getReferenceNumber = (key) => {
  return key.split('/')[1].split('.')[0];
};

const loadImageBuffer = async (key) => {
  const response = await s3.send(new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key
  }));

  const stream = response.Body;
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
  });
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
