const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const s3 = new S3Client();

exports.handler = async (state) => {
  try {
    const object = await loadImageBuffer(state.key);
    const image = sharp(object);
    const metadata = await image.metadata();

    // Calculate new dimensions while maintaining aspect ratio
    const maxPixels = 10000; // Max pixels
    const aspectRatio = metadata.width / metadata.height;
    let newWidth, newHeight;

    if (metadata.width > metadata.height) {
      newWidth = Math.sqrt(maxPixels * aspectRatio);
      newHeight = maxPixels / newWidth;
    } else {
      newHeight = Math.sqrt(maxPixels / aspectRatio);
      newWidth = maxPixels / newHeight;
    }

    // Resize the image
    const resizedImage = await image.resize(Math.round(newWidth), Math.round(newHeight)).toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: state.key,
      Body: resizedImage,
      ContentType: metadata.format,
      Metadata: {
        referencenumber: getReferenceNumber(state.key),
      },
    }));

    return { convert_success: true }
  } catch (error) {
    console.error(error);
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
