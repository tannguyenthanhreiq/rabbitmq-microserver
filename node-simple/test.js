// const axios = require("axios");
// const { GoogleAuth } = require("google-auth-library");
// const path = require("path");
const ampq = require("amqplib");

/**
 * Triggered from a change to a Cloud Storage bucket.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.helloGCS = async (event, context) => {
  const file = event.name;
  const bucket = event.bucket;
  console.log("event contentType", event.contentType);
  console.log("is include raw-content", file);
  if (!event.contentType?.includes("video") || !file.includes("raw-content")) {
    console.log("function closed");
    return;
  }
  const connection = await amqp.connect(
    "amqp://guest:guest@0.tcp.ap.ngrok.io:11505"
  );
  const channel = await connection.createChannel();
  const queue = "transcoding_queue";

  await channel.assertQueue(queue, { durable: true });

  const message = JSON.stringify({ file, bucket });
  channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

  console.log(`Sent message to RabbitMQ: ${message}`);

  await channel.close();
  await connection.close();

  // const auth = new GoogleAuth({
  //   keyFilename: path.join(__dirname, "./re-academy.json"),
  //   scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  // });
  // // Replace with your Cloud Run service URL
  // const CLOUD_RUN_SERVICE_URL =
  //   "https://transcode-video-6njst46jha-uc.a.run.app/api/transcode-video";
  // try {
  //   const client = await auth.getClient();
  //   const accessToken = await client.getAccessToken();
  //   console.log(`Got access token: ${accessToken.token}`);
  //   const response = await axios.post(
  //     CLOUD_RUN_SERVICE_URL,
  //     {
  //       file: file,
  //       bucket: bucket,
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${accessToken.token}`,
  //       },
  //     }
  //   );
  //   console.log(`Sent request to transcode: ${file}`);
  // } catch (error) {
  //   console.error(`Error sending request to transcode: ${file}`);
  // }
};
