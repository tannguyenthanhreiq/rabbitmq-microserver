require("dotenv").config();
const amqp = require("amqplib");
const { Storage, TransferManager } = require("@google-cloud/storage");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

async function processMessage(message) {
  try {
    const { name, bucket } = JSON.parse(message.content.toString());

    console.log(
      `Received message from RabbitMQ: fileURL=${name}, bucketName=${bucket}`
    );

    if (name && bucket) {
      const fileName = name;
      const bucketName = bucket;

      const inputPath = encodeURI(
        `https://storage.googleapis.com/${bucketName}/${fileName}`
      );
      const arrFile = fileName.split("/");
      const instructorId = arrFile[1];
      const lectureId = arrFile[2];
      const videoName = arrFile[3];
      console.log(instructorId, lectureId, videoName);
      if (!videoName.includes(".mp4") || !(instructorId && lectureId)) {
        throw new Error("Invalid input");
      }
      const outputPath = `transcoded-videos/${instructorId}/${lectureId}`;

      const videoInfo = await getVideoInfo(inputPath);
      const videoHeight = videoInfo.streams[0].height;

      // Step 2: Determine resolutions to transcode
      const resolutions = [];
      // if (videoHeight >= 360) resolutions.push(360);
      if (videoHeight >= 480) resolutions.push(480);
      if (videoHeight >= 720) resolutions.push(720);
      if (videoHeight >= 1080) resolutions.push(1080);

      await createOutputDirectories(outputPath);

      const transcodePromises = resolutions.map((resolution) =>
        transcodeVideo(inputPath, outputPath, resolution)
      );
      await Promise.all(transcodePromises);
      createMasterPlaylist(outputPath, resolutions);
      await transferFileToGcs(bucketName, outputPath);
      await sendMetadataToServer({
        metadata: {
          lectureId,
          transcodedVideoUrl: `https://storage.googleapis.com/${bucketName}/transcoded-videos/${instructorId}/${lectureId}/manifest.m3u8`,
          status: "finished",
        },
      });
      deleteFolderDirectory(outputPath);
    }
  } catch (error) {
    console.log(`Error processing message: ${error}`);
  }
}

async function consumeFromRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  console.log(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  const queue = "transcoding_queue";

  await channel.assertQueue(queue, { durable: true });
  await channel.prefetch(1);

  console.log("Waiting for messages in RabbitMQ...");

  await channel.consume(queue, async (message) => {
    try {
      await processMessage(message);
      channel.ack(message);
    } catch (error) {
      console.log({ error });
    }
  });
}

async function sendMetadataToServer(metadata) {
  try {
    const response = await axios.post(
      `${process.env.SERVER_URL}/webhook/processing-transcode-video`,
      metadata
    );
    console.log(response?.data);
  } catch (error) {
    console.error(`Error sending metadata to server: ${error}`);
    throw new Error(`Error sending metadata to server: ${error}`);
  }
}

