// Default sites with their icons and display names
const defaultSites = [
  { domain: 'facebook.com', name: 'Facebook', icon: 'f', class: 'facebook' },
  { domain: 'youtube.com', name: 'YouTube', icon: '▶', class: 'youtube' },
  { domain: 'twitter.com', name: 'Twitter', icon: '🐦', class: 'twitter' },
  { domain: 'instagram.com', name: 'Instagram', icon: '📷', class: 'instagram' },
  { domain: 'tiktok.com', name: 'TikTok', icon: '🎵', class: 'tiktok' },
  { domain: 'reddit.com', name: 'Reddit', icon: '🤖', class: 'reddit' }
];

let blockedSites = [];
let timerState = 'idle'; // 'idle', 'focus', 'break', 'paused'
let currentTime = 25 * 60; // 25 minutes in seconds
let totalTime = 25 * 60; // Total time for current session
let breakTime = 5 * 60; // 5 minutes break
let sessionCount = 0;
let totalSessionTime = 0;
let countdownNotificationShown = false;
let timerSettings = {
  defaultFocusTime: 25,
  defaultBreakTime: 5,
  blockDuringBreak: false,
  soundNotifications: true
};

// Test connection to background script
function testBackgroundConnection() {
  chrome.runtime.sendMessage({ action: "ping" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Background connection error:', chrome.runtime.lastError);
      document.getElementById('timer-status').textContent = 'Extension error - please reload';
    } else if (response && response.success) {
      console.log('Background connection successful');
    } else {
      console.error('Background connection failed');
      document.getElementById('timer-status').textContent = 'Extension error - please reload';
    }
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadBlockedSites();
  await loadFocusStats();
  await loadTimerSettings();
  await loadCurrentTimerState();
  requestNotificationPermission();
  renderSitesList();
  setupEventListeners();
  updateTimerDisplay();
  updateProgressBar();
  updateTimerUI();
  
  // Test background connection
  testBackgroundConnection();
  
  // Start polling for timer updates
  startTimerPolling();
});

// Load current timer state from background
async function loadCurrentTimerState() {
  try {
    const result = await chrome.storage.local.get(['timerState', 'currentTime', 'totalTime', 'breakTime']);
    if (result.timerState) {
      timerState = result.timerState;
    }
    if (result.currentTime) {
      currentTime = result.currentTime;
    }
    if (result.totalTime) {
      totalTime = result.totalTime;
    }
    if (result.breakTime) {
      breakTime = result.breakTime;
    }
  } catch (error) {
    console.error('Error loading current timer state:', error);
  }
}

// Start polling for timer updates from background
function startTimerPolling() {
  setInterval(async () => {
    try {
      const result = await chrome.storage.local.get(['timerState', 'currentTime', 'totalTime', 'breakTime']);
      
      let stateChanged = false;
      
      if (result.timerState && result.timerState !== timerState) {
        timerState = result.timerState;
        stateChanged = true;
      }
      
      if (result.currentTime && result.currentTime !== currentTime) {
        currentTime = result.currentTime;
        stateChanged = true;
      }
      
      if (result.totalTime && result.totalTime !== totalTime) {
        totalTime = result.totalTime;
        stateChanged = true;
      }
      
      if (result.breakTime && result.breakTime !== breakTime) {
        breakTime = result.breakTime;
        stateChanged = true;
      }
      
      if (stateChanged) {
        updateTimerDisplay();
        updateProgressBar();
        updateTimerUI();
        updateBadge();
      }
      
    } catch (error) {
      console.error('Error polling timer state:', error);
    }
  }, 1000);
}

// Load blocked sites from storage
async function loadBlockedSites() {
  try {
    const result = await chrome.storage.local.get(['blockedSites']);
    blockedSites = result.blockedSites || [];
  } catch (error) {
    console.error('Error loading blocked sites:', error);
    blockedSites = [];
  }
}

