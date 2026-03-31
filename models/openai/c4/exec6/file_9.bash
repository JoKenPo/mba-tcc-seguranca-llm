# Registro
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@example.com","password":"S3nh@F0rte"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"S3nh@F0rte"}' | jq -r .token)

# Perfil (autenticado)
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN"