require('dotenv').config();
const chai = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const app = require('../../../src/app');
const UserModel = require('../../../src/models/userModel');

const { expect } = chai;

describe('Auth Controller', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      sinon.stub(UserModel, 'findByEmail').returns(null);
      const createUserStub = sinon.stub(UserModel, 'createUser').returns({ id: 1, email: 'testuser@example.com' });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'testuser@example.com', password: 'password123' });

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Usuário cadastrado com sucesso');
      expect(createUserStub.calledOnce).to.be.true;
    });

    it('should return 409 if email already exists', async () => {
      sinon.stub(UserModel, 'findByEmail').returns({ id: 1, email: 'testuser@example.com' });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'testuser@example.com', password: 'password123' });

      expect(res.status).to.equal(409);
      expect(res.body.message).to.equal('O usuário já existe');
    });

    it('should return 400 if email or password are not provided', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'testuser@example.com' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Email e senha são obrigatórios');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully and return a token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = { id: 1, email: 'testuser@example.com', password: hashedPassword };

      sinon.stub(UserModel, 'findByEmail').returns(user);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'testuser@example.com', password: 'password123' });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
    });

    it('should return 401 for invalid credentials (user not found)', async () => {
      sinon.stub(UserModel, 'findByEmail').returns(null);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'wronguser@example.com', password: 'password123' });

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Credenciais inválidas');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = { id: 1, email: 'testuser@example.com', password: hashedPassword };

      sinon.stub(UserModel, 'findByEmail').returns(user);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'testuser@example.com', password: 'wrongpassword' });

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Credenciais inválidas');
    });
  });
});