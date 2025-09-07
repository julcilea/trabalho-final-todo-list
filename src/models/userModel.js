const users = [];
let nextUserId = 1;

const findByEmail = (email) => {
  return users.find(user => user.email === email);
};

const findById = (id) => {
  return users.find(user => user.id === id);
};

const createUser = (user) => {
  const newUser = { id: nextUserId++, ...user };
  users.push(newUser);
  return newUser;
};

const clear = () => {
  users.length = 0;
  nextUserId = 1;
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  users,
  clear
};
