# Backend Starter Project

A RESTful API starter project with Express.js, MongoDB, and JWT authentication.

## Features

- Express.js server setup
- MongoDB database connection
- JWT Authentication
- Environment configuration
- Error handling middleware
- API documentation endpoint
- Vercel deployment ready

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middlewares/    # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   ├── app.js          # Express setup
│   └── server.js       # Server entry point
├── .env.dev           # Development environment variables
├── .env.prod          # Production environment variables
├── .env.dev.example   # Example development environment variables
├── .env.prod.example  # Example production environment variables
├── .gitignore         # Git ignore file
├── package.json       # Project dependencies
├── README.md          # Project documentation
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment files:
   - Copy `.env.dev.example` to `.env.dev`
   - Copy `.env.prod.example` to `.env.prod`
   - Update the environment variables in both `.env.dev` and `.env.prod`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

Required environment variables:
- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT

## License

MIT 