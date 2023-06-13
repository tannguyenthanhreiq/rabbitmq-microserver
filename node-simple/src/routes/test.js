// // Imports the Transcoder library
// const { TranscoderServiceClient } =
//   require("@google-cloud/video-transcoder").v1;
// const transcoderServiceClient = new TranscoderServiceClient();

// /**
//  * Triggered from a change to a Cloud Storage bucket.
//  *
//  * @param {!Object} event Event payload.
//  * @param {!Object} context Metadata for the event.
//  */
// exports.helloGCS = async (event, context) => {
//   const gcsEvent = event;
//   console.log({ gcsEvent });

//   if (!gcsEvent.contentType?.includes("video")) {
//     return;
//   }

//   const projectId = "re-academy";
//   const location = "us-central1";
//   const inputVideoUri = `gs://${gcsEvent?.bucket}/${gcsEvent?.name}`;
//   const outputUri = `gs://${gcsEvent?.bucket}/transcoded-videos/${gcsEvent?.generation}/`;

//   // Construct request
//   const request = {
//     parent: transcoderServiceClient.locationPath(projectId, location),
//     job: {
//       outputUri: outputUri,
//       config: {
//         inputs: [
//           {
//             key: "input0",
//             uri: inputVideoUri,
//           },
//         ],
//         editList: [
//           {
//             key: "atom0",
//             inputs: ["input0"],
//           },
//         ],
//         elementaryStreams: [
//           {
//             key: "video-stream0",
//             videoStream: {
//               h264: {
//                 heightPixels: 240,
//                 widthPixels: 426,
//                 bitrateBps: 550000,
//                 frameRate: 30,
//               },
//             },
//           },
//           {
//             key: "video-stream1",
//             videoStream: {
//               h264: {
//                 heightPixels: 360,
//                 widthPixels: 640,
//                 bitrateBps: 774000,
//                 frameRate: 30,
//               },
//             },
//           },
//           {
//             key: "video-stream2",
//             videoStream: {
//               h264: {
//                 heightPixels: 480,
//                 widthPixels: 854,
//                 bitrateBps: 965000,
//                 frameRate: 30,
//               },
//             },
//           },
//           {
//             key: "video-stream3",
//             videoStream: {
//               h264: {
//                 heightPixels: 720,
//                 widthPixels: 1280,
//                 bitrateBps: 1992000,
//                 frameRate: 30,
//               },
//             },
//           },
//           {
//             key: "video-stream4",
//             videoStream: {
//               h264: {
//                 heightPixels: 1080,
//                 widthPixels: 1920,
//                 bitrateBps: 550000,
//                 frameRate: 30,
//               },
//             },
//           },
//           {
//             key: "audio-stream0",
//             audioStream: {
//               codec: "aac",
//               bitrateBps: 64000,
//             },
//           },
//         ],
//         muxStreams: [
//           {
//             key: "240",
//             container: "fmp4",
//             elementaryStreams: ["video-stream0"],
//           },
//           {
//             key: "360",
//             container: "fmp4",
//             elementaryStreams: ["video-stream1"],
//           },
//           {
//             key: "480",
//             container: "fmp4",
//             elementaryStreams: ["video-stream2"],
//           },
//           {
//             key: "720",
//             container: "fmp4",
//             elementaryStreams: ["video-stream3"],
//           },
//           {
//             key: "1080",
//             container: "fmp4",
//             elementaryStreams: ["video-stream4"],
//           },
//           {
//             key: "audio-hls-fmp4",
//             container: "fmp4",
//             elementaryStreams: ["audio-stream0"],
//           },
//         ],
//         manifests: [
//           {
//             fileName: "manifest.m3u8",
//             type: "HLS",
//             muxStreams: ["240", "360", "480", "720", "1080", "audio-hls-fmp4"],
//           },
//         ],
//       },
//     },
//   };

//   // Run request
//   const [response] = await transcoderServiceClient.createJob(request);
//   console.log(`Job: ${response.name}`);
// };
