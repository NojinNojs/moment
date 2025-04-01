import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Only log in non-production environments
  if (mode !== 'production') {
    console.log(`Building in mode: ${mode}`);
    console.log('API URL:', env.VITE_API_URL);
    console.log('API KEY exists:', !!env.VITE_API_KEY);
  }
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Make environment variables available globally at build time
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    build: {
      chunkSizeWarningLimit: 600,
      // Remove console.log calls in production build
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-components': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip'
            ],
            'form-utils': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'animation': ['framer-motion'],
            'charts': ['recharts']
          }
        }
      }
    },
    server: {
      allowedHosts: ["4d81-120-188-65-253.ngrok-free.app"],
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  }
});
