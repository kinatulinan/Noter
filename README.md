# Noter — Notes App (React + Spring Boot + MySQL)

A simple note‑taking web app with **registration + login** and **CRUD** for notes.  
Users can see everyone’s notes, but **only the creator can edit or delete their own note**.  
Authorization (tokens/roles) is intentionally **not** included to keep the scope small.

---

## ✨ Features

- Register and login (basic, no JWT yet).
- Create, read, update, delete notes.
- Every note stores **who created it** (name + email).
- UI shows the **creator’s name** on each note.
- Only the **creator** sees **Edit**/**Delete** on their notes; others can only view.

---

## 🧱 Architecture Overview

```
Frontend (Vite + React)  →  REST API (Spring Boot)  →  MySQL (JPA/Hibernate)
```

- **Frontend**: Vite + React, fetches the API at `http://localhost:8080` (configurable).
- **Backend**: Spring Boot 3, Spring Web, Spring Data JPA, MySQL connector.
- **Database**: MySQL (`noter_db`) with Hibernate `ddl-auto=update` for schema updates.

---

## 🖥️ Frontend

- Stack: **Vite + React**, plain fetch (or axios), single‑page UI.
- Dev server: `http://localhost:5173`
- **Username field** in the UI is treated as **email** to match backend inputs.
- Notes text box maps to:
  - `title` = first 60 chars of the text (for convenience),
  - `content` = full text of the note.

### Frontend setup

```bash
cd Frontend/Noter
npm install
# Optional: configure API base URL
echo "VITE_API_BASE_URL=http://localhost:8080" > .env
npm run dev
# open http://localhost:5173
```

---

## ⚙️ Backend

- Stack: **Spring Boot 3.5.x**, Java 17+ (works on 22), Spring Web, Spring Data JPA, MySQL.
- Run on port **8080**.

### Key classes (simplified)

**Entity**

```java
// NoteEntity
Long id;
String title;
String content;
String authorEmail; // who created it (ownership)
String authorName;
Instant createdAt;
Instant updatedAt;
```

**DTOs**

```java
// NoteCreateRequest
{ "title": "...", "content": "...", "authorEmail": "user@example.com", "authorName": "User Name" }

// NoteUpdateRequest
{ "title": "...", "content": "...", "actorEmail": "user@example.com" }

// NoteResponse
{ "id": 1, "title": "...", "content": "...", "authorName": "...", "authorEmail": "...",
  "createdAt": "...", "updatedAt": "..." }
```

**Ownership enforcement**

- Only `authorEmail` can update/delete.
- Server throws proper HTTP errors (403/404/400) using `ResponseStatusException`.

**CORS**

```java
@CrossOrigin(origins = "http://localhost:5173") // on NoteController (and/or a global CORS bean)
```

### Backend setup

1. **Create database** (MySQL):

```sql
CREATE DATABASE noter_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Configure application properties** (`src/main/resources/application.properties`):

```properties
spring.application.name=Noter

spring.datasource.url=jdbc:mysql://localhost:3306/noter_db
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=YOUR_DB_USER
spring.datasource.password=YOUR_DB_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Optional
server.error.include-stacktrace=never
```

3. **Run**:

```bash
cd Backend/Noter
./mvnw spring-boot:run   # or: mvn spring-boot:run
```

---

## 🔌 REST API (Quick Reference)

### Auth

> Minimal endpoints; no tokens. The frontend treats “username” as the email.

**Register**

```
POST /api/auth/register
Content-Type: application/json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
200 OK  →  { "id": 1, "name": "Jane Doe", "email": "jane@example.com" }
```

**Login**

```
POST /api/auth/login
Content-Type: application/json
{
  "email": "jane@example.com",
  "password": "secret123"
}
200 OK  →  { "success": true, "message": "Login successful", "user": { "id": 1, "name": "...", "email": "..." } }
```

### Notes

**List**

```
GET /api/notes
200 OK → [
  { "id": 1, "title": "...", "content": "...", "authorName": "...", "authorEmail": "...", ... }
]
```

**Create**

```
POST /api/notes
Content-Type: application/json
{
  "title": "My first note",
  "content": "Hello world",
  "authorEmail": "jane@example.com",
  "authorName": "Jane Doe"   // optional; server derives from email if omitted
}
201 Created → NoteResponse
```

**Update (author only)**

```
PUT /api/notes/{id}
Content-Type: application/json
{
  "title": "Updated title",
  "content": "Updated content",
  "actorEmail": "jane@example.com"
}
200 OK → NoteResponse
403 FORBIDDEN if actorEmail != authorEmail
```

**Delete (author only)**

```
DELETE /api/notes/{id}
Headers: X-User-Email: jane@example.com
# or: /api/notes/{id}?actorEmail=jane@example.com
204 No Content
403 FORBIDDEN if actorEmail != authorEmail
```

---

## ✅ How the flow matches the requirement

- When **user1** creates a note, it’s stored with `authorEmail`/`authorName`.
- Any user can **see** the note and its **creator’s name**.
- Only the **creator** can **edit/delete** (checked in UI _and_ enforced on the server).

---

## 🧪 Testing tips

- Use **Postman** or the browser console to verify endpoints.
- Common checks:
  - Create a note as `user1@example.com` → confirm it shows `authorName` on list.
  - Login as `user2@example.com` → cannot edit/delete `user1`’s note; gets 403 from API.

---

## 🛠️ Troubleshooting

- **Unknown database 'noter_db'**: Create it first (`CREATE DATABASE noter_db;`) and ensure the JDBC URL points to it.
- **Cannot load driver class: com.mysql.cj.jdbc.Driver**: Ensure `mysql-connector-j` is on the classpath (it is in `pom.xml`).
- **NPE on email**: The register/login JSON must include the `email` key; add validation (`@Valid`) on DTOs.
- **CORS**: If the browser blocks requests, confirm `@CrossOrigin` or a global CORS config allows `http://localhost:5173`.

---

## 📦 Tech Stack

- **Frontend**: React (Vite), CSS
- **Backend**: Spring Boot 3, Spring Web, Spring Data JPA
- **Database**: MySQL 8+
- **Build Tools**: Maven
- **Java**: 17+

---

## 🚀 Roadmap (nice-to-have)

- JWT auth (Spring Security) to remove the need to pass emails in requests.
- Per-user note visibility (if required) or personal feeds.
- Pagination & search.
- Better error messages and form validation on the frontend.
- Docker Compose for one‑command local setup.
