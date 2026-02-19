# Taskpile

A physics-based browser game that turns your Linear issue backlog into physical playing cards. Authenticate with Linear, pick your team and filters, choose a game mode, and watch your real issues tumble onto a canvas where you can drag, toss, and stack them.

## Game Modes

### Free Play

All issues drop at once from random positions. No rules, no score — just a sandbox to throw your backlog around. Pan and zoom to explore the pile.

### Sort Challenge

Cards fall one at a time. Drag each card into the correct priority bin (Urgent, High, Normal, Low) before it crosses the deadline line. Correct placement scores +1, wrong placement scores -1. 90-second timer.

### Stack Attack

Cards spawn continuously. Stack them as high as possible without letting any fall off the bottom. Your max stack height is your score.

## How Issues Map to Cards

- **Priority** determines the card's color accent (red = Urgent, orange = High, yellow = Normal, blue = Low)
- **Estimate** determines the card's physical size and weight — a 13-point story is ~2.2x the size of an unestimated card
- Cards display the issue title, identifier, and assignee avatar

## Architecture

```
taskpile/
  app/       React + Vite SPA (Matter.js physics, Canvas 2D rendering)
  worker/    Cloudflare Worker (OAuth token exchange proxy)
```

- **Frontend**: React 19, Vite, TanStack Query, Zustand, React Router, Matter.js
- **Backend**: Cloudflare Worker handling Linear OAuth PKCE token exchange and refresh (keeps the client secret server-side)

## Setup

### Prerequisites

- Node.js
- A [Linear](https://linear.app) account
- (For deployment) A Cloudflare account

### Install

```sh
npm install
```

### Development

Start the frontend dev server:

```sh
npm run dev
```

Start the worker locally (in a separate terminal):

```sh
cd worker
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Lint

```sh
npm run lint
```

### Deploy

Build the frontend:

```sh
npm run build
```

Deploy the worker:

```sh
cd worker
npm run deploy
```

The worker requires `LINEAR_CLIENT_SECRET` set via `wrangler secret put`.
