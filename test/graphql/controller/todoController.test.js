require('dotenv').config();
const chai = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { startServer } = require('../../../src/graphql/app');
let app;
const TodoModel = require('../../../src/models/todoModel');

const { expect } = chai;

describe('GraphQL Todo', () => {
    const fakeUser = { id: 1, email: 'testuser@example.com' };
    const fakeToken = jwt.sign(fakeUser, process.env.JWT_SECRET || 'test-secret');

    before(async () => {
        app = await startServer();
    });

    beforeEach(() => {
        sinon.stub(jwt, 'verify').returns(fakeUser);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Query todos', () => {
        const todosQuery = `
      query {
        todos {
          id
          title
          description
          completed
          userId
          createdAt
        }
      }
    `;

        it('should return only todos belonging to the authenticated user', async () => {
            const userTodos = [{ id: 1, userId: fakeUser.id, title: 'User 1 Todo', completed: false, createdAt: new Date().toISOString() }];
            sinon.stub(TodoModel, 'findAllByUserId').withArgs(fakeUser.id).returns(userTodos);

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({ query: todosQuery });

            expect(res.body.data.todos).to.be.an('array').with.lengthOf(1);
            expect(res.body.data.todos[0].title).to.equal('User 1 Todo');
            expect(TodoModel.findAllByUserId.calledWith(fakeUser.id)).to.be.true;
        });
    });

    describe('Mutation createTodo', () => {
        const createTodoMutation = `
      mutation CreateTodo($input: CreateTodoInput!) {
        createTodo(input: $input) {
          id
          title
          description
          completed
          userId
        }
      }
    `;

        it('should create a new todo for the authenticated user', async () => {
            const newTodo = { title: 'New Test Todo', description: 'A description' };
            const createdTodo = { id: 10, userId: fakeUser.id, ...newTodo, completed: false, createdAt: new Date() };

            sinon.stub(TodoModel, 'create').returns(createdTodo);

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    query: createTodoMutation,
                    variables: { input: newTodo }
                });

            expect(res.body.data.createTodo.title).to.equal(newTodo.title);
            expect(res.body.data.createTodo.userId).to.equal(String(fakeUser.id));
            expect(TodoModel.create.calledWith(sinon.match({ userId: fakeUser.id, title: newTodo.title }))).to.be.true;
        });

        it('should validate required fields with GraphQL schema', async () => {
            const res = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    query: createTodoMutation,
                    variables: { input: { description: 'A description' } }
                });

            expect(res.body.errors[0].message).to.include('Field "title" of required type "String!" was not provided');
        });
    });

    describe('Mutation updateTodo', () => {
        const updateTodoMutation = `
      mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
        updateTodo(id: $id, input: $input) {
          id
          title
          description
          completed
          userId
        }
      }
    `;

        it('should update a todo successfully', async () => {
            const todoId = "1";
            const updatedData = { title: 'Updated Title', completed: true };
            const updatedTodo = { id: Number(todoId), userId: fakeUser.id, ...updatedData };

            sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(Number(todoId), fakeUser.id).returns(0);
            sinon.stub(TodoModel, 'update').returns(updatedTodo);

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    query: updateTodoMutation,
                    variables: { id: todoId, input: updatedData }
                });

            expect(res.body.data.updateTodo.title).to.equal(updatedData.title);
            expect(res.body.data.updateTodo.completed).to.be.true;
        });

        it('should return error if todo not found', async () => {
            const todoId = "99";
            sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(Number(todoId), fakeUser.id).returns(-1);

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    query: updateTodoMutation,
                    variables: { id: todoId, input: { title: 'Does not matter' } }
                });

            expect(res.body.errors[0].message).to.equal('Tarefa não encontrada');
        });
    });

    describe('Mutation deleteTodo', () => {
        const deleteTodoMutation = `
      mutation DeleteTodo($id: ID!) {
        deleteTodo(id: $id) {
          message
        }
      }
    `;

        it('should delete a todo successfully', async () => {
            const todoId = "1";
            sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(Number(todoId), fakeUser.id).returns(0);
            const removeStub = sinon.stub(TodoModel, 'remove');

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    query: deleteTodoMutation,
                    variables: { id: todoId }
                });

            expect(res.body.data.deleteTodo.message).to.equal('Tarefa excluída com sucesso');
            expect(removeStub.calledOnce).to.be.true;
        });

        it('should return error if todo not found', async () => {
            const todoId = "99";
            sinon.stub(TodoModel, 'findIndexByIdAndUserId').withArgs(Number(todoId), fakeUser.id).returns(-1);

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    query: deleteTodoMutation,
                    variables: { id: todoId }
                });

            expect(res.body.errors[0].message).to.equal('Tarefa não encontrada');
        });
    });
});