// Load focus statistics from storage
async function loadFocusStats() {
  try {
    const result = await chrome.storage.local.get(['focusStats']);
    const stats = result.focusStats || {};
    const today = new Date().toDateString();
    
    if (stats[today]) {
      sessionCount = stats[today].sessions || 0;
      totalSessionTime = stats[today].totalTime || 0;
    } else {
      sessionCount = 0;
      totalSessionTime = 0;
    }
    
    updateStatsDisplay();
  } catch (error) {
    console.error('Error loading focus stats:', error);
  }
}

// Load timer settings from storage
async function loadTimerSettings() {
  try {
    const result = await chrome.storage.local.get(['timerSettings']);
    if (result.timerSettings) {
      timerSettings = { ...timerSettings, ...result.timerSettings };
    }
    
    // Update input fields
    const minutesInput = document.getElementById('custom-minutes');
    const secondsInput = document.getElementById('custom-seconds');
    const breakMinutesInput = document.getElementById('break-minutes');
    
    if (minutesInput && secondsInput && breakMinutesInput) {
      minutesInput.value = Math.floor(timerSettings.defaultFocusTime / 60);
      secondsInput.value = timerSettings.defaultFocusTime % 60;
      breakMinutesInput.value = Math.floor(timerSettings.defaultBreakTime / 60);
    }
    
    // Set current time
    currentTime = timerSettings.defaultFocusTime;
    totalTime = timerSettings.defaultFocusTime;
    breakTime = timerSettings.defaultBreakTime * 60;
    
  } catch (error) {
    console.error('Error loading timer settings:', error);
  }
}

// Save timer settings to storage
async function saveTimerSettings() {
  try {
    await chrome.storage.local.set({ 
      timerSettings: { 
        defaultFocusTime: currentTime,
        defaultBreakTime: Math.floor(breakTime / 60),
        lastUpdated: Date.now()
      } 
    });
  } catch (error) {
    console.error('Error saving timer settings:', error);
  }
}

// Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const statusElement = document.getElementById('timer-status');
    if (statusElement) {
      statusElement.textContent = 'Click Start to begin (notifications enabled)';
      setTimeout(() => {
        if (timerState === 'idle') {
          statusElement.textContent = 'Ready to focus';
        }
      }, 3000);
    }
  }
}

// Save focus statistics to storage
async function saveFocusStats() {
  try {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get(['focusStats']);
    const stats = result.focusStats || {};
    
    stats[today] = {
      sessions: sessionCount,
      totalTime: totalSessionTime,
      lastUpdated: Date.now()
    };
    
    await chrome.storage.local.set({ focusStats: stats });
  } catch (error) {
    console.error('Error saving focus stats:', error);
  }
}

// Update statistics display
function updateStatsDisplay() {
  const sessionsElement = document.getElementById('today-sessions');
  const timeElement = document.getElementById('today-time');
  
  if (sessionsElement) sessionsElement.textContent = sessionCount;
  if (timeElement) timeElement.textContent = `${Math.floor(totalSessionTime / 60)}m`;
}

// Timer functions - now delegate to background script
function startTimer() {
  if (timerState !== 'idle') return;
  
  // Send message to background to start focus timer
  chrome.runtime.sendMessage({ 
    action: "startFocusTimer", 
    duration: Math.floor(totalTime / 60),
    totalTime: totalTime,
    breakTime: breakTime
  }, (response) => {
    if (response && response.success) {
      console.log('Focus timer started successfully');
      // Update UI immediately to show starting state
      document.getElementById('timer-status').textContent = 'Starting focus session...';
    } else {
      console.error('Failed to start focus timer:', response ? response.error : 'Unknown error');
      document.getElementById('timer-status').textContent = 'Error starting timer';
      setTimeout(() => {
        if (timerState === 'idle') {
          document.getElementById('timer-status').textContent = 'Ready to focus';
        }
      }, 3000);
    }
  });
}

