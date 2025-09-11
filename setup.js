import { S3Client, PutBucketNotificationConfigurationCommand } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION ?? "us-east-1";
const s3 = new S3Client({ region });

export const setupNotification = async () => {
    const bucketName = process.env.BUCKET_NAME;
    const queueArn = process.env.QUEUE_ARN;

    const command = new PutBucketNotificationConfigurationCommand({
        Bucket: bucketName,
        NotificationConfiguration: {
            QueueConfigurations: [
                {
                    Id: "S3ToSqs",
                    Events: ["s3:ObjectCreated:*"],
                    QueueArn: queueArn,
                    Filter: {
                        Key: {
                            FilterRules: [
                                { Name: "prefix", Value: "uploads/" }
                            ]
                        }
                    }
                }
            ]
        }
    });

    await s3.send(command);
    return { statusCode: 200, body: "Done" };
}