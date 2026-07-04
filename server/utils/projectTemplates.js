// Project-specific templates to override AI generation when it fails
// This is a fallback when AI keeps generating inappropriate content

const PROJECT_TEMPLATES = {
  // Todo/Task Management Apps
  todo: {
    keywords: ['todo', 'task', 'checklist', 'reminder'],
    files: [
      { path: 'package.json', purpose: 'Project configuration and dependencies', language: 'json' },
      { path: 'backend/index.js', purpose: 'Backend server entry point', language: 'javascript' },
      { path: 'backend/routes/taskRoutes.js', purpose: 'Handles task-related routes', language: 'javascript' },
      { path: 'backend/routes/userRoutes.js', purpose: 'Handles user authentication routes', language: 'javascript' },
      { path: 'backend/models/Task.js', purpose: 'Mongoose model for tasks', language: 'javascript' },
      { path: 'backend/models/User.js', purpose: 'Mongoose model for users', language: 'javascript' },
      { path: 'backend/services/TaskService.js', purpose: 'Implements task management logic', language: 'javascript' },
      { path: 'backend/services/UserService.js', purpose: 'Implements user service logic', language: 'javascript' },
      { path: 'frontend/src/App.jsx', purpose: 'Main application component', language: 'jsx' },
      { path: 'frontend/src/components/TaskList.jsx', purpose: 'Task list component', language: 'jsx' },
      { path: 'frontend/src/components/TaskItem.jsx', purpose: 'Individual task component', language: 'jsx' },
      { path: 'frontend/src/index.js', purpose: 'Frontend entry point', language: 'javascript' }
    ]
  },

  // E-commerce Apps
  ecommerce: {
    keywords: ['shop', 'store', 'ecommerce', 'commerce', 'product', 'cart'],
    files: [
      { path: 'package.json', purpose: 'Project configuration and dependencies', language: 'json' },
      { path: 'backend/index.js', purpose: 'Backend server entry point', language: 'javascript' },
      { path: 'backend/routes/productRoutes.js', purpose: 'Handles product-related routes', language: 'javascript' },
      { path: 'backend/routes/orderRoutes.js', purpose: 'Handles order-related routes', language: 'javascript' },
      { path: 'backend/routes/userRoutes.js', purpose: 'Handles user authentication routes', language: 'javascript' },
      { path: 'backend/models/Product.js', purpose: 'Mongoose model for products', language: 'javascript' },
      { path: 'backend/models/Order.js', purpose: 'Mongoose model for orders', language: 'javascript' },
      { path: 'backend/models/User.js', purpose: 'Mongoose model for users', language: 'javascript' },
      { path: 'backend/services/ProductService.js', purpose: 'Implements product management logic', language: 'javascript' },
      { path: 'backend/services/OrderService.js', purpose: 'Implements order processing logic', language: 'javascript' },
      { path: 'frontend/src/App.jsx', purpose: 'Main application component', language: 'jsx' },
      { path: 'frontend/src/components/ProductList.jsx', purpose: 'Product listing component', language: 'jsx' },
      { path: 'frontend/src/components/Cart.jsx', purpose: 'Shopping cart component', language: 'jsx' },
      { path: 'frontend/src/index.js', purpose: 'Frontend entry point', language: 'javascript' }
    ]
  },

  // Blog Apps
  blog: {
    keywords: ['blog', 'article', 'post', 'content', 'cms'],
    files: [
      { path: 'package.json', purpose: 'Project configuration and dependencies', language: 'json' },
      { path: 'backend/index.js', purpose: 'Backend server entry point', language: 'javascript' },
      { path: 'backend/routes/articleRoutes.js', purpose: 'Handles article-related routes', language: 'javascript' },
      { path: 'backend/routes/userRoutes.js', purpose: 'Handles user authentication routes', language: 'javascript' },
      { path: 'backend/models/Article.js', purpose: 'Mongoose model for articles', language: 'javascript' },
      { path: 'backend/models/User.js', purpose: 'Mongoose model for users', language: 'javascript' },
      { path: 'backend/services/ArticleService.js', purpose: 'Implements article management logic', language: 'javascript' },
      { path: 'backend/services/UserService.js', purpose: 'Implements user service logic', language: 'javascript' },
      { path: 'frontend/src/App.jsx', purpose: 'Main application component', language: 'jsx' },
      { path: 'frontend/src/components/ArticleList.jsx', purpose: 'Article listing component', language: 'jsx' },
      { path: 'frontend/src/components/ArticleEditor.jsx', purpose: 'Article editing component', language: 'jsx' },
      { path: 'frontend/src/index.js', purpose: 'Frontend entry point', language: 'javascript' }
    ]
  }
};

function detectProjectType(projectName, projectIdea = '', projectDescription = '') {
  const searchText = `${projectName} ${projectIdea} ${projectDescription}`.toLowerCase();
  
  for (const [type, template] of Object.entries(PROJECT_TEMPLATES)) {
    if (template.keywords.some(keyword => searchText.includes(keyword))) {
      return type;
    }
  }
  
  return null;
}

function getProjectTemplate(projectName, projectIdea = '', projectDescription = '') {
  const type = detectProjectType(projectName, projectIdea, projectDescription);
  return type ? PROJECT_TEMPLATES[type] : null;
}

module.exports = {
  PROJECT_TEMPLATES,
  detectProjectType,
  getProjectTemplate
};