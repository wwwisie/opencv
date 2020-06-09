let width = 0;
let height = 0;

let qvga = { width: { exact: 400 }, height: { exact: 250 } };

let vga = { width: { exact: 400 }, height: { exact: 250 } };

let resolution = window.innerWidth < 640 ? qvga : vga;

// whether streaming video from the camera.
let streaming = false;

let video = document.getElementById("video");
let stream = null;
let vc = null;

let info = document.getElementById('info');
let container = document.getElementById('container');

function startCamera() {
  if (streaming) return;
  navigator.mediaDevices.getUserMedia({video: resolution, audio: false})
    .then(function(s) {
    stream = s;
    video.srcObject = s;
    video.play();
  })
    .catch(function(err) {
    console.log("An error occured! " + err);
  });

  video.addEventListener("canplay", function(ev){
    if (!streaming) {
      height = video.videoHeight;
      width = video.videoWidth;
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      streaming = true;
      vc = new cv.VideoCapture(video);
    }
    startVideoProcessing();
  }, false);
}

let lastFilter = '';
let src = null;
/*CANVAS DESTINATION OUTPUT*/
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;

function startVideoProcessing() {
  if (!streaming) { console.warn("Please startup your webcam"); return; }
  stopVideoProcessing();
  src = new cv.Mat(height, width, cv.CV_8UC4);
  dstC1 = new cv.Mat(height, width, cv.CV_8UC1);
  dstC3 = new cv.Mat(height, width, cv.CV_8UC3);
  dstC4 = new cv.Mat(height, width, cv.CV_8UC4);
  requestAnimationFrame(processVideo);
}

// This function creates a bypass passthrough.
function passThrough(src) {
  return src;
}

/*
// (gray) Converts an image from one color space to another.
*/ 
function gray(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  return dstC1;
}

/*
// (hsv) Converts an image from one color space to another.
*/ 
function hsv(src) {
  cv.cvtColor(src, dstC3, cv.COLOR_RGBA2RGB);
  cv.cvtColor(dstC3, dstC3, cv.COLOR_RGB2HSV);
  return dstC3;
}

/*
// (canny) Edge detection.
*/ 
function canny(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  /* Canny Params:
   * (image,edges,threshold1,threshold2,apertureSize,L2gradient)
   **/
  cv.Canny(dstC1, dstC1, controls.cannyThreshold1, controls.cannyThreshold2, controls.cannyApertureSize, controls.cannyL2Gradient);
  return dstC1;
}


/*
// (inRange) Checks if array elements lie between the elements of two other arrays.
*/
function inRange(src) {
  let lowValue = controls.inRangeLow;
  let lowScalar = new cv.Scalar(lowValue, lowValue, lowValue, 255);
  let highValue = controls.inRangeHigh;
  let highScalar = new cv.Scalar(highValue, highValue, highValue, 255);
  let low = new cv.Mat(height, width, src.type(), lowScalar);
  let high = new cv.Mat(height, width, src.type(), highScalar);

  /* inRange Params:
   * (image, lower boundary, upper boundary, destination canvas)
   **/
  cv.inRange(src, low, high, dstC1);
  low.delete(); high.delete();
  return dstC1;
}

/*
// (threshold) Applies a fixed-level threshold to each array element.
*/
function threshold(src) {
  /* threshold Params:
   * (image, destination canvas, thresh, maxval, type)
   **/
  cv.threshold(src, dstC4, controls.thresholdValue, 200, cv.THRESH_BINARY);
  return dstC4;
}

/*
// (adaptiveThreshold) Applies an adaptive threshold to an array.
*/
function adaptiveThreshold(src) {
  let mat = new cv.Mat(height, width, cv.CV_8U);
  cv.cvtColor(src, mat, cv.COLOR_RGBA2GRAY);

  /* adaptiveThreshold Params:
  * (src mat, destination canvas, maxValue, adaptiveMethod, thresholdType, blockSize, constant)
  **/
  cv.adaptiveThreshold(mat, dstC1, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, Number(controls.adaptiveBlockSize), 2);
  mat.delete();
  return dstC1;
}

/*
// (gaussianBlur) Blurs an image using a Gaussian filter.
*/
function gaussianBlur(src) {
  /* gaussianBlur Params:
  * (src, destination canvas, size (height,width), sigmaX, sigmaY, borderType)
  **/
  cv.GaussianBlur(src, dstC4, {width: controls.gaussianBlurSize, height: controls.gaussianBlurSize}, 0, 0, cv.BORDER_DEFAULT);
  return dstC4;
}

