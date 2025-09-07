require('dotenv').config();
const chai = require('chai');
const request = require('supertest');

const { expect } = chai;

const User = require('../../../src/models/userModel');
const Todo = require('../../../src/models/todoModel');

describe('To-Do API', () => {
  const api = request(process.env.URL_BASE_REST);

  before(async () => {
    User.clear();
    Todo.clear();

    const email = `test_get_todos_${Date.now()}@teste.com`;
    const password = 'password123';

    await api.post('/auth/register').send({ email, password });
    const loginRes = await api.post('/auth/login').send({ email, password });
    token = loginRes.body.token;
  });


  describe('GET /todos', () => {
    it('should return an array of todos for the authenticated user', async () => {
      await api
        .post('/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Todo for GET' });

      const res = await api
        .get('/todos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0].title).to.equal('Test Todo for GET');
    });
  });

  describe('POST /todos', () => {
    it('should create a new todo', async () => {
      const newTodo = { title: 'New API Test Todo' };
      const res = await api
        .post('/todos')
        .set('Authorization', `Bearer ${token}`)
        .send(newTodo);

      expect(res.status).to.equal(201);
      expect(res.body.title).to.equal(newTodo.title);
    });

    it('should return 400 if title is missing', async () => {
      const res = await api
        .post('/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title provided' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Titulo é obrigatório');
    });
  });

  describe('PUT /todos/:id', () => {

    beforeEach(async () => {
      const newTodo = { title: 'New API Test Todo', description: 'Description' };
      const createRes = await api
        .post('/todos')
        .set('Authorization', `Bearer ${token}`)
        .send(newTodo);

      todoId = createRes.body.id;
    });

    it('should update a todo successfully', async () => {
      const updatedData = { title: 'Updated Title', description: 'Updated Description', completed: true };
      const res = await api
        .put(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);

      expect(res.status).to.equal(200);
      expect(res.body.title).to.equal(updatedData.title);
      expect(res.body.completed).to.be.true;
    });

    it('should return 404 if todo not found', async () => {
      const nonExistentId = 9999;
      const res = await api
        .put(`/todos/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Does not matter' });

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Tarefa não encontrada');
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete a todo successfully', async () => {
      const createRes = await api
        .post('/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Todo to be deleted' });

      const todoId = createRes.body.id;

      const res = await api
        .delete(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(204);
    });

    it('should return 404 if todo not found', async () => {
      const res = await api
        .delete(`/todos/9999`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Tarefa não encontrada');
    });
  });
});
