# OpenIssue Backend

A REST API for a lightweight repository issue-tracking and collaboration platform. The backend is written in JavaScript with Node.js, Express and MongoDB/Mongoose. It is intentionally organized in small modules so a developer can understand the request flow without navigating a large framework.

## What it supports

- Account registration and login with bcrypt password hashing and signed JWT access tokens.
- Private and public repositories, repository ownership, and member access.
- Issue creation, numbered issues, priorities, statuses, labels, assignment, search, filters and pagination.
- Issue comments with author/owner edit permissions.
- Dashboard counts for issues by status and priority, plus recently updated issues.
- Request validation, centralized errors, CORS, Helmet headers, and rate limiting on authentication endpoints.

## Stack

- Node.js 20 or newer
- Express 4
- MongoDB with Mongoose
- Zod for request validation
- bcryptjs and jsonwebtoken for authentication
- Helmet, CORS and express-rate-limit for baseline API security

## Live demo

The backend API is deployed on Render and connected to MongoDB Atlas.

- **API homepage:** https://openissue-backend-5zye.onrender.com/
- **Health check (includes MongoDB connection status):** https://openissue-backend-5zye.onrender.com/api/v1/health
- **API index:** https://openissue-backend-5zye.onrender.com/api/v1
- **Render service dashboard:** https://dashboard.render.com/web/srv-dbplsvd9fdbs73fa11n0

The homepage is a small HTML landing page. The API index and health check return JSON. Use the endpoint links above to explore the deployed API. Registration and login are available at `/api/v1/auth/register` and `/api/v1/auth/login`; protected endpoints require a Bearer token.

## Run locally

1. Install Node.js 20+ and start a local MongoDB server (or use a MongoDB connection URI).
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI` and a random `JWT_SECRET` with at least 32 characters.
4. Install packages and start the API:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. Check `GET /api/v1/health` to confirm the process is responding.

For a normal run without file watching, use `npm start`.

## Connect the React frontend

Set the frontend API base URL to `http://localhost:5000/api/v1`. After login or registration, keep the returned token in the frontend's chosen session strategy and send it on protected requests:

```js
const response = await fetch(`${API_BASE_URL}/repositories`, {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

const result = await response.json();
```

The API uses JSON request and response bodies. For protected routes, include `Authorization: Bearer <token>`.

## Main API routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Sign in |
| GET | `/api/v1/auth/me` | Current user |
| GET / POST | `/api/v1/repositories` | List my repositories / create repository |
| GET / PATCH / DELETE | `/api/v1/repositories/:repositoryId` | Read / update / delete repository |
| POST | `/api/v1/repositories/:repositoryId/members` | Add a repository member by user ID |
| GET / POST | `/api/v1/repositories/:repositoryId/issues` | List / create issues |
| GET / PATCH / DELETE | `/api/v1/issues/:issueId` | Read / update / delete issue |
| GET / POST | `/api/v1/issues/:issueId/comments` | List / add comments |
| PATCH / DELETE | `/api/v1/issues/:issueId/comments/:commentId` | Edit / delete a comment |
| GET | `/api/v1/dashboard/summary` | Dashboard statistics |

Detailed request/response examples and query parameters are in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). The beginner-friendly code walkthrough is in [`docs/LEARNING_GUIDE.md`](docs/LEARNING_GUIDE.md).

## Run checks

```bash
npm test
npm run check
```

The automated test suite covers query helpers, request validation and permission helper logic. It does **not** replace database-backed integration tests. Before production use, run end-to-end tests against a disposable MongoDB database, configure deployment secrets, and review the authentication/session strategy.

## Important scope notes

- This is the backend implementation and API contract. It does not include the existing React frontend.
- MongoDB is required; there is no SQL database layer.
- The access token is returned by login/register and is valid for the configured duration. Refresh-token rotation, password reset emails, OAuth, file uploads and production observability are not implemented in this MVP.
- Public repositories are readable by authenticated users. Creating issues in a public repository is allowed for an authenticated user. Updating an issue is allowed for its author, a repository member, or the owner. Deleting issues and changing repository settings are restricted to repository maintainers/owners respectively.
- The API is deployed on Render and connected to MongoDB Atlas. The frontend is not included in this repository; deploy the React frontend separately and set `CLIENT_ORIGIN` to its exact origin instead of `*` for production.
