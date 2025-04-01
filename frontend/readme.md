# 💰 Moment Frontend

A modern financial management platform built with React, TypeScript, and TailwindCSS that helps users track expenses and build better financial habits.

## 📑 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [State Management](#state-management)
- [API Communication](#api-communication)
- [Authentication Implementation](#authentication-implementation)
- [UI Framework](#ui-framework)
- [Forms and Validation](#forms-and-validation)
- [Common Tasks](#common-tasks)
- [Testing](#testing)
- [Optimization](#optimization)
- [Browser Compatibility](#browser-compatibility)
- [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🔍 Overview

The Moment frontend is a React-based web application that provides a user-friendly interface for managing personal finances. It connects to the Moment API backend to store and retrieve financial data securely. The frontend features a responsive design, rich interactive components, and a comprehensive dashboard for financial insights.

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16.x or higher)
- npm (version 7.x or higher)
- A running instance of the Moment backend API

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NojinNojs/moment.git
   cd moment/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   > Note: We use `--legacy-peer-deps` flag to resolve some dependency conflicts with shadcn/ui components.

3. **Set up environment variables**
   ```bash
   npm run setup-env
   ```
   
   This script automatically:
   - Creates `.env.local` for development
   - Sets up necessary API configuration
   - Guides you through the setup process

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to http://localhost:5173

### Environment Setup

The frontend uses multiple environment files:

- `.env.local` - Development variables (created by setup-env script)
- `.env.production` - Production variables
- `.env.example` - Template with example values

Key environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api/v1` |
| `VITE_APP_NAME` | Application name | `Moment` |
| `VITE_ENABLE_ANALYTICS` | Toggle analytics | `false` |
| `VITE_ENABLE_DARK_MODE` | Default theme setting | `true` |
| `VITE_MAX_UPLOAD_SIZE` | Maximum file upload size | `5242880` |

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks
- `npm run lint:fix` - Fix linting issues automatically
- `npm run test` - Run tests with Jest and React Testing Library
- `npm run test:coverage` - Run tests with coverage report
- `npm run setup-env` - Set up environment variables interactively

## 📂 Project Structure

```
frontend/
├── src/                  # Source code
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   │   ├── assets/   # Asset management components
│   │   │   ├── common/   # Common dashboard components
│   │   │   └── transactions/ # Transaction management components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Base UI components (shadcn/ui)
│   ├── contexts/         # React Context providers
│   │   ├── AuthContext.tsx  # Authentication context
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts    # Authentication hook
│   │   └── ...
│   ├── lib/              # Utilities and helpers
│   │   ├── utils.ts      # Common utilities
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   └── ...
│   ├── services/         # API and other services
│   │   ├── api.ts        # API service
│   │   └── ...
│   ├── types/            # TypeScript type definitions
│   │   ├── transactions.ts # Transaction-related types
│   │   └── ...
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── scripts/              # Utility scripts
│   └── setup-env.js      # Environment setup script
├── index.html            # HTML entry point
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.js        # Vite configuration
```

### Key Directories and Files

- **`components/`**: Contains all reusable UI components
  - Organized by feature/domain
  - Each component has its own directory with styles and tests
- **`contexts/`**: React Context providers for state management
- **`hooks/`**: Custom React hooks for shared logic
- **`pages/`**: Page components that represent routes
- **`services/`**: API and external service integrations
- **`types/`**: TypeScript type definitions shared across the application
- **`lib/`**: Utility functions and helpers

## 🧩 Key Components

### Dashboard Components

- **`Dashboard.tsx`**: Main dashboard layout
- **`Overview.tsx`**: Financial overview with charts and stats
- **`Transactions.tsx`**: Transaction management interface
- **`Assets.tsx`**: Asset management interface

### Transaction Components

- **`TransactionList.tsx`**: Displays transaction history with filtering
- **`TransactionItem.tsx`**: Individual transaction display
- **`TransactionForm.tsx`**: Form for creating/editing transactions
- **`TransactionDetails.tsx`**: Detailed view of transaction information

### Asset Components

- **`AssetList.tsx`**: Displays user's financial accounts
- **`AssetForm.tsx`**: Form for adding/editing assets
- **`AssetTransferModal.tsx`**: Interface for transferring between assets

### UI Components

We use shadcn/ui, a collection of reusable components built with Radix UI and styled with Tailwind CSS:

- **`Button`**: Styled button with variants
- **`Card`**: Container component with consistent styling
- **`Dialog`**: Modal dialogs for user interactions
- **`Dropdown`**: Menu for selection from options
- **`Tabs`**: Tabbed interface for organizing content

## 🔄 State Management

The application uses React Context API for global state management:

- **`AuthContext`**: Handles user authentication state
  - Manages current user data
  - Provides login, logout, and registration functions
  - Handles token storage and renewal
- **`ThemeContext`**: Manages application theme (light/dark)
  - Detects system preferences
  - Allows manual theme switching
  - Persists user preferences
- **`SidebarContext`**: Controls sidebar state in responsive layouts
  - Manages open/closed state
  - Handles responsive behavior

For local state, we primarily use React's `useState` and `useReducer` hooks. Complex component state uses `useReducer` for better maintainability.

### State Management Best Practices

- Keep global state minimal and focused
- Use context for cross-component shared data
- Prefer lifting state up for closely related components
- Use local component state for UI-specific concerns
- Implement custom hooks to encapsulate state logic

## 🌐 API Communication

Communication with the backend is centralized through the API service:

```typescript
// src/services/api.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized errors
    if (error.response && error.response.status === 401) {
      // Redirect to login or refresh token
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Example methods
const apiService = {
  // Auth
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  // Transactions
  getTransactions: async (params) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  
  // Assets
  getAssets: async () => {
    const response = await api.get('/assets');
    return response.data;
  },
  
  // ... more methods
};

export default apiService;
```

### API Communication Best Practices

- Use interceptors for common behavior
- Implement consistent error handling
- Add type safety to API responses
- Create domain-specific service methods
- Handle loading and error states
- Implement request caching where appropriate
- Use authentication headers automatically

## 🔐 Authentication Implementation

Authentication is implemented using JWT tokens:

### Auth Flow

1. User submits login/register form
2. Credentials are sent to the backend via API
3. Backend validates and returns JWT token
4. Token is stored in localStorage
5. Token is attached to subsequent API requests
6. Protected routes check auth state
7. Token is refreshed automatically when necessary

### Auth Context

```typescript
// src/contexts/AuthContext.tsx (simplified)
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const res = await apiService.getProfile();
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    const res = await apiService.login(email, password);
    localStorage.setItem('auth_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected Routes

```typescript
// src/components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : null;
};
```

### Token Management

- Tokens are stored in localStorage for persistence
- Token expiration is handled automatically
- Refresh tokens are used for longer sessions
- Security measures are implemented to prevent token theft

## 🎨 UI Framework

### Tailwind CSS

We use Tailwind CSS for styling, with a custom theme configuration:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* custom colors */ },
        secondary: { /* custom colors */ },
        // ... other color extensions
      },
      // ... other theme extensions
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

### Shadcn/UI Components

We use shadcn/ui, which provides unstyled, accessible components that integrate with Tailwind CSS:

- Components are located in `src/components/ui/`
- These components are customized to match our application's design system
- They provide consistent styling and behavior
- Built on top of Radix UI primitives for accessibility

### Design System

- **Typography**: Consistent text styles (headings, body, etc.)
- **Colors**: Custom color palette with semantic naming
- **Spacing**: Consistent spacing scale
- **Components**: Reusable UI components with variants
- **Icons**: Consistent icon system using Lucide React
- **Animations**: Subtle animations for better UX

## 📝 Forms and Validation

Forms are implemented using React Hook Form with Zod validation:

```typescript
// Example form implementation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema
const transactionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  amount: z.string().refine(val => !isNaN(parseFloat(val)), 'Amount must be a number'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  // ... more fields
});

// Use in component
const TransactionForm = () => {
  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      title: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    },
  });
  
  const onSubmit = async (data) => {
    try {
      await apiService.createTransaction(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

### Form Best Practices

- Use Zod schemas for validation
- Implement client-side validation before submission
- Show clear error messages
- Disable the submit button when the form is invalid or submitting
- Use proper input types for better mobile experience
- Implement form state persistence for complex forms
- Use proper accessibility attributes

## 📋 Common Tasks

### Adding a New Page

1. Create a new file in the appropriate directory in `src/pages/`
2. Implement the page component
3. Add the route in `App.tsx`

Example:
```typescript
// src/pages/dashboard/Reports.tsx
import { DashboardLayout } from '@/components/layout';

export default function Reports() {
  return (
    <DashboardLayout>
      <h1>Financial Reports</h1>
      {/* Page content */}
    </DashboardLayout>
  );
}

// In App.tsx
<Route path="/dashboard/reports" element={
  <ProtectedRoute>
    <Reports />
  </ProtectedRoute>
} />
```

### Adding a New API Service Method

1. Open `src/services/api.ts`
2. Add the new method to the `apiService` object

Example:
```typescript
// Add to apiService object
generateReport: async (params) => {
  const response = await api.get('/reports/generate', { params });
  return response.data;
},
```

### Implementing Dark Mode

The application supports dark mode using Tailwind's `dark:` variants. To toggle:

```typescript
// src/contexts/ThemeContext.tsx
const toggleTheme = () => {
  setDarkMode(prev => {
    const newMode = !prev;
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('darkMode', newMode ? 'true' : 'false');
    return newMode;
  });
};
```

### Creating a New Component

1. Create a new directory in the appropriate location in `src/components/`
2. Create the component file, along with any necessary styles
3. Export the component for use elsewhere

Example:
```typescript
// src/components/dashboard/ReportCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

export function ReportCard({ title, value, icon, change }: ReportCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${change.type === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
            {change.type === 'increase' ? '↑' : '↓'} {change.value}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

## 🧪 Testing

We use React Testing Library and Jest for testing:

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- -t "component name"
```

### Testing Approach

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **Mock Services**: Use Jest mocks for API services
- **Test Utilities**: Custom testing utilities for common patterns

Example test:
```typescript
// src/components/TransactionItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionItem } from './TransactionItem';

describe('TransactionItem', () => {
  const mockTransaction = {
    id: '123',
    title: 'Groceries',
    amount: 59.99,
    date: '2023-04-01',
    category: { name: 'Food', color: '#00FF00' }
  };

  it('renders transaction details correctly', () => {
    render(<TransactionItem transaction={mockTransaction} />);
    
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<TransactionItem transaction={mockTransaction} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByLabelText('Edit transaction'));
    expect(onEdit).toHaveBeenCalledWith('123');
  });
});
```

## ⚡ Optimization

- **Code Splitting**: We use React's lazy loading to split code by routes
- **Memoization**: Components use `useMemo` and `useCallback` for optimization
- **Bundle Analysis**: Run `npm run analyze` to analyze the bundle size
- **Image Optimization**: We use Vite's built-in image optimization
- **Tree Shaking**: Unused code is removed during the build process
- **Dynamic Imports**: Large libraries are loaded on demand
- **Component Profiling**: React DevTools profiler identifies performance bottlenecks

### Performance Best Practices

- Avoid unnecessary re-renders with memoization
- Use virtualized lists for large datasets
- Optimize images and assets
- Implement proper loading states
- Use code splitting for large components
- Minimize CSS and JavaScript
- Use web workers for CPU-intensive tasks

## 🌐 Browser Compatibility

The application supports all modern browsers:

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome for Android)

We use browserslist to configure supported browsers for transpilation.

## ♿ Accessibility

The application follows WCAG 2.1 AA guidelines:

- Proper semantic HTML
- Keyboard navigation
- Screen reader support
- Sufficient color contrast
- Focus management
- ARIA attributes where necessary
- Skip links for keyboard users

We use Radix UI primitives which provide robust accessibility support out of the box.

## ❓ Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check if backend is running
   - Verify API URL in environment variables
   - Check network tab for specific errors
   - Verify CORS settings on the backend

2. **Component Rendering Issues**
   - Check console for errors
   - Verify that data is available before rendering
   - Use React DevTools to inspect component state
   - Check for missing key props in lists

3. **Authentication Problems**
   - Clear localStorage and retry
   - Check network requests for token issues
   - Verify token expiration settings
   - Ensure the backend auth endpoints are working

4. **Build Failures**
   - Clear node_modules and reinstall dependencies
   - Check for TypeScript errors
   - Ensure all required environment variables are set
   - Verify that imported modules exist

5. **Styling Issues**
   - Check for conflicting Tailwind classes
   - Verify that Tailwind is properly configured
   - Check for CSS specificity issues
   - Verify that the correct theme is applied

### Debugging Process

1. Check the browser console for errors
2. Use React DevTools to inspect component state
3. Check network requests in the Network tab
4. Add logging at key points in the code
5. Use breakpoints for step-by-step debugging
6. Isolate the issue by removing code until it works

## 👥 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the project's code style and naming conventions
4. Run linting checks before submitting: `npm run lint`
5. Run tests to ensure your changes work: `npm run test`
6. Submit a pull request with a clear description of changes

### Coding Guidelines

- Use TypeScript for all new code
- Follow the established component structure
- Add proper typing for all variables and functions
- Write JSDoc comments for public functions and components
- Keep components focused and reusable
- Follow the existing naming conventions
- Write tests for new functionality
- Ensure accessibility for all new components

For more detailed contribution guidelines, please refer to the project's [CONTRIBUTING.md](../CONTRIBUTING.md).

---

© 2023 Moment Financial. All rights reserved.
