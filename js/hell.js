import * as THREE from "three";
const scene = new THREE.Scene();

var orientationArray = [];
var speedArray = [];
var deltaArray = [];
var flipping = false;
var captureWindow = 16;
var deltaThreshold = 8;
var averageAccel = 0.1;
var averageAccelThreshold = 2;
var flipStartIndex = null;
var flippingOrientationSlice = null;
var flippingSpeedSlice = [];
var flippingDeltaSlice = [];
var flipTimeStart = null;
var sampleRate = 60;

var tMin = 0.2;
var tMax = 1.6;

var sMin = 250;
var sMax = 2400;

var rMin = 0.2;
var rMax = 7.0;

var currentChallenge = 0;
var challengeTarget = null;
var challengeText = "";

var completed = false;
var score = 0;
var lives = 3;

var gameOver = false;

generateChallenge();
document.getElementById("challenge").innerHTML = challengeText;

function generateChallenge() {
  currentChallenge = (Math.random() * (2 - 0 + 1)) << 0;
  console.log(currentChallenge);
  if (currentChallenge == 0) {
    challengeTarget = (Math.random() * (tMax - tMin) + tMin).toFixed(2);
    challengeText = "Land a " + challengeTarget + "-second flip";
  } else if (currentChallenge == 1) {
    challengeTarget = (Math.random() * (sMax - sMin) + sMin).toFixed(2);
    challengeText = "Hit a min speed of " + challengeTarget;
  } else if (currentChallenge == 2) {
    challengeTarget = (Math.random() * (rMax - rMin) + rMin).toFixed(2);
    challengeText = "Hit " + challengeTarget + " rotations in one flip";
  }
}

function challengeJudge(airTime, speed, rotations) {
  if (currentChallenge == 0) {
    if (airTime >= challengeTarget) {
      return true;
    }
  } else if (currentChallenge == 1) {
    if (speed >= challengeTarget) {
      return true;
    }
  } else if (currentChallenge == 2) {
    if (rotations >= challengeTarget) {
      return true;
    }
  }
  return false;
}

function resetVariables() {
  orientationArray = [];
  speedArray = [];
  deltaArray = [];
  flipStartIndex = null;
  flippingOrientationSlice = null;
  flippingSpeedSlice = [];
  flippingDeltaSlice = [];
  flipTimeStart = null;
}

function addOrientationToArray(event) {
  orientationArray.push({
    alpha: event.alpha,
    beta: event.beta,
    gamma: event.gamma,
  });
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

  if (is_running && !gameOver) {
    window.removeEventListener("devicemotion", handleMotion);
    demo_button.innerHTML = "BEGIN";
    is_running = false;
  } else if (!is_running && !gameOver) {
    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);
    document.getElementById("start_demo").innerHTML = "STOP";
    is_running = true;
  }
};

function handleOrientation(event) {
  if (is_running) {
    addOrientationToArray(event);
    flip_or_no_flip();
  }
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
      document.body.style.backgroundColor = "#88ff88";
      if (!flipping) {
        startFlip();
      }
      flipping = true;
    } else {
      document.body.style.backgroundColor = "#ff8888";
      if (flipping) {
        stopFlip();
      }
      flipping = false;
    }
  }
}

function results(result) {
  if (result) {
    score += 100;
    document.getElementById("score").innerHTML = score;
  } else if (result == false) {
    lives--;
    document.getElementById("lives").innerHTML = lives;
  }

  if (lives == 0) {
    alert("GAME OVER");
    gameOver = true;
    document.getElementById("stuff").innerHTML = "GAME OVER";
  } else {
    generateChallenge();
    document.getElementById("challenge").innerHTML = challengeText;
  }
}

function startFlip() {
  flipStartIndex = orientationArray.length;
}

function stopFlip() {
  flippingOrientationSlice = orientationArray.slice(flipStartIndex, -1);
  flippingSpeedSlice = speedArray.slice(flipStartIndex, -1);
  flippingDeltaSlice = deltaArray.slice(flipStartIndex, -1);

  document.getElementById("flip_time").innerHTML = getFlipTime();

  document.getElementById("flip_max_speed").innerHTML = getMaxSpeed();

  document.getElementById("flip_num_rotations").innerHTML = getNumRotations();

  window.removeEventListener("deviceorientation", handleOrientation);
  window.removeEventListener("devicemotion", handleMotion);
  demo_button.innerHTML = "BEGIN";
  is_running = false;

  completed = challengeJudge(getFlipTime(), getMaxSpeed(), getNumRotations());
  results(completed);
  resetVariables();
  completed = false;
}

function getMaxSpeed() {
  let maxSpeed = 0;
  flippingSpeedSlice.forEach((element) => {
    let speed = Math.sqrt(
      Math.pow(element.a, 2) + Math.pow(element.b, 2) + Math.pow(element.g, 2)
    );
    if (speed > maxSpeed) {
      maxSpeed = speed;
    }
  });
  return maxSpeed;
}

function getFlipTime() {
  return flippingOrientationSlice.length / sampleRate;
}

function averageOrientation(array) {
  let sumAlphaDeltas = 0;
  let sumBetaDeltas = 0;
  let sumGammaDeltas = 0;

  let localDeltaArray = [];

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

    localDeltaArray.push({
      alpha: deltaAlpha,
      beta: deltaBeta,
      gamma: deltaGamma,
    });

    deltaArray.push({
      alpha: deltaAlpha,
      beta: deltaBeta,
      gamma: deltaGamma,
    });
  }

  localDeltaArray.forEach((element) => {
    sumAlphaDeltas += element.alpha;
    sumBetaDeltas += element.beta;
    sumGammaDeltas += element.gamma;
  });

  let averageAlphaDeltas = sumAlphaDeltas / localDeltaArray.length;
  let averageBetaDeltas = sumBetaDeltas / localDeltaArray.length;
  let averageGammaDeltas = sumGammaDeltas / localDeltaArray.length;

  return {
    averageAlphaDeltas: averageAlphaDeltas,
    averageBetaDeltas: averageBetaDeltas,
    averageGammaDeltas: averageGammaDeltas,
  };
}

function handleMotion(event) {
  if (is_running) {
    speedArray.push({
      a: event.rotationRate.alpha,
      b: event.rotationRate.beta,
      g: event.rotationRate.gamma,
    });

    averageAccel =
      (Math.abs(event.acceleration.x) +
        Math.abs(event.acceleration.y) +
        Math.abs(event.acceleration.z)) /
      3;
  }
}

function getNumRotations() {
  let angleSum = 0;
  for (let i = 1; i < flippingOrientationSlice.length; i++) {
    let from = flippingOrientationSlice[i - 1];

    let fromRadA = (from.alpha * Math.PI) / 180;
    let fromRadB = (from.beta * Math.PI) / 180;
    let fromRadG = (from.gamma * Math.PI) / 180;

    let fromEuler = new THREE.Euler(fromRadA, fromRadB, fromRadG, "XYZ");
    let fromQuaternion = new THREE.Quaternion();
    fromQuaternion.setFromEuler(fromEuler);

    let to = flippingOrientationSlice[i];

    let toRadA = (to.alpha * Math.PI) / 180;
    let toRadB = (to.beta * Math.PI) / 180;
    let toRadG = (to.gamma * Math.PI) / 180;

    let toEuler = new THREE.Euler(toRadA, toRadB, toRadG, "XYZ");
    let toQuaternion = new THREE.Quaternion();
    toQuaternion.setFromEuler(toEuler);

    angleSum += fromQuaternion.angleTo(toQuaternion);
  }

  return angleSum / (2 * Math.PI);
}
