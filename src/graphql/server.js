require('dotenv').config();
const { startServer } = require('./app');

const PORT = process.env.GRAPHQL_PORT;

startServer().then(app => {
    app.listen(PORT, () => {
        console.log(`🚀 GraphQL Server running at http://localhost:${PORT}/graphql`);
    });
});
