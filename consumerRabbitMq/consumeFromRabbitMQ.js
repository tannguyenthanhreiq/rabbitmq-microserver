const amqp = require("amqplib");

async function processMessage(message) {
  const { file, bucket } = JSON.parse(message.content.toString());

  console.log(
    `Received message from RabbitMQ: fileURL=${file}, bucketName=${bucket}`
  );

  // TODO: Add your transcoding logic here
}

async function consumeFromRabbitMQ() {
  const connection = await amqp.connect(
    "amqp://guest:guest@0.tcp.ap.ngrok.io:11505"
  );
  const channel = await connection.createChannel();
  const queue = "transcoding_queue";

  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(1);

  console.log("Waiting for messages in RabbitMQ...");

  channel.consume(queue, async (message) => {
    await processMessage(message);
    channel.ack(message);
  });
}

consumeFromRabbitMQ();
