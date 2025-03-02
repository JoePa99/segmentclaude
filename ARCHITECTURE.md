# MarketSegment Application Architecture

## Overview

MarketSegment is a web application that uses LLMs to replace traditional market segmentation studies and create synthetic focus groups. The application is built with a React frontend and Node.js backend, with MongoDB for data storage.

## Architecture

### Frontend (React)

The frontend is built with React using the Vite framework and Chakra UI for components. The main structure includes:

- **Authentication**: Login and registration using JWT
- **Dashboard**: Shows all segmentation projects
- **Project Creation**: Wizard interface for creating a new segmentation project
- **Project Detail**: Displays segments, focus groups, and uploaded research
- **Focus Group Creation**: Interface for creating synthetic focus groups
- **Focus Group Detail**: Displays synthetic focus group responses

### Backend (Node.js/Express)

The backend is built with Node.js and Express, using MongoDB for storage. The main components include:

- **Authentication Service**: User management with JWT
- **LLM Service**: Integration with OpenAI/Anthropic APIs
- **Document Processing**: Extraction of text from PDF, DOCX, and TXT files
- **PDF Generation**: Creation of PDF reports for segments and focus groups

### Database Structure (MongoDB)

The application uses MongoDB with Mongoose ODM with three main collections:

1. **Users**
   - Authentication data
   - Preferences

2. **Projects**
   - Project details (name, industry, etc.)
   - Segments
   - Focus groups
   - References to uploaded files

3. **Uploads**
   - File metadata
   - Extracted text
   - Processing status

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Segmentation
- `POST /api/segmentation` - Create project
- `GET /api/segmentation` - List projects
- `GET /api/segmentation/:id` - Get project details
- `POST /api/segmentation/:id/generate` - Generate segmentation

### Focus Groups
- `POST /api/focus-group/:projectId` - Create focus group
- `GET /api/focus-group/:projectId` - List focus groups
- `GET /api/focus-group/:projectId/:focusGroupId` - Get focus group

### Uploads
- `POST /api/upload` - Upload document
- `GET /api/upload/project/:projectId` - Get project uploads

### PDF Export
- `GET /api/pdf/segmentation/:projectId` - Export segmentation PDF
- `GET /api/pdf/focus-group/:projectId/:focusGroupId` - Export focus group PDF

## LLM Integration

The application integrates with both OpenAI and Claude (Anthropic) LLMs:

1. **Segmentation Generation**
   - Inputs: Industry, business type, weighting preferences, uploaded research
   - Output: 3-5 segments with detailed descriptions

2. **Focus Group Simulation**
   - Inputs: Generated segments, user questions
   - Output: Simulated responses from different persona types

## Document Processing

The application supports the following document types:
- PDF (using pdf-parse)
- DOCX (using mammoth)
- TXT (native Node.js)

Documents are processed to extract text and optionally chunked for LLM context.