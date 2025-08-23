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
let timerSettings = {
  defaultFocusTime: 25,
  defaultBreakTime: 5,
  blockDuringBreak: false,
  soundNotifications: true
};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadBlockedSites();
  await loadFocusStats();
  renderSitesList();
  setupEventListeners();
});

// Load all settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['timerSettings']);
    if (result.timerSettings) {
      timerSettings = { ...timerSettings, ...result.timerSettings };
    }
    
    // Update UI with loaded settings
    document.getElementById('default-focus-time').value = timerSettings.defaultFocusTime;
    document.getElementById('default-break-time').value = timerSettings.defaultBreakTime;
    document.getElementById('block-during-break').classList.toggle('active', timerSettings.blockDuringBreak);
    document.getElementById('sound-notifications').classList.toggle('active', timerSettings.soundNotifications);
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save timer settings to storage
async function saveTimerSettings() {
  try {
    // Get values from UI
    timerSettings.defaultFocusTime = parseInt(document.getElementById('default-focus-time').value);
    timerSettings.defaultBreakTime = parseInt(document.getElementById('default-break-time').value);
    timerSettings.blockDuringBreak = document.getElementById('block-during-break').classList.contains('active');
    timerSettings.soundNotifications = document.getElementById('sound-notifications').classList.contains('active');
    
    // Save to storage
    await chrome.storage.sync.set({ timerSettings });
    
    // Also save to local storage for popup access
    await chrome.storage.local.set({ timerSettings });
    
    showSaveStatus('Settings saved successfully!', 'success');
    
    // Send message to popup to refresh settings
    chrome.runtime.sendMessage({ action: "refreshSettings" });
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showSaveStatus('Error saving settings', 'error');
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

// Save blocked sites to storage
async function saveBlockedSites() {
  try {
    await chrome.storage.local.set({ blockedSites });
  } catch (error) {
    console.error('Error saving blocked sites:', error);
  }
}

// Load focus statistics from storage
async function loadFocusStats() {
  try {
    const result = await chrome.storage.local.get(['focusStats']);
    const stats = result.focusStats || {};
    
    // Calculate totals
    let totalSessions = 0;
    let totalTime = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    // Calculate current streak
    let streakCount = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dateStr = currentDate.toDateString();
      if (stats[dateStr] && stats[dateStr].sessions > 0) {
        streakCount++;
        if (streakCount > bestStreak) {
          bestStreak = streakCount;
        }
      } else {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    currentStreak = streakCount;
    
    // Calculate totals
    Object.values(stats).forEach(dayStats => {
      totalSessions += dayStats.sessions || 0;
      totalTime += dayStats.totalTime || 0;
    });
    
    // Update UI
    document.getElementById('total-sessions').textContent = totalSessions;
    document.getElementById('total-time').textContent = `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m`;
    document.getElementById('current-streak').textContent = currentStreak;
    document.getElementById('best-streak').textContent = bestStreak;
    
  } catch (error) {
    console.error('Error loading focus stats:', error);
  }
}

// Render the sites list
function renderSitesList() {
  const sitesList = document.getElementById('sites-list');
  
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

// Export blocked sites list
function exportSites() {
  const dataStr = JSON.stringify(blockedSites, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'focuskiller-blocked-sites.json';
  link.click();
}

// Import blocked sites list
function importSites() {
  const fileInput = document.getElementById('import-file');
  fileInput.click();
}

// Handle file import
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const importedSites = JSON.parse(text);
    
    if (Array.isArray(importedSites)) {
      // Validate domains
      const validSites = importedSites.filter(domain => 
        /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domain)
      );
      
      if (validSites.length > 0) {
        blockedSites = [...new Set([...blockedSites, ...validSites])]; // Remove duplicates
        await saveBlockedSites();
        renderSitesList();
        
        // Add blocking rules for new sites
        validSites.forEach(domain => {
          if (!blockedSites.includes(domain)) {
            chrome.runtime.sendMessage({ action: "addBlockingRule", domain: domain });
          }
        });
        
        showSaveStatus(`Imported ${validSites.length} sites successfully!`, 'success');
      } else {
        showSaveStatus('No valid domains found in file', 'error');
      }
    } else {
      showSaveStatus('Invalid file format', 'error');
    }
  } catch (error) {
    console.error('Error importing sites:', error);
    showSaveStatus('Error importing sites', 'error');
  }
  
  // Reset file input
  event.target.value = '';
}

// Reset statistics
async function resetStats() {
  if (confirm('Are you sure you want to reset all focus statistics? This action cannot be undone.')) {
    try {
      await chrome.storage.local.remove(['focusStats']);
      await loadFocusStats();
      showSaveStatus('Statistics reset successfully!', 'success');
    } catch (error) {
      console.error('Error resetting stats:', error);
      showSaveStatus('Error resetting statistics', 'error');
    }
  }
}

// Show save status message
function showSaveStatus(message, type) {
  const statusElement = document.getElementById('save-status');
  statusElement.textContent = message;
  statusElement.className = `save-status save-${type}`;
  statusElement.classList.remove('hidden');
  
  setTimeout(() => {
    statusElement.classList.add('hidden');
  }, 3000);
}

// Setup event listeners
function setupEventListeners() {
  // Timer settings
  document.getElementById('save-timer-settings').addEventListener('click', saveTimerSettings);
  
  // Toggle switches
  document.getElementById('block-during-break').addEventListener('click', function() {
    this.classList.toggle('active');
  });
  
  document.getElementById('sound-notifications').addEventListener('click', function() {
    this.classList.toggle('active');
  });
  
  // Site management
  document.getElementById('add-site-btn').addEventListener('click', addCustomSite);
  document.getElementById('new-site').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomSite();
    }
  });
  
  // Export/Import
  document.getElementById('export-sites').addEventListener('click', exportSites);
  document.getElementById('import-sites').addEventListener('click', importSites);
  document.getElementById('import-file').addEventListener('change', handleFileImport);
  
  // Statistics
  document.getElementById('reset-stats').addEventListener('click', resetStats);
}
