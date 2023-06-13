// const { Storage, TransferManager } = require("@google-cloud/storage");
// const { exec } = require("child_process");
// const path = require("path");
// const fs = require("fs");

// const { Router } = require("express");
// const apiRoutes = () => {
//   const router = Router();
//   router.post("/transcode-video", async (req, res) => {
//     try {
//       const fileName = req.body.file;
//       const bucketName = req.body.bucket;

//       const inputPath = encodeURI(
//         `https://storage.googleapis.com/${bucketName}/${fileName}`
//       );
//       const arrFile = fileName.split("/");
//       const instructorId = arrFile[1];
//       const contentId = arrFile[2];
//       const videoName = arrFile[3];
//       if (!videoName.includes(".mp4") || !(instructorId && contentId)) {
//         throw new Error("Invalid input");
//       }
//       const outputPath = `transcoded-videos/${instructorId}/${contentId}`;

//       const videoInfo = await getVideoInfo(inputPath);
//       const videoHeight = videoInfo.streams[0].height;

//       // Step 2: Determine resolutions to transcode
//       const resolutions = [];
//       if (videoHeight >= 360) resolutions.push(360);
//       if (videoHeight >= 480) resolutions.push(480);
//       if (videoHeight >= 720) resolutions.push(720);

//       await createOutputDirectories(outputPath);
//       const command = `ffmpeg -hide_banner -y -i ${inputPath} \
//       -vf "scale=w=640:h=360:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v h264 -profile:v main -preset slow -crf 23 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod  -b:v 800k -maxrate 856k -bufsize 1200k -b:a 96k -hls_segment_filename ${outputPath}/360/360p_%03d.ts ${outputPath}/360/360p.m3u8 \
//       -vf "scale=w=842:h=480:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v h264 -profile:v main -preset slow -crf 22 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 1400k -maxrate 1498k -bufsize 2100k -b:a 128k -hls_segment_filename ${outputPath}/480/480p_%03d.ts ${outputPath}/480/480p.m3u8 \
//       -vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v h264 -profile:v main -preset slow -crf 21 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 2800k -maxrate 2996k -bufsize 4200k -b:a 128k -hls_segment_filename ${outputPath}/720/720p_%03d.ts ${outputPath}/720/720p.m3u8 \
//       -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v h264 -profile:v main -preset slow -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 5000k -maxrate 5350k -bufsize 7500k -b:a 192k -hls_segment_filename ${outputPath}/1080/1080p_%03d.ts ${outputPath}/1080/1080p.m3u8`;

//       console.log("starting ffmpeg conversion");
//       exec(command, async (error, stdout, stderr) => {
//         if (error) {
//           console.error(`Error: ${error.message}`);
//           res.status(500).send(error.message);
//           return;
//         }

//         createMasterPlaylist(outputPath);
//         console.log("Conversion completed.");
//         console.log("Starting transfer files to storage");
//         await transferFileToGcs(bucketName, outputPath);
//         console.log("Transfer completed.");
//         console.log("Starting delete output directory");
//         deleteFolderDirectory(outputPath);
//         console.log("Output directory deleted.");

//         res.status(200).send("Conversion completed.");
//       });
//     } catch (error) {
//       res.json(error);
//     }
//   });
//   return router;
// };

// // Step 1: Get video information
// async function getVideoInfo(inputPath) {
//   return new Promise((resolve, reject) => {
//     const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json ${inputPath}`;
//     exec(command, (error, stdout) => {
//       if (error) {
//         reject(new Error(`Error obtaining video info: ${error.message}`));
//       } else {
//         const videoInfo = JSON.parse(stdout);
//         resolve(videoInfo);
//       }
//     });
//   });
// }

// // Step 3: Transcode video with compatible bitrates
// async function transcodeVideo(inputPath, outputPath, resolutions) {
//   const commands = [];

//   if (resolutions.includes(360)) {
//     commands.push(
//       `-vf "scale=w=640:h=360:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -preset slow -crf 23 -maxrate 800k -bufsize 1200k -b:a 96k -hls_time 4 -hls_playlist_type vod -hls_segment_filename ${outputPath}/360/360p_%03d.ts ${outputPath}/360/360p.m3u8`
//     );
//   }
//   if (resolutions.includes(480)) {
//     commands.push(
//       `-vf "scale=w=842:h=480:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -preset slow -crf 22 -maxrate 1400k -bufsize 2100k -b:a 128k -hls_time 4 -hls_playlist_type vod -hls_segment_filename ${outputPath}/480/480p_%03d.ts ${outputPath}/480/480p.m3u8`
//     );
//   }
//   if (resolutions.includes(720)) {
//     commands.push(
//       `-vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -preset slow -crf 21 -maxrate 2800k -bufsize 4200k -b:a 128k -hls_time 4 -hls_playlist_type vod -hls_segment_filename ${outputPath}/720/720p_%03d.ts ${outputPath}/720/720p.m3u8`
//     );
//   }
//   if (resolutions.includes(1080)) {
//     commands.push(
//       `-vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease:eval=frame,scale=w=ceil(iw/2)*2:h=ceil(ih/2)*2" -c:a aac -ar 48000 -c:v libx264 -profile:v main -preset slow -crf 20 -maxrate 5350k -bufsize 7500k -b:a 192k -hls_time 4 -hls_playlist_type vod -hls_segment_filename ${outputPath}/1080/1080p_%03d.ts ${outputPath}/1080/1080p.m3u8`
//     );
//   }

//   const command = `ffmpeg -hide_banner -y -i ${inputPath} ${commands.join(
//     " "
//   )}`;

//   return new Promise((resolve, reject) => {
//     exec(command, async (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error: ${error.message}`);
//         reject(new Error(`Error transcoding video: ${error.message}`));
//       } else {
//         createMasterPlaylist(outputPath);
//         console.log("Conversion completed.");
//         console.log("Starting transfer files to storage");
//         await transferFileToGcs(bucketName, outputPath);
//         console.log("Transfer completed.");
//         console.log("Starting delete output directory");
//         deleteFolderDirectory(outputPath);
//         console.log("Output directory deleted.");
//         resolve("Conversion completed.");
//       }
//     });
//   });
// }

// function createMasterPlaylist(outputPath) {
//   const masterPlaylistContent = `#EXTM3U
// #EXT-X-VERSION:3
// #EXT-X-STREAM-INF:BANDWIDTH=960000,RESOLUTION=640x360
// 360/360p.m3u8
// #EXT-X-STREAM-INF:BANDWIDTH=1648000,RESOLUTION=842x480
// 480/480p.m3u8
// #EXT-X-STREAM-INF:BANDWIDTH=5408000,RESOLUTION=1280x720
// 720/720p.m3u8
// #EXT-X-STREAM-INF:BANDWIDTH=10208000,RESOLUTION=1920x1080
// 1080/1080p.m3u8
// `;

//   fs.writeFile(`${outputPath}/manifest.m3u8`, masterPlaylistContent, (err) => {
//     if (err) {
//       console.error(`Error writing master playlist file: ${err.message}`);
//       return;
//     }

//     console.log("Master playlist file created.");
//   });
// }

// async function createOutputDirectories(outputPath) {
//   fs.mkdirSync(outputPath, { recursive: true });
//   fs.mkdirSync(`${outputPath}/360`, { recursive: true });
//   fs.mkdirSync(`${outputPath}/480`, { recursive: true });
//   fs.mkdirSync(`${outputPath}/720`, { recursive: true });
//   fs.mkdirSync(`${outputPath}/1080`, { recursive: true });
// }

// async function deleteFolderDirectory(path) {
//   fs.rmSync(path, {
//     recursive: true,
//   });
//   console.log("File deleted successfully");
// }

// async function transferFileToGcs(bucketName, outputPath) {
//   const gcs = new Storage({
//     projectId: "re-academy",
//     keyFilename: path.join(__dirname, "../../re-academy.json"),
//   });

//   const transferManager = new TransferManager(gcs.bucket(bucketName));
//   await transferManager.uploadManyFiles(outputPath, {
//     passthroughOptions: {
//       onUploadProgress: (progress) => {
//         console.log(progress);
//       },
//     },
//   });
// }

// module.exports = apiRoutes;
