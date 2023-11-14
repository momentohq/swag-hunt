const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const s3 = new S3Client();

exports.handler = async (state) => {
  try {
    const image = await loadImageBuffer(state.key);
    const webpBuffer = await sharp(image)
      .resize({
        width: 1920,
        height: 1280,
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
