// Initialize blocked sites from storage on extension load
chrome.runtime.onStartup.addListener(async () => {
  await initializeBlockingRules();
});

chrome.runtime.onInstalled.addListener(async () => {
  await initializeBlockingRules();
});

// Initialize blocking rules from storage
async function initializeBlockingRules() {
  try {
    const result = await chrome.storage.local.get(['blockedSites']);
    const blockedSites = result.blockedSites || [];
    
    // Clear any existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: await getAllRuleIds()
    });
    
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

// Add blocking rule for a domain
async function addBlockingRule(domain) {
  try {
    // Generate a unique rule ID based on domain hash
    const ruleId = Math.abs(domain.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
    
    console.log(`Adding blocking rule for ${domain} with ID ${ruleId}`);
    
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
    
    console.log(`Successfully added blocking rule for ${domain}`);
    
  } catch (error) {
    console.error('Error adding blocking rule:', error);
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
  }
});