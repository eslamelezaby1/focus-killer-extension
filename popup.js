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

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadBlockedSites();
  renderSitesList();
  setupEventListeners();
});

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
  console.log(`Toggling site: ${domain}`);
  const index = blockedSites.indexOf(domain);
  
  if (index > -1) {
    // Remove from blocked sites
    console.log(`Removing ${domain} from blocked sites`);
    blockedSites.splice(index, 1);
    // Send message to background script to remove blocking rule
    chrome.runtime.sendMessage({ action: "removeBlockingRule", domain: domain }, (response) => {
      console.log(`Remove response:`, response);
    });
  } else {
    // Add to blocked sites
    console.log(`Adding ${domain} to blocked sites`);
    blockedSites.push(domain);
    // Send message to background script to add blocking rule
    chrome.runtime.sendMessage({ action: "addBlockingRule", domain: domain }, (response) => {
      console.log(`Add response:`, response);
    });
  }
  
  await saveBlockedSites();
  renderSitesList();
}

// Setup event listeners
function setupEventListeners() {
  const addSiteBtn = document.getElementById('add-site-btn');
  const newSiteInput = document.getElementById('new-site');
  
  addSiteBtn.addEventListener('click', addCustomSite);
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomSite();
    }
  });
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