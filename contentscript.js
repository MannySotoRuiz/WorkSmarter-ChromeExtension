console.log("script inject");

let timerInterval;

if (!document.getElementById("changeBackground")) {
  let quotesOnline = [
    '"Focus on being productive instead of busy." --Tim Ferriss',
    '"The key is not to prioritize what\'s on your schedule, but to schedule your priorities." --Stephen Covey',
    '"Ordinary people think merely of spending time, great people think of using it." --Arthur Schopenhauer',
    '"Success is often achieved by those who don\'t know that failure is inevitable." --Coco Chanel',
    '"Don\'t wait. The time will never be just right." --Napoleon Hill',
    '"The way to get started is to quit talking and begin doing." --Walt Disney',
  ];
  const css = document.createElement("link");
  css.setAttribute("rel", "stylesheet");
  css.setAttribute("type", "text/css");
  css.setAttribute("href", chrome.runtime.getURL("styles/contentscript.css"));
  document.head.appendChild(css);
  console.log("Changed Content On This Page");

  // blocker UI
  if (document.querySelectorAll(".blockContent").length !== 0) {
    console.log("stop here");
  } else {
    // prevent scrolling
    document.body.style.overflow = "hidden";

    console.log("block screen");

    // div for changing background
    const injectElement = document.createElement("div");
    injectElement.classList = "blockContent";
    injectElement.id = "changeBackground";

    // div for timer
    const timerDiv = document.createElement("div");
    timerDiv.id = "timerDiv";
    injectElement.appendChild(timerDiv);

    // div for phrase
    const randomQuote = Math.floor(Math.random() * quotesOnline.length);
    const phraseDiv = document.createElement("div");
    phraseDiv.id = "phraseDiv";
    phraseDiv.textContent = quotesOnline[randomQuote];
    injectElement.appendChild(phraseDiv);

    // div for img
    const imageDiv = document.createElement("div");
    imageDiv.id = "imageDiv";
    const holdImg = document.createElement("img");
    let imgPath = chrome.runtime.getURL("images/neverGiveUp.png");
    holdImg.src = imgPath;
    holdImg.alt = "Never give up image";
    imageDiv.appendChild(holdImg);
    injectElement.appendChild(imageDiv);

    // give up btn
    const giveUpBtn = document.createElement("button");
    giveUpBtn.id = "giveUpBtn";
    giveUpBtn.textContent = "Give Up";
    injectElement.appendChild(giveUpBtn);

    document.body.appendChild(injectElement);
  }
  // end of blocker UI
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "sendDataToContent") {
    const { remainingTime, ifTimerStarted } = request.data;
    let currentTime = remainingTime;
    let minutes = Math.floor(remainingTime / 60);
    let seconds = remainingTime % 60;
    document.getElementById("timerDiv").textContent = `${minutes}: ${
      seconds >= 1 ? seconds : "00"
    }`;
    timerInterval = setInterval(function () {
      currentTime--;
      const minutes = Math.floor(currentTime / 60);
      const seconds = currentTime % 60;
      document.getElementById("timerDiv").textContent = `${minutes}: ${
        seconds >= 1 ? seconds : "00"
      }`;

      if (currentTime <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
  }
});
