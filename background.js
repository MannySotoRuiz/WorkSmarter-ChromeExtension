// variables
let previousStartingTime;
let previousTimeLeft;
let startingTime = 5;
let currentTime = startingTime * 60;
let timerInterval;
let blockedDomains = [];
let ifTimerStarted = false;
let displayReset = false;
let keepAliveInterval;

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
      displayReset,
      previousStartingTime,
      previousTimeLeft,
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
  } else if (request.action === "clearDomainList") {
    blockedDomains = [];
  } else if (request.action === "handleResetClick") {
    displayReset = false;
  }
});

function startTimer(time) {
  displayReset = false;
  ifTimerStarted = true;
  startingTime = time;
  currentTime = startingTime * 60;
  timerInterval = setInterval(function () {
    currentTime--;
    console.log(currentTime + " seconds remaining...");
    if (currentTime <= 0) {
      endTimer();
    }
    // chrome.runtime.sendMessage({ action: "timerUpdate", value: currentTime });
  }, 1000);

  chrome.tabs.query({}, function (tabs) {
    console.log("keeping alive");
    tabs.forEach(function (tab) {
      const currentDomain = getDomainName(tab.url);
      if (blockedDomains.includes(currentDomain)) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ["contentscript.js"],
          },
          function () {
            const dataToSend = { remainingTime: currentTime, ifTimerStarted };
            chrome.tabs.sendMessage(tab.id, {
              action: "sendDataToContent",
              data: dataToSend,
            });
          }
        );
      }
    });
  });

  // go through all tabs and check if they need blocking
  keepAliveInterval = setInterval(function () {
    chrome.tabs.query({}, function (tabs) {
      console.log("keeping alive");
      tabs.forEach(function (tab) {
        const currentDomain = getDomainName(tab.url);
        if (blockedDomains.includes(currentDomain)) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ["contentscript.js"],
            },
            function () {
              const dataToSend = { remainingTime: currentTime, ifTimerStarted };
              chrome.tabs.sendMessage(tab.id, {
                action: "sendDataToContent",
                data: dataToSend,
              });
            }
          );
        }
      });
    });
  }, 30000);
}

function endTimer() {
  previousStartingTime = startingTime;
  previousTimeLeft = currentTime;
  displayReset = true;
  ifTimerStarted = false;
  clearInterval(timerInterval);
  startingTime = 5;
  currentTime = startingTime * 60;
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (tab) {
      const currentDomain = getDomainName(tab.url);
      if (blockedDomains.includes(currentDomain)) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ["contentscript.js"],
          },
          function () {
            const dataToSend = { remainingTime: currentTime, ifTimerStarted };
            chrome.tabs.sendMessage(tab.id, {
              action: "sendDataToContent",
              data: dataToSend,
            });
          }
        );
        chrome.tabs.reload(tab.id);
      }
    });
  });
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

// call this when URL of current tab is changed to see if contentscript.js needs to be injected or not
try {
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
      console.log("testing onUpdated");
      attemptInject(tab, tabId);
    }
  });
} catch (e) {
  console.log("Error with onUpdated");
  console.log(e);
}

// call this when the User changes tab and get the URL to see if contentscript.js needs to be injected or not
try {
  // tabs changed
  chrome.tabs.onActivated.addListener(function (activeInfo) {
    getCurrentTab();
    console.log("user changed windows");
    console.log(activeInfo);
    chrome.tabs.get(activeInfo.tabId, function (tab) {
      const urlTab = tab.url;
      console.log("current tab url: " + urlTab);
    });
  });
} catch (e) {
  console.log("ERROR with onActivated");
  console.log(e);
}

function getCurrentTab() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    // the current tab is available in the 'tabs' array
    let tab_Id = tabs[0].id;
    try {
      attemptInject(tabs[0], tab_Id);
    } catch (e) {
      console.log("ERROR HAPPENED - " + e);
    }
  });
}

function attemptInject(tab, tabId) {
  let testURL = new URL(tab.url);
  // remove http:// https:// and www. from start of string
  let testDomain = testURL.hostname.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
  // if url is in the blocked domains list
  if (blockedDomains.includes(testDomain) && ifTimerStarted) {
    chrome.scripting.executeScript(
      {
        files: ["contentscript.js"],
        target: { tabId: tabId },
      },
      function () {
        const dataToSend = { remainingTime: currentTime, ifTimerStarted };
        chrome.tabs.sendMessage(tabId, {
          action: "sendDataToContent",
          data: dataToSend,
        });
      }
    );
  }
  return;
}

function getDomainName(url) {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
}
