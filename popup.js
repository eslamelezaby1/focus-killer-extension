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
let timerInterval = null;
let focusSessionActive = false;
let currentTime = 25 * 60; // 25 minutes in seconds
let totalTime = 0;
let sessionCount = 0;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadBlockedSites();
  await loadFocusStats();
  renderSitesList();
  setupEventListeners();
  updateTimerDisplay();
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

// Load focus statistics from storage
async function loadFocusStats() {
  try {
    const result = await chrome.storage.local.get(['focusStats']);
    const stats = result.focusStats || {};
    const today = new Date().toDateString();
    
    if (stats[today]) {
      sessionCount = stats[today].sessions || 0;
      totalTime = stats[today].totalTime || 0;
    } else {
      sessionCount = 0;
      totalTime = 0;
    }
    
    updateStatsDisplay();
  } catch (error) {
    console.error('Error loading focus stats:', error);
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
      totalTime: totalTime,
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
  if (timeElement) timeElement.textContent = `${Math.floor(totalTime / 60)}m`;
}

// Timer functions
function startTimer() {
  if (focusSessionActive) return;
  
  focusSessionActive = true;
  currentTime = 25 * 60; // Reset to 25 minutes
  
  // Send message to background to activate focus mode
  chrome.runtime.sendMessage({ action: "activateFocusMode" });
  
  // Update UI
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('stop-btn').style.display = 'inline-block';
  document.getElementById('timer-status').textContent = 'Focus session active';
  
  // Start countdown
  timerInterval = setInterval(() => {
    currentTime--;
    updateTimerDisplay();
    
    if (currentTime <= 0) {
      completeFocusSession();
    }
  }, 1000);
}

function stopTimer() {
  if (!focusSessionActive) return;
  
  focusSessionActive = false;
  clearInterval(timerInterval);
  timerInterval = null;
  
  // Send message to background to deactivate focus mode
  chrome.runtime.sendMessage({ action: "deactivateFocusMode" });
  
  // Update UI
  document.getElementById('start-btn').style.display = 'inline-block';
  document.getElementById('stop-btn').style.display = 'none';
  document.getElementById('timer-status').textContent = 'Session paused';
}

function resetTimer() {
  stopTimer();
  currentTime = 25 * 60;
  updateTimerDisplay();
  document.getElementById('timer-status').textContent = 'Ready to focus';
}

function completeFocusSession() {
  stopTimer();
  
  // Update statistics
  sessionCount++;
  totalTime += 25 * 60; // Add 25 minutes
  updateStatsDisplay();
  saveFocusStats();
  
  // Show completion message
  document.getElementById('timer-status').textContent = 'Session completed! 🎉';
  
  // Reset after 3 seconds
  setTimeout(() => {
    document.getElementById('timer-status').textContent = 'Ready for next session';
  }, 3000);
  
  // Send message to background to deactivate focus mode
  chrome.runtime.sendMessage({ action: "deactivateFocusMode" });
}

function updateTimerDisplay() {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) timerDisplay.textContent = display;
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
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-btn');
  
  addSiteBtn.addEventListener('click', addCustomSite);
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomSite();
    }
  });
  
  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);
  
  // Add debug button
  addDebugButton();
}

// Add debug button for testing
function addDebugButton() {
  const debugBtn = document.createElement('button');
  debugBtn.textContent = '🐛 Debug API';
  debugBtn.style.cssText = `
    background: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    margin-top: 8px;
    width: 100%;
  `;
  
  debugBtn.addEventListener('click', testBlockingAPI);
  
  const addSiteDiv = document.querySelector('.add-site');
  addSiteDiv.appendChild(debugBtn);
}

// Test the blocking API
async function testBlockingAPI() {
  console.log('Testing blocking API...');
  
  try {
    // Test adding a blocking rule
    const response = await chrome.runtime.sendMessage({ 
      action: "testBlockingAPI", 
      domain: "test.example.com" 
    });
    
    console.log('Test response:', response);
    
    if (response && response.success) {
      alert('✅ API test successful! Check console for details.');
    } else {
      alert('❌ API test failed! Check console for details.');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    alert('❌ Test failed! Check console for details.');
  }
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