# Beverage System - Backend

Modern, scalable backend for the Beverage Management System built with Node.js, Express, and Sequelize.

## Architecture

This backend follows a **4-layer architecture** pattern for clean separation of concerns:

```
┌─────────────────┐
│    Routes       │ ← HTTP endpoints and routing
├─────────────────┤
│  Controllers    │ ← Request/Response handling
├─────────────────┤
│   Services      │ ← Business logic
├─────────────────┤
│  Repositories   │ ← Data access layer
├─────────────────┤
│    Models       │ ← Database models (Sequelize)
└─────────────────┘
```

### Directory Structure

```
backend/src/
├── config/           # Configuration files
│   ├── database.js   # Database connection
│   ├── env.js        # Environment variables
│   └── constants.js  # Application constants
├── controllers/      # Request handlers
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── beverage.controller.js
│   ├── order.controller.js
│   └── report.controller.js
├── services/         # Business logic
│   ├── auth.service.js
│   ├── user.service.js
│   ├── beverage.service.js
│   ├── order.service.js
│   └── report.service.js
├── repositories/     # Data access
│   ├── base.repository.js
│   ├── user.repository.js
│   ├── beverage.repository.js
│   ├── order.repository.js
│   └── inventory.repository.js
├── models/           # Database models
│   ├── User.js
│   ├── Beverage.js
│   ├── Order.js
│   ├── InventoryTransaction.js
│   └── index.js
├── routes/           # API routes
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── beverage.routes.js
│   ├── order.routes.js
│   ├── report.routes.js
│   └── index.js
├── middleware/       # Express middleware
│   ├── auth.middleware.js
│   ├── authorize.middleware.js
│   ├── validate.middleware.js
│   ├── error.middleware.js
│   └── logger.middleware.js
├── validators/       # Input validation
│   ├── auth.validator.js
│   ├── user.validator.js
│   ├── beverage.validator.js
│   └── order.validator.js
├── utils/            # Utility functions
│   ├── error.util.js
│   ├── response.util.js
│   ├── logger.util.js
│   └── seed.util.js
└── server.js         # Main entry point
```

## Layer Responsibilities

### 1. Routes Layer
- Defines HTTP endpoints
- Maps URLs to controllers
- Applies middleware (auth, validation)
- **Principle**: Thin routing layer, no business logic

### 2. Controllers Layer
- Handles HTTP requests/responses
- Calls appropriate services
- Returns formatted responses
- **Principle**: No business logic, just delegation

### 3. Services Layer
- Contains all business logic
- Orchestrates data operations
- Enforces business rules
- **Principle**: Independent of HTTP layer

### 4. Repositories Layer
- Data access abstraction
- Database queries
- CRUD operations
- **Principle**: Only database operations

## Key Features

✅ **Clean Architecture** - Separation of concerns
✅ **Dependency Injection** - Services receive repositories
✅ **Error Handling** - Centralized error middleware
✅ **Validation** - express-validator integration
✅ **Logging** - Request and error logging
✅ **Authentication** - JWT-based auth
✅ **Authorization** - Role-based access control
✅ **Database** - Sequelize ORM with SQLite
✅ **Testing Ready** - Layered architecture enables easy testing

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users (Admin only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Beverages
- `GET /api/beverages` - List beverages
- `GET /api/beverages/:id` - Get beverage
- `POST /api/beverages` - Create beverage (Admin)
- `PUT /api/beverages/:id` - Update beverage (Admin)
- `DELETE /api/beverages/:id` - Delete beverage (Admin)

### Orders
- `GET /api/orders` - List orders (Admin/Office Boy)
- `GET /api/orders/:id` - Get order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status (Admin/Office Boy)

### Reports (Admin only)
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/popular-beverages` - Popular beverages
- `GET /api/reports/inventory-status` - Inventory status
- `GET /api/reports/consumption-trends` - Consumption trends
- `GET /api/reports/export/pdf` - Export PDF
- `GET /api/reports/export/excel` - Export Excel

## Development

### Prerequisites
- Node.js >= 14
- npm >= 6

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

### Default Credentials
- **Admin**: `admin / admin123`
- **Office Boy**: `officeBoy / office123`
- **Employee**: `ahmed / ahmed123`
- **Employee**: `sara / sara123`

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
DB_DIALECT=sqlite
DB_STORAGE=./backend/src/database/beverages.db
```

## Database

The system uses **SQLite** by default for easy setup. The database is automatically:
- Created on first run
- Migrated with latest schema
- Seeded with initial data

Database location: `backend/src/database/beverages.db`

## Error Handling

All errors are caught and handled by the centralized error middleware:
- Custom error classes for different scenarios
- Proper HTTP status codes
- Consistent error response format
- Detailed logging

## Validation

Input validation using `express-validator`:
- Separate validator files per resource
- Validation middleware
- Formatted validation errors

## Security

- JWT authentication
- Password hashing (bcrypt)
- Role-based authorization
- Input validation
- SQL injection protection (Sequelize ORM)

## Best Practices

1. **Single Responsibility** - Each layer has one purpose
2. **Dependency Injection** - Services are injected
3. **Error Handling** - try-catch in all async functions
4. **Logging** - All operations are logged
5. **Constants** - No magic strings/numbers
6. **Validation** - All inputs are validated
7. **Documentation** - All files have JSDoc comments

## Future Enhancements

- TypeScript migration
- Unit tests (Jest)
- Integration tests
- API documentation (Swagger)
- Rate limiting
- Caching (Redis)
- PostgreSQL support
- Docker containerization
