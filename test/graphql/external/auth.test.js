require('dotenv').config();
const chai = require('chai');
const request = require('supertest');

const { expect } = chai;
const User = require('../../../src/models/userModel');
const Todo = require('../../../src/models/todoModel');

describe('GraphQL Auth API', () => {
    const api = request(process.env.URL_BASE_GRAPHQL);

    beforeEach(() => {
        User.clear();
        Todo.clear();
    });

    describe('Mutation register', () => {
        const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          message
        }
      }
    `;

        it('should register a new user successfully', async () => {
            User.clear();
            const res = await api
                .post('/graphql')
                .send({
                    query: registerMutation,
                    variables: {
                        input: { email: `test_get_todos_${Date.now()}@teste.com`, password: "123456" }
                    }
                });

            expect(res.body.data.register.message).to.equal('Usuário cadastrado com sucesso');
        });

        it('should return error if email already exists', async () => {
            User.clear();
            const email = 'duplicate@teste.com';

            await api
                .post('/graphql')
                .send({
                    query: registerMutation,
                    variables: {
                        input: { email, password: "123456" }
                    }
                });

            const res = await api
                .post('/graphql')
                .send({
                    query: registerMutation,
                    variables: {
                        input: { email, password: "123456" }
                    }
                });

            expect(res.body.errors[0].message).to.equal('O usuário já existe');
        });

        it('should validate required fields with GraphQL schema', async () => {
            const res = await api
                .post('/graphql')
                .send({
                    query: registerMutation,
                    variables: {
                        input: { email: 'teste@teste.com' }
                    }
                });

            expect(res.body.errors[0].message).to.include('Field "password" of required type "String!" was not provided');
        });
    });

    describe('Mutation login', () => {
        const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
        }
      }
    `;

        it('should login successfully and return a token', async () => {
            User.clear();

            const email = `test_login_success_${Date.now()}@teste.com`;
            const password = '123456';

            await api
                .post('/graphql')
                .send({
                    query: `mutation Register($input: RegisterInput!) {
            register(input: $input) { message }
          }`,
                    variables: {
                        input: { email, password }
                    }
                });

            const res = await api
                .post('/graphql')
                .send({
                    query: loginMutation,
                    variables: {
                        input: { email, password }
                    }
                });

            expect(res.body.data.login).to.have.property('token');
        });

        it('should return error for invalid credentials (user not found)', async () => {
            User.clear();

            const res = await api
                .post('/graphql')
                .send({
                    query: loginMutation,
                    variables: {
                        input: { email: `nonexistent_${Date.now()}@teste.com`, password: '123456' }
                    }
                });

            expect(res.body.errors[0].message).to.equal('Credenciais inválidas');
        });

        it('should return error for invalid credentials (wrong password)', async () => {
            User.clear();

            const email = `test_login_wrong_pwd_${Date.now()}@teste.com`;
            const password = '123456';

            await api
                .post('/graphql')
                .send({
                    query: `mutation Register($input: RegisterInput!) {
            register(input: $input) { message }
          }`,
                    variables: {
                        input: { email, password }
                    }
                });

            const res = await api
                .post('/graphql')
                .send({
                    query: loginMutation,
                    variables: {
                        input: { email, password: 'wrongpassword' }
                    }
                });

            expect(res.body.errors[0].message).to.equal('Credenciais inválidas');
        });
    });
});
