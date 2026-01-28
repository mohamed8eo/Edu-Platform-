# Edu-Platform - Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

This project is the backend for a robust and scalable educational platform, built with the [NestJS](https://nestjs.com/) framework. It provides a comprehensive set of features for managing users, courses, categories, and tracking user progress. The API is designed to be secure, efficient, and easy to use, with features like authentication, authorization, and detailed traffic logging.

## Core Features

- **User Management**: Secure user authentication and management, including sign-up, sign-in, and profile updates, with avatar generation via DiceBear and storage on Cloudinary.
- **Course & Lesson Management**: Create, update, and delete courses and lessons, with support for YouTube playlists and videos (fetching details and duration via YouTube Data API).
- **Category Management**: Organize courses into a hierarchical structure of categories, with CRUD operations and the ability to fetch courses by category.
- **Progress Tracking**: Users can mark lessons as completed, and the system automatically tracks course progress and status.
- **Admin Dashboard**: Endpoints for administrators to monitor daily traffic, top visited endpoints, slowest endpoints, error statistics, and active users. Admins can also ban/unban users.
- **Secure API**: Role-based access control to protect routes and ensure data privacy, utilizing `better-auth` for robust authentication.
- **Traffic Logging**: Detailed logging of API requests, including method, path, status code, duration, IP, user agent, and user ID.

---

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better-Auth](https://better-auth.com/)
- **API Documentation**: [Swagger](https://swagger.io/)
- **Media Management**: [Cloudinary](https://cloudinary.com/)
- **Email Services**: [Resend](https://resend.com/)
- **Avatar Generation**: [DiceBear](https://www.dicebear.com/)
- **Video Data**: [YouTube Data API](https://developers.google.com/youtube/v3)
- **Utilities**: `slugify`, `class-validator`, `class-transformer`, `rxjs`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v16 or higher recommended)
- [Yarn](https://yarnpkg.com/) (or npm)
- [PostgreSQL](https://www.postgresql.org/download/)
- A [Google Cloud Project](https://cloud.google.com/docs/get-started) with the YouTube Data API enabled to fetch video/playlist information.
- A [Cloudinary account](https://cloudinary.com/console) for image storage.
- A [Resend account](https://resend.com/signup) for email services.

### Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/Edu-Platform-.git
    cd Edu-Platform-
    ```

2.  **Install dependencies:**

    ```bash
    yarn install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory and add the following variables:

    ```env
    DATABASE_URL="postgresql://user:password@host:port/database"
    YT_API_KEY="your_youtube_data_api_key"
    RESEND_API_KEY="your_resend_api_key"
    RESEND_FROM_EMAIL="noreply@yourdomain.com"
    CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
    DEFAULT_BAN_DURATION="86400" # Default ban duration in seconds (e.g., 1 day)
    PORT=3000 # Optional: Port for the application to listen on
    ```

4.  **Run database migrations:**

    ```bash
    yarn drizzle-kit generate
    ```

    _Note: You might need to run `yarn drizzle-kit push:pg` or similar commands depending on your Drizzle setup to apply migrations._

### Running the Application

-   **Development mode (with watch):**

    ```bash
    yarn start:dev
    ```

-   **Production mode:**

    ```bash
    yarn build
    yarn start:prod
    ```

### API Documentation

API documentation is generated using **Swagger** and is available at the `/api` endpoint when the application is running.

-   **Base URL**: `http://localhost:3000`
-   **Swagger UI**: `http://localhost:3000/api`

---

## Testing

-   **Run unit tests:**

    ```bash
    yarn test
    ```

-   **Run end-to-end (e2e) tests:**

    ```bash
    yarn test:e2e
    ```

-   **Generate a test coverage report:**
    ```bash
    yarn test:cov
    ```

## Project Structure

The project follows a modular structure typical for NestJS applications:

```
Edu-Platform-/
├── src/
│   ├── app.module.ts          # Main application module
│   ├── main.ts                # Application entry point
│   ├── auth/                  # Authentication module (sign-up, sign-in, OTP, password reset)
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   ├── categorie/             # Course category management module
│   │   ├── categorie.controller.ts
│   │   ├── categorie.module.ts
│   │   ├── categorie.service.ts
│   │   └── dto/
│   ├── course/                # Course and lesson management module
│   │   ├── course.controller.ts
│   │   ├── course.module.ts
│   │   ├── course.service.ts
│   │   └── dto/
│   ├── db/                    # Database connection and Drizzle schema
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── lib/                   # Shared libraries, e.g., BetterAuth instance
│   │   └── auth.ts
│   ├── traffic/               # API traffic logging and admin monitoring
│   │   ├── traffic.controller.ts
│   │   ├── traffic.middleware.ts
│   │   ├── traffic.module.ts
│   │   ├── traffic.service.ts
│   │   └── dto/
│   └── user/                  # User profile management and course enrollment
│       ├── user.controller.ts
│       ├── user.module.ts
│       ├── user.service.ts
│       └── dto/
├── .env.example               # Example environment variables (create .env from this)
├── cloudinary.config.ts       # Cloudinary configuration
├── drizzle.config.ts          # Drizzle ORM configuration
├── nest-cli.json              # NestJS CLI configuration
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── yarn.lock                  # Yarn lock file

```

## Deployment

The project is configured for deployment with standard Node.js deployment practices. For NestJS specific deployment considerations, refer to the [NestJS Deployment Guide](https://docs.nestjs.com/deployment).

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
