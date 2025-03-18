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

### Routing and State Management
- **React Router**: For application routing
- **React Context**: For state management

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   └── ...            # Feature-specific components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and helpers
│   ├── styles/            # Global styles
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
└── ... (config files)
```

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint for code quality checks

## Contributing

When contributing to this project, please ensure you follow our code style and naming conventions. Make sure to run linting checks before submitting pull requests.
