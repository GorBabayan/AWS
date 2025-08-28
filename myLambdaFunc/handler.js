import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as generateSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });
export const getSignedUrl = async (event) => {
    try {
        const fileName = event.queryStringParameters?.fileName;
        const contentType = event.queryStringParameters?.contentType;

        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: fileName,
            ContentType: contentType,
        });

        const signedUrl = await generateSignedUrl(s3, command, { expiresIn: 60 });

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ uploadUrl: signedUrl }),
        };
    } catch(error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Not signed url" }),
        };
    }
} 