/*
// (bilateralFilter) Applies the bilateral filter to an image.
*/
function bilateralFilter(src) {
  let mat = new cv.Mat(height, width, cv.CV_8UC3);
  cv.cvtColor(src, mat, cv.COLOR_RGBA2RGB);

  /* bilateralFilter Params:
  * (src mat, destination canvas, pixel diameter, sigmaColor, sigmaSpace, borderType)
  **/
  cv.bilateralFilter(mat, dstC3, controls.bilateralFilterDiameter, controls.bilateralFilterSigma, controls.bilateralFilterSigma, cv.BORDER_DEFAULT);
  mat.delete();
  return dstC3;
}

/*
// (medianBlur) Applies the bilateral filter to an image.
*/
function medianBlur(src) {
  /* medianBlur Params:
  * (src, destination canvas, aperture linear size)
  * apperture: must be odd and greater than 1, for example: 3, 5, 7.
  **/
  cv.medianBlur(src, dstC4, controls.medianBlurSize);
  return dstC4;
}

/*
// (sobel) Calculates the first, second, third, or mixed image derivatives using an extended Sobel operator.
*/
function sobel(src) {
  var mat = new cv.Mat(height, width, cv.CV_8UC1);
  cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);

  /* sobel Params:
  * (src mat, destination canvas, output depth, derivativeX, derivativeY, sobel kernel, scale, delta, borderType)
  **/
  cv.Sobel(mat, dstC1, cv.CV_8U, 1, 0, controls.sobelSize, 1, 0, cv.BORDER_DEFAULT);
  mat.delete();
  return dstC1;
}

/*
// (scharr) Calculates the first x- or y- image derivative using Scharr operator.
*/
function scharr(src) {
  var mat = new cv.Mat(height, width, cv.CV_8UC1);
  cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);

  /* scharr Params:
  * (src mat, destination canvas, output depth, dX, dY, scale, delta, borderType)
  **/
  cv.Scharr(mat, dstC1, cv.CV_8U, 1, 0, 1, 0, cv.BORDER_DEFAULT);
  mat.delete();
  return dstC1;
}

/*
// (laplacian) calculates the Laplacian of the source image by adding up the second x and y derivatives calculated using the Sobel operator.
*/
function laplacian(src) {
  var mat = new cv.Mat(height, width, cv.CV_8UC1);
  cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY);

  /* laplacian Params:
  * (src mat, destination canvas, output depth, aperture size, scale, delta, borderType)
  **/
  cv.Laplacian(mat, dstC1, cv.CV_8U, controls.laplacianSize, 1, 0, cv.BORDER_DEFAULT);
  mat.delete();
  return dstC1;
}


let contoursColor = [];
for (let i = 0; i < 10000; i++) {
  contoursColor.push([Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255), 0]);
}

/*
// (contours) Finds contours in a binary image.
*/
function contours(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  cv.threshold(dstC1, dstC4, 120, 200, cv.THRESH_BINARY);
  let contours  = new cv.MatVector();
  let hierarchy = new cv.Mat();

  /* findContours Params:
  * (src dst, contours, hierarchy, mode, method, offset)
  **/
  cv.findContours(dstC4, contours, hierarchy, Number(controls.contoursMode), Number(controls.contoursMethod), {x: 0, y: 0});
  dstC3.delete();
  dstC3 = cv.Mat.ones(height, width, cv.CV_8UC3);

  /* drawContours Params:
  * (src dst, contours, contourIdx, color, thickness, lineType, hierarchy)
  **/
  for (let i = 0; i<contours.size(); ++i)
  {
    let color = contoursColor[i];
    cv.drawContours(dstC3, contours, i, color, 1, cv.LINE_8, hierarchy);
  }
  contours.delete(); hierarchy.delete();
  return dstC3;
}

