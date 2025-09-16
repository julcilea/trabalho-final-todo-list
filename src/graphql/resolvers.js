const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TodoModel = require('../models/todoModel');
const UserModel = require('../models/userModel');

const resolvers = {
    Query: {
        todos: async (_, __, { user }) => {
            if (!user) throw new Error('Authentication required');
            return TodoModel.findAllByUserId(user.id);
        },
    },

    Mutation: {
        register: async (_, { input }) => {
            const { email, password } = input;

            if (!email || !password) {
                throw new Error('Email e senha são obrigatórios');
            }

            const existingUser = UserModel.findByEmail(email);
            if (existingUser) {
                throw new Error('O usuário já existe');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await UserModel.createUser({ email, password: hashedPassword });
            return { message: 'Usuário cadastrado com sucesso' };
        },

        login: async (_, { input }) => {
            const { email, password } = input;

            const user = UserModel.findByEmail(email);
            if (!user) {
                throw new Error('Credenciais inválidas');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Credenciais inválidas');
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            return { token };
        },

        createTodo: async (_, { input }, { user }) => {
            if (!user) throw new Error('Authentication required');

            const { title, description } = input;
            if (!title) {
                throw new Error('Titulo é obrigatório');
            }

            return TodoModel.create({
                userId: user.id,
                title,
                description,
                completed: false,
                createdAt: new Date()
            });
        },

        updateTodo: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Authentication required');

            const todoIndex = TodoModel.findIndexByIdAndUserId(Number(id), user.id);
            if (todoIndex === -1) {
                throw new Error('Tarefa não encontrada');
            }

            return TodoModel.update(todoIndex, input);
        },

        deleteTodo: async (_, { id }, { user }) => {
            if (!user) throw new Error('Authentication required');

            const todoIndex = TodoModel.findIndexByIdAndUserId(Number(id), user.id);
            if (todoIndex === -1) {
                throw new Error('Tarefa não encontrada');
            }

            TodoModel.remove(todoIndex);
            return { message: 'Tarefa excluída com sucesso' };
        },
    },
};

module.exports = resolvers;
