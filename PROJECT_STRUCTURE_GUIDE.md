# Project Structure Guide - Suggesto Web Application

This document outlines the project structure for the Suggesto web application - a Node.js/TypeScript application for managing application suggestions and feedback. Built with Express.js, MongoDB, and EJS templating.

## Technology Stack

- **Backend Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with local strategy
- **Session Management**: express-session
- **Template Engine**: EJS
- **CSS Framework**: Tailwind CSS
- **Validation**: class-validator and class-transformer
- **Security**: Helmet, CORS, HPP protection

## Root Directory Structure

```
project-root/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env (not in repo)
├── README.md
└── src/
```

## Core Configuration Files

### package.json
Essential dependencies for the Suggesto application:

```json
{
  "scripts": {
    "start:dev": "concurrently \"npx @tailwindcss/cli -i ./src/public/stylesheets/_styles.css -o ./src/public/stylesheets/styles.css --watch\" \"cross-env NODE_ENV=development nodemon --watch src --ext ts --exec ts-node ./src/app.ts\""
  },
  "dependencies": {
    "express": "^4.21.2",
    "mongoose": "^8.9.5",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "express-session": "^1.18.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "ejs": "^3.1.10",
    "helmet": "^8.0.0",
    "cors": "^2.8.5",
    "moment": "^2.30.1",
    "moment-timezone": "^0.5.46",
    "@tailwindcss/cli": "^4.0.0"
  }
}
```

### tsconfig.json
TypeScript configuration with decorators support for Mongoose and class validation:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "es6",
    "noImplicitAny": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*", "src/types/*"]
    }
  },
  "include": ["src/**/*", "tailwind.config.js", "postcss.config.js"],
  "exclude": ["node_modules"]
}
```

## Source Directory Structure (`src/`)

### Main Application File
- `app.ts` - Main Express application entry point with middleware setup, route registration, and server initialization

### Configuration Directory (`config/`)
```
config/
├── datasource.ts       # MongoDB connection configuration
└── passport.ts         # Passport.js authentication strategies
```

### Controllers Directory (`controllers/`)
Controllers organized by feature area for the Suggesto application:
```
controllers/
├── appController.ts       # Application management (create, view, manage apps)
├── authController.ts      # User authentication (login, register, logout)
└── homeController.ts      # Home page and general functionality
```

**Controller Structure Guidelines:**
- Each controller should handle related routes
- Use class-based controllers with methods for each route
- Import and use appropriate DTOs for validation
- Handle errors appropriately and return consistent responses

### Data Transfer Objects (`dtos/`)
DTOs organized by feature for input validation:
```
dtos/
├── app/
│   ├── add-app.dto.ts          # Validation for creating new applications
│   └── add-suggestion.dto.ts   # Validation for adding suggestions to apps
└── auth/
    ├── create-user.dto.ts      # User registration validation
    └── login-user.dto.ts       # User login validation
```

**DTO Guidelines:**
- Use class-validator decorators for validation
- Use class-transformer decorators for data transformation
- Group related DTOs by feature
- Name files with `.dto.ts` suffix

### Middleware Directory (`middlewares/`)
```
middlewares/
└── validateDto.ts      # DTO validation middleware
```

### Models Directory (`models/`)
Mongoose schema definitions for the Suggesto application:
```
models/
├── Application.ts      # Application schema with embedded suggestions
├── Suggestion.ts       # Detailed suggestion schema with comments and categories
└── User.ts            # User authentication and profile schema
```

**Model Guidelines:**
- Use Mongoose schemas with TypeScript interfaces
- Define proper relationships using ObjectId references
- Use appropriate data types and validation
- Include timestamps where relevant
- Use embedded documents for related data when appropriate

### Public Assets (`public/`)
```
public/
├── images/             # Application images and assets
└── stylesheets/
    ├── _styles.css     # Tailwind input file
    └── styles.css      # Generated Tailwind output
