const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

let todos = [];

app.get('/', (req, res) => res.send('DevOps Todo App'));
app.get('/todos', (req, res) => res.json(todos));
app.post('/todos', (req, res) => {
  const todo = { id: Date.now(), text: req.body.text || 'empty' };
  todos.push(todo);
  res.status(201).json(todo);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
