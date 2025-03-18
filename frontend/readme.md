# Moment Frontend

A financial management platform focused on helping users build better financial habits.

## Getting Started

### Prerequisites

- Node.js (version 16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/NojinNojs/moment.git
   cd moment/frontend
   ```

2. Install dependencies
   ```bash
   npm install --legacy-peer-deps
   ```
   
   > Note: We use `--legacy-peer-deps` flag to resolve some dependency conflicts.

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:5173

## Core Dependencies

### Framework
- **React** (v18.x): A JavaScript library for building user interfaces
- **TypeScript** (v5.x): Adds static typing to JavaScript for better developer experience
- **Vite** (v5.x): Next-generation frontend tooling for faster development

### UI Components and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Reusable components built with Radix UI and Tailwind
- **Framer Motion**: Animation library for React
- **Sonner**: Toast notifications

### Data Management
- **Axios**: HTTP client for API requests
- **API Service**: Custom service for backend communication

## Authentication Implementation

The frontend implements a comprehensive authentication system that communicates with the backend through our API service.

### API Service

The authentication functionality is handled by two API service implementations:

1. **Axios-based API Service** (`src/services/api.ts`):
   - Uses Axios for HTTP requests
   - Handles token storage and retrieval
   - Manages request/response interceptors
   - Provides specialized methods for authentication

2. **Fetch-based API Service** (`src/services/apiFetch.ts`):
   - Alternative implementation using the native Fetch API
   - Same functionality as the Axios version
   - Can be used as a fallback or for comparison

### Authentication Methods

Both services implement these authentication methods:

```typescript
// Login with email and password
login(email: string, password: string): Promise<ApiResponse<AuthResponse>>

// Register a new user
register(userData: { name: string; email: string; password: string }): Promise<ApiResponse<AuthResponse>>

// Get the current user's profile (authenticated)
getProfile(): Promise<ApiResponse<User>>

// Logout the current user
logout(): void
```

### Authentication Pages

The application features dedicated pages for user authentication with sophisticated form handling:

1. **Login Page** (`src/pages/Login.tsx`):
   - Integrates with the API service for user authentication
   - Implements form validation with Zod schema
   - Provides password visibility toggle
   - Displays server-side validation errors in the form
   - Shows toast notifications for success/error feedback
   - Redirects to dashboard upon successful login

2. **Registration Page** (`src/pages/Register.tsx`):
   - Multi-step registration form for improved UX
   - Advanced password requirements with visual indicators
   - Real-time client-side validation
   - Server-side validation error handling
   - Implements the complete registration flow with the backend API

### Token Management

Authentication tokens are handled automatically:

- After successful login/registration, the JWT token is stored in localStorage
- The token is automatically attached to all subsequent API requests
- When logging out, the token is removed and the user is redirected

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   └── ...            # Feature-specific components
│   ├── services/          # API and other services
│   │   ├── api.ts         # Axios-based API service
│   │   └── apiFetch.ts    # Fetch-based API service
│   ├── pages/             # Page components
│   │   ├── Login.tsx      # Login page with API integration
│   │   └── Register.tsx   # Registration page with API integration
│   ├── lib/               # Utilities and helpers
│   ├── styles/            # Global styles
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── scripts/               # Utility scripts
│   └── setup-env.js       # Environment setup script
└── ... (config files)
```

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint for code quality checks
- `npm run setup-env`: Set up environment variables for development

## Contributing

When contributing to this project, please ensure you follow our code style and naming conventions. Make sure to run linting checks before submitting pull requests.
