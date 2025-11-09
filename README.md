# B2B iXhello Portal

A modern, responsive React application for the B2B iXhello Portal by Concentrix. This application provides an intuitive interface for managing AI assistants, chat history, and generating email content.

## Features

- 🎨 **Modern Dark UI** - Beautiful dark theme with cyan accents
- 📱 **Responsive Design** - Works seamlessly across different screen sizes
- 💬 **Chat History** - Track all your previous conversations and prompts
- 🤖 **Multiple Assistants** - Access various AI assistants including Email Generator and Sentiment Analyzer
- 📝 **Interactive Forms** - Easy-to-use forms for entering prompts and viewing outputs
- ⚡ **Real-time Updates** - Instant feedback and smooth transitions

## Tech Stack

- **React 18** - Modern React with hooks
- **CSS3** - Custom styling with modern CSS features
- **JavaScript (ES6+)** - Latest JavaScript features

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation & Run (Local)

1. Navigate to the project directory:

   ```bash
   cd "b2bixplatform"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Vite dev server:

   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## Available Scripts

### `npm run dev`

Runs the Vite dev server at `http://localhost:3000`. Hot Module Replacement (HMR) is enabled by default.

### `npm run build`

Builds the app for production to the `dist` folder using Vite.

### `npm run preview`

Serves the production build locally for preview at `http://localhost:4173`.

## Project Structure

```
b2bixplatform/
├── index.html                # Vite root HTML
├── vite.config.js            # Vite config with dev proxies
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── MainContent.jsx
│   │   ├── MainContent.css
│   │   ├── Assistants.jsx
│   │   ├── Assistants.css
│   │   ├── AssistantDetails.jsx
│   │   ├── AssistantDetails.css
│   │   ├── BottomInput.jsx
│   │   └── BottomInput.css
│   ├── services/
│   │   └── chatService.js
│   ├── data/
│   │   └── assistants.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.jsx
│   └── index.css
├── package.json
└── README.md
```

## Dev API Proxies (Vite)

The dev server proxies API requests to avoid CORS issues:

- `/api` → `https://us.api.customer.ixhello.com` (rewrites `/api` → `/`)
- `/chatbot-api` → `https://us.customer.ixhello.com` (rewrites `/chatbot-api` → `/`)

Change targets in `vite.config.js` if needed.

## Component Overview

### Header

- Displays the portal title and navigation options
- Contains Config Assistants, Usage Report, and Train Assistants buttons

### Chat History

- Shows previous conversations organized by date
- Includes Email Generation and Prompt Generation history items

### Main Content

- Tabbed interface for different workspaces
- Form inputs for trail conversations and prompts
- Toggle options for configuration
- Output display area

### Frequent Assistants

- Quick access to commonly used AI assistants
- Email Assistant (BETA) - Generate email content
- Sentiment Analyzer (ACTIVE) - Gauge customer sentiment

### Bottom Input

- Global input field for quick queries
- Submit button for processing requests

## Customization

### Colors

The app uses a dark theme with the following primary colors:

- Background: `#0a0e27`
- Secondary Background: `#0f1329`
- Accent: `#22d3ee` (Cyan)
- Text: `#ffffff` (White)

To customize colors, edit the respective CSS files in the `src/components/` directory.

### Adding New Assistants

To add or modify assistants, edit the `assistants` array in `src/data/assistants.js`:

```javascript
{
  name: 'Email agent',
  description: 'this is email summarizer',
  version: '1.0v',
  model: 'gpt 3.5',
  owner: 'Sales ops',
  welcomeMessage: "Hello! I'm your Email agent",
  capabilities: ['Draft emails', 'Summarize threads'],
  api: { /* optional API config */ },
  components: [ /* UI components config */ ]
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software owned by Concentrix.

## Contact

For support or queries, please contact the Concentrix development team.

---

Built with ❤️ by Concentrix
