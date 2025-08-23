// Modern blocked page with timer integration
document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.container');
  
  // Add subtle hover effect
  container.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px)';
    this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)';
  });
  
  container.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  });

  // Update motivational quotes periodically
  const quotes = [
    "The difference between successful people and very successful people is that very successful people say 'no' to almost everything.",
    "Focus is not about saying yes to the things you've got to focus on, but about saying no to the hundred other good ideas.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future depends on what you do today.",
    "Don't watch the clock; do what it does. Keep going.",
    "The key to success is to focus on goals, not obstacles.",
    "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
    "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus."
  ];

  let quoteIndex = 0;
  setInterval(() => {
    const motivationalText = document.querySelector('.motivational-text');
    quoteIndex = (quoteIndex + 1) % quotes.length;
    motivationalText.style.opacity = '0';
    
    setTimeout(() => {
      motivationalText.textContent = quotes[quoteIndex];
      motivationalText.style.opacity = '1';
    }, 300);
  }, 8000);

  // Timer integration
  updateFocusInfo();
  setInterval(updateFocusInfo, 1000);
});

// Update focus information from storage
async function updateFocusInfo() {
  try {
    const result = await chrome.storage.local.get(['focusModeActive', 'focusStats', 'timerSettings']);
    const focusModeActive = result.focusModeActive || false;
    
    const focusTimeElement = document.getElementById('focus-time');
    const focusStatusElement = document.getElementById('focus-status');
    
    if (focusModeActive) {
      // Get current focus session time
      const stats = result.focusStats || {};
      const today = new Date().toDateString();
      const todayStats = stats[today] || { sessions: 0, totalTime: 0 };
      
      // Get custom timer duration
      const timerSettings = result.timerSettings || {};
      const sessionDuration = timerSettings.customTime || 25 * 60; // Use custom time or default to 25 minutes
      const completedSessions = todayStats.sessions || 0;
      const totalTimeSpent = todayStats.totalTime || 0;
      
      // Show current session progress
      const currentSessionTime = Math.min(sessionDuration, sessionDuration - (Date.now() % (sessionDuration * 1000)) / 1000);
      const minutes = Math.floor(currentSessionTime / 60);
      const seconds = Math.floor(currentSessionTime % 60);
      
      if (focusTimeElement) {
        focusTimeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      if (focusStatusElement) {
        focusStatusElement.textContent = `Session ${completedSessions + 1} in progress`;
      }
    } else {
      // Focus mode not active
      if (focusTimeElement) {
        focusTimeElement.textContent = '00:00';
      }
      
      if (focusStatusElement) {
        focusStatusElement.textContent = 'Focus mode inactive';
      }
    }
  } catch (error) {
    console.error('Error updating focus info:', error);
  }
}
