# Secure Node.js authentication API

Este projeto é uma implementação de referência de uma API REST segura em Node.js com Express, focada em autenticação e prevenção de vulnerabilidades comuns.

## 🛡️ Funcionalidades de Segurança Implementadas

Como revisor de segurança, as seguintes medidas foram aplicadas ao código original para garantir robustez:

1.  **Gerenciamento de Segredos (`dotenv` + Validation)**:
    - Variáveis de ambiente não são commitadas.
    - Uso da biblioteca `zod` para **validar** a existência e a complexidade dos segredos (ex: `JWT_SECRET` deve ter min 32 chars) ao iniciar a aplicação. Se a config for insegura, o app não sobe.

2.  **Hashing de Senhas Seguro (`bcrypt`)**:
    - Uso do `bcrypt` com _salt rounds_ de 12 para tornar o hash lento e resistente a ataques de força bruta.
    - Mitigação de **Timing Attacks** no login: O sistema executa uma comparação de hash falsa mesmo quando o usuário não é encontrado, para que o tempo de resposta seja consistente.

3.  **Proteção de Headers HTTP (`helmet`)**:
    - Middleware `helmet` configurado para definir headers de segurança essenciais (HSTS, X-Frame-Options, X-Content-Type-Options, etc.).
    - Remoção do header `X-Powered-By` para não revelar a tecnologia do servidor.

4.  **Prevenção de Abuso (Rate Limiting)**:
    - `express-rate-limit` implementado. Limitadores estritos para rotas de autenticação (`/login`, `/register`) para mitigar força bruta e ataques de dicionário.
    - Limitador global para proteger a disponibilidade da API (DoS).

5.  **Autenticação JWT Robusta**:
    - Tokens assinados com algoritmo explícito (`HS256`).
    - Tempo de expiração curto (`1h`) definido.
    - Validação estrita do token no middleware.

6.  **Validação de Entrada (`zod`)**:
    - Todos os dados de entrada (`body`) são validados contra schemas estritos antes de qualquer processamento.
    - Prevenção de injeção e dados malformados.
    - Senha exige complexidade mínima (maiúsculas, minúsculas, números, especiais).

7.  **Outras Práticas**:
    - `cors` configurado para produção.
    - Limite de tamanho no body do request (`10kb`) para evitar sobrecarga de memória.
    - Tratamento de erros centralizado sem vazamento de Stack Trace para o cliente.

## 🚀 Como Executar

### Pré-requisitos

- Node.js v18+
- npm

### Instalação

```bash
# 1. Instale as dependências
npm install
```

### Configuração

O arquivo `.env` já foi criado com valores padrão para desenvolvimento. **Em produção, altere o `JWT_SECRET`!**

```env
PORT=3000
JWT_SECRET=super_secret_secure_key_change_me_in_production_at_least_32_chars
NODE_ENV=development
```

### Executando

```bash
# Modo de desenvolvimento
npm run dev

# Modo de produção
npm start
```

## 📚 Endpoints

### 1. Registrar Usuário

**POST** `/register`
Body:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### 2. Login

**POST** `/login`
Body:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

_Retorna:_ `{ "token": "eyJhbGci..." }`

### 3. Perfil (Protegido)

**GET** `/profile`
Headers:

```
Authorization: Bearer <SEU_TOKEN_AQUI>
```

## 📁 Estrutura de Arquivos

- `src/server.js`: Ponto de entrada e configuração do Express.
- `src/config/env.js`: Validação de variáveis de ambiente.
- `src/controllers/authController.js`: Lógica de negócio segura.
- `src/middleware/`: Middlewares de segurança (auth, rate limit).
