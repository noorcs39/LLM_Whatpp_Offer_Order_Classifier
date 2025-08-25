console.log("✅ swipe.js loaded");

// Define the order of pages for swipe navigation
const swipePages = [
  "index.html",
  "match.html",
  "orders.html",
  "offers.html",
  "search.html",
  "customers.html",
  "send.html",
  "whatsapp-manager.html",
  "about.html"
];

// Get current page name
function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

// Navigate to page based on direction
function navigateToPage(direction) {
  const current = getCurrentPage();
  const currentIndex = swipePages.indexOf(current);

  if (direction === "left" && currentIndex < swipePages.length - 1) {
    window.location.href = swipePages[currentIndex + 1];
  } else if (direction === "right" && currentIndex > 0) {
    window.location.href = swipePages[currentIndex - 1];
  }
}

// ---- Mobile: Touch Gesture Detection ----
let touchStartX = null;
let touchStartY = null;
let touchStartTime = null;
let isScrolling = false;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
  isScrolling = false;
}, false);

document.addEventListener("touchmove", (e) => {
  // Allow natural scrolling - don't prevent it
}, false);

document.addEventListener("touchend", (e) => {
  if (touchStartX === null || touchStartTime === null) {
    touchStartX = null;
    touchStartY = null;
    touchStartTime = null;
    isScrolling = false;
    return;
  }
  
  const touchEndX = e.changedTouches[0].clientX;
  const diffX = touchEndX - touchStartX;
  const touchDuration = Date.now() - touchStartTime;

  // Simple thumb-friendly swipe detection
  const minSwipeDistance = 60; // Even more reduced for thumb comfort
  const maxSwipeDuration = 700; // Allow slower swipes
  const minSwipeDuration = 50; // Allow quick thumb flicks

  if (Math.abs(diffX) > minSwipeDistance && 
       touchDuration > minSwipeDuration && 
       touchDuration < maxSwipeDuration) {
    navigateToPage(diffX > 0 ? "right" : "left");
  }
  
  touchStartX = null;
  touchStartY = null;
  touchStartTime = null;
  isScrolling = false;
}, false);

// ---- Desktop: Arrow Key Support ----
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    navigateToPage("right");
  } else if (e.key === "ArrowRight") {
    navigateToPage("left");
  }
});

// ---- Desktop: Arrow Buttons (hidden on mobile) ----
function createArrowButtons() {
  const leftArrow = document.createElement("button");
  leftArrow.innerHTML = "⬅️";
  leftArrow.onclick = () => navigateToPage("right");
  leftArrow.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 10px;
    background: rgba(255, 255, 255, 0.85);
    border: none;
    padding: 8px 10px;
    border-radius: 12px;
    font-size: 18px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    cursor: pointer;
    display: none;
  `;

  const rightArrow = document.createElement("button");
  rightArrow.innerHTML = "➡️";
  rightArrow.onclick = () => navigateToPage("left");
  rightArrow.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 10px;
    background: rgba(255, 255, 255, 0.85);
    border: none;
    padding: 8px 10px;
    border-radius: 12px;
    font-size: 18px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    cursor: pointer;
    display: none;
  `;

  // Only show on desktop
  if (window.innerWidth >= 768) {
    leftArrow.style.display = "block";
    rightArrow.style.display = "block";
  }

  document.body.appendChild(leftArrow);
  document.body.appendChild(rightArrow);
}

createArrowButtons();
