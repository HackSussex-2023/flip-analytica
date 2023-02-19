var orientationArray = [];
var deltaTrackerArray = [];
var flipping = false;
var captureWindow = 16;
var deltaThreshold = 8;
var averageAccel = 0.1;
var averageAccelThreshold = 5;
var flipStartIndex = null;
var flippingOrientationSlice = null;
var flipTimeStart = null;
var sampleRate = 60;

function addOrientationToArray(event) {
  orientationArray.push({
    alpha: event.alpha,
    beta: event.beta,
    gamma: event.gamma,
  });
}

function stopRunning() {
  window.addEventListener("devicemotion", handleMotion);
  window.addEventListener("deviceorientation", handleOrientation);
  document.getElementById("start_demo").innerHTML = "Stop demo";
  is_running = true;
}

let is_running = false;
let demo_button = document.getElementById("start_demo");
demo_button.onclick = function (e) {
  e.preventDefault();

  // Request permission for iOS 13+ devices
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission();
  }

  if (is_running) {
    window.removeEventListener("devicemotion", handleMotion);
    demo_button.innerHTML = "Start demo";
    is_running = false;
  } else {
    stopRunning();
  }
};

function handleOrientation(event) {
  updateFieldIfNotNull("Orientation_a", event.alpha);
  updateFieldIfNotNull("Orientation_b", event.beta);
  updateFieldIfNotNull("Orientation_g", event.gamma);
  addOrientationToArray(event);
  flip_or_no_flip();
}

function flip_or_no_flip() {
  if (orientationArray.length > captureWindow) {
    let windowOrientationSlice = orientationArray.slice(
      orientationArray.length - captureWindow,
      orientationArray.length
    );

    let averageDeltas = averageOrientation(windowOrientationSlice);
    let combinedDeltaAverage =
      (averageDeltas.averageAlphaDeltas +
        averageDeltas.averageBetaDeltas +
        averageDeltas.averageGammaDeltas) /
      3;

    if (
      combinedDeltaAverage > deltaThreshold &&
      averageAccel > averageAccelThreshold
    ) {
      document.body.style.backgroundColor = "green";
      if (!flipping) {
        startFlip();
      }
      flipping = true;
    } else {
      document.body.style.backgroundColor = "red";
      if (flipping) {
        stopFlip();
      }
      flipping = false;
    }
  }
}

function startFlip() {
  flipStartIndex = orientationArray.length;
}

function stopFlip() {
  flippingOrientationSlice = orientationArray.slice(flipStartIndex, -1);

  document.getElementById("flip_length").innerHTML =
    flippingOrientationSlice.length;

  document.getElementById("flip_time").innerHTML = getFlipTime();

  stopRunning();
}

function getFlipTime() {
  return flippingOrientationSlice.length / sampleRate;
}

function averageOrientation(array) {
  let sumAlphaDeltas = 0;
  let sumBetaDeltas = 0;
  let sumGammaDeltas = 0;

  let deltaArray = [];

  for (let i = 1; i < array.length; i++) {
    let deltaAlpha = Math.abs(
      Math.abs(array[i].alpha) - Math.abs(array[i - 1].alpha)
    );
    let deltaBeta = Math.abs(
      Math.abs(array[i].beta) - Math.abs(array[i - 1].beta)
    );
    let deltaGamma = Math.abs(
      Math.abs(array[i].gamma) - Math.abs(array[i - 1].gamma)
    );

    deltaArray.push({ alpha: deltaAlpha, beta: deltaBeta, gamma: deltaGamma });
  }

  deltaArray.forEach((element) => {
    sumAlphaDeltas += element.alpha;
    sumBetaDeltas += element.beta;
    sumGammaDeltas += element.gamma;
  });

  let averageAlphaDeltas = sumAlphaDeltas / deltaArray.length;
  let averageBetaDeltas = sumBetaDeltas / deltaArray.length;
  let averageGammaDeltas = sumGammaDeltas / deltaArray.length;

  return {
    averageAlphaDeltas: averageAlphaDeltas,
    averageBetaDeltas: averageBetaDeltas,
    averageGammaDeltas: averageGammaDeltas,
  };
}

function updateFieldIfNotNull(fieldName, value, precision = 10) {
  if (value != null)
    document.getElementById(fieldName).innerHTML = value.toFixed(precision);
}

function handleMotion(event) {
  updateFieldIfNotNull("Accelerometer_x", event.acceleration.x);
  updateFieldIfNotNull("Accelerometer_y", event.acceleration.y);
  updateFieldIfNotNull("Accelerometer_z", event.acceleration.z);

  averageAccel =
    (Math.abs(event.acceleration.x) +
      Math.abs(event.acceleration.y) +
      Math.abs(event.acceleration.z)) /
    3;
}
