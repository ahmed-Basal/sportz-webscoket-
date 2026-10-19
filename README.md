# Express Starter Project

A minimal, modern Express starter application with ES Module support, environment configuration, and standard middleware.

## Features

- **Express 5** with ES modules (`import`/`export`)
- **Environment variables** managed via `dotenv`
- **CORS** enabled
- **JSON & URL-encoded** body parsing
- **Nodemon** for automatic reload in development
- Health check endpoint & basic error handling

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` if needed:
```bash
PORT=5000
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```

## Available Endpoints

- `GET /` — API welcome message
- `GET /api/health` — Health check status and uptime
