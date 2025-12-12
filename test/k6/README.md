# K6 Performance Tests

Este diretório contém testes de performance implementados com K6 para validar a API de TODO list.

## Estrutura de Arquivos

```
test/k6/
├── README.md                          # Este arquivo
├── todo-performance-test.js           # Teste principal de performance
└── helpers/                           # Funções auxiliares reutilizáveis
    ├── getBaseUrl.js                  # Função para obter URL base
    ├── generateRandomData.js          # Geradores de dados aleatórios (Faker)
    ├── authHelper.js                  # Funções de autenticação
    └── todoHelper.js                  # Funções relacionadas a TODOs
```

## Conceitos K6 Aplicados

### 1. **Thresholds**
**Localização:** `todo-performance-test.js` (linhas 13-18)

Define os limites de performance que devem ser respeitados para o teste passar:

```javascript
thresholds: {
    http_req_failed: ['rate<0.01'],           // Menos de 1% de falhas
    http_req_duration: ['p(95)<2000'],        // 95º percentil < 2 segundos
    'todo_request_duration': ['p(95)<2000'],  // Trend específica para TODOs
}
```

---

### 2. **Checks**
**Localização:** `todo-performance-test.js` (linhas 30-32, 46-49, 61-77)

Validações de status codes e respostas esperadas em cada requisição:

**REGISTRATION Group (linhas 30-32):**
```javascript
check(registerResponse, {
    'registration status 201': (r) => r.status === 201,
});
```

**LOGIN Group (linhas 46-49):**
```javascript
check(loginResponse, {
    'login status 200': (r) => r.status === 200,
    'login response has token': (r) => authToken !== null && authToken !== undefined,
});
```

**CREATE TODO Group (linhas 61-77):**
```javascript
check(todoResponse, {
    'todo creation status 201': (r) => r.status === 201,
    'todo response has id': (r) => { /* validação */ },
    'todo response has title': (r) => { /* validação */ },
});
```

---

### 3. **Helpers**
**Localização:** Pasta `helpers/` com 4 arquivos especializados

Funções reutilizáveis para evitar duplicação de código:

#### `helpers/getBaseUrl.js`
```javascript
export function getBaseUrl() {
    return __ENV.BASE_URL || 'http://localhost:3000';
}
```
Retorna a URL base da aplicação (configurável via variável de ambiente).

#### `helpers/generateRandomData.js` (Faker)
Consolidado em um único arquivo com 4 funções de geração de dados:

```javascript
import { faker } from 'https://cdn.jsdelivr.net/npm/@faker-js/faker@8.3.1/+esm';

// Gera emails realistas
export function generateRandomEmail() {
    return faker.internet.email();
}

// Gera senhas de 12 caracteres
export function generateRandomPassword() {
    return faker.internet.password({ length: 12, memorable: false });
}

// Gera títulos de produtos
export function generateRandomTitle() {
    return faker.commerce.productName();
}

// Gera descrições de produtos
export function generateRandomDescription() {
    return faker.commerce.productDescription();
}
```

**Métodos Faker utilizados:**
- `faker.internet.email()` - Emails realistas
- `faker.internet.password()` - Senhas seguras
- `faker.commerce.productName()` - Nomes de produtos
- `faker.commerce.productDescription()` - Descrições de produtos

#### `helpers/authHelper.js`
Contém duas funções principais:
- `registerUser(email, password)` - Registra um novo usuário (gera email e senha via Faker se não fornecidos)
- `loginUser(email, password)` - Faz login e retorna o token

Ambas retornam objetos com a resposta e dados extraídos.

Importações:
```javascript
import { generateRandomEmail, generateRandomPassword } from './generateRandomData.js';
```

#### `helpers/todoHelper.js`
- `createTodo(token, title, description)` - Cria um item TODO (gera título e descrição via Faker se não fornecidos)

Importações:
```javascript
import { generateRandomTitle, generateRandomDescription } from './generateRandomData.js';
```

**Uso no teste:** `todo-performance-test.js` (linhas 4-5)
```javascript
import { registerUser, loginUser } from './helpers/authHelper.js';
import { createTodo } from './helpers/todoHelper.js';
```

---

### 4. **Trends**
**Localização:** `todo-performance-test.js` (linha 7)

Métrica customizada para monitorar especificamente o tempo de resposta do POST /todos:

```javascript
const todoDurationTrend = new Trend('todo_request_duration', true);
```

**Registro da métrica:** `todo-performance-test.js` (linha 63)
```javascript
todoDurationTrend.add(todoResponse.timings.duration);
```

---

### 5. **Variável de Ambiente** 
**Localização:** `helpers/getBaseUrl.js`

Permite configurar a URL base via linha de comando:

```bash
# Usando URL padrão
k6 run test/k6/todo-performance-test.js

# Usando URL customizada
k6 run test/k6/todo-performance-test.js --env BASE_URL=http://localhost:3001
```

