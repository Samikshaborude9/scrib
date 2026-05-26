# Scrib

A real-time multiplayer drawing game built with React, Node.js, and Socket.IO.

## Project Structure
```
scribble/
├── apps/
│   ├── client/     ← React + Vite + Tailwind + Zustand
│   └── server/     ← Node.js + Express + Socket.IO + MongoDB
└── packages/
    └── types/      ← Shared TypeScript types
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure server environment
```bash
cd apps/server
cp .env.example .env
# Edit .env — add your MONGO_URI and JWT_SECRET
```

### 3. Run both apps
```bash
# From root
npm run dev
```

Client: http://localhost:5173  
Server: http://localhost:3001

## Build order (next steps)
1. ✅ Project setup (done)
2. Login + Signup pages
3. Lobby page (create/join rooms)
4. Canvas component (drawing)
5. Game Room page
6. Polish + testing
