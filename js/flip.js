var orientationArray = [];
var flipSlicedOrientationArray = [];
var flipDeltaArray = [];
var flipping = false;
var captureWindow = 11;
var deltaThreshold = 7;
var averageCurrentAcceleration = 0;
var averageAccelerationThreshold = 5;
var millisecondsStart = 0;
var speedArray = [];
var accelerationArray = [];
var flipStartPointer = 0;
var flipOnOff = [];

function addOrientationToArray(event) {
  // console.log(event);
  orientationArray.push({
    alpha: event.alpha,
    beta: event.beta,
    gamma: event.gamma,
  });
  // console.log(orientationArray);
}

let is_running = false;
let demo_button = document.getElementById("start_demo");
demo_button.onclick = function (e) {
  let d = new Date();
  millisecondsStart = d.getMilliseconds();
  e.preventDefault();

  // Request permission for iOS 13+ devices
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission();
  }

  if (is_running) {
    flipOnOffString = flipOnOff.toString().replace(/,/g, " ");
    document.getElementById("flip_on_off").innerHTML = flipOnOffString;
    flipOnOff = [];
    window.removeEventListener("deviceorientation", handleOrientation);
    window.removeEventListener("devicemotion", handleMotion);
    demo_button.innerHTML = "Start demo";
    is_running = false;
  } else {
    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);
    document.getElementById("start_demo").innerHTML = "Stop demo";
    is_running = true;
  }
};

function handleOrientation(event) {
  updateFieldIfNotNull("Orientation_a", event.alpha);
  updateFieldIfNotNull("Orientation_b", event.beta);
  updateFieldIfNotNull("Orientation_g", event.gamma);
  addOrientationToArray(event);
  flip_or_no_flip();
}

function resetArrays() {
  orientationArray = [];
  flipSlicedOrientationArray = [];
  flipDeltaArray = [];
  speedArray = [];
  accelerationArray = [];
  flipStartPointer = 0;
}

function flip_or_no_flip() {
  if (orientationArray.length > captureWindow) {
    let slicedWindowedOrientation = orientationArray.slice(
      orientationArray.length - captureWindow,
      orientationArray.length
    );

    let averageDeltas = averageOrientation(slicedWindowedOrientation);
    let combinedDeltaAverage =
      (averageDeltas.averageAlphaDeltas +
        averageDeltas.averageBetaDeltas +
        averageDeltas.averageGammaDeltas) /
      3;

    // is flipping
    if (
      combinedDeltaAverage > deltaThreshold &&
      averageCurrentAcceleration > averageAccelerationThreshold
    ) {
      document.body.style.backgroundColor = "green";

      flipOnOff.push(true);
      flipSlicedOrientationArray.push(slicedWindowedOrientation);
      flipDeltaArray.push(averageDeltas);

      // if just started flipping
      if (!flipping) {
        let d = new Date();
        millisecondsStart = d.getMilliseconds();
        flipStartPointer = orientationArray.length - 1;
        resetArrays();
      }
      flipping = true;

      // not flipping
    } else {
      flipOnOff.push(false);
      document.body.style.backgroundColor = "red";

      // if just stopped flipping
      if (flipping) {
        let flipEndPointer = orientationArray.length - 1;

        flipping_period_orientation_array = orientationArray.slice(
          flipStartPointer,
          flipEndPointer
        );

        flipping_period_speed_array = speedArray.slice(
          flipStartPointer,
          flipEndPointer
        );

        flipping_period_acceleration_array = accelerationArray.slice(
          flipStartPointer,
          flipEndPointer
        );

        document.getElementById("flipping_length").innerHTML =
          flipping_period_orientation_array.length;

        let d = new Date();
        let millisecondsStop = d.getMilliseconds();
        let millisecondsDifference = millisecondsStop - millisecondsStart;
        document.getElementById("flipping_time").innerHTML =
          millisecondsDifference;
        millisecondsStart = d.getMilliseconds();

        isFaceUp = getFaceUp(orientationArray[orientationArray.length - 1]);
        document.getElementById("flipping_faceup").innerHTML = isFaceUp;

        maxSpeed = getMaxSpeed(flipping_period_speed_array);
        document.getElementById("flipping_maxspeed").innerHTML = maxSpeed;

        averageSpeed = getAverageSpeed(flipping_period_speed_array);
        document.getElementById("flipping_averagespeed").innerHTML =
          averageSpeed.averageCombinedSpeed;

        maxGeforce = getMaxGeforce(flipping_period_acceleration_array);
        document.getElementById("flipping_maxgeforce").innerHTML = maxGeforce;

        let sumOfDeltas = getSumOfDeltas(flipping_period_orientation_array);
        let numRotations = getNumRotations(sumOfDeltas);

        document.getElementById(
          "flipping_numrotation"
        ).innerHTML = `aR: ${numRotations.alphaRotations}<br/>bR: ${numRotations.betaRotations}<br/>gR: ${numRotations.gammaRotations}`;
      }
      flipping = false;
    }
  }
}

