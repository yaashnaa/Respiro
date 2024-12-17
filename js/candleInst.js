
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("instructionModal");
  const closeButton = document.querySelector(".close-button");
  const startButton = document.getElementById("start-button");
  const candleStartButton = document.getElementById("candleStartButton");

  window.onload = () => {
    modal.style.display = "flex"; 
  };

  closeButton.onclick = () => {
    modal.style.display = "none";
  };

  startButton.onclick = () => {
    modal.style.display = "none";
  };
  candleStartButton.onclick = () => {
    modal.style.display = "none";
  };


  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
});
