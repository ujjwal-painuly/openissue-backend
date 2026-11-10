# OpenIssue API contract

Base URL: `http://localhost:5000/api/v1`

All request bodies are JSON. Except the health, register and login endpoints, routes require:

```http
Authorization: Bearer <access-token>
```

## Authentication

### `POST /auth/register`

```json
{
  "name": "Ujjwal Painuly",
  "email": "ujjwal@example.com",
  "password": "at-least-8-characters"
}
```

### `POST /auth/login`

```json
{
  "email": "ujjwal@example.com",
  "password": "at-least-8-characters"
}
```

Both return `data.user` and `data.token`. `GET /auth/me` returns the current user's safe profile fields.

## Repositories

### `POST /repositories`

```json
{
  "name": "OpenIssue-Web",
  "description": "Issue tracking dashboard",
  "visibility": "private"
}
```

`GET /repositories` lists repositories owned by or joined by the current user. `GET /repositories/:repositoryId` returns one repository if the caller can view it. `PATCH /repositories/:repositoryId` accepts one or more of `name`, `description`, `visibility` and is owner-only. `DELETE` is owner-only and also removes the repository's issues and comments.

### `POST /repositories/:repositoryId/members`

```json
{ "userId": "65f000000000000000000001" }
```

Only the repository owner can add an existing user as a member. This MVP adds a member directly; it does not send an invitation email.

## Issues

### `POST /repositories/:repositoryId/issues`

```json
{
  "title": "Login page crashes on refresh",
  "body": "The page shows a blank screen after refreshing the browser.",
  "priority": "HIGH",
  "labels": ["bug", "frontend"],
  "assignee": null
}
```

Allowed priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
Allowed statuses: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.

### `GET /repositories/:repositoryId/issues`

Supported query parameters:

- `page` (default `1`)
- `limit` (default `10`, max `50`)
- `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `assignee` (MongoDB user ID)
- `label` (exact label)
- `q` (literal text search in title/body)
- `sort` (`newest`, `oldest`, `recently-updated`)

Example: `GET /repositories/<repoId>/issues?status=OPEN&priority=HIGH&page=1&limit=10`

### `PATCH /issues/:issueId`

Send only fields to change. Example:

```json
{ "status": "IN_PROGRESS", "priority": "CRITICAL" }
```

The issue author, repository member or repository owner can update an issue. Only repository maintainers can delete it.

## Comments

- `GET /issues/:issueId/comments`
- `POST /issues/:issueId/comments` with `{ "body": "I can reproduce this issue." }`
- `PATCH /issues/:issueId/comments/:commentId` with `{ "body": "Updated comment text." }`
- `DELETE /issues/:issueId/comments/:commentId`

A comment author or repository owner can edit/delete that comment.

## Dashboard

`GET /dashboard/summary` returns:

- `repositoryCount`
- `issueCount`
- `issuesByStatus`
- `issuesByPriority`
- `recentlyUpdated` (up to five records)

## Response shape

Successful responses use `status: "success"` and a `data` object. Errors use `status: "error"`, a human-readable `message`, and optional `details` for field validation errors. Delete endpoints return HTTP `204` with an empty response body.