function getNumRotations(dict) {
  alphaRotations = dict.alpha / 360;
  betaRotations = dict.beta / 360;
  gammaRotations = dict.gamma / 360;

  return {
    alphaRotations: alphaRotations,
    betaRotations: betaRotations,
    gammaRotations: gammaRotations,
  };
}

function getAverageSpeed(array) {
  let sumAlphaSpeed = 0;
  let sumBetaSpeed = 0;
  let sumGammaSpeed = 0;

  array.forEach((element) => {
    sumAlphaSpeed += element.alpha;
    sumBetaSpeed += element.beta;
    sumGammaSpeed += element.gamma;
  });

  let averageAlphaSpeed = sumAlphaSpeed / array.length;
  let averageBetaSpeed = sumBetaSpeed / array.length;
  let averageGammaSpeed = sumGammaSpeed / array.length;
  let averageCombinedSpeed = Math.sqrt(
    Math.pow(averageAlphaSpeed, 2) +
      Math.pow(averageBetaSpeed, 2) +
      Math.pow(averageGammaSpeed, 2)
  );

  return {
    averageAlphaSpeed: averageAlphaSpeed,
    averageBetaSpeed: averageBetaSpeed,
    averageGammaSpeed: averageGammaSpeed,
    averageCombinedSpeed: averageCombinedSpeed,
  };
}

function getMaxSpeed(array) {
  let maxCombinedSpeed = 0;

  array.forEach((element) => {
    let combinedSpeed = Math.sqrt(
      Math.pow(element.alpha, 2) +
        Math.pow(element.beta, 2) +
        Math.pow(element.gamma, 2)
    );

    if (combinedSpeed > maxCombinedSpeed) {
      maxCombinedSpeed = combinedSpeed;
    }
  });
  return maxCombinedSpeed;
}

function getMaxGeforce(array) {
  let maxCombinedAcceleration = 0;

  array.forEach((element) => {
    let combinedAcceleration = Math.sqrt(
      Math.pow(element.x, 2) + Math.pow(element.y, 2) + Math.pow(element.z, 2)
    );

    if (combinedAcceleration > maxCombinedAcceleration) {
      maxCombinedAcceleration = combinedAcceleration;
    }
  });
  return maxCombinedAcceleration / 9.81;
}

function getFaceUp(orientationDict) {
  return (
    orientationDict.beta > -45 &&
    orientationDict.beta < 45 &&
    orientationDict.gamma > -45 &&
    orientationDict.gamma < 45
  );
}
function getSumOfDeltas(array) {
  let sumAlphaDeltas = 0;
  let sumBetaDeltas = 0;
  let sumGammaDeltas = 0;

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

    sumAlphaDeltas += deltaAlpha;
    sumBetaDeltas += deltaBeta;
    sumGammaDeltas += deltaGamma;
  }

  return { alpha: sumAlphaDeltas, beta: sumBetaDeltas, gamma: sumGammaDeltas };
}

function averageOrientation(array) {
  let deltaArray = [];

  let sumAlphaDeltas = 0;
  let sumBetaDeltas = 0;
  let sumGammaDeltas = 0;

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

  speedArray.push({
    alpha: event.rotationRate.alpha,
    beta: event.rotationRate.beta,
    gamma: event.rotationRate.gamma,
  });

  accelerationArray.push({
    x: event.acceleration.x,
    y: event.acceleration.y,
    z: event.acceleration.z,
  });

  averageCurrentAcceleration =
    (Math.abs(event.acceleration.x) +
      Math.abs(event.acceleration.y) +
      Math.abs(event.acceleration.z)) /
    3;
}