A função `getBaseUrl()` é usada em todas as requisições HTTP:
- `helpers/authHelper.js`
- `helpers/todoHelper.js`

---

### 6. **Stages**
**Localização:** `todo-performance-test.js` (linhas 15-22)

Define fases de execução com escalabilidade gradual de VUs (Virtual Users), simulando padrões realistas de carga com spike testing:

```javascript
stages: [
    { duration: '3s', target: 10 },   // Ramp-up: 0 → 10 VUs em 3 segundos
    { duration: '15s', target: 10 },  // Average: Mantém 10 VUs por 15 segundos
    { duration: '2s', target: 100 },  // Spike: Pico de carga, 10 → 100 VUs em 2 segundos
    { duration: '3s', target: 100 },  // Spike: Sustenta 100 VUs por 3 segundos
    { duration: '5s', target: 10 },   // Average: Reduz para 10 VUs em 5 segundos
    { duration: '5s', target: 0 },    // Ramp-down: 10 → 0 VUs em 5 segundos
]
```

**Fases do teste:**
1. **Ramp-up (3s):** Aquecimento gradual de 0 para 10 VUs
2. **Average (15s):** Carga média sustentada com 10 VUs
3. **Spike (2s):** Pico abrupto de 10 para 100 VUs (teste de escalabilidade)
4. **Spike (3s):** Mantém a carga de pico em 100 VUs
5. **Average (5s):** Redução gradual de 100 para 10 VUs (recuperação)
6. **Ramp-down (5s):** Encerramento suave de 10 para 0 VUs

**Duração total:** 33 segundos

**Padrão simulado:** Teste realista que avalia o sistema em:
-  Aquecimento progressivo
-  Carga média sustentada
-  Picos de carga abruptos (10x a carga normal)
-  Recuperação após picos
-  Encerramento controlado

---

### 7. **Reaproveitamento de Resposta**
**Localização:** `todo-performance-test.js` (linhas 42-44, 55)

O token extraído do login é utilizado na requisição de criação de TODO:

```javascript
// Extração do token no LOGIN Group (linha 43)
const result = loginUser(registerEmail, '123456');
authToken = result.token;

// Uso do token no CREATE TODO Group (linha 55)
todoResponse = createTodo(
    authToken,  // Token reutilizado
    'Lista de compras',
    'Lista de compras do mês de dezembro'
);
```
**Localização:** `login-performance-test.js` (linhas 7-9, 34)

-  Lê o arquivo login-test-data.json com usuários pré-configurados
-  SharedArray = Compartilha dados entre todas as VUs (economiza memória)
-  Dados carregados uma única vez no início do teste

```javascript
const users = new SharedArray('users', function () {
    return JSON.parse(open('./data/login-test-data.json'));
});
```
---

### 8. **Faker**
**Localização:** `helpers/generateRandomData.js`

Integração consolidada com a biblioteca Faker.js para geração de dados realistas em um único arquivo:

```javascript
import { faker } from 'https://cdn.jsdelivr.net/npm/@faker-js/faker@8.3.1/+esm';

export function generateRandomEmail() {
    return faker.internet.email();
}

export function generateRandomPassword() {
    return faker.internet.password({ length: 12, memorable: false });
}

export function generateRandomTitle() {
    return faker.commerce.productName();
}

export function generateRandomDescription() {
    return faker.commerce.productDescription();
}
```

**Benefícios:**
-  Dados realistas para todos os campos (email, senha, título, descrição)
-  Arquivo único e bem organizado para geradores de dados
-  Fácil manutenção e reutilização
-  Reduz duplicação de código
-  Melhor para testes com dados realistas

---

### 9. **Token de Autenticação Bearer JWT**
**Localização:** 
- Extração: `helpers/authHelper.js` (linha 56)
- Uso: `helpers/todoHelper.js` (linha 20)

O token JWT é:
1. **Extraído** da resposta de login:
```javascript
const token = response.json('token');
```

2. **Utilizado** no header Authorization:
```javascript
'Authorization': `Bearer ${token}`,
```

---

### 10. **Data-Driven Testing**
**Localização:** `todo-performance-test.js` (linhas 27-89)

Cada iteração gera dados únicos:
- **Email aleatório** via `generateRandomEmail()` com Faker (linha 31)
- **Senha consistente** durante login com o mesmo email (linha 47)

- **Dados da TODO** dinâmicos e consistentes (linhas 63-67)
- **Fluxo completo** para cada usuário virtual (registro → login → criar todo)

---

### 10. **Groups**
**Localização:** `todo-performance-test.js` (linhas 27, 42, 58)

Separação lógica das ações em três grupos principais:

```javascript
group('REGISTRATION', function () {
    // Registro do usuário
});

group('LOGIN', function () {
    // Login e extração do token
});

group('CREATE TODO', function () {
    // Criação do item TODO
});
```

