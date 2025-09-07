const TodoModel = require('../models/todoModel');

exports.getTodos = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      const todoIndex = TodoModel.findIndexByIdAndUserId(parseInt(id, 10), req.user.id);
      if (todoIndex === -1) {
        return res.status(404).json({ message: 'Tarefa não encontrada' });
      }
      const todo = TodoModel.findByIdAndUserId(parseInt(id, 10), req.user.id);
      return res.status(200).json(todo);
    } else {
      const todos = TodoModel.findAllByUserId(req.user.id);
      return res.status(200).json(todos);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

exports.createTodo = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Titulo é obrigatório' });
    }

    const todo = TodoModel.create({
      title,
      description,
      userId: req.user.id
    });

    return res.status(201).json(todo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

exports.updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const todoId = parseInt(id, 10);
    const todoIndex = TodoModel.findIndexByIdAndUserId(todoId, req.user.id);

    if (todoIndex === -1) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    const updatedTodo = TodoModel.update(todoIndex, {
      title,
      description,
      completed
    });

    return res.status(200).json(updatedTodo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const todoId = parseInt(id, 10);
    const todoIndex = TodoModel.findIndexByIdAndUserId(todoId, req.user.id);

    if (todoIndex === -1) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    TodoModel.remove(todoIndex);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno no servidor' });
  }
};
