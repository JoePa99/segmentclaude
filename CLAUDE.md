# MarketSegment App - Development Notes

## Proxy Server Setup for AI API Calls

To solve the CORS restriction issue with direct API calls to OpenAI, we've implemented the following solution:

### Backend Proxy Server

The simplest server is in `src/backend/simple.js` which provides:

1. A dedicated `/api/openai` endpoint that:
   - Receives endpoint and data parameters
   - Forwards requests to OpenAI API with authentication
   - Returns the response to the frontend

2. Features:
   - CORS enabled for cross-origin requests
   - Proper error handling
   - Environment variable loading from .env file
   - Debug logging

### Frontend Integration

The frontend service in `src/frontend/src/services/directAIService.js`:

1. First attempts to call our own proxy server
2. Falls back to static mock data if the server is unavailable
3. Uses dynamic URL resolution based on development or production environment

## Running the Application

### Start the Proxy Server

```bash
cd src/backend
PORT=8000 node simple.js
```

### Start the Frontend

```bash
cd src/frontend
npm run dev
```

### Environment Variables

Make sure the `.env` file in the root directory contains:
- `OPENAI_API_KEY` - Your OpenAI API key
- `JWT_SECRET` - For authentication (if needed)
- `PORT` - The port for the backend server (default: 8000)

## API Flow

1. Frontend calls our proxy server at `/api/openai`
2. Proxy server adds authentication headers and forwards to OpenAI
3. Proxy returns the API response to the frontend
4. Frontend handles any errors and falls back to static data if needed

## Next Steps

1. Deploy the proxy server to a service like Vercel, Netlify, or Render
2. Update the production URL in `directAIService.js`
3. Add Claude API support through the same proxy pattern
4. Implement rate limiting and enhanced error handling