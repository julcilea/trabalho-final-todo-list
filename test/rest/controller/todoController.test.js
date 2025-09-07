require('dotenv').config();
const chai = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const TodoModel = require('../../../src/models/todoModel');

const { expect } = chai;

describe('To-Do Controller', () => {
  const fakeUser = { id: 1, email: 'testuser@example.com' };

  beforeEach(() => {
    sinon.stub(jwt, 'verify').returns(fakeUser);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /todos', () => {
    it('should return only todos belonging to the authenticated user', async () => {
      const userTodos = [{ id: 1, userId: fakeUser.id, title: 'User 1 Todo' }];
      sinon.stub(TodoModel, 'findAllByUserId').withArgs(fakeUser.id).returns(userTodos);

      const res = await request(app)
        .get('/todos')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').with.lengthOf(1);
      expect(res.body[0].title).to.equal('User 1 Todo');
      expect(TodoModel.findAllByUserId.calledWith(fakeUser.id)).to.be.true;
    });
  });

  describe('POST /todos', () => {
    it('should create a new todo for the authenticated user', async () => {
      const newTodo = { title: 'New Test Todo', description: 'A description' };
      const createdTodo = { id: 10, userId: fakeUser.id, ...newTodo, completed: false, createdAt: new Date() };

      sinon.stub(TodoModel, 'create').returns(createdTodo);

      const res = await request(app)
        .post('/todos')
        .set('Authorization', 'Bearer fake-token')
        .send(newTodo);

      expect(res.status).to.equal(201);
      expect(res.body.title).to.equal(newTodo.title);
      expect(res.body.userId).to.equal(fakeUser.id);
      expect(TodoModel.create.calledWith(sinon.match({ userId: fakeUser.id, title: newTodo.title }))).to.be.true;
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/todos')
        .set('Authorization', 'Bearer fake-token')
        .send({ description: 'A description' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Titulo é obrigatório');
    });
  });

  describe('PUT /todos/:id', () => {
    it('should update a todo successfully', async () => {
      const todoId = 1;
      const updatedData = { title: 'Updated Title', completed: true };
      const updatedTodo = { id: todoId, userId: fakeUser.id, ...updatedData };

      sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(todoId, fakeUser.id).returns(0);
      sinon.stub(TodoModel, 'update').returns(updatedTodo);

      const res = await request(app)
        .put(`/todos/${todoId}`)
        .set('Authorization', 'Bearer fake-token')
        .send(updatedData);

      expect(res.status).to.equal(200);
      expect(res.body.title).to.equal(updatedData.title);
      expect(res.body.completed).to.be.true;
    });

    it('should return 404 if todo not found', async () => {
      const todoId = 99;
      sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(todoId, fakeUser.id).returns(-1);

      const res = await request(app)
        .put(`/todos/${todoId}`)
        .set('Authorization', 'Bearer fake-token')
        .send({ title: 'Does not matter' });

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Tarefa não encontrada');
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete a todo successfully', async () => {
      const todoId = 1;
      sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(todoId, fakeUser.id).returns(0);
      const removeStub = sinon.stub(TodoModel, 'remove');

      const res = await request(app)
        .delete(`/todos/${todoId}`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).to.equal(204);
      expect(removeStub.calledOnce).to.be.true;
    });

    it('should return 404 if todo not found', async () => {
      const todoId = 99;
      sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(todoId, fakeUser.id).returns(-1);

      const res = await request(app)
        .delete(`/todos/${todoId}`)
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).to.equal(404);
    });
  });
});