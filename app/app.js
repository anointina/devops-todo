// Enhanced DevOps Todo Application Backend
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// Serve static UI from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// In-memory todos with enhanced structure
let todos = [
  {
    id: 1,
    text: 'Welcome to your enhanced DevOps Todo App! 🚀',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    text: 'This app demonstrates modern DevOps practices',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    text: 'Try the new features: edit, delete, and filters!',
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextId = 4;

// Validation middleware
const validateTodo = (req, res, next) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ 
      error: 'Text is required and must be a string' 
    });
  }
  
  if (text.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Text cannot be empty' 
    });
  }
  
  if (text.length > 200) {
    return res.status(400).json({ 
      error: 'Text cannot exceed 200 characters' 
    });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API endpoints
app.get('/todos', (req, res) => {
  try {
    // Support query parameters for filtering
    const { completed, limit, offset } = req.query;
    let filteredTodos = [...todos];
    
    // Filter by completion status
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      filteredTodos = filteredTodos.filter(todo => todo.completed === isCompleted);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit) || filteredTodos.length;
    const offsetNum = parseInt(offset) || 0;
    
    const paginatedTodos = filteredTodos.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      todos: paginatedTodos,
      total: filteredTodos.length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// For backward compatibility, also support direct array response
app.get('/todos/simple', (req, res) => {
  res.json(todos);
});

app.post('/todos', validateTodo, (req, res) => {
  try {
    const { text, completed = false } = req.body;
    const now = new Date().toISOString();
    
    const todo = {
      id: nextId++,
      text: text.trim(),
      completed: Boolean(completed),
      createdAt: now,
      updatedAt: now
    };
    
    todos.push(todo);
    
    console.log(`Created todo: ${todo.text}`);
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single todo
app.get('/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update todo
app.put('/todos/:id', validateTodo, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const { text, completed } = req.body;
    const now = new Date().toISOString();
    
    todos[todoIndex] = {
      ...todos[todoIndex],
      text: text.trim(),
      completed: completed !== undefined ? Boolean(completed) : todos[todoIndex].completed,
      updatedAt: now
    };
    
    console.log(`Updated todo ${id}: ${todos[todoIndex].text}`);
    res.json(todos[todoIndex]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Patch todo (partial update)
app.patch('/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const { text, completed } = req.body;
    const now = new Date().toISOString();
    
    // Validate text if provided
    if (text !== undefined) {
      if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text must be a non-empty string' });
      }
      if (text.length > 200) {
        return res.status(400).json({ error: 'Text cannot exceed 200 characters' });
      }
      todos[todoIndex].text = text.trim();
    }
    
    // Update completed status if provided
    if (completed !== undefined) {
      todos[todoIndex].completed = Boolean(completed);
    }
    
    todos[todoIndex].updatedAt = now;
    
    console.log(`Patched todo ${id}`);
    res.json(todos[todoIndex]);
  } catch (error) {
    console.error('Error patching todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete todo
app.delete('/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const deletedTodo = todos.splice(todoIndex, 1)[0];
    
    console.log(`Deleted todo ${id}: ${deletedTodo.text}`);
    res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all completed todos
app.delete('/todos/completed/all', (req, res) => {
  try {
    const completedTodos = todos.filter(t => t.completed);
    todos = todos.filter(t => !t.completed);
    
    console.log(`Deleted ${completedTodos.length} completed todos`);
    res.json({ 
      message: `Deleted ${completedTodos.length} completed todos`,
      deletedTodos: completedTodos
    });
  } catch (error) {
    console.error('Error deleting completed todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics
app.get('/stats', (req, res) => {
  try {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    
    res.json({
      total,
      completed,
      active,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Fallback: serve index.html for other routes (SPA feel)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 DevOps Todo Server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(`📊 Stats: http://localhost:${port}/stats`);
  console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
