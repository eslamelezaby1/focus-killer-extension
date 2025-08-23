// Test function to verify Chrome API is working
async function testChromeAPI() {
  try {
    console.log('Testing Chrome declarativeNetRequest API...');
    
    // Test getting current rules
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    console.log('Current dynamic rules count:', currentRules.length);
    
    // Test adding a simple test rule with proper integer ID
    const testRuleId = Math.floor(Math.random() * 100000) + 1; // Ensure positive integer
    console.log('Testing with rule ID:', testRuleId);
    
    const testResult = await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: testRuleId,
        priority: 1,
        action: { 
          type: "redirect", 
          redirect: { extensionPath: "/blocked.html" } 
        },
        condition: { 
          urlFilter: "test.example.com", 
          resourceTypes: ["main_frame"] 
        }
      }],
      removeRuleIds: []
    });
    
    console.log('Test rule added successfully:', testResult);
    
    // Clean up test rule
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [testRuleId]
    });
    
    console.log('Test rule cleaned up successfully');
    return true;
    
  } catch (error) {
    console.error('Chrome API test failed:', error);
    return false;
  }
}

// Focus mode state
let focusModeActive = false;
let blockedSitesInFocus = [];
let currentTimerState = 'idle'; // 'idle', 'focus', 'break', 'paused'
let currentTime = 25 * 60; // Current time remaining
let totalTime = 25 * 60; // Total focus time
let breakTime = 5 * 60; // Break duration
let timerInterval = null;
let timerSettings = {
  defaultFocusTime: 25,
  defaultBreakTime: 5,
  blockDuringBreak: false,
  soundNotifications: true
};

// Initialize extension
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up...');
  await initializeBlockingRules();
  await loadTimerSettings();
  await loadTimerState();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated...');
  await initializeBlockingRules();
  await loadTimerSettings();
  await loadTimerState();
});

// Load timer settings from storage
async function loadTimerSettings() {
  try {
    const result = await chrome.storage.local.get(['timerSettings']);
    if (result.timerSettings) {
      timerSettings = { ...timerSettings, ...result.timerSettings };
    }
  } catch (error) {
    console.error('Error loading timer settings:', error);
  }
}

// Load timer state from storage
async function loadTimerState() {
  try {
    const result = await chrome.storage.local.get(['timerState', 'currentTime', 'totalTime', 'breakTime']);
    if (result.timerState) {
      currentTimerState = result.timerState;
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
    
    // Resume timer if it was running
    if (currentTimerState === 'focus' || currentTimerState === 'break') {
      startBackgroundTimer();
    }
  } catch (error) {
    console.error('Error loading timer state:', error);
  }
}

// Save timer state to storage
async function saveTimerState() {
  try {
    await chrome.storage.local.set({
      timerState: currentTimerState,
      currentTime: currentTime,
      totalTime: totalTime,
      breakTime: breakTime
    });
  } catch (error) {
    console.error('Error saving timer state:', error);
  }
}

// Clean up any existing rules to prevent conflicts
async function cleanupExistingRules() {
  try {
    // Get all existing dynamic rules
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    if (rules.length > 0) {
      console.log(`Cleaning up ${rules.length} existing rules`);
      const ruleIds = rules.map(rule => rule.id);
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
      console.log('Existing rules cleaned up');
    }
  } catch (error) {
    console.error('Error cleaning up existing rules:', error);
  }
}

// Initialize blocking rules from storage
async function initializeBlockingRules() {
  try {
    // First clean up any existing rules
    await cleanupExistingRules();
    
    const result = await chrome.storage.local.get(['blockedSites']);
    const blockedSites = result.blockedSites || [];
    
    // Clear any existing rules from storage
    await chrome.storage.local.set({ ruleIds: {} });
    
    // Add rules for currently blocked sites
    for (const domain of blockedSites) {
      await addBlockingRule(domain);
    }
  } catch (error) {
    console.error('Error initializing blocking rules:', error);
  }
}

// Get all rule IDs from storage
async function getAllRuleIds() {
  try {
    const result = await chrome.storage.local.get(['ruleIds']);
    const ruleIds = result.ruleIds || {};
    return Object.values(ruleIds);
  } catch (error) {
    console.error('Error getting rule IDs:', error);
    return [];
  }
}

// Generate a unique rule ID for a domain
function generateRuleId(domain) {
  // Use a combination of timestamp and domain hash to ensure uniqueness
  // But keep it within a reasonable range for Chrome's integer requirement
  const timestamp = Date.now() % 1000000; // Keep timestamp part manageable
  const domainHash = domain.split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) & 0x7fffffff; // Keep positive and manageable
  }, 0);
  
  // Combine and ensure it's a proper integer
  const combined = timestamp + domainHash;
  return Math.abs(combined) % 1000000; // Keep within reasonable range
}

