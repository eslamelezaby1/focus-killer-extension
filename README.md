# FocusKiller

A simple browser extension that helps you stay focused by blocking distracting websites.

## What It Does

FocusKiller blocks access to distracting websites when you enable focus mode, helping you maintain concentration on your work.

## Features

### 🎯 **Simple Focus Mode**
- **One-Click Toggle** - Enable/disable website blocking with a single button
- **Visual Feedback** - Clear indication of current focus mode status
- **Instant Activation** - Start blocking distractions immediately

### 🚫 **Website Blocking**
- **Pre-configured Sites** - Common distracting sites are included by default
- **Custom Sites** - Add your own distracting websites to block
- **Smart Blocking** - Sites are only blocked when focus mode is active

### ⚙️ **Easy Management**
- **Site Toggle** - Enable/disable blocking for individual sites
- **Export/Import** - Backup and restore your blocked sites list
- **Simple Interface** - Clean, intuitive popup and options pages

### 📊 **Progress Tracking**
- **Daily Focus Time** - Track how long you stay focused each day
- **Streak Building** - Build consecutive days of focus
- **Statistics Dashboard** - View your focus progress over time

## Installation

1. Download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The FocusKiller icon will appear in your toolbar

## How to Use

### Basic Usage
1. **Click the FocusKiller icon** in your browser toolbar
2. **Click "Enable Focus Mode"** to start blocking distracting sites
3. **Work distraction-free** - blocked sites will redirect to a focus page
4. **Click "Disable Focus Mode"** when you're done

### Managing Blocked Sites
1. **Open the popup** and scroll to see your blocked sites
2. **Toggle individual sites** on/off using the switches
3. **Add custom sites** by typing a domain and clicking "Add Site"
4. **Access options** by right-clicking the extension icon

### Advanced Settings
1. **Right-click the extension icon** and select "Options"
2. **Customize settings** like sound notifications
3. **Export your site list** for backup
4. **Import site lists** from other devices

## Default Blocked Sites

The extension comes with these common distracting sites pre-configured:
- Facebook
- YouTube  
- Twitter
- Instagram
- TikTok
- Reddit

You can easily add or remove any of these sites.

## How It Works

### Focus Mode
- When **enabled**: All blocked websites redirect to a "Stay Focused" page
- When **disabled**: All websites are accessible normally
- **No timer needed** - simply toggle on/off as needed

### Website Blocking
- Uses Chrome's `declarativeNetRequest` API for efficient blocking
- Creates dynamic rules that can be easily modified
- Works across all browser tabs and windows

### Data Storage
- **Settings**: Stored in `chrome.storage.sync` (syncs across devices)
- **Blocked Sites**: Stored in `chrome.storage.local`
- **Focus Statistics**: Tracks daily focus time and streaks

## Technical Details

- **Manifest V3** - Built with the latest Chrome extension standards
- **Service Worker** - Background script manages blocking rules
- **Storage APIs** - Uses Chrome's built-in storage for data persistence
- **Declarative Rules** - Efficient website blocking without performance impact

## Privacy

- **No data collection** - All data stays on your device
- **No tracking** - Extension doesn't monitor your browsing
- **Local storage** - Your blocked sites list is private
- **Open source** - Code is transparent and auditable

## Troubleshooting

### Focus Mode Not Working
- Check that the extension has permission to access all URLs
- Try disabling and re-enabling the extension
- Verify that sites are added to your blocked list

### Sites Still Accessible
- Ensure focus mode is enabled (button should be red)
- Check that the site domain is in your blocked list
- Try refreshing the page or opening in a new tab

### Extension Not Loading
- Check Chrome's extension page for error messages
- Try reloading the extension
- Ensure you're using a compatible Chrome version

## Development

### Project Structure
```
FocusKiller/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── background.js          # Background service worker
├── options.html           # Options page
├── options.js             # Options functionality
├── blocked.html           # Blocked page shown to users
├── blocked.js             # Blocked page logic
└── icons/                 # Extension icons
```

### Key Components
- **Popup**: Main user interface for controlling focus mode
- **Background**: Manages website blocking rules and extension state
- **Options**: Settings page for customization
- **Blocked Page**: Redirect destination for blocked websites

### Building
1. Make your changes to the source files
2. Load the extension in Chrome's developer mode
3. Test your changes
4. Package for distribution when ready

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the code for potential issues
3. Open an issue on the project repository

---

**FocusKiller** - Simple, effective website blocking for better focus and productivity.
