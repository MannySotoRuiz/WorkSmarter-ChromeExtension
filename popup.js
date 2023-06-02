// isolate our DOM queries
const removeTimeBtn = document.getElementById("removeTimeBtn");
const addTimeBtn = document.getElementById("addTimeBtn");
const startBtn = document.getElementById("start");
const giveUpBtn = document.getElementById("give-up");
const progressBar = document.getElementById("progressDone");
const settingsSection = document.getElementById("settingsSection");
const expandBtn = document.getElementById("expandBtn");
const collapseBtn = document.getElementById("collapseBtn");
const timerDisplay = document.getElementById("actualTimer");
const submitUrlBtn = document.getElementById("submitUrlBtn");
const listOfSitesContainer = document.getElementById("ListOfSites");

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
submitUrlBtn.addEventListener("click", submitUrl); // add url to blocked domains list
/////////////////////// end event listeners ////////////////////

/////////////////////// functions //////////////////////////////
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
  }
}

function roundTime(num) {
  const m = Number((Math.abs(num) * 100).toPrecision(15));
  return (Math.round(m) / 100) * Math.sign(num);
}

function reset() {
  startingTime = 5;
  currentTime = startingTime * 60;
  progressBar.textContent = "";
  progressBar.style.width = "0px";
  timerDisplay.textContent = "5: 00"; // update timer display
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

  // warning texts
  document.getElementById("cantEdit").classList.remove("hidden");
  document.getElementById("alreadyExists").classList.add("hidden");
  document.getElementById("incorrectFormat").classList.add("hidden");
}

function giveUp() {
  clearInterval(timerInterval);
  reset();
  document.getElementById("cantEdit").classList.add("hidden");
  chrome.runtime.sendMessage({ action: "endTimer" });
}

function submitUrl() {
  const urlToAdd = document.getElementById("urlForm").value;
  if (ifValidURL(urlToAdd)) {
    if (blockedDomains.includes(urlToAdd)) {
      document.getElementById("alreadyExists").classList.remove("hidden");
      document.getElementById("incorrectFormat").classList.add("hidden");
      return;
    }
    const domainName = getDomainName(urlToAdd);
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
  deleteUrlBtn.classList.add("hidden");
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
  newBlockedSiteDiv.onmouseover = function () {
    // when user's mouse is over the div of a specific URL, display delete button
    this.children[0].children[1].classList.remove("hidden");
  };
  newBlockedSiteDiv.onmouseout = function () {
    // when user's mouse is over the div of a specific URL, display delete button
    this.children[0].children[1].classList.add("hidden");
  };
  listOfSitesContainer.appendChild(newBlockedSiteDiv);
}

function updateBlockedList(blockedList) {
  blockedDomains = blockedList;
  for (let i = 0; i < blockedList.length; i++) {
    const currentURL = blockedList[i];
    addDomainToBlockedList(currentURL);
  }
}
/////////////////////// end of functions ///////////////////////

////////////////// do this when popup is opened ////////////////
let minutes = Math.floor(currentTime / 60);
let seconds = currentTime % 60;
timerDisplay.textContent = `${minutes}: ${seconds >= 1 ? seconds : "00"}`;
////////////////////////////////////////////////////////////////