// Add blocking rule for a domain
async function addBlockingRule(domain) {
  try {
    // Generate a unique rule ID
    const ruleId = generateRuleId(domain);
    
    console.log(`Adding blocking rule for ${domain} with ID ${ruleId}`);
    
    const result = await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: ruleId,
        priority: 1,
        action: { 
          type: "redirect", 
          redirect: { extensionPath: "/blocked.html" } 
        },
        condition: { 
          urlFilter: `*${domain}*`, 
          resourceTypes: ["main_frame"] 
        }
      }],
      removeRuleIds: []
    });
    
    console.log('Chrome API response:', result);
    
    // Store rule ID for later removal
    const rules = await chrome.storage.local.get(['ruleIds']) || { ruleIds: {} };
    rules.ruleIds[domain] = ruleId;
    await chrome.storage.local.set(rules);
    
    console.log(`Successfully added blocking rule for ${domain}`);
    
  } catch (error) {
    console.error('Error adding blocking rule:', error);
    
    // If there's an ID conflict, try with a different approach
    if (error.message.includes('does not have a unique ID')) {
      console.log('Retrying with alternative ID generation...');
      await addBlockingRuleWithAlternativeId(domain);
    }
  }
}

// Alternative method for adding blocking rule with guaranteed unique ID
async function addBlockingRuleWithAlternativeId(domain) {
  try {
    // Use a completely different approach - timestamp + random + domain length
    // But ensure it's a proper integer within Chrome's requirements
    const timestamp = Date.now() % 1000000;
    const random = Math.floor(Math.random() * 10000);
    const domainLength = domain.length;
    const ruleId = timestamp + random + domainLength;
    
    console.log(`Adding blocking rule for ${domain} with alternative ID ${ruleId}`);
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: ruleId,
        priority: 1,
        action: { 
          type: "redirect", 
          redirect: { extensionPath: "/blocked.html" } 
        },
        condition: { 
          urlFilter: `*${domain}*`, 
          resourceTypes: ["main_frame"] 
        }
      }],
      removeRuleIds: []
    });
    
    // Store rule ID for later removal
    const rules = await chrome.storage.local.get(['ruleIds']) || { ruleIds: {} };
    rules.ruleIds[domain] = ruleId;
    await chrome.storage.local.set(rules);
    
    console.log(`Successfully added blocking rule for ${domain} with alternative ID`);
    
  } catch (error) {
    console.error('Error adding blocking rule with alternative ID:', error);
  }
}

// Remove blocking rule for a domain
async function removeBlockingRule(domain) {
  try {
    const rules = await chrome.storage.local.get(['ruleIds']) || { ruleIds: {} };
    const ruleId = rules.ruleIds[domain];
    
    if (ruleId) {
      console.log(`Removing blocking rule for ${domain} with ID ${ruleId}`);
      
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId]
      });
      
      // Remove rule ID from storage
      delete rules.ruleIds[domain];
      await chrome.storage.local.set(rules);
      
      console.log(`Successfully removed blocking rule for ${domain}`);
    }
  } catch (error) {
    console.error('Error removing blocking rule:', error);
  }
}

// Start background timer
function startBackgroundTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    currentTime--;
    
    // Save current state
    saveTimerState();
    
    // Update badge
    updateBadge();
    
    // Check if timer completed
    if (currentTime <= 0) {
      if (currentTimerState === 'focus') {
        completeFocusSession();
      } else if (currentTimerState === 'break') {
        completeBreak();
      }
    }
  }, 1000);
}

// Stop background timer
function stopBackgroundTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Activate focus mode - enable blocking for all blocked sites
async function activateFocusMode() {
  try {
    console.log('Activating focus mode...');
    focusModeActive = true;
    
    // Get current blocked sites
    const result = await chrome.storage.local.get(['blockedSites']);
    const blockedSites = result.blockedSites || [];
    
    // Store current blocked sites for focus mode
    blockedSitesInFocus = [...blockedSites];
    
    // Ensure all blocked sites have active blocking rules
    for (const domain of blockedSites) {
      await addBlockingRule(domain);
    }
    
    console.log(`Focus mode activated with ${blockedSites.length} sites blocked`);
    
    // Store focus mode state
    await chrome.storage.local.set({ focusModeActive: true });
    
    // Update badge
    updateBadge();
    
  } catch (error) {
    console.error('Error activating focus mode:', error);
  }
}

