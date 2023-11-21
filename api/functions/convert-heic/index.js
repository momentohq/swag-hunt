const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const convert = require('heic-convert');
const sharp = require('sharp');

const s3 = new S3Client();

exports.handler = async (state) => {
  try {
    const object = await loadImageBuffer(state.key);
    const buffer = await convert({
      buffer: object,
      format: 'PNG'
    });

    const metadata = await sharp(buffer).metadata();

    let resizeOptions;
    if (metadata.width > metadata.height) {
      resizeOptions = { width: 1920, height: 1280 };
    } else {
      resizeOptions = { width: 1280, height: 1920 };
    }

    const resized = await sharp(buffer)
      .resize({
        width: resizeOptions.width,
        height: resizeOptions.height,
        fit: 'inside',
        withoutEnlargement: true
      }).toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: state.key,
      Body: resized,
      ContentType: 'image/x-png',
      Metadata: {
        referencenumber: getReferenceNumber(state.key),
      },
    }));

    return { convert_success: true };
  }
  catch (err) {
    console.error(err);
    return { convert_success: false }
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
