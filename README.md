# MarketSegment

An LLM-powered market segmentation and synthetic focus group application that replaces traditional segmentation studies with AI-generated approximations.

## Features

- **LLM-Generated Market Segmentation**: Create comprehensive B2B and B2C segmentations with demographic, psychographic, behavioral, and geographic factors.
- **Synthetic Focus Groups**: Simulate focus group responses for each segment with realistic personas.
- **Research Integration**: Upload and analyze market research documents (PDF, DOCX, TXT) to enhance segmentation accuracy.
- **Interactive Reports**: View segmentation results in an interactive dashboard and export PDF reports.
- **Multi-Model Support**: Choose between different AI models from Anthropic (Claude) and OpenAI (GPT) for both segmentation and focus groups.

## Tech Stack

### Frontend
- React with Vite
- Chakra UI for component library
- React Router for navigation
- Formik and Yup for form handling
- Chart.js for data visualization

### Backend
- Firebase (Authentication, Firestore, Storage, Functions)
- Anthropic Claude API for LLM integrations
- OpenAI GPT API for alternative LLM models
- PDF processing with pdf-parse and mammoth
- Firebase Authentication instead of JWT

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project
- Anthropic API key

### Firebase Setup

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)

2. Enable the following Firebase services:
   - Authentication (with Email/Password)
   - Firestore Database
   - Storage
   - Functions

3. Clone the repository:
```
git clone https://github.com/yourusername/newsegment.git
cd newsegment
```

4. Log in to Firebase CLI and select your project:
```
firebase login
firebase use --add
```

5. Set your API keys for Firebase Functions:
```
firebase functions:config:set anthropic.key="your-anthropic-api-key"
firebase functions:config:set openai.key="your-openai-api-key"
```

6. Update the frontend environment file:

Create or edit `/src/frontend/.env` file:
```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Installation

1. Install dependencies for all components:
```
npm run install:all
```

2. Deploy Firestore rules and indexes:
```
firebase deploy --only firestore
```

3. Deploy Storage rules:
```
firebase deploy --only storage
```

4. Deploy Firebase Functions:
```
firebase deploy --only functions
```

### Local Development

1. Start the Firebase emulators for local development:
```
firebase emulators:start
```

2. In a separate terminal, start the frontend development server:
```
npm run dev:frontend
```

3. Access the application at `http://localhost:3000`

### Production Deployment

1. Build the frontend application:
```
npm run build
```

2. Deploy to Firebase Hosting:
```
firebase deploy --only hosting
```

3. Deploy everything to Firebase:
```
firebase deploy
```

## Project Structure

```
/
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules        # Storage security rules
├── functions/           # Firebase Cloud Functions
│   ├── index.js         # Functions for segmentation and focus groups
│   └── package.json     # Functions dependencies
└── src/
    ├── frontend/        # React frontend
    │   ├── components/  # UI components
    │   ├── context/     # React context for state management
    │   ├── pages/       # Page components
    │   ├── services/    # Firebase service integrations
    │   └── utils/       # Utility functions
    └── backend/         # Legacy Express backend (kept for reference)
```

## Firebase Functions

The application uses Firebase Cloud Functions for the backend processing:

### Callable Functions
- `generateSegmentation` - Processes uploaded documents and generates market segments
  - Input: `{ projectId, uploadIds }`
  - Output: `{ segments, summary, rawText }`

- `generateFocusGroup` - Creates synthetic focus group for a specific segment
  - Input: `{ projectId, segmentId, prompt }`
  - Output: `{ participants, transcript, summary, rawText }`

### HTTP Functions for AI Proxying
- `proxyOpenAI` - Proxies requests to OpenAI API without CORS issues
  - Input: `{ prompt, systemPrompt, model }`
  - Output: `{ content }`

- `proxyAnthropic` - Proxies requests to Anthropic API without CORS issues
  - Input: `{ prompt, systemPrompt, model }`
  - Output: `{ content }`

## Firestore Data Structure

### Collections
- `users` - User profiles and settings
- `projects` - Segmentation projects
- `uploads` - Document metadata and download URLs
- `segmentations` - Generated segmentation results
- `focusGroups` - Synthetic focus group results

## Firebase Storage

Storage is organized by project ID:
- `/uploads/{projectId}/{fileName}` - Uploaded market research documents

## User Flow

1. Log in or register for an account
2. Create a new segmentation project with industry, business type, and weighting preferences
3. Optionally upload market research documents for more accurate results
4. Generate the segmentation and view the results
5. Create a synthetic focus group with questions
6. Export reports as PDFs

## License

This project is licensed under the MIT License - see the LICENSE file for details.