const startBtn = document.getElementById("start");
const settingsSection = document.getElementById("settingsSection");
const expandBtn = document.getElementById("expandBtn");
const collapseBtn = document.getElementById("collapseBtn");

// event listener to open settings
expandBtn.addEventListener("click", function () {
  settingsSection.style.display = "flex";
  expandBtn.classList.add("hidden");
  collapseBtn.classList.remove("hidden");
});

// event listener to close settings
collapseBtn.addEventListener("click", function () {
  settingsSection.style.display = "none";
  expandBtn.classList.remove("hidden");
  collapseBtn.classList.add("hidden");
});
