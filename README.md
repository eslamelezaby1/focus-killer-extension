# FocusKiller 🚫

A browser extension designed to help you stay focused and productive by blocking distracting websites during your focus sessions.

## Features

- **Website Blocking**: Block distracting websites during focus sessions
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

1. **Click the extension icon** in your browser toolbar to open the popup
2. **Configure blocked sites** by adding URLs you want to block
3. **Start a focus session** to activate website blocking
4. **Stay productive** - blocked sites will show a clean, motivational blocked page

## File Structure

```
FocusKiller/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── blocked.html          # Blocked page design
├── blocked.js            # Blocked page interactions
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Configuration

The extension can be customized by modifying:
- `manifest.json` - Extension metadata and permissions
- `blocked.html` - Blocked page appearance and content
- `popup.html` - Extension popup interface

## Development

To modify the extension:
1. Make your changes to the source files
2. Go to your browser's extension management page
3. Click the refresh/reload button for the FocusKiller extension
4. Test your changes

## Permissions

This extension requires the following permissions:
- `storage` - To save your blocked site preferences
- `webNavigation` - To detect and block website navigation
- `tabs` - To manage browser tabs

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve FocusKiller.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue in the repository.

---

**Stay focused, stay productive! 💪**
