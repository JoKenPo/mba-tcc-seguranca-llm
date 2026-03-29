# Registro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"SenhaForte123"}'

# Login (recebe token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SenhaForte123"}' | jq -r .token)

# Acesso ao profile (autenticado)
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"