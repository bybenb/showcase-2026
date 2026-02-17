#!/bin/bash
# Script de teste da API Sayllingo
# Use: bash test_api.sh (Linux/Mac) ou powershell no Windows

echo "🧪 Testando API Sayllingo..."
echo ""

API="http://localhost:5000"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. TESTE: Registrar Novo Usuário${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

curl -X POST $API/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "test123",
    "full_name": "Test User"
  }' | jq .

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. TESTE: Login${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TOKEN=$(curl -s -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }' | jq -r '.access_token')

echo "Token obtido: ${TOKEN:0:20}..."
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. TESTE: Obter Dados do Usuário Autenticado${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

curl -H "Authorization: Bearer $TOKEN" \
  $API/api/auth/me | jq .

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. TESTE: Listar Cursos${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

COURSES=$(curl -s $API/api/courses | jq '.[] | .id' | head -1 | tr -d '"')
echo "Cursos disponíveis:"
curl $API/api/courses | jq .

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. TESTE: Obter Detalhes de um Curso (se existir)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ ! -z "$COURSES" ]; then
  echo "Obtendo detalhes do curso: $COURSES"
  curl -H "Authorization: Bearer $TOKEN" \
    $API/api/courses/$COURSES | jq .
else
  echo "⚠️  Nenhum curso disponível. Execute 'python seed.py' para popular dados."
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. TESTE: Leaderboard${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

curl $API/api/users/leaderboard | jq .

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. TESTE: Progresso do Usuário${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

curl -H "Authorization: Bearer $TOKEN" \
  $API/api/users/me/progress | jq .

echo ""
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "Para mais testes, veja docs/SETUP.md"
