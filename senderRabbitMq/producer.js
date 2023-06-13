const amqp = require("amqplib");

//step 1 : Connect to the rabbitmq server
//step 2 : Create a new channel on that connection
//step 3 : Create the exchange
//step 4 : Publish the message to the exchange with a routing key

class Producer {
  channel;

  async createChannel() {
    const connection = await amqp.connect(
      "amqp://guest:guest@0.tcp.ap.ngrok.io:11505"
    );
    this.channel = await connection.createChannel();
  }

  async publishMessage(message) {
    if (!this.channel) {
      await this.createChannel();
    }

    const queue = "transcoding_queue";
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    console.log(`Sent message to RabbitMQ: ${message}`);
    console.log(`The  sent to exchange `);
    return message;
  }
}

module.exports = Producer;
