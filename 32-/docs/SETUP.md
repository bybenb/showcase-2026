# Setup Sayllingo (Versão Ultra-Leve)

## 📋 Pré-requisitos

### Requerido
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 8GB RAM mínimo
- 20GB espaço em disco (para Ollama + modelos)

### Opcional (Desenvolvimento Local)
- Python 3.11+
- Dart 3.0+ e Flutter 3.0+
- PostgreSQL Client
- Redis CLI

## 🚀 Quick Start com Docker Compose

### 1. Clone o repositório
```bash
git clone https://github.com/bybenb/sayllingo.git
cd sayllingo
```

### 2. Crie arquivo .env
```bash
# Backend
DATABASE_URL=postgresql://sayllingo:sayllingo_dev@postgres:5432/sayllingo_db
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin_dev
OLLAMA_BASE_URL=http://ollama:11434
ENVIRONMENT=development
```

### 3. Inicie os containers
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 4. Aguarde o Ollama baixar Llama 3 (primeira vez leva tempo)
```bash
# Verificar status do Ollama
docker logs sayllingo-ollama

# Puxar modelo Llama 3 (se necessário)
docker exec sayllingo-ollama ollama pull llama2
```

### 5. Inicialize o banco de dados Airflow
```bash
docker exec sayllingo-airflow-webserver airflow db init
docker exec sayllingo-airflow-webserver airflow users create \
    --username admin \
    --firstname Admin \
    --lastname User \
    --role Admin \
    --email admin@example.com \
    --password admin123
```

### 6. Acesse os serviços

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| FastAPI Docs | http://localhost:8000/docs | N/A |
| Airflow | http://localhost:8080 | admin / admin123 |
| MinIO | http://localhost:9001 | minioadmin / minioadmin_dev |
| PostgreSQL | localhost:5432 | sayllingo / sayllingo_dev |
| Redis | localhost:6379 | N/A |
| Ollama | http://localhost:11434 | N/A |

## 💻 Setup Desenvolvimento Local (Backend)

### 1. Crie ambiente virtual
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 2. Instale dependências
```bash
pip install -r requirements.txt

# Baixe modelo spaCy
python -m spacy download pt_core_news_sm
python -m spacy download en_core_web_sm
```

### 3. Execute migrações
```bash
alembic upgrade head
```

### 4. Inicie servidor FastAPI
```bash
uvicorn app.main:app --reload --port 8000
```

API estará disponível em `http://localhost:8000`

## 📱 Setup Desenvolvimento Local (Frontend)

### 1. Instale Flutter
```bash
# Verifique instalação
flutter --version

# Atualize Flutter
flutter upgrade
```

### 2. Crie novo projeto Flutter
```bash
cd frontend
flutter create .
# ou use o pubspec.yaml existente:
flutter pub get
```

### 3. Configure arquivo de ambientes
```dart
// lib/core/constants/env.dart
class Environment {
  static const String API_BASE_URL = 'http://localhost:8000';
  static const String OLLAMA_BASE_URL = 'http://localhost:11434';
}
```

### 4. Execute em modo de desenvolvimento
```bash
# Web
flutter run -d chrome

# Mobile (requer emulador/dispositivo)
flutter run
```

## 🔧 Airflow Setup

### 1. Inicialize banco de dados Airflow
```bash
docker exec sayllingo-airflow-webserver airflow db init
```

### 2. Crie usuário admin
```bash
docker exec sayllingo-airflow-webserver airflow users create \
    --username admin \
    --firstname Admin \
    --lastname User \
    --role Admin \
    --email admin@example.com \
    --password admin123
```

### 3. Acesse Airflow UI
Navegue para http://localhost:8080

### 4. Crie DAGs

Exemplos de DAGs em `airflow/dags/`:

```python
# airflow/dags/fsrs_update.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

default_args = {
    'owner': 'sayllingo',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'fsrs_update_dag',
    default_args=default_args,
    description='Update FSRS states daily',
    schedule_interval='0 2 * * *',  # 2 AM daily
    start_date=datetime(2024, 1, 1),
)

def update_fsrs_states():
    # Logic to update FSRS states
    pass

task = PythonOperator(
    task_id='update_fsrs',
    python_callable=update_fsrs_states,
    dag=dag,
)
```

## 📦 MinIO Setup

### 1. Crie buckets
```bash
# Usar MinIO Client (mc)
mc alias set minio http://localhost:9000 minioadmin minioadmin_dev

# Crie buckets necessários
mc mb minio/exercises-audio
mc mb minio/exercises-images
mc mb minio/user-avatars
mc mb minio/course-materials
```

### 2. Configure políticas de acesso
```bash
# Permita leitura pública de imagens
mc policy set public minio/exercises-images
```

## 🗄️ PostgreSQL Setup

### 1. Conecte ao banco
```bash
psql -h localhost -U sayllingo -d sayllingo_db
```

### 2. Verifique tabelas
```sql
\dt auth.*
\dt courses.*
\dt learning.*
```

### 3. Adicione dados de teste
```sql
-- Inserir curso de exemplo
INSERT INTO courses.courses (id, title, description, language_from, language_to, difficulty_level)
VALUES (
    uuid_generate_v4(),
    'English for Beginners',
    'Learn English from Portuguese',
    'pt_BR',
    'en_US',
    'beginner'
);
```

## 🧪 Testes

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd frontend
flutter test
```

## 🐛 Troubleshooting

### Ollama não baixa modelo
```bash
# Verifique logs
docker logs sayllingo-ollama

# Aumente timeout de pull
docker exec sayllingo-ollama ollama pull llama2 --timeout 300
```

### Airflow não inicia
```bash
# Reinicie webserver
docker restart sayllingo-airflow-webserver

# Verifique logs
docker logs sayllingo-airflow-webserver
```

### Conexão PostgreSQL falha
```bash
# Teste conexão
docker exec sayllingo-postgres psql -U sayllingo -d sayllingo_db -c "SELECT 1;"
```

### MinIO não accessible
```bash
# Verifique se container está rodando
docker ps | grep minio

# Reinicie MinIO
docker restart sayllingo-minio
```

## 📝 Próximos Passos

1. ✅ Docker Compose configurado
2. ⬜ Implementar modelos e schemas de banco
3. ⬜ Criar endpoints FastAPI
4. ⬜ Integrar Ollama para geração de conteúdo
5. ⬜ Implementar algoritmo FSRS
6. ⬜ Criar UI Flutter
7. ⬜ Integrar NLP (spaCy)
8. ⬜ Configurar DAGs Airflow

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique logs dos containers: `docker logs <container-name>`
2. Verifique variáveis de ambiente
3. Reinicie os containers: `docker-compose down && docker-compose up -d`

---

**Atualizado**: 2026-02-17
