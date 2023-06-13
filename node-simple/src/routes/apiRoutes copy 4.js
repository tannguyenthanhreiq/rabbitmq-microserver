const { Storage, TransferManager } = require("@google-cloud/storage");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { Router } = require("express");
const { spawn } = require("child_process");
const apiRoutes = () => {
  const router = Router();
  router.post("/transcode-video", async (req, res) => {
    try {
      const fileName = req.body.file;
      const bucketName = req.body.bucket;
      const storage = new Storage({
        projectId: "re-academy",
        keyFilename: path.join(__dirname, "../../re-academy.json"),
      });
      const bucket = storage.bucket(bucketName);

      const inputPath = encodeURI(
        `https://storage.googleapis.com/${bucketName}/${fileName}`
      );
      // const inputPath = encodeURI(`gs://${bucketName}/${fileName}`);

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
      // const videoHeight = 720;

      // Step 2: Determine resolutions to transcode
      const resolutions = [];
      if (videoHeight >= 360) resolutions.push(360);
      if (videoHeight >= 720) resolutions.push(720);
      if (videoHeight >= 1080) resolutions.push(1080);

      await transcodeVideo(inputPath, outputPath, resolutions, bucket);

      res.status(200).json({ message: "Video transcoded" });
    } catch (error) {
      console.log("error", error?.message);
      res.json(error.message);
    }
  });
  return router;
};

// Step 1: Get video information
async function getVideoInfo(inputPath) {
  // const encodedInputPath = encodeFileName(inputPath);
  console.log(inputPath);
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
async function transcodeVideo(inputPath, outputPath, resolutions, bucket) {
  console.log("Starting transcode video for ", inputPath);
  const streams = [];

  // Build FFmpeg command
  const args = ["-hide_banner", "-y", "-i", inputPath];

  if (resolutions.includes(360)) {
    const m3u8WriteStream = bucket
      .file(`${outputPath}/360p.m3u8`)
      .createWriteStream();
    streams.push(m3u8WriteStream);
    const m4sWriteStream = bucket
      .file(`${outputPath}/360p.m4s`)
      .createWriteStream();
    streams.push(m4sWriteStream);
    args.push(
      ...[
        "-vf",
        "scale=w=640:h=360:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2",
        "-c:a",
        "aac",
        "-ar",
        "48000",
        "-c:v",
        "libx264",
        "-profile:v",
        "main",
        "-crf",
        "23",
        "-maxrate",
        "800k",
        "-bufsize",
        "1200k",
        "-b:a",
        "96k",
        "-hls_time",
        "4",
        "-hls_playlist_type",
        "vod",
        "-hls_flags",
        "single_file+independent_segments",
        "-hls_segment_type",
        "fmp4",
        "-hls_segment_filename",
        "pipe:2",
        "-f",
        "hls",
        "pipe:1",
      ]
    );
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    // Pipe FFmpeg output to the writable streams
    console.log("streams", streams);
    streams.forEach((stream, index) => {
      ffmpeg.stdio[index + 1].pipe(stream);
    });

    // Pipe FFmpeg output to the writable streams
    console.log("tet is", ffmpeg.stdio);

    ffmpeg.stderr.on("data", (data) => console.error(`FFmpeg stderr: ${data}`));

    ffmpeg.on("error", (error) => {
      console.error(`Error: ${error.message}`);
      reject(new Error(`Error transcoding video: ${error.message}`));
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log("Conversion completed.");
        resolve("Conversion completed.");
      } else {
        console.error(`FFmpeg exited with code ${code}`);
        reject(
          new Error(`Error transcoding video: FFmpeg exited with code ${code}`)
        );
      }
    });
  });
}

module.exports = apiRoutes;
