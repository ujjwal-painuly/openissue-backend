# OpenIssue backend — learning guide (Hinglish)

Is guide ka goal hai ki tu code ko samajhkar explain kar sake. Pehle request ka flow samajh; har file ratne ki zarurat nahi.

## 1. Project ka simple idea

OpenIssue ek issue tracking platform hai. Developer ek repository banata hai, usmein issue open karta hai, issue ko priority/status deta hai, kisi team member ko assign karta hai aur comments mein discussion karta hai.

Example:

1. Ujjwal account banata hai.
2. Ujjwal `OpenIssue-Web` naam ka repository create karta hai.
3. Ujjwal `Login page crashes on refresh` issue open karta hai.
4. Issue ki priority `HIGH` aur status `OPEN` set hoti hai.
5. Owner kisi member ko issue assign karta hai.
6. Team comment karke progress discuss karti hai.
7. Developer status ko `IN_PROGRESS`, phir `RESOLVED` karta hai.

## 2. Ek API request ka flow

```text
React frontend
     |
     | HTTP request + JSON + Bearer token
     v
Route (src/routes)
     |
     v
Validation middleware (src/middleware/validate.js)
     |
     v
Authentication middleware (protected routes)
     |
     v
Controller (src/controllers)
     |
     v
Model / MongoDB (src/models)
     |
     v
JSON response back to React
```

- **Route:** URL aur HTTP method ko controller se connect karta hai.
- **Middleware:** Controller se pehle common checks karta hai. Example: token valid hai ya body ka format sahi hai.
- **Controller:** Request samajhta hai, permission check/service call karta hai aur response bhejta hai.
- **Model:** MongoDB document ka shape aur indexes define karta hai.
- **Service:** Reusable rules rakhta hai, jaise private repository access ka check.

## 3. Folder kis kaam ka hai?

| Folder | Iska kaam |
|---|---|
| `config/` | Environment variables aur MongoDB connection |
| `controllers/` | Register, repository, issue, comment aur dashboard logic |
| `middleware/` | Authentication, validation aur central error response |
| `models/` | User, Repository, Issue, Comment ke MongoDB schemas |
| `routes/` | API endpoints / URL mapping |
| `services/` | Permission checks jaise shared business rules |
| `utils/` | Error class, async wrapper, token aur query helpers |
| `validators/` | Zod request schemas |
| `tests/` | Query helper ke automated tests |

## 4. Authentication kaise kaam karta hai?

1. Register route email, name aur password leta hai.
2. Password ko `bcrypt.hash(password, 12)` se hash kiya jata hai. Plain password database mein store nahi hota.
3. Login par `bcrypt.compare()` supplied password ko stored hash ke saath verify karta hai.
4. Login successful ho toh JWT create hota hai. Token mein user ID (`sub`) aur role hota hai.
5. React protected API request mein `Authorization: Bearer <token>` bhejta hai.
6. `authenticate.js` JWT verify karta hai, user database se load karta hai aur `req.user` set karta hai.

Important: JWT signed hota hai, encrypted nahi. Isliye password ya private information JWT payload mein nahi rakhte.

## 5. Repository permissions

`repositoryAccess.js` teen cheezein check karta hai:

- Owner: repository jis user ne banayi.
- Member: jis user ko owner ne member add kiya.
- Public/private: public repo ko authenticated user dekh sakta hai; private repo sirf owner/member ko.

Private repository ke liye API `404` return karti hai, taaki unauthorized user ko repository ke existence ka hint na mile.

## 6. Issue number duplicate kyun nahi hota?

Har repository ka `nextIssueNumber` counter hai. Issue create karte waqt MongoDB ka `$inc` operator counter ko ek atomic database operation mein increment karta hai. Isse do simultaneous requests ko same issue number nahi milta.

Agar counter increment ke baad issue save fail ho, toh number skip ho sakta hai. Number unique rahega, lekin sequence mein gap aa sakta hai. Real issue trackers mein gaps acceptable hote hain.

## 7. Search aur pagination

Issue listing API filters support karti hai: status, priority, assignee, label aur text search (`q`). Page/limit se records chhote batches mein milte hain.

- `skip = (page - 1) * limit`
- `limit` maximum 50 rakha gaya hai.
- Search text ko regex banane se pehle escape kiya jata hai. Isse user input regex operators ki tarah execute nahi hota.

## 8. Dashboard aggregation

`dashboardController.js` MongoDB aggregation pipeline use karta hai. `$match` current user's repositories ke issues filter karta hai. `$facet` ek hi pipeline run mein totals, status-wise counts, priority-wise counts aur recently updated issues nikalta hai.

## 9. Error handling

Controllers expected failures ko `AppError` ke through raise karte hain. `asyncHandler` async controller rejection ko Express error middleware tak pahunchata hai. `errorHandler.js` duplicate-key, invalid Mongo ID aur Mongoose validation errors ko consistent JSON response mein convert karta hai.

Frontend ko error ka format roughly aisa milega:

```json
{
  "status": "error",
  "message": "Request validation failed",
  "details": [
    { "field": "body.title", "message": "String must contain at least 4 character(s)" }
  ]
}
```

## 10. Tujhe kaise padhna chahiye?

1. `src/app.js` — sab routes aur middleware kahan register hue.
2. `src/routes/authRoutes.js` — route se controller tak ka connection.
3. `src/controllers/authController.js` — register/login ka flow.
4. `src/middleware/authenticate.js` — protected route kaise secure hoti hai.
5. `src/models/Repository.js` aur `src/services/repositoryAccess.js` — data model aur permissions.
6. `src/controllers/issueController.js` — issue create/list/update ka main workflow.
7. `src/controllers/commentController.js` — comments aur ownership checks.
8. `src/controllers/dashboardController.js` — aggregation.

Har endpoint ko Postman/Thunder Client se call kar, request body badal, response dekh aur debugger/console se flow follow kar. Jab tu bina code dekhe request ka path explain kar dega, tab concept samajh aa gaya.

## 11. Interview mein project kaise explain karein?

"OpenIssue is a repository issue-tracking backend built with Node.js, Express and MongoDB. It provides JWT-based authentication, repository-level access control, issue lifecycle management, comments, filtering and dashboard analytics. I separated routes, controllers, models, validation and reusable permission checks so the API is easier to test and maintain."

Jo features abhi implemented nahi hain—jaise refresh-token rotation, email verification, OAuth, file uploads, CI deployment—unhe implemented bolna mat. Unhe future improvements ke roop mein mention kar sakta hai.
