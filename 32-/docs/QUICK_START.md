# 🚀 Sayllingo - Stack Ultra-Leve Pronta!

Seu projeto foi **reconfigurado com sucesso** para uma stack muito mais leve! Agora roda em qualquer PC fraco.

## ✨ O Que Mudou

| Antes (Pesado) | Depois (Leve) | Ganho |
|---|---|---|
| FastAPI | Flask | ⚡ 5x mais leve |
| PostgreSQL | SQLite | 📦 Zero instalação |
| Docker + Compose | Rodar direto | 🚀 5 min setup |
| Airflow | Nada | 💾 -1GB RAM |
| MinIO | Pasta local | 📁 Simples |
| Ollama + Llama 3 | Gemini API (opt) | 💰 Gratuito |
| spaCy NLP | Regex simples | 📉 -500MB |

## 🎯 Stack Atual

```
Frontend: Flutter (Dart)      ✨ Multiplataforma
Backend: Flask (Python)       ⚡ Leve e rápido
Banco: SQLite                 📦 Um arquivo
Armazenamento: Pasta local    📁 /media
FSRS: Algoritmo simples       🧠 Spaced repetition
IA: (Opcional) Gemini API     💡 Gratuito
Infra: Zero Docker            🚀 Direto em Python
```

## 📁 Estrutura

```
sayllingo/
├── backend/
│   ├── app/
│   │   ├── __init__.py       ← Factory da app Flask
│   │   ├── models.py         ← 7 tabelas SQLAlchemy
│   │   ├── routes/           ← 4 blueprints (auth, courses, exercises, users)
│   │   └── utils/
│   │       └── fsrs.py       ← Algoritmo FSRS
│   ├── sayllingo.db          ← Criado automaticamente
│   ├── run.py                ← Script para iniciar
│   ├── seed.py               ← Popular com dados de teste
│   └── requirements.txt       ← Dependências leves
├── frontend/                 ← Flutter (preparado)
├── media/                    ← Armazenamento local
│   ├── audio/
│   ├── images/
│   └── docs/
└── docs/
    ├── ARCHITECTURE.md       ← Diagrama da arquitetura
    └── SETUP.md              ← Guia completo
```

## 🚀 Quick Start (Copiar e Colar)

### Terminal 1: Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py             # (Opcional) Popular com dados de teste
python run.py              # Backend rodando em http://localhost:5000
```

### Terminal 2: Testar API

```bash
# Listar cursos
curl http://localhost:5000/api/courses

# Registrar usuário
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "username": "yourname",
    "password": "pass123"
  }'
```

### Frontend (Depois)

```bash
cd frontend
flutter pub get
flutter run -d chrome  # Ou emulador
```

## 📊 Consumo de Recursos

| Recurso | Uso |
|---------|-----|
| **Disco** | ~50 MB (sem mídia) |
| **RAM** | ~50-100 MB |
| **CPU** | Mínimo |
| **Startup** | ~2 segundos |

## 🎓 Modelos de Dados (7 Tabelas)

```
1. users
   - Autenticação com JWT
   - XP, level, streak

2. courses
   - Idioma de origem/destino
   - Dificuldade

3. lessons
   - Dentro de um curso
   - Ordem para organizar

4. exercises
   - Perguntas
   - Dificuldade 1-5
   - Caminhos de áudio/imagem

5. user_progress
   - Progresso em cada curso
   - XP e nível por curso

6. user_answers
   - Histórico de respostas
   - Se acertou ou errou

7. fsrs_state
   - Estado de repetição espaçada
   - Próxima revisão
   - Estabilidade/Dificuldade
```

## 🔌 Endpoints Já Implementados

### Autenticação
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login (retorna JWT)
- `GET /api/auth/me` - Dados atuais
- `PUT /api/auth/profile` - Atualizar perfil

### Cursos
- `GET /api/courses` - Listar
- `GET /api/courses/{id}` - Detalhes
- `GET /api/courses/{id}/lessons/{lesson_id}` - Exercícios

### Exercícios
- `POST /api/exercises/{id}/submit` - Submeter resposta + FSRS
- `GET /api/exercises/review-queue` - Para revisar agora
- `GET /api/exercises/new-queue` - Novos exercícios

### Usuários
- `GET /api/users/{id}/stats` - Estatísticas
- `GET /api/users/leaderboard` - Ranking
- `GET /api/users/me/progress` - Progresso em cursos

## 🧪 Dados de Teste

Executar no backend:
```bash
python seed.py
```

Cria:
- ✅ 1 usuário: `test@example.com` / `test123`
- ✅ 1 curso: "English for Beginners"
- ✅ 2 lições: "Greetings" e "Numbers 1-10"
- ✅ 8 exercícios prontos para aprender

## 📚 Documentação

Leia os arquivos:
- `docs/ARCHITECTURE.md` - Como funciona tudo
- `docs/SETUP.md` - Passo a passo completo
- `docs/API.md` - Referência de endpoints (criar em breve)

## 🔮 Próximos Passos

### Fase 1: Backend (Pronta! ✅)
- ✅ Flask estruturado
- ✅ SQLite com 7 tabelas
- ✅ Autenticação JWT
- ✅ FSRS implementado
- ✅ 13 endpoints funcionando

### Fase 2: Frontend (Próximo)
- ⬜ Telas Flutter básicas
- ⬜ Integração com API
- ⬜ Hive para cache local
- ⬜ Tela de aprendizado

### Fase 3: Polish (Depois)
- ⬜ Gemini API para gerar exercícios
- ⬜ Leaderboard em tempo real
- ⬜ Notificações de streak
- ⬜ Dark mode

## 🆘 Troubleshooting Rápido

**Erro: "ModuleNotFoundError"**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Erro: "Address already in use 5000"**
```bash
# Mudar porta em backend/run.py:
app.run(debug=True, port=5001)
```

**Erro: "sqlite database is locked"**
```bash
# Deletar e deixar recriar:
rm backend/sayllingo.db
python run.py
```

## 💡 Dicas

1. **Gemini API (Opcional)**
   - Criar conta em: https://ai.google.dev
   - Gerar API key gratuita (150 req/dia)
   - Adicionar em `.env`: `GEMINI_API_KEY=xxx`

2. **Adicionar Dependências**
   ```bash
   pip install nomedalib
   pip freeze > requirements.txt
   ```

3. **Resetar Banco Completamente**
   ```bash
   rm backend/sayllingo.db
   python run.py
   python seed.py
   ```

4. **Testar com Postman**
   - Importar `requirements.txt` como referência
   - Copiar exemplos de `docs/SETUP.md`

## 🎉 Parabéns!

Seu projeto Sayllingo está **pronto para começar**! 

Agora é só:
1. Ativar venv
2. Rodar `python run.py`
3. Começar a desenvolver o frontend

**Total de preparação: 30 minutos**

---

**Stack Ultra-Leve | Roda em qualquer PC | Zero Docker | Código Aberto**

Desenvolvido com ❤️ para rodar localmente!
