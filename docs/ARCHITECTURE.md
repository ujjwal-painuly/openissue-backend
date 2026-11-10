# Architecture notes

## Design choices

- **Modular monolith:** one Express application with clear route/controller/service/model boundaries. This is easier to understand and deploy than splitting a student project into microservices.
- **Controllers stay HTTP-focused:** request/response handling lives in controllers; repository access policy is shared in services.
- **Validation at the boundary:** Zod validates incoming payloads before controllers use them.
- **Consistent errors:** controllers throw `AppError`; one Express middleware formats error responses.
- **Database indexes:** unique owner/name repository pair, unique issue number per repository, and compound indexes for common issue filters.
- **Authorization close to data access:** private repository access is checked before issue/comment data is returned.
- **Atomic issue counter:** `$inc` gives concurrent issue creation a unique number per repository.

## Data relationships

```text
User 1 ---- owns/members ---- many Repository
Repository 1 --------------- many Issue
User 1 --------------------- many Issue (author)
User 0..1 ------------------ many Issue (assignee)
Issue 1 -------------------- many Comment
User 1 --------------------- many Comment (author)
```

## Production hardening still needed

- Integration tests against a disposable MongoDB instance, including authorization cases.
- Refresh-token rotation or an explicit short-lived access-token strategy.
- Email verification, password reset, audit log and account recovery.
- Invite acceptance rather than direct member addition.
- Request logging with a structured logger and monitoring/alerting.
- Deployment secrets, TLS, backup/restore checks and rate-limit tuning behind a trusted proxy.
- Consider transactions for multi-document cleanup if the MongoDB deployment supports them.
