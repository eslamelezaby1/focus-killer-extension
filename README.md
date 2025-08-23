# FocusKiller - Browser Extension

A browser extension designed to help you stay focused and productive by blocking distracting websites during your focus sessions.

## 🚀 Features

### Core Functionality
- **Website Blocking**: Block distracting websites individually with one click
- **Focus Timer**: Customizable Pomodoro-style timer with focus and break sessions
- **Smart Notifications**: Browser notifications and sounds when sessions end
- **Session Tracking**: Monitor your daily focus progress and build streaks

### Timer Features
- **Customizable Focus Duration**: Set focus time from 1-120 minutes (default: 25 minutes)
- **Break Timer**: Automatic 5-minute breaks after focus sessions (customizable)
- **Pause/Resume**: Pause and resume your focus sessions at any time
- **Visual Progress**: Progress bar showing session completion
- **Badge Display**: Extension badge shows countdown and current mode

### Break Mode Options
- **Configurable Blocking**: Choose whether to block sites during breaks
- **Flexible Duration**: Set break time from 1-60 minutes
- **Smart Transitions**: Automatic switching between focus and break modes

### Statistics & Analytics
- **Daily Tracking**: Monitor sessions completed and total focus time
- **Streak Building**: Track consecutive days of focus sessions
- **Progress Visualization**: See your productivity trends over time

### Website Management
- **Pre-built List**: Common distracting sites pre-configured
- **Custom Sites**: Add your own distracting websites
- **Export/Import**: Backup and restore your blocked sites list
- **One-Click Toggle**: Easily enable/disable blocking for specific sites

## 📱 User Interface

### Popup Interface
- **Timer Display**: Large, clear countdown timer
- **Mode Indicator**: Shows current state (IDLE, FOCUS, BREAK, PAUSED)
- **Progress Bar**: Visual representation of session progress
- **Quick Controls**: Start, pause, resume, stop, and cancel buttons
- **Settings Panel**: Adjust focus time, break time, and other preferences

### Options Page
- **Timer Settings**: Configure default focus and break durations
- **Blocking Preferences**: Choose whether to block sites during breaks
- **Notification Settings**: Enable/disable sound notifications
- **Site Management**: Add, remove, and organize blocked websites
- **Statistics Dashboard**: View your focus productivity metrics

## 🛠️ Technical Details

### Architecture
- **Manifest V3**: Built with the latest Chrome extension standards
- **Service Worker**: Background script handles timer logic and site blocking
- **Storage API**: Uses chrome.storage.sync for settings and chrome.storage.local for data
- **Alarms API**: Reliable timer handling even when popup is closed
- **Declarative Net Request**: Efficient website blocking without performance impact

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## 📖 Usage Guide

### Getting Started
1. **Install the Extension**: Load the extension from the Chrome Web Store or developer mode
2. **Configure Settings**: Right-click the extension icon and select "Options"
3. **Set Timer Preferences**: Choose your preferred focus and break durations
4. **Add Distracting Sites**: Select from pre-built list or add custom domains
5. **Start Your First Session**: Click the extension icon and press "Start Focus"

### Timer Controls
- **Start Focus**: Begin a focus session with the configured duration
- **Pause**: Temporarily pause the timer (sites remain blocked)
- **Resume**: Continue a paused session from where you left off
- **Stop**: End the current session and return to idle mode
- **Cancel**: Abort the session and reset the timer
- **Reset**: Return to the default timer settings

### Break Mode
- **Automatic Transition**: Breaks start automatically after focus sessions
- **Configurable Blocking**: Choose whether distracting sites remain blocked
- **Break Duration**: Set custom break lengths (1-60 minutes)
- **Smart Notifications**: Get notified when break time is complete

### Website Management
- **Toggle Blocking**: Click the toggle switch next to any site
- **Add Custom Sites**: Enter domain names (e.g., "facebook.com")
- **Export List**: Download your blocked sites as a JSON file
- **Import List**: Restore sites from a previously exported file

## ⚙️ Configuration

### Timer Settings
- **Focus Duration**: 1-120 minutes (default: 25)
- **Break Duration**: 1-60 minutes (default: 5)
- **Block During Break**: Enable/disable site blocking during breaks
- **Sound Notifications**: Enable/disable audio alerts

### Blocking Preferences
- **Individual Control**: Block/unblock sites independently
- **Persistent Storage**: Settings saved across browser sessions
- **Real-time Updates**: Changes apply immediately without restart

## 📊 Statistics & Progress

### Daily Metrics
- **Sessions Completed**: Number of focus sessions finished today
- **Total Focus Time**: Cumulative minutes of focused work
- **Current Streak**: Consecutive days with completed sessions
- **Best Streak**: Longest streak of focus days

### Progress Tracking
- **Automatic Recording**: Statistics update automatically
- **Persistent Storage**: Data saved locally for privacy
- **Reset Option**: Clear statistics if desired
- **Export Capability**: Backup your progress data

## 🔧 Development

### Project Structure
```
FocusKiller/
├── manifest.json          # Extension configuration
├── popup.html            # Main timer interface
├── popup.js              # Timer logic and UI interactions
├── background.js         # Service worker and background tasks
├── options.html          # Settings and configuration page
├── options.js            # Options page functionality
├── blocked.html          # Blocked site redirect page
├── icons/                # Extension icons
└── README.md             # This documentation
```

### Key Technologies
- **HTML5**: Modern semantic markup
- **CSS3**: Responsive design with CSS Grid and Flexbox
- **JavaScript ES6+**: Modern JavaScript with async/await
- **Chrome Extensions API**: Manifest V3 and related APIs
- **Local Storage**: Chrome storage APIs for data persistence

### Building & Testing
1. **Load Extension**: Enable developer mode in Chrome
2. **Load Unpacked**: Select the FocusKiller directory
3. **Test Functionality**: Use the popup and options pages
4. **Debug**: Check console logs in background and popup contexts

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use modern JavaScript (ES6+)
- Follow Chrome extension best practices
- Maintain consistent formatting
- Add comments for complex logic

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

### Common Issues
- **Sites Not Blocking**: Check if the domain is correctly added
- **Timer Not Working**: Ensure the extension has necessary permissions
- **Notifications Not Showing**: Grant notification permissions when prompted

### Getting Help
- Check the browser console for error messages
- Verify extension permissions in Chrome settings
- Ensure the extension is properly loaded in developer mode

---

**FocusKiller** - Stay focused, stay productive! 🎯