function pauseTimer() {
  if (timerState !== 'focus' && timerState !== 'break') return;
  
  // Send message to background to pause timer
  chrome.runtime.sendMessage({ action: "pauseTimer" }, (response) => {
    if (response && response.success) {
      console.log('Timer paused successfully');
      // UI will be updated by the polling mechanism
    } else {
      console.error('Failed to pause timer:', response ? response.error : 'Unknown error');
      document.getElementById('timer-status').textContent = 'Error pausing timer';
      setTimeout(() => {
        if (timerState === 'focus' || timerState === 'break') {
          document.getElementById('timer-status').textContent = 'Focus session active';
        } else if (timerState === 'break') {
          document.getElementById('timer-status').textContent = 'Break time! Take a rest';
        }
      }, 3000);
    }
  });
}

function resumeTimer() {
  if (timerState !== 'paused') return;
  
  // Send message to background to resume timer
  chrome.runtime.sendMessage({ action: "resumeTimer" }, (response) => {
    if (response && response.success) {
      console.log('Timer resumed successfully');
      // UI will be updated by the polling mechanism
    } else {
      console.error('Failed to resume timer:', response ? response.error : 'Unknown error');
      document.getElementById('timer-status').textContent = 'Error resuming timer';
      setTimeout(() => {
        if (timerState === 'paused') {
          document.getElementById('timer-status').textContent = 'Session paused';
        }
      }, 3000);
    }
  });
}

function stopTimer() {
  if (timerState === 'idle') return;
  
  // Send message to background to stop timer
  chrome.runtime.sendMessage({ action: "stopTimer" }, (response) => {
    if (response && response.success) {
      console.log('Timer stopped successfully');
      // UI will be updated by the polling mechanism
    } else {
      console.error('Failed to stop timer:', response ? response.error : 'Unknown error');
      document.getElementById('timer-status').textContent = 'Error stopping timer';
      setTimeout(() => {
        if (timerState === 'idle') {
          document.getElementById('timer-status').textContent = 'Ready to focus';
        }
      }, 3000);
    }
  });
}

function cancelTimer() {
  if (timerState === 'idle') return;
  
  // Send message to background to cancel timer
  chrome.runtime.sendMessage({ action: "cancelTimer" }, (response) => {
    if (response && response.success) {
      console.log('Timer cancelled successfully');
      // UI will be updated by the polling mechanism
    } else {
      console.error('Failed to cancel timer:', response ? response.error : 'Unknown error');
      document.getElementById('timer-status').textContent = 'Error cancelling timer';
      setTimeout(() => {
        if (timerState === 'idle') {
          document.getElementById('timer-status').textContent = 'Ready to focus';
        }
      }, 3000);
    }
  });
}

function resetTimer() {
  // Send message to background to reset timer
  chrome.runtime.sendMessage({ action: "resetTimer" }, (response) => {
    if (response && response.success) {
      console.log('Timer reset successfully');
      // Update UI to show reset state
      document.getElementById('timer-status').textContent = 'Timer reset to default';
      setTimeout(() => {
        if (timerState === 'idle') {
          document.getElementById('timer-status').textContent = 'Ready to focus';
        }
      }, 2000);
    } else {
      console.error('Failed to reset timer:', response ? response.error : 'Unknown error');
      // Show error message to user
      document.getElementById('timer-status').textContent = 'Error resetting timer';
      setTimeout(() => {
        if (timerState === 'idle') {
          document.getElementById('timer-status').textContent = 'Ready to focus';
        }
      }, 3000);
    }
  });
}

