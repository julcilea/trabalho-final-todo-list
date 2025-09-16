const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { getUser } = require('./auth');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const app = express();
app.use(express.json());

let server;

const startServer = async () => {
    if (!server) {
        server = new ApolloServer({
            typeDefs,
            resolvers,
            formatError: (error) => {
                return {
                    message: error.message
                };
            },
        });
        await server.start();
    }

    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req }) => {
            const user = getUser(req);
            return { user };
        },
    }));

    return app;
};

// Se o arquivo for importado para testes, não inicia o servidor automaticamente
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