// Step 1: Get video information
async function getVideoInfo(inputPath) {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json '${inputPath}'`;
    exec(command, (error, stdout) => {
      if (error) {
        reject(new Error(`Error obtaining video info: ${error.message}`));
      } else {
        const videoInfo = JSON.parse(stdout);
        console.log("Video info obtained");
        resolve(videoInfo);
      }
    });
  });
}

// Step 3: Transcode video with compatible bitrates
async function transcodeVideo(inputPath, outputPath, resolution) {
  console.log("Starting for ", inputPath);
  const commands = [];

  // if (resolutions.includes(360)) {
  //   commands.push(
  //     `-vf "scale=w=640:h=360:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -crf 23 -maxrate 800k -bufsize 1200k -b:a 96k -hls_time 4 -hls_playlist_type vod -hls_flags single_file+independent_segments -hls_segment_type fmp4  -hls_segment_filename ${outputPath}/360p.m4s ${outputPath}/360p.m3u8`
  //   );
  // }
  if (resolution === 480) {
    commands.push(
      `-vf "scale=w=842:h=480:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -crf 22 -maxrate 1400k -bufsize 2100k -b:a 128k -hls_time 4 -hls_playlist_type vod -hls_flags single_file+independent_segments -hls_segment_type fmp4 -hls_segment_filename ${outputPath}/480p.m4s ${outputPath}/480p.m3u8`
    );
  } else if (resolution === 720) {
    commands.push(
      `-vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -crf 21 -maxrate 2800k -bufsize 4200k -b:a 128k -hls_time 4 -hls_playlist_type vod -hls_flags single_file+independent_segments -hls_segment_type fmp4 -hls_segment_filename ${outputPath}/720p.m4s ${outputPath}/720p.m3u8`
    );
  } else if (resolution === 1080) {
    commands.push(
      `-vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -crf 20 -maxrate 5350k -bufsize 7500k -b:a 192k -hls_time 4 -hls_playlist_type vod -hls_flags single_file+independent_segments -hls_segment_type fmp4 -hls_segment_filename ${outputPath}/1080p.m4s ${outputPath}/1080p.m3u8`
    );
  }

  const command = `ffmpeg -hide_banner -y -i '${inputPath}' ${commands.join(
    " "
  )}`;

  return new Promise((resolve, reject) => {
    const transcodingProcess = exec(command);

    let duration;
    let currentTime;

    transcodingProcess.stderr.on("data", (data) => {
      const str = data.toString();
      let match = str.match(/Duration: ([\d:.]+)/);
      if (match) {
        const timeParts = match[1].split(":");
        duration = +timeParts[0] * 60 * 60 + +timeParts[1] * 60 + +timeParts[2];
      }
      match = str.match(/time=([\d:.]+)/);
      if (match) {
        const timeParts = match[1].split(":");
        currentTime =
          +timeParts[0] * 60 * 60 + +timeParts[1] * 60 + +timeParts[2];
      }

      if (duration && currentTime) {
        const percentage = ((currentTime / duration) * 100).toFixed(2);
        console.log(
          `Transcoding progress for ${resolution} - ${inputPath}: ${percentage}%`
        );
      }
    });

    transcodingProcess.stdout.on("data", (data) => {
      console.log(`FFMPEG finished for ${resolution}:\n${data}`);
    });

    transcodingProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("Conversion completed.");
        resolve("Conversion completed.");
      } else {
        console.error(`Error: FFMPEG process exited with code ${code}`);
        reject(
          new Error(
            `Error transcoding video: FFMPEG process exited with code ${code}`
          )
        );
      }
    });
  });
}

function createMasterPlaylist(outputPath, resolutions) {
  try {
    let masterPlaylistContent = "#EXTM3U\n#EXT-X-VERSION:3\n";
    // if (resolutions.includes(360)) {
    //   masterPlaylistContent +=
    //     "#EXT-X-STREAM-INF:BANDWIDTH=960000,RESOLUTION=640x360\n360p.m3u8\n";
    // }
    if (resolutions.includes(480)) {
      masterPlaylistContent +=
        "#EXT-X-STREAM-INF:BANDWIDTH=1648000,RESOLUTION=842x480\n480p.m3u8\n";
    }
    if (resolutions.includes(720)) {
      masterPlaylistContent +=
        "#EXT-X-STREAM-INF:BANDWIDTH=5408000,RESOLUTION=1280x720\n720p.m3u8\n";
    }
    if (resolutions.includes(1080)) {
      masterPlaylistContent +=
        "#EXT-X-STREAM-INF:BANDWIDTH=10208000,RESOLUTION=1920x1080\n1080p.m3u8\n";
    }

    fs.writeFile(
      `${outputPath}/manifest.m3u8`,
      masterPlaylistContent,
      (err) => {
        if (err) {
          console.error(`Error writing master playlist file: ${err.message}`);
          return;
        }

        console.log("Master playlist file created.");
      }
    );
  } catch (error) {
    throw new Error(`Error creating master playlist: ${error}`);
  }
}

async function createOutputDirectories(outputPath) {
  try {
    fs.mkdirSync(outputPath, { recursive: true });
  } catch (error) {
    throw new Error(`Error creating output directories: ${error}`);
  }
}

function deleteFolderDirectory(path) {
  try {
    console.log("Starting delete output directory");
    fs.rmSync(path, {
      recursive: true,
    });
    console.log("Output directory deleted.");
  } catch (error) {
    throw new Error(`Error deleting output directory: ${error}`);
  }
}

async function transferFileToGcs(bucketName, outputPath) {
  try {
    console.log("Starting transfer files to storage");
    const gcs = new Storage({
      projectId: "re-academy",
      keyFilename: path.join(__dirname, "./re-academy.json"),
    });

    const transferManager = new TransferManager(gcs.bucket(bucketName));
    await transferManager.uploadManyFiles(outputPath);
    console.log("Transfer completed.");
  } catch (error) {
    throw new Error(`Error transferring files to storage: ${error}`);
  }
}

consumeFromRabbitMQ();
