

const buildPanel = document.querySelector("#buildPanel")!;
const showBuildPanel = document.querySelector("#showBuildPanel")!;

function toggleBuildPanel() {
  buildPanel.classList.toggle("display-none");
  showBuildPanel.classList.toggle("display-none");
}
showBuildPanel.addEventListener("click", toggleBuildPanel);

export {};