```

### Routes Directory (`routes/`)
```
routes/
├── appRoutes.ts        # Application-related routes (create, view, manage)
├── authRoutes.ts       # Authentication routes (login, register, logout)  
└── homeRoutes.ts       # Home page and general routes
```

**Route Guidelines:**
- Group routes by feature or user role
- Use Express Router
- Apply appropriate middleware for authentication and validation
- Keep routes clean by delegating logic to controllers

### Utilities Directory (`utils/`)
```
utils/
└── regex.constants.ts  # Shared regex patterns for validation
```

### Views Directory (`views/`)
EJS template organization for the Suggesto application:
```
views/
├── home.ejs            # Main landing page
├── pages/
│   ├── apps/
│   │   ├── add-app.ejs        # Create new application form
│   │   ├── add-suggestion.ejs  # Add suggestion to application
│   │   ├── app.ejs            # Single application view
│   │   └── my-apps.ejs        # User's applications dashboard
│   └── auth/
│       ├── login.ejs          # User login form
│       └── register.ejs       # User registration form
└── shared/
    ├── includes/              # Common includes (meta, scripts, styles)
    └── partials/              # Reusable components (header, etc.)
```

**View Guidelines:**
- Organize by user role or feature
- Use partials for reusable components
- Keep shared elements in the `shared` directory
- Use meaningful directory names

## Environment Configuration

Create a `.env` file with the following structure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/suggesto

# Session
SESSION_SECRET=your_session_secret

# Application
NODE_ENV=development
PORT=3000
```

## Architecture Patterns

### 1. MVC Pattern
- **Models**: Mongoose schemas in `models/` directory
- **Views**: EJS templates in `views/` directory  
- **Controllers**: Business logic in `controllers/` directory

### 2. Middleware Pattern
- Authentication middleware for protected routes
- Validation middleware using DTOs

### 3. Repository Pattern
- Use Mongoose models for database operations
- Keep database queries in controller methods

### 4. DTO Pattern
- Validate incoming data using class-validator
- Transform data using class-transformer
- Separate DTOs by feature

## Development Workflow

### 1. Project Setup
```bash
npm install
# Set up environment variables
# Configure database connection
# Run database migrations if needed
```

### 2. Development Server
```bash
npm run start:dev
```

### 3. Database Setup
- Ensure MongoDB server is running
- Configure MongoDB connection in `config/datasource.ts`

### 4. Adding New Features
1. Create DTOs for validation
2. Create/update Mongoose models if database changes needed
3. Implement controller methods
4. Add routes
5. Create views if needed
6. Add middleware if required

## Best Practices

### Security
- Use helmet for security headers
- Implement proper authentication and authorization
- Validate all input using DTOs
- Use parameterized queries (Mongoose handles this)
- Implement CORS and HPP protection

### Error Handling
- Use try-catch blocks in controllers
- Return consistent error responses
- Log errors appropriately
- Handle database connection errors

### Code Organization
- Keep controllers focused on handling requests/responses
- Use meaningful variable and function names
- Group related functionality together
- Follow TypeScript best practices

### Performance
- Use MongoDB indexing where appropriate
- Use connection pooling for database connections
- Optimize database queries
- Implement proper session management

## Testing Structure (Recommended)
```
tests/
├── unit/
│   ├── controllers/
│   ├── models/
│   └── utils/
├── integration/
│   └── routes/
└── fixtures/
    └── test-data.ts
```

## Deployment Considerations
- Use environment-specific configuration
- Implement proper logging
- Configure reverse proxy (nginx)
- Use PM2 for process management
- Set up monitoring and health checks
- Ensure MongoDB security and backups

---

**Note**: This structure is specifically designed for the Suggesto application - a suggestion management system that allows users to create applications and collect feedback/suggestions from their users. The architecture can be adapted for similar web applications requiring user authentication, content management, and structured data relationships.
