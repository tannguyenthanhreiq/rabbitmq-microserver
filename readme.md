# Clean

Clean code

```sh
$ sudo rabbitmqctl purge_queue transcoding_queue
$ sudo rabbitmqctl purge_queue transcoding_video
```

# Pm2

Start workers

```sh
$ pm2 start ecosystem.config.js
```

Stop workers

```sh
$ pm2 stop
```

Log a specific worker

```sh
$ pm2 log (id of worker)
```

# rabbitmq

Check the status of rabbitmq

```sh
$ sudo systemctl status rabbitmq-server
```
