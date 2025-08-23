// Blocked page - simplified version without timer
let timerState = 'focus'; // 'focus' or 'idle'

// Initialize blocked page
document.addEventListener('DOMContentLoaded', async () => {
  await loadTimerInfo();
  setupEventListeners();
  updateModeIndicator();
});

// Load timer state from storage (just for mode indicator)
async function loadTimerInfo() {
  try {
    const result = await chrome.storage.local.get(['timerState']);
    
    if (result.timerState) {
      timerState = result.timerState;
    }
    
    updateModeIndicator();
    
  } catch (error) {
    console.error('Error loading timer info:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  const extensionLink = document.getElementById('extension-link');
  if (extensionLink) {
    extensionLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Try to open the extension popup
      chrome.runtime.sendMessage({ action: "openPopup" });
    });
  }
}

// Update mode indicator
function updateModeIndicator() {
  const modeIndicator = document.getElementById('mode-indicator');
  if (!modeIndicator) return;
  
  modeIndicator.className = 'mode-indicator';
  
  if (timerState === 'focus') {
    modeIndicator.textContent = 'FOCUS';
    modeIndicator.classList.add('mode-focus');
  } else {
    modeIndicator.textContent = 'COMPLETE';
    modeIndicator.classList.add('mode-idle');
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateTimer") {
    timerState = message.timerState || timerState;
    updateModeIndicator();
    sendResponse({ success: true });
  } else if (message.action === "sessionComplete") {
    timerState = 'idle';
    updateModeIndicator();
    sendResponse({ success: true });
  }
});

// Request timer updates periodically (just for mode indicator)
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['timerState']);
    
    if (result.timerState && result.timerState !== timerState) {
      timerState = result.timerState;
      updateModeIndicator();
    }
    
  } catch (error) {
    console.error('Error updating timer info:', error);
  }
}, 2000); // Check less frequently since we only need mode updates
