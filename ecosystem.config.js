module.exports = {
  apps: [
    {
      name: "consumerRabbitMq",
      script: "./consumerRabbitMq/consumeFromRabbitMQ.js",
      instances: 3, // Số lượng instances bạn muốn chạy
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        RABBITMQ_URL: "amqp://tannguyen:514723@34.173.207.107:5672",
        SERVER_URL: "https://dev-api-academy.megalithinc.com",
      },
    },
  ],
};
