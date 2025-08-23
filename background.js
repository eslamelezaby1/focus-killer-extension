// Focus mode state
let focusModeActive = false;
let blockedSitesInFocus = [];

// Initialize extension
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up...');
  await initializeBlockingRules();
  await loadFocusModeState();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated...');
  await initializeBlockingRules();
  await loadFocusModeState();
});

// Load focus mode state from storage
async function loadFocusModeState() {
  try {
    const result = await chrome.storage.local.get(['focusModeActive']);
    focusModeActive = result.focusModeActive || false;
    
    // If focus mode was active, reactivate it
    if (focusModeActive) {
      await activateFocusMode();
    }
  } catch (error) {
    console.error('Error loading focus mode state:', error);
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

// Update badge based on focus mode state
function updateBadge() {
  if (focusModeActive) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6c757d' });
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === "addBlockingRule") {
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
  } else if (message.action === "refreshSettings") {
    loadFocusModeState().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});