Cada grupo representa uma etapa do fluxo de teste.

---

## Como Executar

### Execução Básica
```bash
k6 run test/k6/todo-performance-test.js
```

O teste será executado com os stages configurados (33 segundos totais):
- **3 segundos**: 0 → 10 VUs (ramp-up)
- **15 segundos**: Mantém 10 VUs (average)
- **2 segundos**: 10 → 100 VUs (spike)
- **3 segundos**: Mantém 100 VUs (spike sustain)
- **5 segundos**: 100 → 10 VUs (recuperação)
- **5 segundos**: 10 → 0 VUs (ramp-down)

### Execução com URL Customizada
```bash
k6 run todo-performance-test.js --env BASE_URL=http://localhost:3001
```

### Exportar Resumo JSON
```bash
k6 run todo-performance-test.js --summary-export=summary.json
```

### Executar com Verbosidade
```bash
k6 run todo-performance-test.js -v
```

### Executar com Dashboard HTML e Acompanhamento em Tempo Real
```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-performance.html K6_WEB_DASHBOARD_PERIOD=2s k6 run test/k6/todo-performance-test.js
```

**O que faz:**
- `K6_WEB_DASHBOARD=true` - Ativa o dashboard web em tempo real (acesse em `http://localhost:5665` enquanto o teste executa)
- `K6_WEB_DASHBOARD_EXPORT=html-performance.html` - Exporta o relatório completo em HTML ao final do teste
- `K6_WEB_DASHBOARD_PERIOD=2s` - Atualiza o dashboard a cada 2 segundos
- Salva o arquivo `html-performance.html` na raiz do projeto para análise posterior

**Resultado:** Um arquivo HTML interativo com gráficos, métricas e análises completas do teste de performance.


---

## Estrutura de Uma Iteração

Cada VU executa o seguinte fluxo:

```
1. REGISTRO
   └─ POST /auth/register
   └─ Check: status 201
   └─ Sleep: 0.5s

2. LOGIN  
   └─ POST /auth/login
   └─ Extrai token
   └─ Checks: status 200, token existe
   └─ Sleep: 0.5s

3. CRIAR TODO
   └─ POST /todos (com Bearer token)
   └─ Registra duração na Trend
   └─ Checks: status 201, id existe, title correto
   └─ Sleep: 1s

Total por iteração: ~2.5 segundos
```

---

## Visualização dos Stages e Dashboard

### Stages do Teste

Durante a execução, você verá a escalabilidade progredindo através de 6 fases:

```
FASE 1 - Ramp-up (0-3s)
├─ 00s: 0 VUs
├─ 01s: ~3 VUs
├─ 02s: ~6 VUs
└─ 03s: 10 VUs

FASE 2 - Average (3-18s)
├─ 03s: 10 VUs (início)
├─ 10s: 10 VUs (carga média sustentada)
└─ 18s: 10 VUs (fim)

FASE 3 - Spike (18-24s)
├─ 18s: 10 VUs (início)
├─ 20s: 100 VUs ⚡ (pico de carga!)
├─ 21s: 100 VUs (sustain)
└─ 24s: 100 VUs (fim do pico)

FASE 4 - Recuperação (24-29s)
├─ 24s: 100 VUs
├─ 26s: ~55 VUs
├─ 28s: ~20 VUs
└─ 29s: 10 VUs

FASE 5 - Ramp-down (29-33s)
├─ 29s: 10 VUs
├─ 30s: ~7 VUs
├─ 31s: ~5 VUs
├─ 32s: ~2 VUs
└─ 33s: 0 VUs (fim)
```

### Dashboard HTML

Ao executar com a opção de dashboard HTML, você terá acesso a:

**Durante o teste (Web Dashboard):**
- Gráficos em tempo real de VUs, requisições, taxa de erro
- Métricas ao vivo atualizadas a cada 2 segundos
- Acompanhamento visual do progresso

**Após o teste (Relatório HTML):**
- Arquivo `html-performance.html` com análise completa
- Gráficos interativos de performance
- Detalhes de cada fase do teste
- Estatísticas de thresholds e checks
- Histórico de requisições

---

## Referências

- [Documentação K6 - Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [Documentação K6 - Checks](https://k6.io/docs/using-k6/checks/)
- [Documentação K6 - Trends](https://k6.io/docs/using-k6/metrics/custom-metrics/)
- [Documentação K6 - Groups](https://k6.io/docs/using-k6/tags-and-groups/)
- [Documentação K6 - Stages](https://k6.io/docs/using-k6/scenarios/executors/ramping-vus/)
- [Documentação K6 - Web Dashboard](https://k6.io/docs/results-output/web-dashboard/)
- [Documentação Faker.js](https://fakerjs.dev/)

---

**Última atualização:** 11 de dezembro de 2025