// Apply custom timer settings
function applyCustomTimer() {
  const minutesInput = document.getElementById('custom-minutes');
  const secondsInput = document.getElementById('custom-seconds');
  const breakMinutesInput = document.getElementById('break-minutes');
  
  if (!minutesInput || !secondsInput || !breakMinutesInput) return;
  
  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;
  const breakMinutes = parseInt(breakMinutesInput.value) || 5;
  
  // Validate input
  if (minutes < 1 || minutes > 120) {
    alert('Focus minutes must be between 1 and 120');
    return;
  }
  
  if (seconds < 0 || seconds > 59) {
    alert('Focus seconds must be between 0 and 59');
    return;
  }
  
  if (breakMinutes < 1 || breakMinutes > 60) {
    alert('Break minutes must be between 1 and 60');
    return;
  }
  
  // Calculate total time in seconds
  const newTime = (minutes * 60) + seconds;
  
  if (newTime < 60) {
    alert('Total focus time must be at least 1 minute');
    return;
  }
  
  // Update timer
  currentTime = newTime;
  totalTime = newTime;
  breakTime = breakMinutes * 60;
  
  // Save settings
  saveTimerSettings();
  
  // Update display
  updateTimerDisplay();
  updateProgressBar();
  
  // Show confirmation
  document.getElementById('timer-status').textContent = `Timer set to ${minutes}:${seconds.toString().padStart(2, '0')} focus, ${breakMinutes} min break`;
  
  // Reset status after 3 seconds
  setTimeout(() => {
    if (timerState === 'idle') {
      document.getElementById('timer-status').textContent = 'Ready to focus';
    }
  }, 3000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = display;
    
    // Update color based on state
    timerDisplay.className = 'timer-time';
    if (timerState === 'focus') {
      timerDisplay.classList.add('focus');
    } else if (timerState === 'break') {
      timerDisplay.classList.add('break');
    }
  }
}

