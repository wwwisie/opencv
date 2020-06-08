let videoWidth, videoHeight;

let qvga = { width: { exact: 400 }, height: { exact: 250 } };

let vga = { width: { exact: 400 }, height: { exact: 250 } };

let resolution = window.innerWidth < 640 ? qvga : vga;

// whether streaming video from the camera.
let streaming = false;

let video = document.getElementById('video');
let canvasOutput = document.getElementById('canvasOutput');
let canvasOutputCtx = canvasOutput.getContext('2d');
let stream = null;

let detectFace = document.getElementById('face');
let detectEye = document.getElementById('eye');
let detectBody = document.getElementById('body');

let info = document.getElementById('info');

function startCamera() {
  if (streaming) return;
  navigator.mediaDevices.getUserMedia({ video: resolution, audio: false })
    .then(function (s) {
      stream = s;
      video.srcObject = s;
      video.play();
    })
    .catch(function (err) {
      console.log("An error occured! " + err);
    });

  video.addEventListener("canplay", function (ev) {
    if (!streaming) {
      videoWidth = video.videoWidth;
      videoHeight = video.videoHeight;
      video.setAttribute("width", videoWidth);
      video.setAttribute("height", videoHeight);
      canvasOutput.width = videoWidth;
      canvasOutput.height = videoHeight;
      streaming = true;
    }
    startVideoProcessing();
  }, false);
}

let faceClassifier = null;
let eyeClassifier = null;
let bodyClassifier = null;

let src = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;

let canvasInput = null;
let canvasInputCtx = null;

let canvasBuffer = null;
let canvasBufferCtx = null;

function startVideoProcessing() {
  if (!streaming) { console.warn("Please startup your webcam"); return; }
  stopVideoProcessing();
  canvasInput = document.createElement('canvas');
  canvasInput.width = videoWidth;
  canvasInput.height = videoHeight;
  canvasInputCtx = canvasInput.getContext('2d');

  canvasBuffer = document.createElement('canvas');
  canvasBuffer.width = videoWidth;
  canvasBuffer.height = videoHeight;
  canvasBufferCtx = canvasBuffer.getContext('2d');

  srcMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
  grayMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1);

  bodyClassifier = new cv.CascadeClassifier();
  bodyClassifier.load('haarcascade_fullbody.xml');

  faceClassifier = new cv.CascadeClassifier();
  faceClassifier.load('haarcascade_frontalface_default.xml');

  eyeClassifier = new cv.CascadeClassifier();
  eyeClassifier.load('haarcascade_eye.xml');

  requestAnimationFrame(processVideo);
}

