# Le Gourmand - Technical Documentation

---

## Table of Contents

1. [Technical Introduction](#1-technical-introduction)
2. [Technology Stack](#2-technology-stack)
3. [Global Architecture](#3-global-architecture)
4. [Data Model](#4-data-model)
5. [API Documentation](#5-api-documentation)
6. [Security](#6-security)
7. [User Interface](#7-user-interface)
8. [Performance and Optimization](#8-performance-and-optimization)
9. [Tests](#9-tests)
10. [Technical Decisions and Trade-offs](#10-technical-decisions-and-trade-offs)

---

## 1. Technical Introduction

Le Gourmand is a web application for creating, sharing, and discovering recipes. Users can register, create their own recipes, browse what others have posted, and organize recipes into personal favorites or a shared list. The application supports filtering by country of origin, diet type, meal type, and ingredients.

The project is split into two separate Node.js services: an API server that handles all data access and business logic, and a web server that serves the frontend. This separation keeps the backend independent from the presentation layer, making it easier to update or replace either side without touching the other.

### Functional Scope

- User registration and login with token-based authentication
- Full recipe lifecycle: creation, editing, deletion
- Recipe browsing with multi-filter search (by name, country, diet, type, and ingredients)
- User interactions with recipes: favorites, sharing, and star ratings
- User profile management including profile picture upload
- Image upload for recipe photos and profile pictures

### Technical Objectives

- Keep the architecture simple and maintainable for a small team
- Use a relational database to model the structured nature of recipe data
- Secure all write operations behind authentication
- Keep the frontend lightweight without requiring a build step or JavaScript framework

---

## 2. Technology Stack

### Backend

**Node.js with Express 5**

Node.js works well for I/O-heavy applications like a REST API. Express is the most straightforward way to define routes and middleware in the Node ecosystem. Express 5 was used for its improved async error handling compared to version 4: unhandled promise rejections in route handlers automatically propagate to the error middleware without needing extra try-catch blocks around every route.

**MySQL 2 (mysql2/promise)**

The project uses MySQL as its relational database, accessed through the `mysql2` package with its promise-based API. MySQL fits the data model well since recipes, users, ingredients, and their relationships have a clearly relational structure. A connection pool (max 10 connections) avoids the overhead of opening a new database connection on each request.

**bcrypt**

Passwords are hashed with bcrypt before being stored. The library handles salt generation internally and is resistant to brute-force attacks due to its configurable cost factor. The project uses 10 rounds, which is the standard recommendation for a good balance between security and CPU cost.

**jsonwebtoken**

JWT is used for stateless authentication. The token is signed with a secret stored in an environment variable and expires after 7 days. This avoids the need for a session store on the server side.

**multer**

File uploads for recipe and profile images are handled by multer, which provides disk storage with configurable filename generation and file type validation.

**dotenv**

Environment-specific configuration (database credentials, JWT secret, port numbers) is loaded from `.env` files and never committed to version control.

### Frontend

**Vanilla JavaScript, HTML5, CSS3**

No frontend framework was used. Each page has its own HTML file and a corresponding JavaScript file that handles data fetching and DOM manipulation. This keeps the frontend simple and avoids adding a build step or bundler. Some patterns like component reuse are handled manually, but for the scale of this project that is acceptable.

### Summary Table

| Component | Technology | Version |
|-----------|-----------|---------|
| API runtime | Node.js | Current LTS |
| API framework | Express | 5.x |
| Database driver | mysql2 | 3.x |
| Password hashing | bcrypt | 6.x |
| Token auth | jsonwebtoken | 9.x |
| File uploads | multer | 2.x |
| Environment config | dotenv | 17.x |
| Frontend | Vanilla JS / HTML / CSS | N/A |
| Database | MySQL 8.0 (Aiven cloud) | 8.0.45 |

---

## 3. Global Architecture

The application runs as two separate Express processes:

- **API server** on port 3001: handles all database access, business logic, and authentication
- **Web server** on port 3002: serves static HTML, CSS, and JS files, and handles image uploads

The web server does not talk to the database directly. All data fetching is done from the browser using the Fetch API, which calls the API server. The web server also exposes a file upload endpoint that writes images to the local disk. After uploading, the returned file path is included in the request body when creating or updating a recipe or profile.

### Request Flow

```
Browser
  |
  |-- HTTP GET (pages/assets) ---------> Web Server (port 3002)
  |                                             |
  |                                        Static files
  |                                        Image upload (multer)
  |                                             |
  |                                        Local disk (public/assets/)
  |
  |-- HTTP GET/POST/PUT/DELETE --------> API Server (port 3001)
                                               |
                                          JWT validation
                                          Controllers
                                               |
                                          MySQL (Aiven)
```

### Component Overview

```
+-------------------------+       +-------------------------+
|                         |       |                         |
|       Browser           |       |      Web Server         |
|                         |       |      (Express 3002)     |
|  - HTML pages           | <---> |                         |
|  - CSS stylesheets      |       |  - Static file serving  |
|  - JS scripts           |       |  - Image upload route   |
|  - Fetch API calls      |       |                         |
|  - localStorage         |       +----------+--------------+
|    (token, user,        |                  |
|     filter state)       |             Local disk
|                         |          /public/assets/
|                         |
|                         |       +-------------------------+
|                         | ----> |                         |
|                         |       |      API Server         |
|                         |       |      (Express 3001)     |
+-------------------------+       |                         |
                                  |  - Auth middleware      |
                                  |  - Route handlers       |
                                  |  - Controllers          |
                                  |                         |
                                  +----------+--------------+
                                             |
                                  +----------+--------------+
                                  |                         |
                                  |   MySQL (Aiven cloud)   |
                                  |   le-gourmand database  |
                                  |                         |
                                  +-------------------------+
```

The two servers are run as separate Node.js processes. There is no reverse proxy, container orchestration, or service mesh at the current stage.

---

## 4. Data Model

The database is named `le-gourmand` and is hosted on Aiven, a managed MySQL 8.0 cloud service. The schema is relational. Note that referential integrity between tables is enforced at the application level in the controllers rather than through explicit FOREIGN KEY constraints in the DDL.

### Tables

**users**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| picture | VARCHAR(200) | default: `/assets/default-profile.png` |
| email | VARCHAR(100) | |
| username | VARCHAR(100) | |
| password | VARCHAR(200) | bcrypt hash |

**recipes**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| name | VARCHAR(45) | |
| picture | VARCHAR(200) | default: `/assets/default-food.png` |
| description | TEXT | |
| preparation | TEXT | step-by-step instructions |
| diet_id | INT | references diets, default: 1 (No Diet) |
| type_id | INT | references recipe_types |
| country_id | INT | references countries |
| user_id | INT | references users (creator) |

**ingredients**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| name | VARCHAR(45) | |

**relation_recipe_ingredients**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| recipe_id | INT | references recipes |
| ingredient_id | INT | references ingredients |

**diets**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| name | VARCHAR(45) | No Diet, Vegetarian, No Gluten, Vegan, Dairy Free, Keto |

**recipe_types**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| name | VARCHAR(45) | Appetizer, Main Course, Dessert, Cocktail |

**countries**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| name | VARCHAR(45) | 193 countries pre-loaded |

**recipe_notes** (ratings)

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| user_id | INT, FK | references users |
| recipe_id | INT, FK | references recipes |
| note | INT | value between 1 and 5 |

**user_favorites**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| user_id | INT, FK | references users |
| recipe_id | INT, FK | references recipes |

**user_shared**

| Column | Type | Notes |
|--------|------|-------|
| id | INT, PK, AUTO_INCREMENT | |
| user_id | INT, FK | references users |
| recipe_id | INT, FK | references recipes |

### Entity-Relationship Diagram

```
users ────────────────────────── recipes
  |  (1 user creates N recipes)    |  |  |
  |                                |  |  |
  |  user_favorites (N:N)          |  |  |
  |  user_shared (N:N)             |  |  |
  |  recipe_notes (N:N, 1 per pair)|  |  |
                                   |  |  |
                            diets ─+  |  |
                      recipe_types ───+  |
                          countries ─────+

recipes ─────────────────── ingredients
           (N:N via relation_recipe_ingredients)
```

### Why SQL

MySQL fits this use case because the data is structured and the relationships between entities are well-defined. Recipes always have the same set of known fields and belong to categories that come from fixed lookup tables. A document store like MongoDB would not add value here and would make JOIN-equivalent queries more complex to write and maintain. The relational model makes it easy to reason about joins, aggregations, and filters across the different entities.

---

## 5. API Documentation

The API server listens on port 3001. All endpoints are prefixed with `/api`. Responses always follow the same JSON envelope:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

On error, `success` is `false` and `message` explains what went wrong. The `data` field is omitted on errors.

Routes marked **[Auth]** require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

### 5.1 Authentication Routes

#### POST /api/auth/register

Registers a new user and returns a JWT token.

Request body:

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "secret123"
}
```

Response 201:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "user@example.com"
    },
    "token": "<jwt_token>"
  }
}
```

| Status | Condition |
|--------|-----------|
| 201 | User created successfully |
| 400 | Missing required fields |
| 409 | Email or username already in use |
| 500 | Server error |

---

#### POST /api/auth/login

Authenticates a user with email and password.

Request body:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response 200:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "user@example.com",
      "picture": null
    },
    "token": "<jwt_token>"
  }
}
```

| Status | Condition |
|--------|-----------|
| 200 | Login successful |
| 400 | Missing fields |
| 401 | Invalid credentials |
| 500 | Server error |

---

#### POST /api/auth/logout

There is no server-side session to invalidate. The endpoint just returns a success message and the client is expected to remove the token from storage.

Response 200:

```json
{
  "success": true,
  "message": "Logout successful. Please delete the token on client side."
}
```

---

#### GET /api/auth/verify [Auth]

Checks whether the current token is valid and returns the decoded user payload.

Response 200:

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

| Status | Condition |
|--------|-----------|
| 200 | Token is valid |
| 401 | No token provided |
| 403 | Token invalid or expired |

---

### 5.2 Recipe Routes

#### GET /api/recipes

Returns all recipes. Results can be filtered using query parameters. Multiple values for the same filter are passed as comma-separated IDs and are applied with OR logic.

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Partial name match (case-insensitive) |
| diet | string | Comma-separated diet IDs |
| type | string | Comma-separated recipe type IDs |
| country | string | Comma-separated country IDs |
| ingredients | string | Comma-separated ingredient IDs |

Response 200:

```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": 1,
      "name": "Ratatouille",
      "picture": "/assets/recipe/1234567890_abc.jpg",
      "description": "A classic Provencal dish.",
      "preparation": "1. Cut vegetables\n2. Cook slowly",
      "diet_name": "Vegan",
      "type_name": "Main Course",
      "country_name": "France",
      "average_rating": 4.2,
      "favorites_count": 8,
      "ingredients": [
        { "id": 3, "name": "Tomato" },
        { "id": 7, "name": "Zucchini" }
      ]
    }
  ]
}
```

---

#### GET /api/recipes/:id

Returns a single recipe with full details including ingredient list and aggregated ratings.

Response 200:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ratatouille",
    "picture": "/assets/recipe/1234567890_abc.jpg",
    "description": "A classic Provencal dish.",
    "preparation": "1. Cut vegetables\n2. Cook slowly",
    "diet_id": 2,
    "type_id": 1,
    "country_id": 5,
    "user_id": 3,
    "diet_name": "Vegan",
    "type_name": "Main Course",
    "country_name": "France",
    "average_rating": 4.2,
    "total_ratings": 15,
    "favorites_count": 8,
    "ingredients": [
      { "id": 3, "name": "Tomato" },
      { "id": 7, "name": "Zucchini" }
    ]
  }
}
```

| Status | Condition |
|--------|-----------|
| 200 | Recipe found |
| 404 | Recipe not found |
| 500 | Server error |

---

#### POST /api/recipes [Auth]

Creates a new recipe. The `user_id` is taken from the JWT token, not from the request body.

Request body:

```json
{
  "name": "Ratatouille",
  "picture": "/assets/recipe/1234567890_abc.jpg",
  "description": "A classic Provencal dish.",
  "preparation": "1. Cut vegetables\n2. Cook slowly",
  "diet_id": 2,
  "type_id": 1,
  "country_id": 5,
  "ingredients": [3, 7, 12]
}
```

Response 201:

```json
{
  "success": true,
  "message": "Recipe created successfully",
  "data": { "id": 14 }
}
```

The ingredient relations are inserted in the same database transaction as the recipe row. If either operation fails, both are rolled back.

| Status | Condition |
|--------|-----------|
| 201 | Recipe created |
| 401 | Not authenticated |
| 500 | Server error |

---

#### PUT /api/recipes/:id [Auth]

Updates an existing recipe. Only the recipe's creator can update it. The ingredient list is replaced in full: the old relations are deleted and new ones are inserted.

Request body: same structure as POST.

Response 200:

```json
{
  "success": true,
  "message": "Recipe updated successfully"
}
```

| Status | Condition |
|--------|-----------|
| 200 | Updated successfully |
| 403 | User is not the recipe owner |
| 404 | Recipe not found |
| 500 | Server error |

---

#### DELETE /api/recipes/:id [Auth]

Deletes a recipe. Only the recipe's creator can delete it. All related rows (ingredient relations, ratings, favorites, shared entries) are deleted first within a transaction before the recipe row itself is removed.

Response 200:

```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

| Status | Condition |
|--------|-----------|
| 200 | Deleted successfully |
| 403 | User is not the recipe owner |
| 404 | Recipe not found |
| 500 | Server error |

---

#### POST /api/recipes/:id/favorite [Auth]

Adds a recipe to the authenticated user's favorites. Returns 409 if already favorited.

Response 200:

```json
{ "success": true, "message": "Recipe added to favorites" }
```

---

#### DELETE /api/recipes/:id/favorite [Auth]

Removes a recipe from the authenticated user's favorites. Returns 404 if the recipe was not in the user's favorites.

---

#### POST /api/recipes/:id/share [Auth]

Adds a recipe to the authenticated user's shared list. Returns 409 if already shared.

---

#### DELETE /api/recipes/:id/share [Auth]

Removes a recipe from the authenticated user's shared list.

---

#### POST /api/recipes/:id/rate [Auth]

Rates a recipe. If the user already has a rating for this recipe, it is updated instead of creating a new one.

Request body:

```json
{ "note": 4 }
```

The `note` field must be an integer between 1 and 5. Returns 400 if the value is out of range.

Response 200:

```json
{ "success": true, "message": "Recipe rated successfully" }
```

---

#### GET /api/recipes/:id/my-rating [Auth]

Returns the authenticated user's current rating for a recipe.

Response 200:

```json
{
  "success": true,
  "data": { "note": 4 }
}
```

If the user has not rated the recipe yet, `note` is returned as `0`.

---

### 5.3 User Routes

All user routes require authentication.

#### GET /api/users/:id [Auth]

Returns a user's public profile.

Response 200:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "picture": "/assets/profile/1234567890_xyz.jpg"
  }
}
```

---

#### PUT /api/users/:id [Auth]

Updates a user's profile. Only the authenticated user can update their own profile.

Request body:

```json
{
  "username": "newname",
  "picture": "/assets/profile/1234567890_xyz.jpg"
}
```

Response 200:

```json
{ "success": true, "message": "Profile updated successfully" }
```

---

#### GET /api/users/:id/favorites [Auth]

Returns the list of recipes the user has added to favorites.

---

#### GET /api/users/:id/shared [Auth]

Returns the list of recipes the user has marked as shared.

---

#### GET /api/users/:id/recipes [Auth]

Returns the list of recipes created by the user.

---

### 5.4 Reference Data Routes

These endpoints return the lookup tables used to populate filter options. All are public and do not require authentication.

| Endpoint | Description |
|----------|-------------|
| GET /api/ingredients | List all ingredients |
| GET /api/ingredients/:id | Get a single ingredient |
| GET /api/diets | List all diets |
| GET /api/diets/:id | Get a single diet |
| GET /api/countries | List all countries |
| GET /api/countries/:id | Get a single country |
| GET /api/recipe-types | List all recipe types |
| GET /api/recipe-types/:id | Get a single recipe type |

---

### 5.5 File Upload (Web Server)

#### POST /upload-image

This endpoint is on the web server (port 3002), not the API server. It accepts a `multipart/form-data` request with a single image file and a `folder` query parameter.

Query parameters:

| Parameter | Accepted values | Description |
|-----------|-----------------|-------------|
| folder | `recipe`, `profile` | Target subdirectory under `public/assets/` |

The response returns the file path that should be submitted to the API when creating or updating a recipe or profile. The filename is generated from a timestamp and a random string to avoid collisions and to prevent users from controlling filenames on disk.

Constraints:
- Max file size: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`

---

### 5.6 Health Check

#### GET /api/health

Returns a minimal response to confirm the API process is running. Useful for monitoring and deployment checks.

---

### 5.7 Error Handling

All API error responses use HTTP status codes consistently:

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing or invalid input) |
| 401 | No authentication token provided |
| 403 | Token invalid, expired, or insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate favorite, email already taken) |
| 500 | Unexpected server error |

---

## 6. Security

### Authentication with JWT

When a user registers or logs in, the server generates a JWT signed with the `JWT_SECRET` environment variable. The payload contains `{ id, email, username }`. The token is valid for 7 days.

The client stores the token in `localStorage` and sends it on every request to a protected endpoint using the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The auth middleware on the API server extracts the token, verifies its signature using `jwt.verify`, and attaches the decoded payload to `req.user`. Missing tokens return 401; invalid or expired tokens return 403.

The frontend also does a lightweight client-side expiry check on each protected page load by decoding the JWT payload and comparing the `exp` field to `Date.now()`. If the token is expired, the client clears `localStorage` and redirects to the login page before making any API calls.

### Password Storage

Passwords are never stored in plaintext. On registration, the password is passed through `bcrypt.hash` with a cost factor of 10 before being inserted into the database. On login, `bcrypt.compare` is used to verify the submitted password against the stored hash. The password field is explicitly removed from the user object before it is sent back in any response.

### Resource Authorization

Beyond token verification, the API enforces ownership on destructive operations. Before a recipe is updated or deleted, the controller queries the recipe's `user_id` and compares it to the authenticated user's `id` from the token. If they do not match, the server returns 403 without performing the operation. The same check applies to profile updates.

### SQL Injection Prevention

All database queries are written using parameterized statements via the `mysql2` driver. User-supplied values are always passed as separate parameters, never interpolated into the SQL string. This applies to all routes including the dynamic filter logic in the recipe list endpoint.

Example:

```javascript
const [users] = await db.query(
  `SELECT id FROM users WHERE email = ? OR username = ?`,
  [email, username]
);
```

### File Upload Restrictions

The multer middleware validates uploaded files before they are written to disk. Files that are not `image/jpeg`, `image/png`, or `image/gif` are rejected. Files larger than 5 MB are also rejected. Filenames generated on the server are based on a timestamp and a random string, so user-provided filenames are never used on the filesystem.

---

## 7. User Interface

### Platform and Approach

The frontend is a set of static HTML pages served by the web server. Each page loads its own JavaScript module that fetches data from the API and updates the DOM directly. There is no client-side router, no build step, and no transpilation.

The API base URL is defined in a single `config.js` file loaded on every page:

```javascript
const CONFIG = { API_URL: 'http://localhost:3001/api' };
```

This makes it easy to point the frontend at a different API instance by changing one value.

### Pages

**Sign In and Sign Up**

Two standalone authentication pages. Client-side validation runs before the form is submitted: required fields are checked, the email format is validated with a regex, and on the sign-up page the two password fields are compared. On success the token and user object are stored in `localStorage` and the user is redirected to the home page.

**Home Page**

The main recipe browsing page. It shows a search bar and four filter panels: Country, Ingredients, Types, and Diets. Each filter is multi-select, with selected values displayed as removable chips. The filter state is saved to `localStorage` on each change, so it persists when navigating away and coming back.

Below the filters the recipes are shown in a responsive card grid. Each card shows the recipe image, name, country, diet type, and average star rating. Clicking a card navigates to the recipe detail page.

**Recipe Detail Page**

Shows the full information for a single recipe: hero image, name, description, country, type, diet, creator, ingredient list, and step-by-step preparation. Authenticated users can rate the recipe by clicking on the star row (1 to 5). They can also toggle the recipe in their favorites or shared list using two buttons that reflect the current state. The creator's username links to their profile.

**Profile Page**

Shows a user's username, email, and profile picture. Three sections display the user's favorite recipes, shared recipes, and recipes they have created. If the logged-in user is viewing their own profile, an edit button opens a modal where they can change their username and upload a new profile picture. Recipes created by the user have a delete button that triggers a confirmation dialog before sending the delete request to the API.

### Key Scripts

| Script | Responsibility |
|--------|---------------|
| config.js | API base URL constant |
| checkAuth.js | Checks token validity on page load, redirects if expired |
| signin.js | Login form handler and validation |
| signup.js | Registration form handler and validation |
| home.js | Filter state, recipe list rendering, filter persistence |
| create_recipe.js | Recipe creation modal, ingredient multi-select, image upload |
| recipe.js | Recipe detail rendering, rating, favorites, sharing |
| profile.js | Profile data loading, recipe collections, profile edit modal |

### State Management

There is no global state manager. Page-level state lives in variables within each script. Persistent state across page loads is handled through `localStorage`:

| Key | Content |
|-----|---------|
| `token` | JWT token string |
| `user` | Object with `id`, `username`, `email`, `picture` |
| `recipeFilters` | Search query and selected filter IDs for the home page |

After the user updates their profile, the `user` entry in `localStorage` is updated immediately so that username and profile picture changes are reflected on other pages without requiring a re-login.

---

## 8. Performance and Optimization

### Query Design

The recipe list endpoint uses a single SQL query with multiple LEFT JOINs to fetch recipe data alongside diet, type, country, average rating, favorites count, and ingredients in one database round trip. `GROUP_CONCAT` is used to aggregate ingredient IDs and names into comma-separated strings, which are then split into arrays in the controller.

```sql
SELECT
    r.id, r.name, r.picture, r.description, r.preparation,
    d.name as diet_name,
    rt.name as type_name,
    c.name as country_name,
    AVG(rn.note) as average_rating,
    COUNT(DISTINCT uf.id) as favorites_count,
    GROUP_CONCAT(DISTINCT i.id ORDER BY i.name ASC) as ingredient_ids,
    GROUP_CONCAT(DISTINCT i.name ORDER BY i.name ASC SEPARATOR ', ') as ingredient_names
FROM recipes r
    LEFT JOIN diets d ON r.diet_id = d.id
    LEFT JOIN recipe_types rt ON r.type_id = rt.id
    LEFT JOIN countries c ON r.country_id = c.id
    LEFT JOIN recipe_notes rn ON r.id = rn.recipe_id
    LEFT JOIN user_favorites uf ON r.id = uf.recipe_id
    LEFT JOIN relation_recipe_ingredients rri ON r.id = rri.recipe_id
    LEFT JOIN ingredients i ON rri.ingredient_id = i.id
WHERE 1=1
  [+ dynamic filter conditions]
GROUP BY r.id, r.name, r.picture, r.description, r.preparation,
         d.name, rt.name, c.name
ORDER BY r.name ASC
```

The recipe detail endpoint makes two separate queries: one for the main recipe data and one for the ingredient list. This was kept separate from `GROUP_CONCAT` for the detail view to get the ingredients as a clean array with both `id` and `name` fields.

### Connection Pooling

The MySQL connection pool is configured with a maximum of 10 connections. This avoids the overhead of establishing a new TCP connection to the database on every HTTP request while bounding resource usage.

### Filter Persistence

The home page saves the current search and filter state to `localStorage` on each change. When the user navigates back from a recipe detail page, the saved state is reloaded and the recipe list is fetched with those filters already applied. This avoids losing filter context on navigation.

### Transactions for Multi-step Writes

Recipe creation, update, and deletion all use database transactions. For example, creating a recipe involves inserting the recipe row and then inserting one row per ingredient into `relation_recipe_ingredients`. If the second operation fails, the transaction is rolled back so no partial data is left in the database. The connection is always released back to the pool in the `finally` block.

### Pagination

The current implementation does not paginate results. All recipes matching the active filters are returned in a single response. For the current dataset size this is workable, but it is one of the first things that would need to change as the data grows.

---

## 9. Tests

The project does not include a test suite. There are no unit tests, integration tests, or end-to-end tests, and there is no test runner configuration. Testing during development was done manually through the browser interface and direct API requests.

---

## 10. Technical Decisions and Trade-offs

### Two Separate Servers

Running the API and the web server as two separate processes adds some operational overhead: two processes to start, two ports to manage. The benefit is a clean separation of concerns. The API has no knowledge of the frontend, which makes it possible to test the API independently and to add other clients (a mobile app, for example) without any changes to the backend. The web server stays simple because it only serves files and handles uploads.

### No Frontend Framework

Using vanilla JavaScript instead of a framework like React or Vue means no build step, no bundler configuration, and no npm dependencies on the frontend side. The downside is that there is no component abstraction, so similar UI patterns like chip-based multi-select filters and recipe card grids are re-implemented in each page's script file rather than shared. For the scope of this project the simplicity outweighed the benefit of adding a framework.

### JWT in localStorage

Storing the JWT in `localStorage` is straightforward and works well for a single-page-per-route architecture. The limitation is that `localStorage` is accessible to JavaScript running on the page, which means the token is exposed if an XSS vulnerability existed. A more secure alternative would be `httpOnly` cookies, which the browser keeps out of reach of JavaScript. The current approach was chosen for its simplicity, and this is a documented trade-off rather than an oversight.

### Stateless Logout

Logout is handled entirely on the client side by removing the token from `localStorage`. The server does not maintain a token blocklist. This means that if a token is stolen before logout it remains valid until it expires (7 days). A production-grade implementation would maintain a blocklist in a cache like Redis, but this adds infrastructure complexity that was out of scope for this project.

### OR Logic for Filters

When multiple values are selected for the same filter category (for example, two countries), the query uses `IN (...)` which returns recipes matching any of the selected values. This means filters within the same category are OR conditions. An AND approach (only return recipes matching all selected values) would be stricter and potentially more useful for ingredient filtering, but the OR approach returns more results and is less likely to produce an empty list for a casual user browsing recipes.

### Recipe Deletion Strategy

When a recipe is deleted, all related rows in junction tables (`relation_recipe_ingredients`, `recipe_notes`, `user_favorites`, `user_shared`) are deleted first, one table at a time within a single transaction. This was done explicitly rather than relying on cascade deletes at the database level, to keep the deletion logic visible in the application code and easier to audit.

### No Pagination

Returning all matching recipes in one response keeps the frontend logic simple: there is no need to handle page state, load-more buttons, or cursor tracking. For the current scale this is fine. As the dataset grows, adding offset-based or cursor-based pagination on the `/api/recipes` endpoint would be the first performance improvement to make.