// Activate break mode
async function activateBreakMode() {
  try {
    console.log('Activating break mode...');
    
    // Check if sites should be blocked during break
    if (!timerSettings.blockDuringBreak) {
      // Remove all blocking rules during break
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      if (rules.length > 0) {
        const ruleIds = rules.map(rule => rule.id);
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds
        });
        console.log(`Removed ${ruleIds.length} blocking rules during break`);
      }
    }
    
    // Update badge
    updateBadge();
    
  } catch (error) {
    console.error('Error activating break mode:', error);
  }
}

// Deactivate focus mode - remove all blocking rules
async function deactivateFocusMode() {
  try {
    console.log('Deactivating focus mode...');
    focusModeActive = false;
    
    // Remove all blocking rules
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    if (rules.length > 0) {
      const ruleIds = rules.map(rule => rule.id);
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
      console.log(`Removed ${ruleIds.length} blocking rules`);
    }
    
    // Clear rule IDs from storage
    await chrome.storage.local.set({ ruleIds: {} });
    
    // Clear focus mode state
    await chrome.storage.local.set({ focusModeActive: false });
    
    // Update badge
    updateBadge();
    
    console.log('Focus mode deactivated');
    
  } catch (error) {
    console.error('Error deactivating focus mode:', error);
  }
}

// Update badge based on timer state
function updateBadge() {
  if (currentTimerState === 'idle') {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6c757d' });
  } else if (currentTimerState === 'focus') {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  } else if (currentTimerState === 'break') {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#17a2b8' });
  }
}

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm triggered:', alarm.name);
  
  if (alarm.name === 'focusTimer') {
    // Focus session complete
    await completeFocusSession();
  } else if (alarm.name === 'breakTimer') {
    // Break complete
    await completeBreak();
  }
});

// Complete focus session
async function completeFocusSession() {
  console.log('Focus session complete, starting break...');
  
  // Stop current timer
  stopBackgroundTimer();
  
  // Update state
  currentTimerState = 'break';
  currentTime = breakTime;
  
  // Save state
  saveTimerState();
  
  // Show notification
  if (timerSettings.soundNotifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'FocusKiller - Session Complete!',
      message: `Great job! You've completed your focus session. Time for a ${Math.floor(breakTime / 60)}-minute break!`
    });
  }
  
  // Activate break mode
  await activateBreakMode();
  
  // Start break timer
  startBackgroundTimer();
  
  // Update badge
  updateBadge();
  
  // Send message to popup to update state
  chrome.runtime.sendMessage({ action: "focusSessionComplete" });
}

// Complete break
async function completeBreak() {
  console.log('Break complete, returning to idle...');
  
  // Stop current timer
  stopBackgroundTimer();
  
  // Update state
  currentTimerState = 'idle';
  currentTime = totalTime;
  
  // Save state
  saveTimerState();
  
  // Show notification
  if (timerSettings.soundNotifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'FocusKiller - Break Complete!',
      message: 'Break time is over! Ready to start your next focus session?'
    });
  }
  
  // Deactivate focus mode
  await deactivateFocusMode();
  
  // Update badge
  updateBadge();
  
  // Send message to popup to update state
  chrome.runtime.sendMessage({ action: "breakComplete" });
}

// Start focus timer
async function startFocusTimer(durationMinutes, totalTimeSeconds, breakTimeSeconds) {
  try {
    console.log(`Starting focus timer for ${durationMinutes} minutes`);
    
    // Update state
    currentTimerState = 'focus';
    currentTime = totalTimeSeconds;
    totalTime = totalTimeSeconds;
    breakTime = breakTimeSeconds;
    
    // Save state
    await saveTimerState();
    
    // Activate focus mode
    await activateFocusMode();
    
    // Start background timer
    startBackgroundTimer();
    
    // Update badge
    updateBadge();
    
    console.log('Focus timer started successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Error starting focus timer:', error);
    return { success: false, error: error.message };
  }
}

