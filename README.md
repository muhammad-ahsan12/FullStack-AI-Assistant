# FullStack AI Assistant Chat Bot 🤖

A full-stack AI-powered chat application that supports text conversations, image analysis, PDF processing, and AI image generation. Built with **FastAPI** (backend) and **Next.js** (frontend) using modern web technologies.

![AI Assistant Demo](https://img.shields.io/badge/Status-Active-green) ![Python](https://img.shields.io/badge/Python-3.8+-blue) ![Next.js](https://img.shields.io/badge/Next.js-14+-black) ![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)

## 🏗️ Architecture

![Workflow](./backend/workflow.png)

## 🎥 Demo Video

[▶️ Watch the demo](./backend/demo(2).mp4)

## ✨ Features

### 🗨️ **Multi-Modal Chat Experience**
- **Text Chat**: Natural conversations with Bob, your AI assistant
- **Image Analysis**: Upload images and ask questions about them
- **PDF Processing**: Upload PDFs for summarization and Q&A
- **Image Generation**: Create images from text descriptions using AI

### 🧠 **Smart Routing System**
- Intelligent request routing to appropriate AI models
- Context-aware responses with conversation memory
- Real-time message processing with loading states

### 🎨 **Modern UI/UX**
- Clean, responsive design built with Tailwind CSS
- Dark/light theme support with shadcn/ui components
- Conversation history with persistent storage
- Drag-and-drop file uploads
- Real-time typing indicators

### 🔧 **Technical Features**
- RESTful API with FastAPI
- Type-safe TypeScript frontend
- State management with React hooks
- File upload support (images & PDFs)
- Cross-origin resource sharing (CORS) enabled
- Error handling and loading states

## 🏗️ Architecture

```mermaid
graph TB
    A[Frontend - Next.js] --> B[API Gateway - FastAPI]
    B --> C[Router Node]
    C --> D[Chat Node - Groq Llama]
    C --> E[Vision Node - Google Gemini]
    C --> F[PDF Node - Text Processing]
    C --> G[Image Gen - Pollinations API]
    D --> H[Tools - Wikipedia/DuckDuckGo]
    I[Memory - InMemorySaver] --> C
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **npm/pnpm/yarn**

### 🔑 Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/muhammad-ahsan12/FullStack-AI-Assistant.git
cd bot
```

2. **Backend Environment:**
```bash
cd backend
cp .env.example .env
```

3. **Add your API keys to `.env`:**
```env
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### 🎯 Installation & Running

#### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Start the development server
npm run dev
# or
pnpm dev
```

### 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🛠️ API Endpoints

### Chat Endpoints

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/chat` | POST | Text-based conversations | `{"message": "string", "thread_id": "string"}` |
| `/vision` | POST | Image analysis with questions | `{"question": "string", "image_url": "string", "thread_id": "string"}` |
| `/pdf` | POST | PDF processing and Q&A | Form data with file and query |
| `/generate-image` | POST | AI image generation | `{"prompt": "string", "width": 1024, "height": 1024}` |
| `/health` | GET | Health check | None |

### Example API Usage

#### Text Chat
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?", "thread_id": "user123"}'
```

#### Image Analysis
```bash
curl -X POST "http://localhost:8000/vision" \
  -H "Content-Type: application/json" \
  -d '{"question": "What do you see?", "image_url": "data:image/png;base64,...", "thread_id": "user123"}'
```

#### PDF Processing
```bash
curl -X POST "http://localhost:8000/pdf" \
  -F "file=@document.pdf" \
  -F "query=Summarize this document" \
  -F "thread_id=user123"
```

## 🧩 Tech Stack

### Backend
- **Framework**: FastAPI
- **AI Models**: 
  - Groq Llama 3.3 70B (Text)
  - Google Gemini 2.5 Flash (Vision)
- **Tools**: LangChain, LangGraph
- **Memory**: InMemorySaver for conversation persistence
- **External APIs**: 
  - Wikipedia
  - DuckDuckGo Search
  - Pollinations (Image Generation)

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React hooks
- **HTTP Client**: Fetch API

## 📁 Project Structure


```
.
├─ .env.example
├─ README.md
├─ backend/
│  ├─ .env                # (local) API keys used by the backend
│  ├─ Dockerfile
│  ├─ config.py
│  ├─ graphs.py
│  ├─ main.py
│  ├─ models.py
│  ├─ requirements.txt
│  ├─ users.db            # SQLite DB used by auth (auto-created)
│  └─ auth/
│     ├─ __init__.py
│     ├─ auth_routes.py   # signup / login routes
│     ├─ database.py      # SQLAlchemy setup (sqlite)
│     ├─ hashing.py       # argon2 password hashing
│     ├─ models.py        # SQLAlchemy user model
│     └─ token.py         # JWT helper (has hardcoded secret)
├─ frontend/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx         # redirect / token check
│  │  ├─ login/page.tsx
│  │  ├─ signup/page.tsx
│  │  └─ chat/page.tsx    # main chat UI page
│  ├─ components/
│  │  ├─ auth-form.tsx
│  │  ├─ chat-input.tsx
│  │  ├─ chat-window.tsx
│  │  ├─ message.tsx
│  │  ├─ sidebar.tsx
│  │  └─ theme-provider.tsx
│  ├─ lib/
│  │  ├─ api.ts           # small fetch wrapper
│  │  └─ utils.ts         # ui helpers (cn)
│  ├─ package.json
│  └─ public/
```


## File structure (high level)
 - `backend/`
   - `main.py` — FastAPI app and endpoints
   - `graphs.py` — langgraph StateGraph and nodes
   - `config.py` — model/tool configuration
   - `requirements.txt` — backend Python deps
   - `auth/` — simple auth implementation (signup/login, hashing, token)
 - `frontend/`
   - `app/` — Next.js app routes
   - `components/` — React UI components (auth form, chat window, chat input)
   - `public/` — static files



## 🎨 Key Features Deep Dive

### 1. **Smart Message Routing**
The application uses a sophisticated routing system that automatically determines the best AI model for each request:
- Text messages → Groq Llama for general conversation
- Images → Google Gemini Vision for image analysis
- PDFs → Text extraction + Groq Llama for document processing
- Image generation requests → Pollinations API

### 2. **Conversation Memory**
- Persistent conversation threads using LangGraph's InMemorySaver
- Each conversation maintains context across multiple interactions
- Frontend localStorage for conversation history

### 3. **File Upload Support**
- **Images**: Drag-and-drop or click to upload (PNG, JPG, GIF)
- **PDFs**: Direct file upload with text extraction
- Real-time file preview and validation

### 4. **Responsive Design**
- Mobile-first responsive design
- Modern chat interface with smooth animations
- Theme support with CSS custom properties


### Frontend Configuration
- API base URL: `http://localhost:8000`
- File size limits: Configurable in components
- Theme: CSS custom properties in `globals.css`

## 🚨 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure `.env` file exists in backend directory
   - Verify API keys are valid and active

2. **CORS Issues**
   - Frontend URL must match CORS origins in `main.py`
   - Default: `http://localhost:3000`

3. **File Upload Failures**
   - Check file size limits
   - Ensure proper file types (images: png/jpg, documents: pdf)

4. **Model Errors**
   - Verify internet connectivity for external APIs
   - Check API key quotas and limits




## 🙏 Acknowledgments

- **LangChain & LangGraph** for AI workflow orchestration
- **Groq** for fast language model inference
- **Google AI** for vision capabilities
- **Pollinations.ai** for image generation
- **shadcn/ui** for beautiful UI components
- **Vercel** for Next.js framework
