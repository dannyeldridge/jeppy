# Jeppy - Daily Jeopardy Game

A simple daily Jeopardy game that fetches 6 clues and lets you test your knowledge. Built with vanilla JavaScript using an IIFE (Immediately Invoked Function Expression) pattern.

## Features

- 🎯 6 daily Jeopardy clues from real episodes
- 🎮 Interactive gameplay with scoring
- ✅ Answer validation with override option ("I was right!")
- 🎊 Confetti animation for correct answers
- 📊 Final score summary with detailed breakdown
- 🖼️ Greg congratulations for perfect scores

## How to Run

### Method 1: Python HTTP Server (Recommended)
```bash
python3 -m http.server 3000
```

### Method 2: Node.js HTTP Server
```bash
npx http-server -p 3000
```

### Method 3: Any Static File Server
Since this is pure HTML/JS/CSS, you can serve it with any static file server.

Then open your browser to: `http://localhost:3000`

## File Structure

```
jeppy/
├── index.html          # Main HTML file with embedded CSS
├── app.js              # Complete game logic in IIFE
├── img/                # Images folder
│   ├── jeppy.webp     # Welcome screen background
│   └── greg.png       # Congratulations image
├── src/               # Original React version (reference)
└── public/            # React build assets (reference)
```

## Game Flow

1. **Start Screen**: Shows welcome background with "Play" button
2. **Game Screen**: 
   - Displays Jeopardy card with category, value, and air date
   - Shows question or answer based on current state
   - Input field for your answer
   - Score tracking and progress counter
3. **Answer Feedback**: 
   - Shows "Right!" or "Wrong!" with confetti for correct answers
   - "Show Answer/Question" toggle button
   - "I was right!" override option
4. **Summary Screen**: 
   - Final score calculation (negative scores possible)
   - Detailed breakdown table
   - Greg congratulations for perfect scores

## API Integration

The app fetches daily clues from:
```javascript
const API_ENDPOINT = 'https://jservice.dannyeldridge.com/daily-clues';
```

Expected API response format:
```json
[
  {
    "question": "This is the question text",
    "answer": "What is the answer?",
    "category": {
      "title": "CATEGORY NAME"
    },
    "value": 400,
    "airdate": "2023-01-01T00:00:00.000Z"
  }
]
```

## Technical Details

- **No Build Process**: Pure HTML/CSS/JS that runs directly in browsers
- **No Dependencies**: Only uses Bootstrap CDN for styling
- **IIFE Pattern**: Self-contained JavaScript module
- **Responsive Design**: Works on desktop and mobile
- **Modern JS**: Uses ES6+ features (async/await, template literals, etc.)

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript features
- CSS3 animations
- Fetch API
- Template literals

## Customization

To modify the API endpoint, edit the `API_ENDPOINT` constant in `app.js`:
```javascript
const API_ENDPOINT = 'your-api-endpoint-here';
```

## Original React Version

The original React implementation is preserved in the `src/` folder for reference. This vanilla version maintains identical functionality while removing all framework dependencies.

## License

This project is for educational purposes. Jeopardy! is a trademark of Sony Pictures Television.