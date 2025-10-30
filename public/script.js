// Enhanced DevOps Todo Application
class TodoApp {
  constructor() {
    this.apiRoot = '/todos';
    this.todos = [];
    this.currentFilter = 'all';
    this.isLoading = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadTodos();
  }

  bindEvents() {
    // Form submission
    document.getElementById('todo-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTodo();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });

    // Clear completed button
    document.getElementById('clear-completed').addEventListener('click', () => {
      this.clearCompleted();
    });

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.loadTodos();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'Enter':
            e.preventDefault();
            document.getElementById('todo-input').focus();
            break;
        }
      }
    });
  }

  async loadTodos() {
    this.setLoading(true);
    this.hideError();

    try {
      const response = await fetch(this.apiRoot);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.todos = await response.json();
      this.renderTodos();
      this.updateStats();
      this.showToast('Tasks loaded successfully', 'success');
    } catch (error) {
      console.error('Failed to load todos:', error);
      this.showError('Failed to load tasks. Please check your connection.');
    } finally {
      this.setLoading(false);
    }
  }

  async handleAddTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (!text) {
      this.showToast('Please enter a task', 'error');
      return;
    }

    if (text.length > 200) {
      this.showToast('Task is too long (max 200 characters)', 'error');
      return;
    }

    this.setLoading(true);

    try {
      const response = await fetch(this.apiRoot, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, completed: false })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add task');
      }

      const newTodo = await response.json();
      this.todos.push(newTodo);
      
      input.value = '';
      this.renderTodos();
      this.updateStats();
      this.showToast('Task added successfully!', 'success');
      
      // Focus back to input for quick adding
      setTimeout(() => input.focus(), 100);
      
    } catch (error) {
      console.error('Failed to add todo:', error);
      this.showToast(error.message, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;

    const originalCompleted = todo.completed;
    todo.completed = !todo.completed;
    
    this.renderTodos();
    this.updateStats();

    try {
      // Simulate API call for toggle (since backend doesn't support PATCH)
      // In a real app, you'd make a PATCH request here
      this.showToast(
        todo.completed ? 'Task completed!' : 'Task marked as active',
        'success'
      );
    } catch (error) {
      // Revert on error
      todo.completed = originalCompleted;
      this.renderTodos();
      this.updateStats();
      this.showToast('Failed to update task', 'error');
    }
  }

  async deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    const todoIndex = this.todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;

    const todo = this.todos[todoIndex];
    this.todos.splice(todoIndex, 1);
    
    this.renderTodos();
    this.updateStats();

    try {
      // Simulate API call for delete (since backend doesn't support DELETE)
      // In a real app, you'd make a DELETE request here
      this.showToast('Task deleted successfully', 'success');
    } catch (error) {
      // Revert on error
      this.todos.splice(todoIndex, 0, todo);
      this.renderTodos();
      this.updateStats();
      this.showToast('Failed to delete task', 'error');
    }
  }

  editTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;

    const newText = prompt('Edit task:', todo.text);
    if (newText === null || newText.trim() === '') return;

    if (newText.trim().length > 200) {
      this.showToast('Task is too long (max 200 characters)', 'error');
      return;
    }

    const originalText = todo.text;
    todo.text = newText.trim();
    
    this.renderTodos();

    try {
      // Simulate API call for edit (since backend doesn't support PATCH)
      // In a real app, you'd make a PATCH request here
      this.showToast('Task updated successfully', 'success');
    } catch (error) {
      // Revert on error
      todo.text = originalText;
      this.renderTodos();
      this.showToast('Failed to update task', 'error');
    }
  }

  clearCompleted() {
    const completedCount = this.todos.filter(t => t.completed).length;
    
    if (completedCount === 0) {
      this.showToast('No completed tasks to clear', 'error');
      return;
    }

    if (!confirm(`Delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
      return;
    }

    this.todos = this.todos.filter(t => !t.completed);
    this.renderTodos();
    this.updateStats();
    this.showToast(`${completedCount} completed task${completedCount > 1 ? 's' : ''} deleted`, 'success');
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    this.renderTodos();
  }

  getFilteredTodos() {
    switch (this.currentFilter) {
      case 'active':
        return this.todos.filter(t => !t.completed);
      case 'completed':
        return this.todos.filter(t => t.completed);
      default:
        return this.todos;
    }
  }

  renderTodos() {
    const list = document.getElementById('todo-list');
    const empty = document.getElementById('empty');
    const filteredTodos = this.getFilteredTodos();
    
    list.innerHTML = '';
    
    if (filteredTodos.length === 0) {
      empty.style.display = 'block';
      this.updateEmptyMessage();
    } else {
      empty.style.display = 'none';
      
      filteredTodos.forEach(todo => {
        const li = this.createTodoElement(todo);
        list.appendChild(li);
      });
    }
    
    this.updateClearButton();
  }

  createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;
    
    li.innerHTML = `
      <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="app.toggleTodo(${todo.id})">
        ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
      </div>
      <span class="todo-text">${this.escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="todo-btn edit-btn" onclick="app.editTodo(${todo.id})" title="Edit task">
          <i class="fas fa-edit"></i>
        </button>
        <button class="todo-btn delete-btn" onclick="app.deleteTodo(${todo.id})" title="Delete task">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    return li;
  }

  updateStats() {
    const total = this.todos.length;
    const completed = this.todos.filter(t => t.completed).length;
    
    document.getElementById('total-count').textContent = total;
    document.getElementById('completed-count').textContent = completed;
  }

  updateEmptyMessage() {
    const empty = document.getElementById('empty');
    const emptyIcon = empty.querySelector('.empty-icon i');
    const emptyTitle = empty.querySelector('h3');
    const emptyText = empty.querySelector('p');
    
    switch (this.currentFilter) {
      case 'active':
        emptyIcon.className = 'fas fa-check-circle';
        emptyTitle.textContent = 'All tasks completed!';
        emptyText.textContent = 'Great job! You\'ve completed all your tasks.';
        break;
      case 'completed':
        emptyIcon.className = 'fas fa-clock';
        emptyTitle.textContent = 'No completed tasks';
        emptyText.textContent = 'Complete some tasks to see them here.';
        break;
      default:
        emptyIcon.className = 'fas fa-clipboard-list';
        emptyTitle.textContent = 'No tasks yet';
        emptyText.textContent = 'Add your first task above to get started!';
        break;
    }
  }

  updateClearButton() {
    const clearBtn = document.getElementById('clear-completed');
    const completedCount = this.todos.filter(t => t.completed).length;
    
    if (completedCount > 0) {
      clearBtn.style.display = 'flex';
      clearBtn.innerHTML = `<i class="fas fa-trash"></i> Clear Completed (${completedCount})`;
    } else {
      clearBtn.style.display = 'none';
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const loadingEl = document.getElementById('loading');
    const form = document.getElementById('todo-form');
    const addBtn = form.querySelector('.add-btn');
    
    if (loading) {
      loadingEl.style.display = 'block';
      addBtn.disabled = true;
      addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    } else {
      loadingEl.style.display = 'none';
      addBtn.disabled = false;
      addBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Add Task';
    }
  }

  showError(message) {
    const errorEl = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorEl.style.display = 'flex';
  }

  hideError() {
    const errorEl = document.getElementById('error-message');
    errorEl.style.display = 'none';
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    toast.innerHTML = `
      <i class="fas ${icon} toast-icon"></i>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app
const app = new TodoApp();

// Add some demo data if no todos exist
setTimeout(() => {
  if (app.todos.length === 0) {
    // Add some sample todos for demonstration
    app.todos = [
      { id: Date.now(), text: 'Welcome to your DevOps Todo App!', completed: false },
      { id: Date.now() + 1, text: 'Try adding a new task above', completed: false },
      { id: Date.now() + 2, text: 'Click the checkbox to mark tasks as complete', completed: true },
      { id: Date.now() + 3, text: 'Use the filter tabs to organize your view', completed: false }
    ];
    app.renderTodos();
    app.updateStats();
  }
}, 1000);

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}