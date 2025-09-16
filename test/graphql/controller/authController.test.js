require('dotenv').config();
const chai = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const { startServer } = require('../../../src/graphql/app');
let app;
const UserModel = require('../../../src/models/userModel');

const { expect } = chai;

describe('GraphQL Auth', () => {
    before(async () => {
        app = await startServer();
    });

    afterEach(() => {
        sinon.restore();
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
            sinon.stub(UserModel, 'findByEmail').returns(null);
            const createUserStub = sinon.stub(UserModel, 'createUser').returns({ id: 1, email: 'testuser@example.com' });

            const res = await request(app)
                .post('/graphql')
                .send({
                    query: registerMutation,
                    variables: {
                        input: { email: 'testuser@example.com', password: 'password123' }
                    }
                });

            expect(res.body.data.register.message).to.equal('Usuário cadastrado com sucesso');
            expect(createUserStub.calledOnce).to.be.true;
        });

        it('should return error if email already exists', async () => {
            sinon.stub(UserModel, 'findByEmail').returns({ id: 1, email: 'testuser@example.com' });

            const res = await request(app)
                .post('/graphql')
                .send({
                    query: registerMutation,
                    variables: {
                        input: { email: 'testuser@example.com', password: 'password123' }
                    }
                });

            expect(res.body.errors[0].message).to.equal('O usuário já existe');
        });

        it('should validate required fields with GraphQL schema', async () => {
            const res = await request(app)
                .post('/graphql')
                .send({
                    query: registerMutation,
                    variables: {
                        input: {}
                    }
                });

            expect(res.body.errors[0].message).to.include('Field "email" of required type "String!" was not provided');
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
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = { id: 1, email: 'testuser@example.com', password: hashedPassword };

            sinon.stub(UserModel, 'findByEmail').returns(user);

            const res = await request(app)
                .post('/graphql')
                .send({
                    query: loginMutation,
                    variables: {
                        input: { email: 'testuser@example.com', password: 'password123' }
                    }
                });

            expect(res.body.data.login).to.have.property('token');
        });

        it('should return error for invalid credentials (user not found)', async () => {
            sinon.stub(UserModel, 'findByEmail').returns(null);

            const res = await request(app)
                .post('/graphql')
                .send({
                    query: loginMutation,
                    variables: {
                        input: { email: 'wronguser@example.com', password: 'password123' }
                    }
                });

            expect(res.body.errors[0].message).to.equal('Credenciais inválidas');
        });

        it('should return error for invalid credentials (wrong password)', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = { id: 1, email: 'testuser@example.com', password: hashedPassword };

            sinon.stub(UserModel, 'findByEmail').returns(user);

            const res = await request(app)
                .post('/graphql')
                .send({
                    query: loginMutation,
                    variables: {
                        input: { email: 'testuser@example.com', password: 'wrongpassword' }
                    }
                });

            expect(res.body.errors[0].message).to.equal('Credenciais inválidas');
        });
    });
});
