// const { Storage, TransferManager } = require("@google-cloud/storage");
// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
// const path = require("path");
// const fs = require("fs");
// const os = require("os");

// ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// /**
//  * Triggered from a change to a Cloud Storage bucket.
//  *
//  * @param {!Object} event Event payload.
//  * @param {!Object} context Metadata for the event.
//  */
// exports.helloGCS = async (event, context) => {
//   const fileName = event.name;
//   const bucketName = event.bucket;
//   const tempPath = os.tmpdir();

//   const gcs = new Storage({
//     projectId: "re-academy",
//     keyFilename: path.join(__dirname, "./re-academy.json"),
//   });

//   const transferManager = new TransferManager(gcs.bucket(bucketName));

//   await new Promise((resolve, reject) => {
//     ffmpeg(
//       encodeURI(`https://storage.googleapis.com/${bucketName}/${fileName}`)
//     )
//       .outputOptions([
//         "-map 0:v",
//         "-map 0:a",
//         "-map 0:v",
//         "-map 0:a",
//         "-map 0:v",
//         "-map 0:a",
//         "-s:v:0 640x360",
//         "-c:v:0 libx264",
//         "-b:v:0 256k",
//         "-c:a:0 aac",
//         "-b:a:0 64k",
//         "-s:v:1 1280x720",
//         "-c:v:1 libx264",
//         "-b:v:1 1024k",
//         "-c:a:1 aac",
//         "-b:a:1 64k",
//         "-s:v:2 1920x1080",
//         "-c:v:2 libx264",
//         "-b:v:2 2500k",
//         "-c:a:2 aac",
//         "-b:a:2 64k",
//         "-master_pl_name playlist.m3u8",
//         "-preset veryslow",
//         "-f hls",
//         "-var_stream_map",
//         "v:0,a:0 v:1,a:1 v:2,a:2",
//         "-max_muxing_queue_size 1024",
//         "-hls_time 10",
//         "-hls_playlist_type vod",
//         "-hls_list_size 0",
//         "-hls_segment_filename",
//         `${tempPath}/public/output/v%v/segment%03d.ts`,
//         // "-hls_base_url",
//         // `https://storage.googleapis.com/${bucketName}/output/v0/`,
//       ])
//       .output(`${tempPath}/public/output/v%v/master.m3u8`)
//       .on("progress", function (progress) {
//         console.log("Processing: " + progress.percent + "% done");
//         console.log(progress);
//         context.invokeFunction();
//       })
//       .on("end", async () => {
//         try {
//           console.log(`Finished encoding`);
//           console.log("Uploading files to GCS");
//           await transferManager.uploadManyFiles(`${tempPath}/public/output`, {
//             passthroughOptions: {
//               onUploadProgress: (progress) => {
//                 console.log(progress);
//               },
//             },
//           });
//           fs.rm(`${tempPath}/public`, { recursive: true }, (err) => {
//             if (err) {
//               // File deletion failed
//               console.error(err.message);
//               reject();
//               return;
//             }
//             console.log("File deleted successfully");
//             resolve();
//           });
//         } catch (error) {
//           console.log("Have error occurs while transferring files", error);
//           reject();
//         }
//       })
//       .on("error", (err) => {
//         console.log(`Error encoding, ${err.message} `);
//         reject();
//       })
//       .run();
//   });
// };
