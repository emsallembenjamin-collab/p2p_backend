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