function updateProgressBar() {
  const progressFill = document.getElementById('progress-fill');
  if (!progressFill) return;
  
  let progress = 0;
  
  if (timerState === 'focus') {
    progress = ((totalTime - currentTime) / totalTime) * 100;
    progressFill.className = 'progress-fill focus';
  } else if (timerState === 'break') {
    progress = ((breakTime - currentTime) / breakTime) * 100;
    progressFill.className = 'progress-fill break';
  } else {
    progress = 0;
    progressFill.className = 'progress-fill';
  }
  
  progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function updateTimerUI() {
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const stopBtn = document.getElementById('stop-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const modeIndicator = document.getElementById('mode-indicator');
  
  // Hide all buttons first
  [startBtn, pauseBtn, resumeBtn, stopBtn, cancelBtn].forEach(btn => {
    if (btn) btn.style.display = 'none';
  });
  
  // Update mode indicator
  if (modeIndicator) {
    modeIndicator.className = 'mode-indicator';
    if (timerState === 'focus') {
      modeIndicator.textContent = 'FOCUS';
      modeIndicator.classList.add('mode-focus');
    } else if (timerState === 'break') {
      modeIndicator.textContent = 'BREAK';
      modeIndicator.classList.add('mode-break');
    } else if (timerState === 'paused') {
      modeIndicator.textContent = 'PAUSED';
      modeIndicator.classList.add('mode-idle');
    } else {
      modeIndicator.textContent = 'IDLE';
      modeIndicator.classList.add('mode-idle');
    }
  }
  
  // Show appropriate buttons based on state
  if (timerState === 'idle') {
    if (startBtn) startBtn.style.display = 'inline-block';
  } else if (timerState === 'focus' || timerState === 'break') {
    if (pauseBtn) pauseBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
  } else if (timerState === 'paused') {
    if (resumeBtn) resumeBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
  }
}

function updateBadge() {
  if (timerState === 'idle') {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6c757d' });
  } else if (timerState === 'focus') {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  } else if (timerState === 'break') {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#17a2b8' });
  }
}

// Save blocked sites to storage
async function saveBlockedSites() {
  try {
    await chrome.storage.local.set({ blockedSites });
  } catch (error) {
    console.error('Error saving blocked sites:', error);
  }
}

// Render the sites list
function renderSitesList() {
  const sitesList = document.getElementById('sites-list');
  const blockedCount = document.getElementById('blocked-count');
  
  // Clear existing list
  sitesList.innerHTML = '';
  
  // Add default sites
  defaultSites.forEach(site => {
    const isBlocked = blockedSites.includes(site.domain);
    const siteElement = createSiteElement(site, isBlocked);
    sitesList.appendChild(siteElement);
  });
  
  // Add custom sites
  blockedSites.forEach(domain => {
    if (!defaultSites.find(site => site.domain === domain)) {
      const customSite = { domain, name: domain, icon: '🌐', class: 'custom' };
      const siteElement = createSiteElement(customSite, true);
      sitesList.appendChild(siteElement);
    }
  });
  
  // Update blocked count
  blockedCount.textContent = blockedSites.length;
}

// Create a site element
function createSiteElement(site, isBlocked) {
  const siteDiv = document.createElement('div');
  siteDiv.className = 'site-item';
  
  siteDiv.innerHTML = `
    <div class="site-info">
      <div class="site-icon ${site.class}">${site.icon}</div>
      <div class="site-name">${site.name}</div>
    </div>
    <div class="toggle-switch ${isBlocked ? 'active' : ''}" data-domain="${site.domain}"></div>
  `;
  
  // Add click event to toggle
  const toggle = siteDiv.querySelector('.toggle-switch');
  toggle.addEventListener('click', () => toggleSite(site.domain));
  
  return siteDiv;
}

// Toggle site blocking
async function toggleSite(domain) {
  const index = blockedSites.indexOf(domain);
  
  if (index > -1) {
    // Remove from blocked sites
    blockedSites.splice(index, 1);
    // Send message to background script to remove blocking rule
    chrome.runtime.sendMessage({ action: "removeBlockingRule", domain: domain });
  } else {
    // Add to blocked sites
    blockedSites.push(domain);
    // Send message to background script to add blocking rule
    chrome.runtime.sendMessage({ action: "addBlockingRule", domain: domain });
  }
  
  await saveBlockedSites();
  renderSitesList();
}

// Setup event listeners
function setupEventListeners() {
  const addSiteBtn = document.getElementById('add-site-btn');
  const newSiteInput = document.getElementById('new-site');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const stopBtn = document.getElementById('stop-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const resetBtn = document.getElementById('reset-btn');
  const applyBtn = document.getElementById('apply-btn');
  
  addSiteBtn.addEventListener('click', addCustomSite);
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomSite();
    }
  });
  
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resumeBtn.addEventListener('click', resumeTimer);
  stopBtn.addEventListener('click', stopTimer);
  cancelBtn.addEventListener('click', cancelTimer);
  resetBtn.addEventListener('click', resetTimer);
  applyBtn.addEventListener('click', applyCustomTimer);
}

// Add custom site
async function addCustomSite() {
  const input = document.getElementById('new-site');
  const domain = input.value.trim().toLowerCase();
  
  if (!domain) return;
  
  // Remove protocol and www if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  // Validate domain format
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(cleanDomain)) {
    alert('Please enter a valid domain (e.g., facebook.com)');
    return;
  }
  
  // Check if already exists
  if (blockedSites.includes(cleanDomain)) {
    alert('This site is already in the list!');
    return;
  }
  
  // Add to blocked sites
  blockedSites.push(cleanDomain);
  await saveBlockedSites();
  
  // Send message to background script to add blocking rule
  chrome.runtime.sendMessage({ action: "addBlockingRule", domain: cleanDomain });
  
  // Clear input and refresh
  input.value = '';
  renderSitesList();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshSettings") {
    loadTimerSettings();
  } else if (message.action === "timerUpdate") {
    // Update timer state from background
    if (message.timerState) timerState = message.timerState;
    if (message.currentTime) currentTime = message.currentTime;
    if (message.totalTime) totalTime = message.totalTime;
    if (message.breakTime) breakTime = message.breakTime;
    
    updateTimerDisplay();
    updateProgressBar();
    updateTimerUI();
    updateBadge();
    
    sendResponse({ success: true });
  }
});