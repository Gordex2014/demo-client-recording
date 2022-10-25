import "./style.css";

const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8"];

const selectedMimeType = mimeTypes[1];

let recordedBlobs: Blob[];
let mediaRecorder: MediaRecorder;

const errorMsgElement =
  document.querySelector<HTMLSpanElement>(".error-message");
const recordedVideo =
  document.querySelector<HTMLVideoElement>("video#recorded");
const startRecordButton = document.querySelector<HTMLButtonElement>(
  "button.buttons--start-record"
);
const playButton = document.querySelector<HTMLButtonElement>(
  "button.buttons--play"
);
const startCameraButton = document.querySelector<HTMLButtonElement>(
  "button.buttons--start-camera"
);
const downloadButton = document.querySelector<HTMLButtonElement>(
  "button.buttons--download"
);

function startRecording() {
  recordedBlobs = [];
  const options: MediaRecorderOptions = {
    mimeType: selectedMimeType,
  };

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error("Exception while creating MediaRecorder:", e);
    errorMsgElement!.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(
      e
    )}`;
    return;
  }

  console.log("Created MediaRecorder", mediaRecorder, "with options", options);
  startRecordButton!.textContent = "Stop Recording";
  playButton!.disabled = true;
  downloadButton!.disabled = true;
  mediaRecorder.onstop = (event) => {
    console.log("Recorder stopped: ", event);
    console.log("Recorded Blobs: ", recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(1000);
  console.log("MediaRecorder started", mediaRecorder);
}

function handleDataAvailable(event: BlobEvent) {
  console.log("handleDataAvailable", event);
  if (event.data && event.data.size > 0) {
    // Should send data to a websocket server
    recordedBlobs.push(event.data);
  }
}

function stopRecording() {
  mediaRecorder.stop();
}

function handleSuccess(stream: MediaStream) {
  startRecordButton!.disabled = false;
  console.log("getUserMedia() got stream:", stream);
  window.stream = stream;

  const sourceVideo = document.querySelector<HTMLVideoElement>("video#source");
  sourceVideo!.srcObject = stream;
}

// Events

startCameraButton!.addEventListener("click", async () => {
  document.querySelector<HTMLButtonElement>(
    "button.buttons--start-camera"
  )!.disabled = true;
  const constraints: MediaStreamConstraints = {
    // audio: { // Audio options
    //   echoCancellation: true,
    //   noiseSuppression: true,
    //   suppressLocalAudioPlayback: true,
    // },
    audio: false,
    video: {
      width: 1280,
      height: 720,
    },
  };
  console.log("Using media constraints:", constraints);
  await init(constraints);
});

downloadButton!.addEventListener("click", () => {
  const blob = new Blob(recordedBlobs, { type: "video/webm" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "test.webm";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

playButton!.addEventListener("click", () => {
  const mimeType = selectedMimeType.split(";", 1)[0];
  const superBuffer = new Blob(recordedBlobs, { type: mimeType });
  recordedVideo!.src = "";
  recordedVideo!.srcObject = null;
  recordedVideo!.src = window.URL.createObjectURL(superBuffer);
  recordedVideo!.controls = true;
  recordedVideo!.play();
});

startRecordButton!.addEventListener("click", () => {
  if (startRecordButton!.textContent?.trim() === "Start Recording") {
    startRecording();
  } else {
    stopRecording();
    startRecordButton!.textContent = "Start Recording";
    playButton!.disabled = false;
    downloadButton!.disabled = false;
  }
});

// Init
async function init(constraints: MediaStreamConstraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // const stream = await navigator.mediaDevices.getDisplayMedia(constraints); // Get screen
    handleSuccess(stream);
  } catch (e: any) {
    console.error("navigator.getUserMedia error:", e);
    errorMsgElement!.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}