// Pause timer
async function pauseTimer() {
  try {
    console.log('Pausing timer...');
    
    if (currentTimerState === 'focus' || currentTimerState === 'break') {
      // Stop background timer
      stopBackgroundTimer();
      
      // Update state
      currentTimerState = 'paused';
      await saveTimerState();
      
      // Update badge
      updateBadge();
      
      console.log('Timer paused successfully');
      return { success: true };
    } else {
      return { success: false, error: 'Timer is not running' };
    }
    
  } catch (error) {
    console.error('Error pausing timer:', error);
    return { success: false, error: error.message };
  }
}

// Resume timer
async function resumeTimer() {
  try {
    console.log('Resuming timer...');
    
    if (currentTimerState === 'paused') {
      // Restore previous state
      if (currentTime > 0) {
        // Resume timer
        startBackgroundTimer();
        
        // Update badge
        updateBadge();
        
        console.log('Timer resumed successfully');
        return { success: true };
      } else {
        // Timer completed, reset to idle
        currentTimerState = 'idle';
        currentTime = totalTime;
        await saveTimerState();
        updateBadge();
        return { success: true };
      }
    } else {
      return { success: false, error: 'Timer is not paused' };
    }
    
  } catch (error) {
    console.error('Error resuming timer:', error);
    return { success: false, error: error.message };
  }
}

// Stop timer
async function stopTimer() {
  try {
    console.log('Stopping timer...');
    
    // Stop background timer
    stopBackgroundTimer();
    
    // Clear all alarms
    await chrome.alarms.clearAll();
    
    // Reset state
    currentTimerState = 'idle';
    currentTime = totalTime;
    
    // Save state
    await saveTimerState();
    
    // Deactivate focus mode
    await deactivateFocusMode();
    
    // Update badge
    updateBadge();
    
    console.log('Timer stopped successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Error stopping timer:', error);
    return { success: false, error: error.message };
  }
}

// Cancel timer
async function cancelTimer() {
  try {
    console.log('Cancelling timer...');
    
    // Stop background timer
    stopBackgroundTimer();
    
    // Clear all alarms
    await chrome.alarms.clearAll();
    
    // Reset state
    currentTimerState = 'idle';
    currentTime = totalTime;
    
    // Save state
    await saveTimerState();
    
    // Deactivate focus mode
    await deactivateFocusMode();
    
    // Update badge
    updateBadge();
    
    console.log('Timer cancelled successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Error cancelling timer:', error);
    return { success: false, error: error.message };
  }
}

// Reset timer
async function resetTimer() {
  try {
    console.log('Resetting timer...');
    
    // Stop background timer
    stopBackgroundTimer();
    
    // Clear all alarms
    await chrome.alarms.clearAll();
    
    // Reset state
    currentTimerState = 'idle';
    currentTime = totalTime;
    
    // Save state
    await saveTimerState();
    
    // Deactivate focus mode
    await deactivateFocusMode();
    
    // Update badge
    updateBadge();
    
    console.log('Timer reset successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Error resetting timer:', error);
    return { success: false, error: error.message };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === "ping") {
    // Simple ping to test connection
    sendResponse({ success: true, message: "Background script is running" });
    return false; // No async response needed
  } else if (message.action === "addBlockingRule") {
    addBlockingRule(message.domain).then(() => {
      console.log(`Blocking rule added for ${message.domain}`);
      sendResponse({ success: true });
    }).catch((error) => {
      console.error(`Error adding blocking rule for ${message.domain}:`, error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "removeBlockingRule") {
    removeBlockingRule(message.domain).then(() => {
      console.log(`Blocking rule removed for ${message.domain}`);
      sendResponse({ success: true });
    }).catch((error) => {
      console.error(`Error removing blocking rule for ${message.domain}:`, error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "activateFocusMode") {
    activateFocusMode().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "deactivateFocusMode") {
    deactivateFocusMode().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "startFocusTimer") {
    startFocusTimer(message.duration, message.totalTime, message.breakTime).then((response) => {
      sendResponse(response);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "pauseTimer") {
    pauseTimer().then((response) => {
      sendResponse(response);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "resumeTimer") {
    resumeTimer().then((response) => {
      sendResponse(response);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "stopTimer") {
    stopTimer().then((response) => {
      sendResponse(response);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "cancelTimer") {
    cancelTimer().then((response) => {
      sendResponse(response);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "resetTimer") {
    resetTimer().then((response) => {
      sendResponse(response);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "refreshSettings") {
    loadTimerSettings().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});