/*
// (calcHist) Calculates a histogram of a set of arrays.
*/
function calcHist(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  let srcVec = new cv.MatVector();
  srcVec.push_back(dstC1);
  let scale = 2;
  let channels = [0], histSize = [src.cols/scale], ranges = [0,255];
  let hist = new cv.Mat(), mask = new cv.Mat(), color = new cv.Scalar(0xfb, 0xca, 0x04, 0xff);

  /* calcHist Params:
  * (src, channels, mask, hist, dims, histSize, ranges)
  **/
  cv.calcHist(srcVec, channels, mask, hist, histSize, ranges);
  let result = cv.minMaxLoc(hist, mask);
  var max = result.maxVal;
  cv.cvtColor(dstC1, dstC4, cv.COLOR_GRAY2RGBA);
  // draw histogram on src
  for(var i = 0; i < histSize[0]; i++)
  {
      var binVal = hist.data32F[i] * src.rows / max;
      cv.rectangle(dstC4, {x: i * scale, y: src.rows - 1}, {x: (i + 1) * scale - 1, y: src.rows - binVal/3}, color, cv.FILLED);
  }
  srcVec.delete();
  mask.delete();
  hist.delete();
  return dstC4;
}

/*
// (equalizeHist) Equalizes the histogram of a grayscale image.
*/
function equalizeHist(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY, 0);
  /* equalizeHist Params:
  * (src input, destination)
  **/
  cv.equalizeHist(dstC1, dstC1);
  return dstC1;
}

/*
// (backprojection) Calculates the back projection of a histogram.
*/
let base;
function backprojection(src) {
  if (lastFilter !== 'backprojection') {
    if (base instanceof cv.Mat)
      base.delete();
    base = src.clone();
    cv.cvtColor(base, base, cv.COLOR_RGB2HSV, 0);
  }
  cv.cvtColor(src, dstC3, cv.COLOR_RGB2HSV, 0);
  let baseVec = new cv.MatVector(), targetVec = new cv.MatVector();
  baseVec.push_back(base); targetVec.push_back(dstC3);
  let mask = new cv.Mat(), hist = new cv.Mat();
  let channels = [0], histSize = [50];
  let ranges;
  if (controls.backprojectionRangeLow < controls.backprojectionRangeHigh)
    ranges = [controls.backprojectionRangeLow, controls.backprojectionRangeHigh];
  else
    return src;

  // (calcHist) Calculates a histogram of a set of arrays.
  cv.calcHist(baseVec, channels, mask, hist, histSize, ranges);
  // Normalize the histogram so that the sum of histogram bins is 255
  cv.normalize(hist, hist, 0, 255, cv.NORM_MINMAX);

  /* calcBackProject Params:
  * (src input, channels, hist, backProject, ranges, scale)
  **/
  cv.calcBackProject(targetVec, channels, hist, dstC1, ranges, 1);

  baseVec.delete();
  targetVec.delete();
  mask.delete();
  hist.delete();
  return dstC1;
}

/*
// (erosion) Erodes an image by using a specific structuring element.
*/
function erosion(src) {
  let kernelSize = controls.erosionSize;
  let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
  let color = new cv.Scalar();

  /* erode Params:
  * (src input, destination, kernel, default anchor, iterations, borderType, borderValue)
  **/
  cv.erode(src, dstC4, kernel, {x: -1, y: -1}, 1, Number(controls.erosionBorderType), color);
  kernel.delete();
  return dstC4;
}

/*
// (dilation) Dilates an image by using a specific structuring element.
*/
function dilation(src) {
  let kernelSize = controls.dilationSize;
  let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
  let color = new cv.Scalar();

  /* dilate Params:
  * (src input, destination, kernel, default anchor, iterations, borderType, borderValue)
  **/
  cv.dilate(src, dstC4, kernel, {x: -1, y: -1}, 1, Number(controls.dilationBorderType), color);
  kernel.delete();
  return dstC4;
}

/*
// (dilation) Dilates an image by using a specific structuring element.
*/
function morphology(src) {
  let kernelSize = controls.morphologySize;
  // Returns a structuring element of the specified size and shape for morphological operations
  let kernel = cv.getStructuringElement(Number(controls.morphologyShape), {width: kernelSize, height: kernelSize});
  let color = new cv.Scalar();
  let op = Number(controls.morphologyOp);
  let image = src;
  if (op === cv.MORPH_GRADIENT || op === cv.MORPH_TOPHAT || op === cv.MORPH_BLACKHAT) {
    cv.cvtColor(src, dstC3, cv.COLOR_RGBA2RGB);
    image = dstC3;
  }

  /* dilate Params:
  * (src input, destination, morph operator, kernel, anchor, iterations, borderType, borderValue)
  **/
  cv.morphologyEx(image, dstC4, op, kernel, {x: -1, y: -1}, 1, Number(controls.morphologyBorderType), color);
  kernel.delete();
  return dstC4;
}

