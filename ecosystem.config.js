module.exports = {
  apps: [
    {
      name: "consumerRabbitMq",
      script: "./consumerRabbitMq/consumeFromRabbitMQ.js",
      instances: 3, // Số lượng instances bạn muốn chạy
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        RABBITMQ_URL: "amqp://guest:guest@6.tcp.ngrok.io:11539",
        SERVER_URL: "https://dev-api-academy.megalithinc.com",
      },
    },
  ],
};