function processVideo() {
  //begin stats
  stats.begin();

  //draw video
  canvasInputCtx.drawImage(video, 0, 0, videoWidth, videoHeight);

  let imageData = canvasInputCtx.getImageData(0, 0, videoWidth, videoHeight);
  srcMat.data.set(imageData.data);
  cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);

  let faces = [];
  let eyes = [];
  let bodies = [];
  let size;
  console.log(detectFace.checked, detectEye.checked, detectBody.checked)
  if (detectFace.checked) {
    let faceVect = new cv.RectVector();
    let faceMat = new cv.Mat();
    if (detectEye.checked) {
      cv.pyrDown(grayMat, faceMat);
      size = faceMat.size();
    } else {
      cv.pyrDown(grayMat, faceMat);
      if (videoWidth > 320)
        cv.pyrDown(faceMat, faceMat);
      size = faceMat.size();
    }
    faceClassifier.detectMultiScale(faceMat, faceVect);
    for (let i = 0; i < faceVect.size(); i++) {
      let face = faceVect.get(i);
      faces.push(new cv.Rect(face.x, face.y, face.width, face.height));
      if (detectEye.checked) {
        let eyeVect = new cv.RectVector();
        let eyeMat = faceMat.roi(face);
        eyeClassifier.detectMultiScale(eyeMat, eyeVect);
        for (let i = 0; i < eyeVect.size(); i++) {
          let eye = eyeVect.get(i);
          eyes.push(new cv.Rect(face.x + eye.x, face.y + eye.y, eye.width, eye.height));
        }
        eyeMat.delete();
        eyeVect.delete();
      }
    }
    faceMat.delete();
    faceVect.delete();
  }
  if (detectEye.checked) {
    let eyeVect = new cv.RectVector();
    let eyeMat = new cv.Mat();
    cv.pyrDown(grayMat, eyeMat);
    size = eyeMat.size();
    eyeClassifier.detectMultiScale(eyeMat, eyeVect);
    for (let i = 0; i < eyeVect.size(); i++) {
      let eye = eyeVect.get(i);
      eyes.push(new cv.Rect(eye.x, eye.y, eye.width, eye.height));
    }
    eyeMat.delete();
    eyeVect.delete();
  }
  if (detectBody.checked) {
    // create rectvector
    let bodyVect = new cv.RectVector();
    let bodyMat = new cv.Mat();
    // Blurs an image and downsamples it.
    cv.pyrDown(grayMat, bodyMat);
    size = bodyMat.size();
    bodyClassifier.detectMultiScale(bodyMat, bodyVect);
    for (let i = 0; i < bodyVect.size(); i++) {
      let body = bodyVect.get(i);
      bodies.push(new cv.Rect(body.x, body.y, body.width, body.height));
      console.log(bodies.length)
    }
    bodyMat.delete();
    bodyVect.delete();
  }

  canvasOutputCtx.drawImage(canvasInput, 0, 0, videoWidth, videoHeight);
  if (detectFace.checked) {
    drawResults(canvasOutputCtx, faces, 'red', size);
  }
  if (detectEye.checked) {
    drawEyeResults(canvasOutputCtx, eyes, 'yellow', size);
  }
  if (detectBody.checked) {
    drawBodyResults(canvasOutputCtx, bodies, 'blue', size);
  }
  stats.end();
  requestAnimationFrame(processVideo);
}

function drawResults(ctx, results, color, size) {
  for (let i = 0; i < results.length; ++i) {
    let rect = results[i];
    let xRatio = videoWidth / size.width;
    let yRatio = videoHeight / size.height;
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.strokeRect(rect.x * xRatio, rect.y * yRatio, rect.width * xRatio, rect.height * yRatio);
    ctx.font = "22px Arial";
    ctx.fillStyle = "red";
    ctx.fillText("Cara", rect.x * xRatio, rect.y * yRatio);
  }
}

function drawEyeResults(ctx, results, color, size) {
  for (let i = 0; i < results.length; ++i) {
    let rect = results[i];
    let xRatio = videoWidth / size.width;
    let yRatio = videoHeight / size.height;
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.strokeRect(rect.x * xRatio, rect.y * yRatio, rect.width * xRatio, rect.height * yRatio);
    ctx.font = "22px Arial";
    ctx.fillStyle = "red";
    ctx.fillText("Ojo " + (i + 1), rect.x * xRatio, rect.y * yRatio);
  }
}

function drawBodyResults(ctx, results, color, size) {
  for (let i = 0; i < results.length; ++i) {
    let rect = results[i];
    let xRatio = videoWidth / size.width;
    let yRatio = videoHeight / size.height;
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.strokeRect(rect.x * xRatio, rect.y * yRatio, rect.width * xRatio, rect.height * yRatio);
    ctx.font = "22px Arial";
    ctx.fillStyle = "red";
    ctx.fillText("Persona " + (i + 1), rect.x * xRatio, rect.y * yRatio);
  }
}

function stopVideoProcessing() {
  if (src != null && !src.isDeleted()) src.delete();
  if (dstC1 != null && !dstC1.isDeleted()) dstC1.delete();
  if (dstC3 != null && !dstC3.isDeleted()) dstC3.delete();
  if (dstC4 != null && !dstC4.isDeleted()) dstC4.delete();
}

function stopCamera() {
  if (!streaming) return;
  stopVideoProcessing();
  document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, width, height);
  video.pause();
  video.srcObject = null;
  stream.getVideoTracks()[0].stop();
  streaming = false;
}

function initUI() {
  stats = new Stats();
  stats.showPanel(0);
  document.getElementById('container').appendChild(stats.dom);
}

function opencvIsReady() {
  console.log('OpenCV.js is ready');
  if (!featuresReady) {
    console.log('Requred features are not ready.');
    return;
  }
  info.innerHTML = '';
  initUI();
  startCamera();
}
