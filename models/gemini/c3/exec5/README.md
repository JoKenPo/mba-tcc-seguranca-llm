# API REST Node.js Autenticada

Esta é uma API de exemplo demonstrando autenticação JWT, hashing de senhas e segurança básica.

## Como executar localmente

1. **Clone o repositório** (ou copie os arquivos).
2. **Instale as dependências**:
   ```bash
   npm install
   ```
3. **Configure o ambiente**:
   - O arquivo `.env` já foi fornecido no exemplo acima. Certifique-se de que ele existe na raiz.
4. **Inicie o servidor**:
   ```bash
   npm start
   ```
   O servidor iniciará em `http://localhost:3000`.

## Testando a API

### 1. Registrar um usuário
**POST** `/register`
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123_segura"
}