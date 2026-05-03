# Public Deployment Guide

Deploy the services in this order so every public URL is available for the next layer.

## 1. AI Service

Folder: `AI&ML`

Recommended host: Render or Railway.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
gunicorn app:app
```

Environment variables:

```bash
OPENAI_API_KEY=your_real_openai_key
OPENAI_MODEL=gpt-3.5-turbo
```

Health check:

```bash
https://your-ai-service.onrender.com/health
```

Analyze endpoint:

```bash
https://your-ai-service.onrender.com/analyze_email
```

## 2. Backend API

Folder: `Backend`

Recommended host: Render or Railway.

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Environment variables:

```bash
AI_SERVICE_URL=https://your-ai-service.onrender.com/analyze_email
FRONTEND_URLS=https://your-frontend.vercel.app,http://localhost:3000
```

Health check:

```bash
https://your-backend.onrender.com/health
```

Process endpoint:

```bash
https://your-backend.onrender.com/process-email
```

## 3. Frontend

Folder: `Frontend/ai-assistant-frontend`

Recommended host: Vercel.

Build command:

```bash
npm run build
```

Output directory:

```bash
build
```

Environment variables:

```bash
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

After changing `REACT_APP_BACKEND_URL`, redeploy the frontend because Create React App embeds environment variables at build time.

## Public Test Flow

1. Open the deployed frontend URL.
2. Go to `Automation`.
3. Paste an email.
4. Click `Process email`.
5. Confirm the UI displays intent, suggested reply, and extracted tasks.

If the frontend shows `Network Error`, the backend URL is unreachable from the browser or CORS does not include the frontend domain.
