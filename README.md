# API de Lista de Tarefas (To-Do List)

Este projeto oferece tanto uma API RESTful quanto uma API GraphQL, ambas construídas com Node.js e autenticação baseada em JWT. As APIs fornecem funcionalidades para registro de usuário, login e gerenciamento de tarefas (CRUD).

Ambas as APIs foram projetadas com uma estrutura separada (`app.js` e `server.js`) para facilitar os testes com ferramentas como o Supertest.

## Funcionalidades

-   Registro de novos usuários.
-   Login de usuários com retorno de token JWT.
-   Autenticação de rotas via JWT.
-   Operações de CRUD (Criar, Ler, Atualizar, Deletar) para tarefas.
-   Cada usuário só pode gerenciar suas próprias tarefas.
-   Documentação da API com Swagger, disponível em `/api-docs`.

## Tecnologias Utilizadas

### API REST
-   Node.js
-   Express
-   JSON Web Token (JWT)
-   bcryptjs (para hash de senhas)
-   Swagger (para documentação)
-   Dotenv (para gerenciamento de variáveis de ambiente)

### API GraphQL
-   Apollo Server 4
-   GraphQL
-   Express
-   JSON Web Token (JWT)
-   bcryptjs (para hash de senhas)


## Configuração e Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/julcilea/trabalho-final-todo-list.git
    cd trabalho-final-todo-list
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis. Você pode usar o arquivo `.env.example` como base.
    ```
    # Porta do servidor
    # Portas dos servidores
    PORT=3000           # API REST
    GRAPHQL_PORT=4000   # API GraphQL

    # Configuração do JWT
    JWT_SECRET=sua-chave-secreta-super-segura
    JWT_EXPIRES_IN=1h
    ```
    > **IMPORTANTE:** Altere o valor de `JWT_SECRET` para uma chave forte e única em um ambiente de produção.

## Como Executar a API

-   **Para desenvolvimento (com auto-reload):**
    O `nodemon` irá reiniciar o servidor automaticamente a cada alteração nos arquivos.
    ```bash
    npm run dev
    ```

-   **Para produção:**
    ```bash
    npm start
    ```

Os servidores estarão em execução em:
- API REST: `http://localhost:3000`
- API GraphQL: `http://localhost:4000/graphql`

## Testes

O projeto utiliza **Mocha**, **Chai**, **Supertest** e **Sinon** para testes de integração e de unidade dos controllers, tanto para a API REST quanto para a API GraphQL.

-   **Mocha**: Test runner.
-   **Chai**: Biblioteca de asserção.
-   **Supertest**: Para realizar requisições HTTP às APIs.
-   **Sinon**: Para criar stubs e mocks nos testes.

### Executando os Testes

Para executar os testes, você pode usar os seguintes comandos:

#### API REST
```bash
# Testes dos controllers
npm run test-rest-controller

# Testes de integração
npm run test-rest-external
```

#### API GraphQL
```bash
# Testes dos controllers
npm run test-graphql-controller

# Testes de integração
npm run test-graphql-external
```
-   **Sinon**: Para criar stubs e mocks, isolando os controllers dos models e middlewares.

Para rodar todos os testes, execute o seguinte comando:

```bash
npm test
```

## Documentação da API (Swagger)

Após iniciar o servidor, a documentação interativa da API estará disponível em:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Endpoints da API

### Autenticação

-   `POST /auth/register`: Registra um novo usuário.
-   `POST /auth/login`: Realiza o login e retorna um token JWT.

### Tarefas (To-Dos) - *Requer Autenticação*

-   `GET /todos`: Lista todas as tarefas do usuário autenticado.
-   `POST /todos`: Cria uma nova tarefa.
-   `GET /todos/{id}`: Obtém uma tarefa específica.
-   `PUT /todos/{id}`: Atualiza uma tarefa específica.
-   `DELETE /todos/{id}`: Deleta uma tarefa específica.

Para acessar os endpoints de tarefas, você deve incluir o token JWT no cabeçalho `Authorization` da requisição:

`Authorization: Bearer <seu-token-jwt>`