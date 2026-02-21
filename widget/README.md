# TinyFeedback Widget

Lightweight vanilla JS widget for collecting user feedback.

## Installation

Add a single line to your HTML:

```html
<script 
  src="https://cdn.tinyfeedback.io/widget.min.js" 
  data-api-key="YOUR_API_KEY"></script>
```

## Configuration Options

```html
<script 
  src="https://cdn.tinyfeedback.io/widget.min.js" 
  data-api-key="YOUR_API_KEY"
  data-position="bottom-right"
  data-color="#3b82f6"
  data-text-color="#ffffff"></script>
```

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-api-key` | (required) | Your project API key |
| `data-position` | `bottom-right` | Button position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-color` | `#3b82f6` | Primary button color (hex) |
| `data-text-color` | `#ffffff` | Button icon color (hex) |
| `data-api-url` | `https://api.tinyfeedback.io/v1` | API endpoint (optional) |

## JavaScript API

```javascript
// Initialize manually
window.TinyFeedback.init({
  apiKey: 'YOUR_API_KEY',
  position: 'bottom-right',
  primaryColor: '#3b82f6',
  textColor: '#ffffff'
});

// Open modal programmatically
window.TinyFeedback.open();

// Close modal
window.TinyFeedback.close();

// Destroy widget
window.TinyFeedback.destroy();
```

## Features

- ✨ 3 feedback types: NPS Rating, Suggestion, Bug Report
- 🎨 Customizable colors
- 📱 Responsive design
- 🪶 **4.3KB gzipped**
- 🔒 CORS protected
- ⚡ Zero dependencies
- 🌐 Works in all modern browsers

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

MIT
