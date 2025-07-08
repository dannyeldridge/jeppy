# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Run development server at http://localhost:3000
- `npm test` - Run test suite in watch mode (Jest + React Testing Library)
- `npm run build` - Create production build in `build/` directory
- `npm run deploy` - Deploy to GitHub Pages (runs build first)

### Environment Setup
- Set `REACT_APP_API_ENDPOINT` environment variable before running the app
- Run `npm install` after cloning to install dependencies

## Architecture

This is a React-based Jeopardy game built with Create React App. The application follows a single-page architecture with client-side state management.

### Key Components
- **App.js** - Main component managing game state and flow (src/App.js:1)
  - Handles game states: start → question → guessed → summary
  - Fetches daily clues from API endpoint
  - Manages score tracking and user interactions

### Game Flow
1. Start screen with "Play Today's Jeopardy" button
2. Game view showing clue cards with category, value, and air date
3. Answer input and submission
4. Result display with "I was right!" override option
5. Summary screen showing final score (with confetti for perfect scores)

### API Integration
- Fetches 6 daily Jeopardy clues from external API
- Endpoint configured via `REACT_APP_API_ENDPOINT` environment variable
- API response expected format: array of clue objects with category, value, question, answer properties

### Deployment
- Configured for GitHub Pages deployment
- Production URL: https://jeopardy-1.onrender.com/
- Deploy with `npm run deploy`