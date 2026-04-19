# Auto Parts Telegram Bot

Telegram bot for collecting auto parts requests from clients and forwarding finalized requests to managers.

## Features

- `/start` resets the current draft and starts a new request flow
- Client submits the main request in one text message
- Client can add multiple clarifications before sending
- Client never sees the internal request number
- Managers always receive numbered requests
- Sequential request numbering persists across restarts
- Supports independent drafts for multiple users
- Delivery mode is configurable:
  - `GROUP`: send all finalized requests to one managers group
  - `ROUND_ROBIN`: rotate finalized requests across manager IDs
- JSON file storage for the MVP

## Project Structure

```text
.
├── .env.example
├── README.md
├── data
│   ├── .gitkeep
│   └── storage.json
├── package.json
└── src
    ├── bot.js
    ├── handlers
    │   ├── actionHandlers.js
    │   ├── messageHandler.js
    │   └── startHandler.js
    ├── services
    │   ├── deliveryService.js
    │   ├── draftService.js
    │   └── requestCounterService.js
    ├── storage
    │   └── jsonStorage.js
    └── utils
        ├── config.js
        ├── constants.js
        ├── formatters.js
        └── keyboards.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the environment file:

```bash
cp .env.example .env
```

3. Fill in `.env`:

- `BOT_TOKEN`: token from BotFather
- `DELIVERY_MODE`: `GROUP` or `ROUND_ROBIN`
- `MANAGERS_GROUP_ID`: required for `GROUP` mode
- `MANAGER_IDS`: required for `ROUND_ROBIN` mode, comma-separated Telegram IDs
- `TIMEZONE`: local timezone for manager message timestamps, for example `Europe/Kyiv`

## Manager IDs And Group ID

- Put manager personal Telegram IDs into `MANAGER_IDS`, for example:

```env
MANAGER_IDS=123456789,987654321
```

- Put the managers group or supergroup chat ID into `MANAGERS_GROUP_ID`, for example:

```env
MANAGERS_GROUP_ID=-1001234567890
```

## Run

```bash
npm start
```

For local development with auto-reload:

```bash
npm run dev
```

## Storage

The bot stores its MVP data in `data/storage.json`:

- request counter
- per-user draft state
- round-robin pointer

Do not delete this file if you need to keep numbering and draft state.
