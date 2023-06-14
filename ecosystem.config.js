module.exports = {
  apps: [
    {
      name: "consumerRabbitMq",
      script: "./consumerRabbitMq/consumeFromRabbitMQ.js",
      instances: 4, // Số lượng instances bạn muốn chạy
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
