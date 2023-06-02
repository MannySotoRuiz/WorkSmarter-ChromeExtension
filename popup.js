// isolate our DOM queries
const removeTimeBtn = document.getElementById("removeTimeBtn");
const addTimeBtn = document.getElementById("addTimeBtn");
const startBtn = document.getElementById("start");
const giveUpBtn = document.getElementById("give-up");
const resetBtn = document.getElementById("resetBtn");
const progressBar = document.getElementById("progressDone");
const settingsSection = document.getElementById("settingsSection");
const expandBtn = document.getElementById("expandBtn");
const collapseBtn = document.getElementById("collapseBtn");
const timerDisplay = document.getElementById("actualTimer");
const submitUrlBtn = document.getElementById("submitUrlBtn");
const listOfSitesContainer = document.getElementById("ListOfSites");
const questionContainer = document.getElementById("questionContainer");
const cancelBtn = document.getElementById("cancel-giveUp");
const yesGiveUpBtn = document.getElementById("yes-giveUp");
const clearBtn = document.getElementById("clearBtn");

// variables
let startingTime = 5;
let currentTime = startingTime * 60;
let timerInterval;
let blockedDomains = [];
let timerStarted = false;
let ifBackgroundTimerActive = false;

// connect with the background script
const port = chrome.runtime.connect();
// receive data from the background script
port.onMessage.addListener(function (message) {
  if (message.action === "sendData") {
    console.log("got data from background script");
    const { originalTime, timeRemaining, ifTimerStarted, blockedList } =
      message.data;
    startingTime = originalTime;
    currentTime = timeRemaining;
    ifBackgroundTimerActive = ifTimerStarted;
    updateBlockedList(blockedList);
    let minutes = Math.floor(currentTime / 60);
    let seconds = currentTime % 60;
    timerDisplay.textContent = `${minutes}: ${seconds >= 1 ? seconds : "00"}`;
    if (ifTimerStarted) {
      startTimer();
    }
  }
});

/////////////////////// event listeners ///////////////////////
expandBtn.addEventListener("click", openSettings); // open settings
collapseBtn.addEventListener("click", closeSettings); // close settings
startBtn.addEventListener("click", function () {
  startTimer();
  chrome.runtime.sendMessage({
    action: "startTimer",
    data: { timeSelected: startingTime },
  });
}); // start timer
giveUpBtn.addEventListener("click", giveUp); // end timer
resetBtn.addEventListener("click", handleResetClick);
cancelBtn.addEventListener("click", closeQuestionContainer);
yesGiveUpBtn.addEventListener("click", handleYesClick);
submitUrlBtn.addEventListener("click", submitUrl); // add url to blocked domains list
clearBtn.addEventListener("click", handleClearList);
addTimeBtn.addEventListener("click", handleAddTime);
removeTimeBtn.addEventListener("click", handleRemoveTime);
/////////////////////// end event listeners ////////////////////

/////////////////////// functions //////////////////////////////
function handleResetClick() {
  startingTime = 5;
  currentTime = startingTime * 60;
  progressBar.textContent = "";
  progressBar.style.width = "0px";
  timerDisplay.textContent = "5: 00"; // update timer display

  resetBtn.classList.add("hidden");
  startBtn.style.display = "flex";
  giveUpBtn.style.display = "flex";
  startBtn.style.opacity = "1.0"; // disable start btn
  startBtn.style.cursor = "pointer";
  startBtn.disabled = false;
  giveUpBtn.style.cursor = "not-allowed"; // enable start btn
  giveUpBtn.style.opacity = "0.5";
  giveUpBtn.disabled = true;

  removeTimeBtn.classList.remove("hidden");
  addTimeBtn.classList.remove("hidden");

  document.getElementById("cantEdit").classList.add("hidden");
  ifDisableDeleteBtns();
}

function handleYesClick() {
  clearInterval(timerInterval);
  timerStarted = false;
  questionContainer.style.display = "none";
  resetBtn.classList.remove("hidden");
  chrome.runtime.sendMessage({ action: "endTimer" });
}

function closeQuestionContainer() {
  questionContainer.style.display = "none";
  startBtn.style.display = "flex";
  giveUpBtn.style.display = "flex";
}

function updateTimer() {
  currentTime--;
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  timerDisplay.textContent = `${minutes}: ${seconds >= 1 ? seconds : "00"}`; // update timer display

  // update progress bar
  const originalTotalTime = startingTime * 60;
  const timePercent = Math.abs(currentTime / originalTotalTime - 1) * 100; // find time in percentage
  const timeInPixels = 200 * (roundTime(timePercent) / 100);
  progressBar.textContent = `${roundTime(timePercent)}%`;
  progressBar.style.width = `${timeInPixels}px`;

  if (currentTime <= 0) {
    clearInterval(timerInterval);
    timerStarted = false;
    startBtn.style.display = "none";
    giveUpBtn.style.display = "none";
    resetBtn.classList.remove("hidden");
    questionContainer.style.display = "none";
  }
}

function roundTime(num) {
  const m = Number((Math.abs(num) * 100).toPrecision(15));
  return (Math.round(m) / 100) * Math.sign(num);
}

function openSettings() {
  settingsSection.style.display = "flex";
  expandBtn.classList.add("hidden");
  collapseBtn.classList.remove("hidden");
}

function closeSettings() {
  settingsSection.style.display = "none";
  expandBtn.classList.remove("hidden");
  collapseBtn.classList.add("hidden");
}

