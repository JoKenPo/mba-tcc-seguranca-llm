# Node.js JWT API (registro, login e rota protegida)

## 📋 Visão geral
Esta é uma API REST mínima construída com **Express**, que oferece:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/register` | **POST** | Cria um novo usuário (nome, e‑mail, senha). A senha é armazenada com hash **bcrypt**. |
| `/api/login`    | **POST** | Autentica o usuário e devolve um **JWT** com tempo de expiração configurável. |
| `/api/profile`  | **GET**  | Rota protegida – requer token JWT válido. Retorna os dados do usuário autenticado. |

Os usuários são mantidos **em memória** (array JavaScript). Em produção troque por um banco de dados.

## 🚀 Como executar localmente

### 1️⃣ Pré‑requisitos
- **Node.js** (versão 18 ou superior)  
- **npm** (vem com o Node)

### 2️⃣ Clonar / criar o diretório
```bash
# Crie a pasta onde desejar
mkdir -p /home/your-user/node-jwt-api
cd /home/your-user/node-jwt-api