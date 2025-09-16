const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
  }

  type Todo {
    id: ID!
    title: String!
    description: String
    completed: Boolean!
    userId: ID!
    createdAt: String!
  }

  type AuthResponse {
    token: String!
  }

  type Message {
    message: String!
  }

  input RegisterInput {
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateTodoInput {
    title: String!
    description: String
  }

  input UpdateTodoInput {
    title: String
    description: String
    completed: Boolean
  }

  type Query {
    todos: [Todo!]!
  }

  type Mutation {
    register(input: RegisterInput!): Message!
    login(input: LoginInput!): AuthResponse!
    createTodo(input: CreateTodoInput!): Todo!
    updateTodo(id: ID!, input: UpdateTodoInput!): Todo!
    deleteTodo(id: ID!): Message!
  }
`;

module.exports = typeDefs;
