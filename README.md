# Jeppy

A daily Jeopardy game with 6 clues from real episodes.

## How to Run

Start a local server:

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000` in your browser.

## Features

- Daily clues with scoring
- **AI-powered answer validation** - accepts equivalent answers (e.g., "Washington" for "George Washington")
- Automatic fallback to string comparison if AI validation fails
- "I was right!" override option
- Confetti for correct answers
- Summary with final score

## How It Works

The app uses an AI-powered proxy server to validate answers intelligently. If the AI service is unavailable or times out (>2 seconds), it automatically falls back to exact string matching.