function startTimer() {
  // hide add/remove buttons
  removeTimeBtn.classList.add("hidden");
  addTimeBtn.classList.add("hidden");

  startBtn.style.opacity = "0.5"; // disable start btn
  startBtn.style.cursor = "not-allowed";
  startBtn.disabled = true;
  giveUpBtn.style.cursor = "pointer"; // enable start btn
  giveUpBtn.style.opacity = "1";
  giveUpBtn.disabled = false;
  timerInterval = setInterval(updateTimer, 1000);
  timerStarted = true;

  // warning texts
  document.getElementById("cantEdit").classList.remove("hidden");
  document.getElementById("alreadyExists").classList.add("hidden");
  document.getElementById("incorrectFormat").classList.add("hidden");
  ifDisableDeleteBtns();
}

function giveUp() {
  // confirm again if user wants to end timer
  questionContainer.style.display = "flex";
  startBtn.style.display = "none";
  giveUpBtn.style.display = "none";
}

function submitUrl() {
  const urlToAdd = document.getElementById("urlForm").value;
  if (ifValidURL(urlToAdd)) {
    const domainName = getDomainName(urlToAdd);
    if (blockedDomains.includes(domainName)) {
      document.getElementById("alreadyExists").classList.remove("hidden");
      document.getElementById("incorrectFormat").classList.add("hidden");
      return;
    }
    blockedDomains.push(domainName);
    document.getElementById("incorrectFormat").classList.add("hidden");
    document.getElementById("alreadyExists").classList.add("hidden");
    document.getElementById("urlForm").value = "";

    // add url to list of blocked sites container
    addDomainToBlockedList(blockedDomains[blockedDomains.length - 1]);

    // send data to background script
    chrome.runtime.sendMessage({
      action: "addURL",
      data: { addURL: domainName },
    });
  } else {
    document.getElementById("incorrectFormat").classList.remove("hidden");
  }
}

// method to see if user input is a valid URL input
function ifValidURL(site) {
  try {
    const url = new URL(site);
    return true;
  } catch (error) {
    console.log("INVALID URL");
    return false;
  }
}

function getDomainName(url) {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
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

function addDomainToBlockedList(url) {
  const newBlockedSiteDiv = document.createElement("div");
  newBlockedSiteDiv.classList.add("newBlockedSiteDiv");
  const newSite = document.createElement("li");
  newSite.classList.add("blockedSite");
  const text = document.createElement("p");
  text.textContent = url;
  newSite.appendChild(text);
  const deleteUrlBtn = document.createElement("div");
  const deleteImg = document.createElement("img");
  deleteUrlBtn.classList.add("deleteUrlBtn");
  deleteImg.src = "images/deleteURL.jpg";
  deleteImg.alt = "Delete site";
  deleteUrlBtn.appendChild(deleteImg);
  deleteUrlBtn.addEventListener("click", function (event) {
    const clickedUrl = event.currentTarget.parentElement;
    clickedUrl.parentElement;
    removeURL(clickedUrl.textContent);
    clickedUrl.parentElement.remove();
    chrome.runtime.sendMessage({
      action: "removeURL",
      data: { urlToRemove: clickedUrl.textContent },
    });
  });
  newSite.appendChild(deleteUrlBtn);
  newBlockedSiteDiv.appendChild(newSite);
  listOfSitesContainer.appendChild(newBlockedSiteDiv);
}

function updateBlockedList(blockedList) {
  blockedDomains = blockedList;
  for (let i = 0; i < blockedList.length; i++) {
    const currentURL = blockedList[i];
    addDomainToBlockedList(currentURL);
  }
}

function ifDisableDeleteBtns() {
  console.log("if disbale buttons", timerStarted);
  const allDeleteBtns = document.querySelectorAll(".deleteUrlBtn");
  for (let i = 0; i < allDeleteBtns.length; i++) {
    if (timerStarted) {
      allDeleteBtns[i].style.display = "none";
    } else {
      allDeleteBtns[i].style.display = "flex";
    }
  }
}

function handleClearList() {
  const allUrls = document.querySelectorAll(".newBlockedSiteDiv");
  if (allUrls.length >= 1) {
    blockedDomains = [];
    for (let i = 0; i < allUrls.length; i++) {
      allUrls[i].remove();
    }
    chrome.runtime.sendMessage({ action: "clearDomainList" });
  }
}

function handleAddTime() {
  if (startingTime >= 120) {
    return;
  }
  startingTime += 5;
  currentTime = startingTime * 60;
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  timerDisplay.textContent = `${minutes}: ${seconds >= 1 ? seconds : "00"}`;

  // responsive stuff
  if (startingTime < 10) {
    addTimeBtn.style.right = "-5px";
    removeTimeBtn.style.left = "-5px";
  } else if (startingTime >= 10 && startingTime < 100) {
    addTimeBtn.style.right = "-10px";
    removeTimeBtn.style.left = "-10px";
  } else {
    addTimeBtn.style.right = "-21px";
    removeTimeBtn.style.left = "-15px";
  }
}

function handleRemoveTime() {
  if (startingTime === 5) {
    return;
  }
  startingTime -= 5;
  currentTime = startingTime * 60;
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  timerDisplay.textContent = `${minutes}: ${seconds >= 1 ? seconds : "00"}`;

  // responsive stuff
  if (startingTime < 10) {
    addTimeBtn.style.right = "-5px";
    removeTimeBtn.style.left = "-5px";
  } else if (startingTime >= 10 && startingTime < 100) {
    addTimeBtn.style.right = "-10px";
    removeTimeBtn.style.left = "-10px";
  } else {
    addTimeBtn.style.right = "-19px";
    removeTimeBtn.style.left = "-15px";
  }
}
/////////////////////// end of functions ///////////////////////

////////////////// do this when popup is opened ////////////////
let minutes = Math.floor(currentTime / 60);
let seconds = currentTime % 60;
timerDisplay.textContent = `${minutes}: ${seconds >= 1 ? seconds : "00"}`;
////////////////////////////////////////////////////////////////
