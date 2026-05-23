# Forest Cloud Server

Forest Cloud is a cloud storage backend server built with NestJS, providing robust file management, user authentication, and administrative capabilities.

## 🏗 Architecture & Structure

The project follows a modular architecture with a monorepo-like structure:

- **`src/`**: Contains the main application modules.
  - `admin/`: Administrative tools for managing users.
  - `auth/`: Authentication logic (JWT & Local strategies).
  - `config/`: Environment configuration and validation (using Joi).
  - `database/`: Sequelize models and database module configuration.
  - `directories/`: Directory management logic.
  - `files/`: Core file operations (upload, download, trash, restore).
  - `logger/`: Pino-based logging configuration.
  - `multer/`: File upload handling configuration.
  - `shared-files/`: Logic for sharing files between users.
  - `users/`: User profile and basic management.
- **`libs/shared/`**: Shared resources accessible via the `@app/shared` alias.
  - `builders/`: Mappers from Models to DTOs.
  - `decorators/`: Custom NestJS decorators (e.g., `@User()`, `@AccessPermission()`).
  - `dtos/`: Shared Data Transfer Objects.
  - `enums/`: Shared enumerations (e.g., `UserRoles`, `MimeTypes`).
  - `guards/`: Security and access control guards.
  - `interceptors/`: Request/Response interceptors.
  - `services/`: Shared business logic.
  - `utils/`: Utility functions.
  - `validators/`: Custom class-validators.

## 🛠 Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) (v11)
- **Language**: TypeScript
- **Database ORM**: [Sequelize](https://sequelize.org/) with `sequelize-typescript`
- **Database**: SQLite (default configuration)
- **Logging**: [Pino](https://getpino.io/) via `nestjs-pino`
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/) (available at `/api`)
- **Security**: [Helmet](https://helmetjs.github.io/), [Passport.js](http://www.passportjs.org/) (JWT & Local)
- **Validation**: `class-validator` & `class-transformer`
- **Testing**: [Jest](https://jestjs.io/) (Unit & E2E)

## 📡 API Conventions

- **Global Prefix**: `/api`
- **Versioning**: URI-based, e.g., `/api/v1/...`
- **Authentication**: Bearer JWT token required for most endpoints.
- **Response Format**: Standard JSON responses, using DTOs for consistency.

## 💾 Data Models

- **`UserModel`**: Stores user information, roles, and access status.
- **`FileModel`**: Manages file metadata, including hierarchy (parentId), size, and trash status (paranoid deletion).
- **`SharedFilesModel`**: Tracks file sharing between users.

## 🚀 Development & Commands

- `pnpm start:dev`: Starts the server in watch mode.
- `pnpm test`: Runs unit tests.
- `pnpm test:e2e`: Runs end-to-end tests using an in-memory SQLite database.
- `pnpm migrate`: Generates a new migration script.
- `pnpm migrate:up`: Applies pending migrations.
- `pnpm lint:fix`: Runs ESLint with automatic fixes.
- `pnpm fmt`: Formats code using Prettier.

## 💡 Guidance for Gemini

1. **Follow Modular Patterns**: When adding features, create a new module in `src/` or extend existing ones.
2. **Use Shared Resources**: Always check `libs/shared` before implementing common logic (decorators, guards, DTOs).
3. **DTOs & Builders**: Use DTOs for all request/response data. Use builders in `libs/shared/src/builders` to map models to DTOs.
4. **Access Control**: Use `@AccessPermission()` and `AccessPermissionGuard` to enforce file/resource ownership.
5. **Logging**: Use the `Logger` from `@nestjs/common` or `nestjs-pino` for application logs.
6. **Error Handling**: Use standard NestJS Exceptions (`NotFoundException`, `BadRequestException`, etc.).
7. **Database**: Adhere to Sequelize patterns. Use transactions for operations involving multiple steps (e.g., file upload + directory size update).
8. **Testing**: Always include tests for new features. E2E tests are preferred for API validation.
9. **Swagger**: Keep API documentation up to date by using Swagger decorators in controllers.
