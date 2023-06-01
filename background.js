// variables
let startingTime = 5;
let currentTime = startingTime * 60;
let timerInterval;
const blockedDomains = [];
let ifTimerStarted = false;

// establish a connection with the popup script
chrome.runtime.onConnect.addListener(function (port) {
  // send data to the popup script
  port.postMessage({
    action: "sendData",
    data: {
      originalTime: startingTime,
      timeRemaining: currentTime,
      ifTimerStarted,
      blockedList: blockedDomains,
    },
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "startTimer") {
    const { timeSelected } = request.data;
    startTimer(timeSelected);
  } else if (request.action === "endTimer") {
    endTimer();
  } else if (request.action === "addURL") {
    const { addURL } = request.data;
    addURLToBlockedList(addURL);
  } else if (request.action === "removeURL") {
    const { urlToRemove } = request.data;
    removeURL(urlToRemove);
  }
});

function startTimer(time) {
  ifTimerStarted = true;
  startingTime = time;
  currentTime = startingTime * 60;
  timerInterval = setInterval(function () {
    currentTime--;
    console.log(currentTime + " seconds remaining...");
    if (currentTime <= 0) {
      endTimer();
    }
  }, 1000);
}

function endTimer() {
  ifTimerStarted = false;
  clearInterval(timerInterval);
}

function addURLToBlockedList(addURL) {
  blockedDomains.push(addURL);
}

function removeURL(url) {
  for (let i = 0; i < blockedDomains.length; i++) {
    let testDomain = blockedDomains[i];
    if (url.includes(testDomain)) {
      blockedDomains.splice(i, 1);
      break;
    }
  }
}
