import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs"
import * as dotenv from 'dotenv'
dotenv.config()
// const s3Client = new S3Client(config);
// export const bucketParams_type = {
//     Bucket: "jason0802",
//     // Specify the name of the new object. For example, 'index.html'.
//     // To create a directory for the object, use '/'. For example, 'myApp/package.json'.
//     Key: "csv file",
//     // Content of the new object.
//     Body: fileStream,
//   };
const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});
// Create and upload the object to the S3 bucket.
export const run = async (bucketParams) => {

  try {
    const data = await s3Client.send(new PutObjectCommand(bucketParams));
    return data; // For unit tests.
    console.log(
      "Successfully uploaded object: " +
      bucketParams.Bucket +
      "/" +
      bucketParams.Key
    );
  } catch (err) {
    console.log("Error", err);
  }
};