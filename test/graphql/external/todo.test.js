require('dotenv').config();
const chai = require('chai');
const request = require('supertest');

const { expect } = chai;
const User = require('../../../src/models/userModel');
const Todo = require('../../../src/models/todoModel');

describe('GraphQL Todo API', () => {
    const api = request(process.env.URL_BASE_GRAPHQL || 'http://localhost:4000/graphql');
    let token;

    before(async () => {
        User.clear();
        Todo.clear();

        const email = `test_get_todos_${Date.now()}@teste.com`;
        const password = 'password123';

        // Register
        await api.post('/graphql').send({
            query: `mutation Register($input: RegisterInput!) {
        register(input: $input) { message }
      }`,
            variables: { input: { email, password } }
        });

        // Login
        const loginRes = await api.post('/graphql').send({
            query: `mutation Login($input: LoginInput!) {
        login(input: $input) { token }
      }`,
            variables: { input: { email, password } }
        });

        token = loginRes.body.data.login.token;
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

        it('should return an array of todos for the authenticated user', async () => {
            // Create a todo first
            await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: `mutation CreateTodo($input: CreateTodoInput!) {
            createTodo(input: $input) {
              id
              title
            }
          }`,
                    variables: {
                        input: { title: 'Test Todo for GET' }
                    }
                });

            const res = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({ query: todosQuery });

            expect(res.body.data.todos).to.be.an('array');
            expect(res.body.data.todos.length).to.be.at.least(1);
            expect(res.body.data.todos[0].title).to.equal('Test Todo for GET');
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
        }
      }
    `;

        it('should create a new todo', async () => {
            const res = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: createTodoMutation,
                    variables: {
                        input: { title: 'New API Test Todo' }
                    }
                });

            expect(res.body.data.createTodo.title).to.equal('New API Test Todo');
            expect(res.body.data.createTodo.completed).to.be.false;
        });

        it('should validate required fields with GraphQL schema', async () => {
            const res = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: createTodoMutation,
                    variables: {
                        input: { description: 'No title provided' }
                    }
                });

            expect(res.body.errors[0].message).to.include('Field "title" of required type "String!" was not provided');
        });
    });

    describe('Mutation updateTodo', () => {
        let todoId;

        beforeEach(async () => {
            const createRes = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: `mutation CreateTodo($input: CreateTodoInput!) {
            createTodo(input: $input) {
              id
            }
          }`,
                    variables: {
                        input: { title: 'Todo to Update', description: 'Description' }
                    }
                });

            todoId = createRes.body.data.createTodo.id;
        });

        it('should update a todo successfully', async () => {
            const res = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: `mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
            updateTodo(id: $id, input: $input) {
              id
              title
              description
              completed
            }
          }`,
                    variables: {
                        id: todoId,
                        input: {
                            title: 'Updated Title',
                            description: 'Updated Description',
                            completed: true
                        }
                    }
                });

            expect(res.body.data.updateTodo.title).to.equal('Updated Title');
            expect(res.body.data.updateTodo.completed).to.be.true;
        });

        it('should return error if todo not found', async () => {
            const res = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: `mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
            updateTodo(id: $id, input: $input) {
              id
              title
            }
          }`,
                    variables: {
                        id: "9999",
                        input: { title: 'Does not matter' }
                    }
                });

            expect(res.body.errors[0].message).to.equal('Tarefa não encontrada');
        });
    });

    describe('Mutation deleteTodo', () => {
        it('should delete a todo successfully', async () => {
            // Create a todo first
            const createRes = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: `mutation CreateTodo($input: CreateTodoInput!) {
            createTodo(input: $input) {
              id
            }
          }`,
                    variables: {
                        input: { title: 'Todo to be deleted' }
                    }
                });

            const todoId = createRes.body.data.createTodo.id;

            const res = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: `mutation DeleteTodo($id: ID!) {
            deleteTodo(id: $id) {
              message
            }
          }`,
                    variables: { id: todoId }
                });

            expect(res.body.data.deleteTodo.message).to.equal('Tarefa excluída com sucesso');
        });

        it('should return error if todo not found', async () => {
            const res = await api
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: `mutation DeleteTodo($id: ID!) {
            deleteTodo(id: $id) {
              message
            }
          }`,
                    variables: { id: "9999" }
                });

            expect(res.body.errors[0].message).to.equal('Tarefa não encontrada');
        });
    });
});