function processVideo() {
  stats.begin();
  vc.read(src);
  let result;
  switch (controls.filter) {
    case 'passThrough': result = passThrough(src); break;
    case 'gray': result = gray(src); break;
    case 'hsv': result = hsv(src); break;
    case 'canny': result = canny(src); break;
    case 'inRange': result = inRange(src); break;
    case 'threshold': result = threshold(src); break;
    case 'adaptiveThreshold': result = adaptiveThreshold(src); break;
    case 'gaussianBlur': result = gaussianBlur(src); break;
    case 'bilateralFilter': result = bilateralFilter(src); break;
    case 'medianBlur': result = medianBlur(src); break;
    case 'sobel': result = sobel(src); break;
    case 'scharr': result = scharr(src); break;
    case 'laplacian': result = laplacian(src); break;
    case 'contours': result = contours(src); break;
    case 'calcHist': result = calcHist(src); break;
    case 'equalizeHist': result = equalizeHist(src); break;
    case 'backprojection': result = backprojection(src); break;
    case 'erosion': result = erosion(src); break;
    case 'dilation': result = dilation(src); break;
    case 'morphology': result = morphology(src); break;
    default: result = passThrough(src);
  }
  cv.imshow("canvasOutput", result);
  stats.end();
  lastFilter = controls.filter;
  requestAnimationFrame(processVideo);
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
  video.srcObject=null;
  stream.getVideoTracks()[0].stop();
  streaming = false;
}

var stats = null;

var filters = {
  'passThrough': 'Pass Through',
  'gray': 'Gray',
  'hsv': 'HSV',
  'canny': 'Canny Edge Detection',
  'inRange': 'In Range',
  'threshold': 'Threshold',
  'adaptiveThreshold': 'Adaptive Threshold',
  'gaussianBlur': 'Gaussian Blurring',
  'medianBlur': 'Median Blurring',
  'bilateralFilter': 'Bilateral Filtering',
  'sobel': 'Sobel Derivatives',
  'scharr': 'Scharr Derivatives',
  'laplacian': 'Laplacian Derivatives',
  'contours': 'Contours',
  'calcHist': 'Calculation',
  'equalizeHist': 'Equalization',
  'backprojection': 'Backprojection',
  'erosion': 'Erosion',
  'dilation': 'Dilation',
  'morphology': 'Morphology',
};

var filterName = document.getElementById('filterName');

var controls;

