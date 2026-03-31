# 1️⃣ Clone ou copie a estrutura acima para um diretório, por exemplo:
mkdir -p /home/user/api && cd /home/user/api

# 2️⃣ Crie os arquivos conforme os caminhos absolutos mostrados.

# 3️⃣ Instale as dependências
npm install

# 4️⃣ Copie o .env.example para .env e ajuste os valores
cp .env.example .env
# Edite .env (por ex.: nano .env) e coloque um JWT_SECRET forte.

# 5️⃣ Inicie a API
npm run dev   # usa nodemon (recarrega ao salvar)
# ou
npm start     # modo produção simples