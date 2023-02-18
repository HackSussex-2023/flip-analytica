var orientationArray = [];
var deltaTrackerArray = [];
var flipping = false;
var captureWindow = 11;
var deltaThreshold = 8;
var averageSpeed = 0.1;
var averageSpeedThreshold = 3;

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
  e.preventDefault();

  // Request permission for iOS 13+ devices
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission();
  }

  if (is_running) {
    averageDeltas = averageOrientation(orientationArray);
    document.getElementById(
      "orientation_average"
    ).innerHTML = `${averageDeltas.averageAlphaDeltas},${averageDeltas.averageBetaDeltas},${averageDeltas.averageGammaDeltas}`;
    window.removeEventListener("deviceorientation", handleOrientation);
    window.removeEventListener("devicemotion", handleMotion);
    demo_button.innerHTML = "Start demo";
    demo_button.classList.add("btn-success");
    demo_button.classList.remove("btn-danger");
    is_running = false;
  } else {
    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);
    document.getElementById("start_demo").innerHTML = "Stop demo";
    demo_button.classList.remove("btn-success");
    demo_button.classList.add("btn-danger");
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

function flip_or_no_flip() {
  if (orientationArray.length > captureWindow) {
    let sliced = orientationArray.slice(
      orientationArray.length - captureWindow,
      orientationArray.length
    );

    let averageDeltas = averageOrientation(sliced);
    let combinedDeltaAverage =
      (averageDeltas.averageAlphaDeltas +
        averageDeltas.averageBetaDeltas +
        averageDeltas.averageGammaDeltas) /
      3;

    if (
      combinedDeltaAverage > deltaThreshold &&
      averageSpeed > averageSpeedThreshold
    ) {
      flipping = true;
      document.body.style.backgroundColor = "green";
    } else {
      flipping = false;
      document.body.style.backgroundColor = "red";
    }
  }
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

  averageSpeed =
    (Math.abs(event.acceleration.x) +
      Math.abs(event.acceleration.y) +
      Math.abs(event.acceleration.z)) /
    3;
}
