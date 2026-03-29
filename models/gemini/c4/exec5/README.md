# API REST Segura com Node.js e Express

Esta é uma implementação de referência de uma API de autenticação, focada em segurança e boas práticas.

## 🛡️ Revisão de Segurança e Melhorias Aplicadas

Após uma revisão crítica, as seguintes vulnerabilidades e melhorias foram implementadas:

1.  **Proteção contra Brute Force:** Adicionado `express-rate-limit` para mitigar ataques de força bruta nos endpoints de login e registro.
2.  **Segurança de Headers:** Implementado o `helmet` para configurar headers HTTP de segurança (HSTS, CSP, XSS Filter, etc.).
3.  **Validação de Input:** Adicionada validação rigorosa de dados de entrada para evitar ataques de negação de serviço (DoS) por payloads gigantes e garantir a integridade dos dados.
4.  **Mensagens de Erro Genéricas:** O login agora retorna a mesma mensagem para "usuário não encontrado" ou "senha incorreta", impedindo a enumeração de usuários.
5.  **Segurança de Senhas:** Uso de `bcrypt` com fator de custo (salt rounds) adequado (12) para hashing lento, dificultando ataques de dicionário.
6.  **Prevenção de DoS:** Limitação do tamanho do JSON aceito pelo body-parser.
7.  **Tratamento de Erros:** Centralização do tratamento de erros para evitar vazamento de stack traces ou informações sensíveis do servidor.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js (v14 ou superior)
- NPM ou Yarn

### 2. Instalação
Crie uma pasta para o projeto e execute:
```bash
npm init -y
npm install express bcryptjs jsonwebtoken dotenv helmet express-rate-limit