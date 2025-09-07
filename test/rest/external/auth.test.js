require('dotenv').config();
const chai = require('chai');
const request = require('supertest');

const { expect } = chai;
const User = require('../../../src/models/userModel');
const Todo = require('../../../src/models/todoModel');

describe('Auth API', () => {
  const api = request(process.env.URL_BASE_REST);

  beforeEach(() => {
    User.clear();
    Todo.clear();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      User.clear();
      const res = await api
        .post('/auth/register')
        .send({ email: `test_get_todos_${Date.now()}@teste.com`, password: "123456" });

      expect(res.status).to.equal(201);
      expect(res.body).to.contain.property('token');

    });

    it('should return 409 if email already exists', async () => {
      User.clear();
      await api
        .post('/auth/register')
        .send({ email: 'duplicate@teste.com', password: '123456' });

      const res = await api
        .post('/auth/register')
        .send({ email: 'duplicate@teste.com', password: '123456' });

      expect(res.status).to.equal(409);
      expect(res.body.error).to.equal('email already registered');
    });

    it('should return 400 if email or password are not provided', async () => {
      const res = await api
        .post('/auth/register')
        .send({ email: 'teste@teste.com' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('email and password are required');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully and return a token', async () => {
      User.clear();

      const email = `test_login_success_${Date.now()}@teste.com`;
      const password = '123456';

      await api
        .post('/auth/register')
        .send({ email, password });

      const res = await api
        .post('/auth/login')
        .send({ email, password });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
    });

    it('should return 401 for invalid credentials (user not found)', async () => {
      User.clear();

      const res = await api
        .post('/auth/login')
        .send({ email: `nonexistent_${Date.now()}@teste.com`, password: '123456' });

      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal('invalid credentials');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      User.clear();

      const email = `test_login_wrong_pwd_${Date.now()}@teste.com`;
      const password = '123456';

      await api
        .post('/auth/register')
        .send({ email, password });

      const res = await api
        .post('/auth/login')
        .send({ email, password: 'wrongpassword' });

      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal('invalid credentials');
    });
  });
});
