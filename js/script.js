function handlePermission() {
  navigator.permissions.query({ name: "geolocation" }).then(function (result) {
    if (result.state == "granted") {
      report(result.state);
    } else if (result.state == "prompt") {
      report(result.state);
      navigator.geolocation.getCurrentPosition(
        revealPosition,
        positionDenied,
        geoSettings
      );
    } else if (result.state == "denied") {
      report(result.state);
    }
    result.onchange = function () {
      report(result.state);
    };
  });
}

function report(state) {
  console.log("Permission " + state);
}

handlePermission();

function onClick() {
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    // Handle iOS 13+ devices.
    DeviceMotionEvent.requestPermission()
      .then((state) => {
        if (state === "granted") {
          window.addEventListener("devicemotion", handleOrientation);
        } else {
          console.error("Request to access the orientation was rejected");
        }
      })
      .catch(console.error);
  } else {
    // Handle regular non iOS 13+ devices.
    window.addEventListener("devicemotion", handleOrientation);
  }
}

calibratedDiv = document.getElementById("calibrated");
posDiv = document.getElementById("pos");

let initialRun = true;
let calibratedAlpha;
let calibratedBeta;
let calibratedGamma;

function handleOrientation(event) {
  const alpha = event.alpha;
  const beta = event.beta;
  const gamma = event.gamma;

  if (initialRun) {
    calibratedAlpha = alpha;
    calibratedBeta = beta;
    calibratedGamma = gamma;
    initialRun = false;
  }

  calibratedDiv.innerHTML = `<br/><br/><div>calibrated alpha: ${calibratedAlpha} calibrated beta: ${calibratedBeta} calibrated gamma: ${calibratedGamma}`;
  posDiv.innerHTML = `alpha: ${alpha} beta: ${beta} gamma: ${gamma}</div><br/><br/><br/><div> cal alpha: ${
    alpha - calibratedAlpha
  } cal beta: ${beta - calibratedBeta} cal gamma: ${
    gamma - calibratedGamma
  }</div>`;
}
