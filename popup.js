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
let focusModeActive = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadBlockedSites();
  await loadFocusModeState();
  renderSitesList();
  setupEventListeners();
  updateFocusModeUI();
});

// Load focus mode state from storage
async function loadFocusModeState() {
  try {
    const result = await chrome.storage.local.get(['focusModeActive']);
    focusModeActive = result.focusModeActive || false;
  } catch (error) {
    console.error('Error loading focus mode state:', error);
    focusModeActive = false;
  }
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

// Save focus mode state to storage
async function saveFocusModeState() {
  try {
    await chrome.storage.local.set({ focusModeActive });
  } catch (error) {
    console.error('Error saving focus mode state:', error);
  }
}

// Toggle focus mode
async function toggleFocusMode() {
  try {
    if (focusModeActive) {
      // Disable focus mode
      await chrome.runtime.sendMessage({ action: "deactivateFocusMode" });
      focusModeActive = false;
      updateFocusModeUI();
      showFocusModeMessage('Focus mode disabled. You can now access all websites.', 'success');
    } else {
      // Enable focus mode
      await chrome.runtime.sendMessage({ action: "activateFocusMode" });
      focusModeActive = true;
      updateFocusModeUI();
      showFocusModeMessage('Focus mode enabled! Distracting websites are now blocked.', 'success');
    }
    
    await saveFocusModeState();
    
  } catch (error) {
    console.error('Error toggling focus mode:', error);
    showFocusModeMessage('Error changing focus mode. Please try again.', 'error');
  }
}

// Show focus mode message
function showFocusModeMessage(message, type) {
  const statusElement = document.getElementById('focus-status');
  if (statusElement) {
    statusElement.innerHTML = `<strong>Status:</strong> ${message}`;
    statusElement.className = `focus-status ${type}`;
    
    // Reset to normal status after 3 seconds
    setTimeout(() => {
      updateFocusModeUI();
    }, 3000);
  }
}

// Update focus mode UI
function updateFocusModeUI() {
  const toggleBtn = document.getElementById('toggle-focus-btn');
  const statusText = document.getElementById('focus-status');
  const btnText = toggleBtn.querySelector('.btn-text');
  
  if (focusModeActive) {
    // Focus mode is ON
    toggleBtn.classList.add('focus-active');
    toggleBtn.classList.remove('focus-btn:disabled');
    btnText.textContent = 'Disable Focus Mode';
    statusText.innerHTML = '<strong>Status:</strong> Focus mode is currently active';
    statusText.className = 'focus-status active';
  } else {
    // Focus mode is OFF
    toggleBtn.classList.remove('focus-active');
    toggleBtn.classList.remove('focus-btn:disabled');
    btnText.textContent = 'Enable Focus Mode';
    statusText.innerHTML = '<strong>Status:</strong> Focus mode is currently disabled';
    statusText.className = 'focus-status inactive';
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

// Setup event listeners
function setupEventListeners() {
  const addSiteBtn = document.getElementById('add-site-btn');
  const newSiteInput = document.getElementById('new-site');
  const toggleFocusBtn = document.getElementById('toggle-focus-btn');
  
  addSiteBtn.addEventListener('click', addCustomSite);
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomSite();
    }
  });
  
  toggleFocusBtn.addEventListener('click', toggleFocusMode);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshSettings") {
    loadFocusModeState();
    updateFocusModeUI();
  }
});