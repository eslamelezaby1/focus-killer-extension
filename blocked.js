// Blocked page timer functionality
let currentTime = 25 * 60; // Default 25 minutes
let totalTime = 25 * 60;
let timerState = 'focus'; // 'focus' or 'break'
let timerInterval = null;

// Initialize blocked page
document.addEventListener('DOMContentLoaded', async () => {
  await loadTimerInfo();
  setupEventListeners();
  updateDisplay();
  
  // Start timer if session is active
  if (timerState !== 'idle') {
    startTimer();
  }
});

// Load timer information from storage
async function loadTimerInfo() {
  try {
    const result = await chrome.storage.local.get(['timerState', 'currentTime', 'totalTime', 'timerSettings']);
    
    if (result.timerState) {
      timerState = result.timerState;
    }
    
    if (result.currentTime) {
      currentTime = result.currentTime;
    }
    
    if (result.totalTime) {
      totalTime = result.totalTime;
    }
    
    if (result.timerSettings) {
      // Update display based on settings
      updateModeIndicator();
    }
    
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

// Start timer countdown
function startTimer() {
  if (timerInterval) return;
  
  timerInterval = setInterval(() => {
    currentTime--;
    updateDisplay();
    
    if (currentTime <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      showSessionComplete();
    }
  }, 1000);
}

// Update display elements
function updateDisplay() {
  updateTimerDisplay();
  updateProgressBar();
  updateModeIndicator();
}

// Update timer display
function updateTimerDisplay() {
  const timerDisplay = document.getElementById('timer-display');
  const timerStatus = document.getElementById('timer-status');
  
  if (timerDisplay) {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.textContent = display;
  }
  
  if (timerStatus) {
    if (timerState === 'focus') {
      timerStatus.textContent = 'Focus session in progress';
    } else if (timerState === 'break') {
      timerStatus.textContent = 'Break time - Take a rest';
    } else {
      timerStatus.textContent = 'Session complete';
    }
  }
}

// Update progress bar
function updateProgressBar() {
  const progressFill = document.getElementById('progress-fill');
  if (!progressFill) return;
  
  let progress = 0;
  
  if (timerState === 'focus') {
    progress = ((totalTime - currentTime) / totalTime) * 100;
  } else if (timerState === 'break') {
    // For break, show progress based on break time
    const breakTime = 5 * 60; // Default 5 minutes
    progress = ((breakTime - currentTime) / breakTime) * 100;
  }
  
  progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

// Update mode indicator
function updateModeIndicator() {
  const modeIndicator = document.getElementById('mode-indicator');
  if (!modeIndicator) return;
  
  modeIndicator.className = 'mode-indicator';
  
  if (timerState === 'focus') {
    modeIndicator.textContent = 'FOCUS';
    modeIndicator.classList.add('mode-focus');
  } else if (timerState === 'break') {
    modeIndicator.textContent = 'BREAK';
    modeIndicator.classList.add('mode-break');
  } else {
    modeIndicator.textContent = 'COMPLETE';
    modeIndicator.classList.add('mode-focus');
  }
}

// Show session complete message
function showSessionComplete() {
  const timerStatus = document.getElementById('timer-status');
  if (timerStatus) {
    if (timerState === 'focus') {
      timerStatus.textContent = 'Focus session complete! 🎉';
    } else {
      timerStatus.textContent = 'Break complete! Ready for next session';
    }
  }
  
  // Update mode indicator
  updateModeIndicator();
  
  // Show completion message after a delay
  setTimeout(() => {
    if (timerStatus) {
      timerStatus.textContent = 'Session ended. Return to your work!';
    }
  }, 3000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateTimer") {
    currentTime = message.currentTime || currentTime;
    totalTime = message.totalTime || totalTime;
    timerState = message.timerState || timerState;
    
    updateDisplay();
    
    // Restart timer if needed
    if (timerState !== 'idle' && !timerInterval) {
      startTimer();
    } else if (timerState === 'idle' && timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    sendResponse({ success: true });
  } else if (message.action === "sessionComplete") {
    showSessionComplete();
    sendResponse({ success: true });
  }
});

// Request timer updates periodically
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['timerState', 'currentTime', 'totalTime']);
    
    if (result.timerState && result.timerState !== timerState) {
      timerState = result.timerState;
      updateModeIndicator();
    }
    
    if (result.currentTime && result.currentTime !== currentTime) {
      currentTime = result.currentTime;
      updateTimerDisplay();
      updateProgressBar();
    }
    
    if (result.totalTime && result.totalTime !== totalTime) {
      totalTime = result.totalTime;
      updateProgressBar();
    }
    
  } catch (error) {
    console.error('Error updating timer info:', error);
  }
}, 1000);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, pause timer updates
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } else {
    // Page is visible, resume timer updates
    if (timerState !== 'idle' && !timerInterval) {
      startTimer();
    }
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
});
