import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import Jimp from "jimp";   

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export const resizeImage = async (event) => {
  for (const record of event.Records) {
    try {
      const s3Event = JSON.parse(record.body).Records[0].s3;
      const bucket = s3Event.bucket.name;
      const key = s3Event.object.key;

      if (key.startsWith('resized/')) {
        console.log('Skipping already resized image: ', key);
        continue;
      }

      const getImage = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const buffer = await streamToBuffer(getImage.Body);

      const image = await Jimp.read(buffer); 
      image.resize(640, 640);  
      const resizedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);

      const newKey = key.startsWith('uploads/')
        ? key.replace('uploads/', 'resized/')
        : `resized/${key}`;

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: newKey,
        Body: resizedBuffer,
        ContentType: 'image/png'
      }));

      console.log('Resized image saved to: ', newKey);
    } catch (err) {
      console.error('Resized image error: ', err);
    }
  }
};
