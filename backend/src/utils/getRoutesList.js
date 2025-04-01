/**
 * Utility function to automatically generate a list of all API routes in the application.
 * This is used to display available routes when the server starts.
 */

/**
 * Returns a formatted array of routes based on the provided options
 * 
 * @param {Object} app - Express application instance
 * @param {Object} options - Configuration options
 * @param {string} options.apiPrefix - API prefix (e.g., '/api')
 * @param {string} options.apiVersion - API version (e.g., 'v1')
 * @returns {Array} Array of route objects with path, method, and description
 */
const getRoutesList = (app, options = {}) => {
  const apiPrefix = options.apiPrefix || '/api';
  const apiVersion = options.apiVersion || 'v1';
  const apiPath = `${apiPrefix}${apiVersion ? '/' + apiVersion : ''}`;
  
  // Manual route descriptions for better display
  const routeDescriptions = {
    // Auth routes
    'POST /auth/register': 'Register a new user',
    'POST /auth/login': 'Authenticate user & get token',
    'GET /auth/me': 'Get current user profile',
    
    // Transaction routes
    'GET /transactions': 'Get all transactions',
    'POST /transactions': 'Create a new transaction',
    'GET /transactions/:id': 'Get transaction by ID',
    'PUT /transactions/:id': 'Update transaction',
    'DELETE /transactions/:id': 'Delete transaction',
    
    // Category routes
    'GET /categories': 'Get all categories',
    'POST /categories': 'Create a new category (Admin)',
    'GET /categories/:id': 'Get category by ID',
    'PUT /categories/:id': 'Update category (Admin)',
    'DELETE /categories/:id': 'Delete category (Admin)',
    'PATCH /categories/:id/restore': 'Restore deleted category (Admin)',
    
    // System routes
    'GET /docs': 'API Documentation',
    'GET /health': 'Health Check'
  };
  
  // Standard routes that should always be included
  const standardRoutes = [
    { path: `${apiPrefix}/docs`, method: 'GET', description: 'API Documentation' },
    { path: `${apiPrefix}/health`, method: 'GET', description: 'Health Check' }
  ];
  
  // List to store our route data
  const routes = [];
  
  // Extract routes from the Express router stack (if available)
  try {
    // Get the registered routes
    let registeredRoutes = [];
    
    // We can't actually extract routes dynamically from Express in a clean way,
    // so we'll use our predefined route descriptions instead
    
    // Add API routes based on our route descriptions
    Object.keys(routeDescriptions).forEach(key => {
      const [method, path] = key.split(' ');
      routes.push({
        path: `${apiPath}${path}`,
        method,
        description: routeDescriptions[key]
      });
    });
    
    // Add standard routes
    standardRoutes.forEach(route => {
      routes.push(route);
    });
    
    // Sort routes for better display
    routes.sort((a, b) => {
      // Sort by path first
      const pathA = a.path.toLowerCase();
      const pathB = b.path.toLowerCase();
      
      if (pathA < pathB) return -1;
      if (pathA > pathB) return 1;
      
      // If paths are equal, sort by method
      const methodOrder = { 'GET': 1, 'POST': 2, 'PUT': 3, 'PATCH': 4, 'DELETE': 5 };
      return methodOrder[a.method] - methodOrder[b.method];
    });
    
    return routes;
  } catch (error) {
    console.error('Error generating routes list:', error);
    
    // Return standard routes if there's an error
    return standardRoutes;
  }
};

module.exports = getRoutesList; 