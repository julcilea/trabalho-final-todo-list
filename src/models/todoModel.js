let todos = [];
let nextTodoId = 1;

const create = (todo) => {
  const newTodo = {
    id: nextTodoId++,
    ...todo,
    completed: false,
    createdAt: new Date(),
  };
  todos.push(newTodo);
  return newTodo;
};

const findAllByUserId = (userId) => {
  return todos.filter(todo => todo.userId === userId);
};

const findByIdAndUserId = (id, userId) => {
  return todos.find(t => t.id === id && t.userId === userId);
};

const findIndexByIdAndUserId = (id, userId) => {
  return todos.findIndex(t => t.id === id && t.userId === userId);
};

const update = (index, newTodoData) => {
  const todo = todos[index];

  const updatedTodo = {
    ...todo,
    ...newTodoData,
  };

  todos[index] = updatedTodo;
  return updatedTodo;
};

const remove = (index) => {
  todos.splice(index, 1);
};

const clear = () => {
  todos.length = 0;
  nextTodoId = 1;
};

module.exports = {
  create,
  findAllByUserId,
  findByIdAndUserId,
  findIndexByIdAndUserId,
  update,
  remove,
  clear
};
