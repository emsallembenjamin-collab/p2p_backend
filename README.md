# P2P Backend

P2P Backend is the server-side application for a peer-to-peer trading platform.
It provides HTTP APIs for account management, authentication, identity checks,
orders, balances, administration, notifications, and selected Web3 operations.
It also starts WebSocket services for real-time client notifications.

> This is an inherited application. Review the security notes and environment
> configuration before exposing it to a public network.

## Main Features

- Email, password, Google, JWT, and two-factor authentication flows
- User profiles and KYC document handling
- Buy, sell, cancel, and processing operations for P2P orders
- Fiat and cryptocurrency balance and transaction records
- Role-based administration and permission checks
- Email, SMS, push, Telegram, and WebSocket notifications
- Wallet address, QR-code, Binance Smart Chain, and Moralis integrations
- MongoDB persistence through Mongoose models and data-access modules

## Technology Stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 18 or newer |
| HTTP API | Express 4 |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens, bcrypt, Speakeasy |
| Real-time updates | `ws` WebSockets |
| Web3 | Ethers, Web3.js, Moralis, Binance Chain SDK |
| Messaging | Nodemailer, Twilio, Firebase Admin, Telegram bot API |
| Tests | Built-in `node:test` runner |
| Process management | npm scripts or PM2 configuration |

## Requirements

Install or obtain the following before starting the application:

- Node.js 18 or newer (Node.js 22 is also supported)
- npm, included with Node.js
- A reachable MongoDB instance
- Integration credentials for only the external services you plan to use
- TLS certificates when running the HTTPS WebSocket service outside local mode

The application does not require a globally installed `nodemon`; it is declared
as a development dependency and can be run through `npm run dev`.

## API Areas

Routes are grouped by responsibility:

- `/api/auth` handles registration, sign-in, password reset, and 2FA.
- `/api/user` handles profiles, balances, orders, and notifications.
- `/download/uploads/:filename` provides authenticated administrative downloads.
- `/api/static` and `/api/qrcode` expose generated public assets.

The administrative router exists in `api/admin.js`, but mounting it is currently
disabled in `index.js`. Review its authorization and operational requirements
before enabling it.

## Installation

Clone the repository, enter its directory, and install dependencies:

```bash
git clone <repository-url>
cd p2p_backend
npm install
```

Do not commit `node_modules`; dependencies are restored from `package.json`.

## Environment Setup

Copy the example file and replace every placeholder required by your deployment:

```bash
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env` instead. At minimum, local
startup requires `DB_URL`, `DB_NAME`, `SESSION_SECRET`, `JWT_SECRET`, and
`TFA_SECRET`. Authentication and 2FA secrets must be long, random, and different.

Generate secret values with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

The example file documents common integration settings, but individual legacy
controllers may require additional provider-specific variables. Search for
`process.env` before enabling an integration and add those values only to `.env`
or your deployment secret store.

## Running the Application

Start the production-style process:

```bash
npm start
```

For local development with automatic restarts:

```bash
npm run dev
```

The HTTP server uses port `8080` by default. WebSocket ports and TLS behavior are
configured separately by the existing notification services.

## Tests and Validation

Run all dependency-free unit tests with:

```bash
npm test
```

Validate the syntax of every JavaScript file:

```bash
npm run check:syntax
```

Run both checks in sequence before committing:

```bash
npm run check
```

## Project Structure

```text
api/                 Express route definitions
config/              Authentication and environment configuration
controllers/         Request handlers, integrations, and data-access services
middlewares/         Authentication, authorization, and request checks
models/              Mongoose schemas and models
public/               Email templates and public assets
Queries/              Analytics query helpers
scripts/              Repository validation scripts
socket_server/        WebSocket server implementation
test/                 Node.js unit tests
utils/                Reusable validation and service helpers
index.js              Application entry point
```

## Security Notes

- Never commit `.env`, private keys, TLS certificates, or service-account files.
- Rotate any credential that has ever appeared in Git history before deployment.
- Use separate values for session, JWT, and temporary 2FA token secrets.
- Keep the admin router disabled until all desired routes have been reviewed.
- Restrict uploaded files and generated QR codes at the proxy or storage layer.
- Configure `TRUST_PROXY=true` only behind a trusted reverse proxy.
