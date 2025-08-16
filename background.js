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

// Initialize blocked sites from storage on extension load
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up...');
  await testChromeAPI();
  await initializeBlockingRules();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated...');
  await testChromeAPI();
  await initializeBlockingRules();
});

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
    console.log('Rule details:', {
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
    });
    
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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      domain: domain
    });
    
    // If there's an ID conflict, try with a different approach
    if (error.message.includes('does not have a unique ID')) {
      console.log('Retrying with alternative ID generation...');
      await addBlockingRuleWithAlternativeId(domain);
    } else {
      // For other errors, try to get more info
      try {
        const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
        console.log('Current dynamic rules:', currentRules);
      } catch (storageError) {
        console.error('Error getting current rules:', storageError);
      }
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
  } else if (message.action === "testBlockingAPI") {
    testChromeAPI().then((success) => {
      sendResponse({ success: success });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});