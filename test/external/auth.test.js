require('dotenv').config();
const chai = require('chai');
const request = require('supertest');

const { expect } = chai;
const User = require('../../src/models/userModel');
const Todo = require('../../src/models/todoModel');

describe('Auth API', () => {
    const api = request(process.env.URL_BASE_REST);

    beforeEach(() => {
        User.clear();
        Todo.clear();
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await api
                .post('/auth/register')
                .send({ email: "teste@teste.com", password: "123456" });

            expect(res.status).to.equal(201);
        });

        it('should return 409 if email already exists', async () => {
            await api
                .post('/auth/register')
                .send({ email: 'teste@teste.com', password: '123456' });

            const res = await api
                .post('/auth/register')
                .send({ email: 'teste@teste.com', password: '123456' });

            expect(res.status).to.equal(409);
            expect(res.body.message).to.equal('O usuário já existe');
        });

        it('should return 400 if email or password are not provided', async () => {
            const res = await api
                .post('/auth/register')
                .send({ email: 'teste@teste.com' });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Email e senha são obrigatórios');
        });
    });

    describe('POST /auth/login', () => {
        const email = `test_login_${Date.now()}@teste.com`;
        const password = '123456';

        before(async () => {
            // Create a user for login tests
            await api.post('/auth/register').send({ email, password });
        });

        it('should login successfully and return a token', async () => {
            const res = await api
                .post('/auth/login')
                .send({ email, password });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('token');
        });

        it('should return 401 for invalid credentials (user not found)', async () => {
            const res = await api
                .post('/auth/login')
                .send({ email: 'wrong@teste.com', password: '123456' });

            expect(res.status).to.equal(401);
            expect(res.body.message).to.equal('Credenciais inválidas');
        });

        it('should return 401 for invalid credentials (wrong password)', async () => {
            const res = await api
                .post('/auth/login')
                .send({ email, password: 'wrongpassword' });

            expect(res.status).to.equal(401);
            expect(res.body.message).to.equal('Credenciais inválidas');
        });
    });
});
