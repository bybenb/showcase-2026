# Sayllingo - ARQUITETURA (Versão Ultra-Leve)

## 1. Visão Geral

Sayllingo é uma plataforma de aprendizado de idiomas **ultra-leve** que roda em qualquer PC, sem necessidade de Docker, servidores externos ou dependências pesadas.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Flutter)                           │
│                    (Mobile/Web multiplataforma)                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    REST API + WebSockets
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                     BACKEND (FastAPI)                              │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ REST Routes │  │ WebSocket    │  │ Auth/JWT     │              │
│  │             │  │ Handlers     │  │              │              │
│  └─────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Services    │  │ Middleware   │  │ Core Config  │              │
│  │ (Business)  │  │ (CORS,Logs)  │  │              │              │
│  └─────────────┘  └──────────────┘  └──────────────┘              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┬──────────────────┐
            │                  │                  │                  │
        PostgreSQL         Redis Cache         MinIO            Ollama
        (Dados)          (Sessions)           (Storage)         (LLM)
            │                  │                  │                  │
```

## 2. Camadas da Aplicação

### 2.1 Camada de Apresentação (Frontend - Flutter)
- **Responsabilidade**: Interface do usuário
- **Componentes**:
  - Views (Telas)
  - Widgets (Componentes reutilizáveis)
  - State Management (Provider/Riverpod)
  - Navigation (GoRouter)
  - Local Storage (Hive/SharedPreferences)

### 2.2 Camada de API (Backend - FastAPI)
- **Responsabilidade**: Lógica de negócio e integração
- **Componentes**:
  - `routes/`: Endpoints da API
  - `services/`: Lógica de negócio
  - `models/`: Modelos de banco de dados
  - `schemas/`: Schemas de validação (Pydantic)
  - `core/`: Configuração e dependências
  - `middleware/`: Autenticação, logging, CORS

### 2.3 Camada de Dados (PostgreSQL)
- **Responsabilidade**: Persistência de dados
- **Estrutura**:
  - Schema `auth`: Usuários e autenticação
  - Schema `courses`: Cursos, lições, exercícios
  - Schema `learning`: Progresso do usuário, respostas, FSRS

### 2.4 Camada de Processamento (Airflow)
- **Responsabilidade**: Orquestração de pipelines de dados
- **Responsabilidades**:
  - Cálculo de FSRS para atualizar agendamentos
  - Processamento de conteúdo com NLP
  - Sincronização de dados
  - Relatórios e análises

### 2.5 Camada de IA (Ollama + Llama 3)
- **Responsabilidade**: Geração inteligente de conteúdo
- **Funcionalidades**:
  - Geração de frases de exercício
  - Análise de respostas do usuário
  - Feedback personalizado
  - Recomendações de dificuldade

### 2.6 Camada de Armazenamento (MinIO)
- **Responsabilidade**: Armazenamento de mídia
- **Tipos de arquivo**:
  - Áudio (pronuncia, frases de áudio)
  - Imagens (ícones de palavras)
  - Documentos (PDFs de lição)

## 3. Fluxos Principais

### 3.1 Fluxo de Autenticação
```
1. Usuário entra credenciais no Flutter
2. Flutter envia POST /auth/login ao Backend
3. Backend valida credenciais no PostgreSQL
4. Backend gera JWT token
5. Backend retorna token ao Flutter
6. Flutter armazena token localmente (Hive)
7. Flutter usa token em requisições subsequentes
```

### 3.2 Fluxo de Aprendizado
```
1. Usuário clica em lição no Flutter
2. Flutter requisita GET /courses/{id}/lessons/{lesson_id}
3. Backend busca exercícios no PostgreSQL
4. Backend recupera mídia do MinIO (áudio/imagens)
5. Backend retorna exercícios estruturados ao Flutter
6. Usuário completa exercício
7. Flutter envia POST /exercises/{id}/submit com resposta
8. Backend valida resposta
9. Backend chama Ollama para análise de qualidade
10. Backend atualiza estado FSRS no PostgreSQL
11. Backend retorna feedback ao Flutter
12. Airflow agenda processamento assíncrono
```

### 3.3 Fluxo FSRS (Spaced Repetition)
```
1. Usuário completa exercício
2. Backend registra resposta no PostgreSQL
3. Backend calcula novo estado FSRS (pode ser imediato ou via Airflow)
4. Estado FSRS armazena: stability, difficulty, next_review
5. Airflow periodicamente executa DAG para "revisar" exercícios vencidos
6. Flutter solicita exercícios a revisar (GET /user/review-queue)
7. Backend retorna exercícios ordenados por próxima revisão
```

### 3.4 Fluxo de Processamento NLP
```
1. Texto do exercício é criado/atualizado
2. Airflow DAG `process_exercise_content` é acionado
3. spaCy processa texto para extrair:
   - Entidades nomeadas
   - Tokens e lematização
   - Análise de sentimento
4. Resultados armazenados em coluna JSONB no PostgreSQL
5. Backend usa análise para personalizar feedback
```

## 4. Integração Ollama (Llama 3)

### Endpoints utilizados:
```
POST /api/generate          # Gerar texto
POST /api/embeddings        # Embeddings para busca semântica
GET /api/tags              # Listar modelos disponíveis
```

### Casos de uso:
1. **Geração de exercícios**
   - Prompt: "Gere 5 frases de tradução do português para inglês no nível intermediário"
   
2. **Feedback inteligente**
   - Input: resposta do usuário + resposta correta
   - Output: análise de erros e sugestões

3. **Análise de qualidade**
   - Input: respostas do usuário
   - Output: score de qualidade (1-10)

## 5. Estrutura de Dados Chave

### User
```python
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "full_name": "Nome Completo",
    "avatar_url": "https://...",
    "xp": 1500,
    "level": 3,
    "streak": 7
}
```

### Exercise
```python
{
    "id": "uuid",
    "lesson_id": "uuid",
    "exercise_type": "translation",  # translation, listening, speaking
    "question": "Translate: 'Hello'",
    "correct_answer": "Olá",
    "hints": ["É uma saudação"],
    "difficulty": 2
}
```

### FSRS State
```python
{
    "user_id": "uuid",
    "exercise_id": "uuid",
    "stability": 45.2,
    "difficulty": 5.1,
    "state": "review",
    "next_review": "2026-02-20T10:00:00Z",
    "reps": 3,
    "lapses": 0
}
```

## 6. Escalabilidade Futura

### Possíveis melhorias:
1. **Cache distribuído**: Redis para sessões e cache de exercises
2. **Message Queue**: Celery + RabbitMQ para tasks assíncroncas
3. **Database Replication**: PostgreSQL master-slave
4. **Load Balancing**: Nginx com múltiplas instâncias de Backend
5. **CDN**: CloudFlare ou similar para servir mídia (MinIO)
6. **Monitoring**: Prometheus + Grafana para métricas

## 7. Segurança

- **JWT**: Autenticação stateless com JWT
- **HTTPS**: Usar TLS em produção
- **CORS**: Whitelist de domínios no Backend
- **Rate Limiting**: Limitar requisições por IP
- **SQL Injection**: SQLAlchemy + Prepared Statements
- **XSS Protection**: Validação de input no Frontend
- **Password Hashing**: bcrypt com salt

## 8. Monitoramento e Logging

- **Logging**: Python json-logger para logs estruturados
- **Erro Tracking**: Integration com Sentry (opcional)
- **APM**: Application Performance Monitoring
- **Health Checks**: Endpoints /health em cada serviço