function initUI() {
  stats = new Stats();
  stats.showPanel(0);
  document.getElementById('container').appendChild(stats.domElement);

  controls = {
    filter: 'passThrough',
    setFilter: function(filter) {
      this.filter = filter;
      filterName.innerHTML = filters[filter];
    },
    passThrough: function() { this.setFilter('passThrough'); },
    gray: function() { this.setFilter('gray'); },
    hsv: function() { this.setFilter('hsv'); },
    inRange: function() { this.setFilter('inRange'); },
    inRangeLow: 75,
    inRangeHigh: 150,
    threshold: function() { this.setFilter('threshold'); },
    thresholdValue: 100,
    adaptiveThreshold: function() { this.setFilter('adaptiveThreshold'); },
    adaptiveBlockSize: 3,
    gaussianBlur: function() { this.setFilter('gaussianBlur'); },
    gaussianBlurSize: 7,
    medianBlur: function() { this.setFilter('medianBlur'); },
    medianBlurSize: 5,
    bilateralFilter: function() { this.setFilter('bilateralFilter'); },
    bilateralFilterDiameter: 5,
    bilateralFilterSigma: 75,
    sobel: function() { this.setFilter('sobel'); },
    sobelSize: 3,
    scharr: function() { this.setFilter('scharr'); },
    laplacian: function() { this.setFilter('laplacian'); },
    laplacianSize: 3,
    canny: function() { this.setFilter('canny'); },
    cannyThreshold1: 150,
    cannyThreshold2: 300,
    cannyApertureSize: 3,
    cannyL2Gradient: false,
    contours: function() { this.setFilter('contours'); },
    contoursMode: cv.RETR_CCOMP,
    contoursMethod: cv.CHAIN_APPROX_SIMPLE,
    calcHist: function() { this.setFilter('calcHist'); },
    equalizeHist: function() { this.setFilter('equalizeHist'); },
    backprojection: function() { this.setFilter('backprojection'); },
    backprojectionRangeLow: 0,
    backprojectionRangeHigh: 150,
    morphology: function () { this.setFilter('morphology'); },
    morphologyShape: cv.MORPH_RECT,
    morphologyOp: cv.MORPH_ERODE,
    morphologySize: 5,
    morphologyBorderType: cv.BORDER_CONSTANT,
  };
  
  let gui = new dat.GUI({ autoPlace: false });
  let guiContainer = document.getElementById('guiContainer');
  guiContainer.appendChild(gui.domElement);
  
  let lastFolder = null;
  function closeLastFolder(folder) {
    if (lastFolder != null && lastFolder != folder) {
      lastFolder.close();
    }
    lastFolder = folder;
  }

  let passThrough = gui.add(controls, 'passThrough').name(filters['passThrough']).onChange(function() {
    closeLastFolder(null);
  });
  
  let colorConversion = gui.addFolder('Color Conversion');
  colorConversion.add(controls, 'gray').name(filters['gray']).onChange(function() {
    closeLastFolder(null);
  });
  
  colorConversion.add(controls, 'hsv').name(filters['hsv']).onChange(function() {
    closeLastFolder(null);
  });
  
  let inRange = colorConversion.addFolder(filters['inRange']);
  inRange.domElement.onclick = function() {
    closeLastFolder(inRange);
    controls.inRange();
  };
  inRange.add(controls, 'inRangeLow', 0, 255, 1).name('lower boundary');
  inRange.add(controls, 'inRangeHigh', 0, 255, 1).name('higher boundary');
  
  // let geometricTransformations = gui.addFolder('Geometric Transformations');
  // TODO
  
  let thresholding = gui.addFolder('Thresholding');
  
  let threshold = thresholding.addFolder(filters['threshold']);
  threshold.domElement.onclick = function() {
    closeLastFolder(threshold);
    controls.threshold();
  };
  threshold.add(controls, 'thresholdValue', 0, 200, 1).name('threshold value');
  
  let adaptiveThreshold = thresholding.addFolder(filters['adaptiveThreshold']);
  adaptiveThreshold.domElement.onclick = function() {
    closeLastFolder(adaptiveThreshold);
    controls.adaptiveThreshold();
  };
  adaptiveThreshold.add(controls, 'adaptiveBlockSize', 3, 99, 1).name('block size').onChange(function(value) { if (value % 2 === 0) controls.adaptiveBlockSize = value + 1;});
  
  let smoothing = gui.addFolder('Smoothing');
  
  let gaussianBlur = smoothing.addFolder(filters['gaussianBlur']);
  gaussianBlur.domElement.onclick = function() {
    closeLastFolder(gaussianBlur);
    controls.gaussianBlur();
  };
  gaussianBlur.add(controls, 'gaussianBlurSize', 7, 99, 1).name('kernel size').onChange(function(value) { if (value % 2 === 0) controls.gaussianBlurSize = value + 1;});
  
  let medianBlur = smoothing.addFolder(filters['medianBlur']);
  medianBlur.domElement.onclick = function() {
    closeLastFolder(medianBlur);
    controls.medianBlur();
  };
  medianBlur.add(controls, 'medianBlurSize', 3, 99, 1).name('kernel size').onChange(function(value) { if (value % 2 === 0) controls.medianBlurSize = value + 1;});
  
  let bilateralFilter = smoothing.addFolder(filters['bilateralFilter']);
  bilateralFilter.domElement.onclick = function() {
    closeLastFolder(bilateralFilter);
    controls.bilateralFilter();
  };
  bilateralFilter.add(controls, 'bilateralFilterDiameter', 1, 15, 1).name('diameter');
  bilateralFilter.add(controls, 'bilateralFilterSigma', 1, 255, 1).name('sigma')
  
  let morphology = gui.addFolder('Morphology');
  morphology.domElement.onclick = function() {
    closeLastFolder(morphology);
    controls.morphology();
  };
  morphology.add(controls, 'morphologyOp', {'MORPH_ERODE': cv.MORPH_ERODE, 'MORPH_DILATE': cv.MORPH_DILATE, 'MORPH_OPEN ': cv.MORPH_OPEN, 'MORPH_CLOSE': cv.MORPH_CLOSE, 'MORPH_GRADIENT': cv.MORPH_GRADIENT, 'MORPH_TOPHAT': cv.MORPH_TOPHAT, 'MORPH_BLACKHAT': cv.MORPH_BLACKHAT}).name('operation');
  morphology.add(controls, 'morphologyShape', {'MORPH_RECT': cv.MORPH_RECT, 'MORPH_CROSS': cv.MORPH_CROSS, 'MORPH_ELLIPSE': cv.MORPH_ELLIPSE}).name('shape');
  morphology.add(controls, 'morphologySize', 1, 15, 1).name('kernel size').onChange(function(value) { if (value % 2 === 0) controls.morphologySize = value + 1;});
  morphology.add(controls, 'morphologyBorderType', {'BORDER_CONSTANT': cv.BORDER_CONSTANT, 'BORDER_REPLICATE': cv.BORDER_REPLICATE, 'BORDER_REFLECT': cv.BORDER_REFLECT, 'BORDER_REFLECT_101': cv.BORDER_REFLECT_101}).name('boarder type');

  let gradients = gui.addFolder('Gradients')
  let sobel = gradients.addFolder(filters['sobel']);
  sobel.domElement.onclick = function() {
    closeLastFolder(sobel);
    controls.sobel();
  };
  sobel.add(controls, 'sobelSize', 3, 19, 1).name('kernel size').onChange(function(value) { if (value % 2 === 0) controls.sobelSize = value + 1;});
  
  gradients.add(controls, 'scharr').name(filters['scharr']).onChange(function() {
    closeLastFolder(null);
  });

  let laplacian = gradients.addFolder(filters['laplacian']);
  laplacian.domElement.onclick = function() {
    closeLastFolder(laplacian);
    controls.laplacian();
  };
  laplacian.add(controls, 'laplacianSize', 1, 19, 1).name('kernel size').onChange(function(value) { if (value % 2 === 0) controls.laplacianSize = value + 1;});

  let canny = gui.addFolder(filters['canny']);
  canny.domElement.onclick = function() {
    closeLastFolder(canny);
    controls.canny();
  };
  canny.add(controls, 'cannyThreshold1', 1, 500, 1).name('threshold1');
  canny.add(controls, 'cannyThreshold2', 1, 500, 1).name('threshold2');
  canny.add(controls, 'cannyApertureSize', 3, 7, 1).name('aperture size').onChange(function(value) { if (value % 2 === 0) controls.cannyApertureSize = value + 1;});
  canny.add(controls, 'cannyL2Gradient').name('l2 gradient');

  let contours = gui.addFolder(filters['contours']);
  contours.domElement.onclick = function() {
    closeLastFolder(contours);
    controls.contours();
  };
  contours.add(controls, 'contoursMode', {'RETR_EXTERNAL': cv.RETR_EXTERNAL, 'RETR_LIST': cv.RETR_LIST, 'RETR_CCOMP': cv.RETR_CCOMP, 'RETR_TREE': cv.RETR_TREE}).name('mode');
  contours.add(controls, 'contoursMethod', {'CHAIN_APPROX_NONE': cv.CHAIN_APPROX_NONE, 'CHAIN_APPROX_SIMPLE': cv.CHAIN_APPROX_SIMPLE, 'CHAIN_APPROX_TC89_L1': cv.CHAIN_APPROX_TC89_L1, 'CHAIN_APPROX_TC89_KCOS': cv.CHAIN_APPROX_TC89_KCOS}).name('method');
  
  let histograms = gui.addFolder('Histograms');
  histograms.add(controls, 'calcHist').name(filters['calcHist']).onChange(function() {
    closeLastFolder(null);
  })
  histograms.add(controls, 'equalizeHist').name(filters['equalizeHist']).onChange(function() {
    closeLastFolder(null);
  });
  
  let backprojection = histograms.addFolder(filters['backprojection']);
  backprojection.domElement.onclick = function() {
    closeLastFolder(backprojection);
    controls.backprojection();
  };
  backprojection.add(controls, 'backprojectionRangeLow', 0, 255, 1).name('range low');
  backprojection.add(controls, 'backprojectionRangeHigh', 0, 255, 1).name('range high');
}

function opencvIsReady() {
  console.log('OpenCV.js is ready');
  if (!featuresReady) {
    console.log('Requred features are not ready.');
    return;
  }
  info.innerHTML = '';
  container.className = '';
  initUI();
  startCamera();
}