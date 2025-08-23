# FocusKiller 🚫

A browser extension designed to help you stay focused and productive by blocking distracting websites during your focus sessions.

## Features

- **Website Blocking**: Block distracting websites during focus sessions
- **Custom Timer**: Set your own focus duration (1-120 minutes)
- **Pomodoro Timer**: Built-in 25-minute focus timer with session tracking
- **Focus Mode**: Automatic blocking activation when timer starts
- **Daily Statistics**: Track your daily focus sessions and total time
- **Modern UI**: Clean, minimalist blocked page design
- **Focus Enhancement**: Motivational quotes to keep you on track
- **Easy Management**: Simple popup interface for extension control

## Installation

### Chrome/Edge/Brave
1. Download or clone this repository
2. Open your browser and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the FocusKiller folder
5. The extension icon should appear in your browser toolbar

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" tab
4. Click "Load Temporary Add-on" and select the `manifest.json` file

## Usage

### Timer & Focus Sessions
1. **Click the extension icon** in your browser toolbar to open the popup
2. **Set your focus time** - Use the custom timer inputs (1-120 minutes + seconds)
3. **Click "Apply"** to save your custom timer settings
4. **Click "Start"** to begin a focus session
   - All blocked sites will be automatically blocked
   - Timer will count down from your custom duration
5. **Stay focused** - Blocked sites will show a motivational blocked page
6. **Session completion** - When timer ends, focus mode automatically deactivates
7. **Track progress** - View daily statistics in the popup

### Website Management
1. **Configure blocked sites** by adding URLs you want to block
2. **Toggle blocking** for individual sites using the switches
3. **Add custom sites** by entering domain names
4. **Monitor status** - See how many sites are currently blocked

## File Structure

```
FocusKiller/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker with focus mode
├── popup.html            # Extension popup interface with timer
├── popup.js              # Popup functionality and timer logic
├── blocked.html          # Blocked page design with timer display
├── blocked.js            # Blocked page interactions and timer sync
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Timer Features

- **Custom timer duration** from 1 minute to 2 hours (120 minutes)
- **25-minute Pomodoro sessions** as default option
- **Minutes and seconds input** for precise timing
- **Automatic focus mode activation** when timer starts
- **Session completion tracking** with daily statistics
- **Real-time countdown** displayed on blocked pages
- **Automatic deactivation** when timer ends
- **Session pause/resume** functionality
- **Settings persistence** - your custom timer is remembered

## Focus Mode

When you start a timer:
- All configured blocked sites become actively blocked
- Blocked pages show real-time timer information
- Focus mode automatically deactivates when timer ends
- Daily statistics are updated with completed sessions

## Configuration

The extension can be customized by modifying:
- `manifest.json` - Extension metadata and permissions
- `popup.html` - Extension popup interface and timer controls
- `blocked.html` - Blocked page appearance and timer display
- `background.js` - Focus mode and blocking logic

## Development

To modify the extension:
1. Make your changes to the source files
2. Go to your browser's extension management page
3. Click the refresh/reload button for the FocusKiller extension
4. Test your changes

## Permissions

This extension requires the following permissions:
- `storage` - To save your blocked site preferences and focus statistics
- `webNavigation` - To detect and block website navigation
- `tabs` - To manage browser tabs
- `declarativeNetRequest` - To implement website blocking rules

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve FocusKiller.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue in the repository.

---

**Stay focused, stay productive! 💪**
