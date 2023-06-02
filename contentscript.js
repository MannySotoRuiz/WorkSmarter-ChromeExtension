chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.action === "sendDataToContent") {
    const req = await request;
    const data = await req.data;
    const { remainingTime, ifTimerStarted } = data;
    console.log(remainingTime, ifTimerStarted);
    let currentTime = await remainingTime;
    if (document.getElementById("timerDiv")) {
      let minutes = Math.floor(remainingTime / 60);
      let seconds = remainingTime % 60;
      document.getElementById("timerDiv").textContent = `${minutes}: ${
        seconds >= 1 ? seconds : "00"
      }`;
    }
    if (ifTimerStarted) {
      let timerInterval;
      let ifBackgroundTimerActive = false;
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
        css.setAttribute(
          "href",
          chrome.runtime.getURL("styles/contentscript.css")
        );
        document.head.appendChild(css);

        // blocker UI
        if (document.querySelectorAll(".blockContent").length !== 0) {
          console.log("stop here");
        } else {
          // prevent scrolling
          document.body.style.overflow = "hidden";

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

          // question div
          const questionDiv = document.createElement("div");
          questionDiv.id = "askQuestionDiv";
          const questionTitle = document.createElement("p");
          questionTitle.id = "askQuestionTitle";
          questionTitle.textContent = "Are you sure?";
          const questionWarning = document.createElement("p");
          questionWarning.id = "askQuestionWarning";
          questionWarning.textContent =
            "This will put you at risk of distractions.";
          questionDiv.appendChild(questionTitle);
          questionDiv.appendChild(questionWarning);

          const buttonsDiv = document.createElement("div");
          buttonsDiv.id = "buttonsDiv";
          const cancelBtn = document.createElement("button"); // creating the cancel button
          cancelBtn.id = "cancelBtn";
          cancelBtn.innerHTML = "Cancel";
          const yesBtn = document.createElement("button"); // creating the cancel button
          yesBtn.id = "yesBtn";
          yesBtn.innerHTML = "Yes";

          cancelBtn.addEventListener("click", function () {
            giveUpBtn.style.display = "flex";
            questionDiv.style.display = "none";
          });

          yesBtn.addEventListener("click", function () {
            clearInterval(timerInterval);
            chrome.runtime.sendMessage({ action: "endTimer" });
            location.reload();
          });

          buttonsDiv.appendChild(cancelBtn); // adding cancel btn to buttons div
          buttonsDiv.appendChild(yesBtn); // adding yes btn to buttons div
          questionDiv.appendChild(buttonsDiv);

          giveUpBtn.addEventListener("click", function () {
            giveUpBtn.style.display = "none";
            questionDiv.style.display = "flex";
          });

          injectElement.appendChild(giveUpBtn);
          injectElement.appendChild(questionDiv);

          document.body.appendChild(injectElement);
        }
        // end of blocker UI
      }

      if (!ifBackgroundTimerActive) {
        timerInterval = setInterval(function () {
          ifBackgroundTimerActive = true;
          currentTime--;
          const minutes = Math.floor(currentTime / 60);
          const seconds = currentTime % 60;
          if (document.getElementById("timerDiv")) {
            document.getElementById("timerDiv").textContent = `${minutes}: ${
              seconds >= 1 ? seconds : "00"
            }`;
          }

          // check if timer is over
          if (currentTime <= 0) {
            clearInterval(timerInterval);
            ifBackgroundTimerActive = false;
            if (document.getElementById("changeBackground")) {
              document.getElementById("changeBackground").remove(); // remove the blocker screen
              let styles = document.querySelectorAll("link[rel=stylesheet]"); // get stylsheets
              for (let i = 0; i < styles.length; i++) {
                // loop through them until we find contentscript.css
                if (styles[i].href.includes("contentscript.css")) {
                  try {
                    // then attempt to remove it from the current page
                    styles[i].parentNode.removeChild(styles[i]);
                  } catch (error) {
                    console.log("error trying to remove contentscript.css");
                    console.log(error);
                  }
                }
              }
            }
          }
        }, 1000);
        console.log(timerInterval);
      }
    } else {
      if (document.getElementById("changeBackground")) {
        document.getElementById("changeBackground").remove(); // remove the blocker screen
        let styles = document.querySelectorAll("link[rel=stylesheet]"); // get stylsheets
        for (let i = 0; i < styles.length; i++) {
          // loop through them until we find contentscript.css
          if (styles[i].href.includes("contentscript.css")) {
            try {
              // then attempt to remove it from the current page
              styles[i].parentNode.removeChild(styles[i]);
            } catch (error) {
              console.log("error trying to remove contentscript.css");
              console.log(error);
            }
          }
        }
      }
    }
  }
});
