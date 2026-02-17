# Sayllingo - Duolingo Recriado

Uma plataforma de aprendizado de idiomas de código aberto e **ultra-leve**, construída com tecnologias simples e de custo zero - roda em qualquer PC!

## 📚 Stack Tecnológico (Versão Leve)

### Frontend
- **Framework**: Flutter (Dart) - Aplicação Mobile/Web multiplataforma
- **Gerenciamento de Estado**: Provider/Riverpod
- **Armazenamento Local**: Hive/SQLite

### Backend
- **Framework**: Flask (Python 3.9+) - Rápido e simples
- **ORM**: SQLAlchemy com SQLite
- **Validação**: Marshmallow
- **Autenticação**: JWT
- **API**: REST simples

### Banco de Dados
- **Primário**: SQLite (arquivo único, sem servidor)

### Armazenamento
- **Arquivos**: Sistema de arquivos local (pasta `/media`)
- **Áudio**: MP3 local
- **Imagens**: PNG/JPG local

### Inteligência Artificial & NLP
- **Algoritmo de Repetição**: FSRS (biblioteca leve)
- **IA**: Google Gemini API (gratuita) - quando necessário
- **NLP**: Regex + processamento básico (sem spaCy)

### Infraestrutura
- **Execução**: Direto em Python (sem Docker)
- **Versionamento**: Git/GitHub

## 🏗️ Estrutura do Projeto

```
sayllingo/
├── backend/                 # Flask Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # Aplicação Flask
│   │   ├── models.py       # Modelos de banco
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Lógica de negócio
│   │   └── utils/          # Utilitários
│   ├── database.db         # SQLite (gerado ao rodar)
│   ├── run.py              # Script para executar
│   └── requirements.txt
├── frontend/                # Flutter App
│   ├── lib/
│   ├── assets/
│   └── pubspec.yaml
├── media/                   # Armazenamento local
│   ├── audio/              # Áudio dos exercícios
│   ├── images/             # Imagens
│   └── docs/               # Documentos
├── docs/                    # Documentação
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SETUP.md
└── .gitignore
```

## 🚀 Como Começar

### Pré-requisitos
- Python 3.9+ (apenas isso!)
- Git
- Navegador web (para testar API)
- Flutter SDK (para frontend)

### Quick Start Backend (30 segundos!)

```bash
# 1. Entrar pasta backend
cd backend

# 2. Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Executar servidor
python run.py
```

Pronto! API rodando em `http://localhost:5000`

### Quick Start Frontend

```bash
cd frontend
flutter pub get
flutter run
```

## 📋 Componentes Principais

### 1. **Backend (Flask)**
- API REST simples com rotas bem organizadas
- Banco de dados SQLite (um arquivo)
- Autenticação JWT básica
- Integração com Google Gemini API (quando necessário)

### 2. **Frontend (Flutter)**
- Aplicação multiplataforma
- Sincronização com backend via REST
- Armazenamento local com Hive

### 3. **FSRS (Spaced Repetition)**
- Biblioteca `fsrs-py` para calcular próxima revisão
- Simples e eficiente

### 4. **Armazenamento Local**
- Arquivos de áudio em `/media/audio`
- Imagens em `/media/images`
- Tudo no PC, sem servidor externo

### 5. **IA (Opcional via Gemini)**
- API Google Gemini (150 requisições/dia gratuitas)
- Para gerar exercícios quando necessário
- Pode pular no início

## 🔄 Fluxo de Aprendizado

1. Usuário abre app Flutter
2. Flutter conecta em `http://localhost:5000`
3. Backend busca exercício do SQLite
4. Backend retorna exercício com dados locais
5. Usuário responde
6. Backend calcula FSRS e salva no SQLite
7. App mostra próxima revisão

## 📁 Próximos Passos

1. ✅ Estrutura base do projeto leve
2. ⬜ Backend Flask com SQLite
3. ⬜ Modelos de banco (Users, Courses, Exercises)
4. ⬜ Rotas CRUD da API
5. ⬜ Autenticação JWT
6. ⬜ Integração FSRS
7. ⬜ Frontend Flutter básico
8. ⬜ Integração Gemini API (opcional)

## 🤝 Contribuindo

Este é um projeto de aprendizado. Sinta-se livre para contribuir!

## 📄 Licença

MIT License

---

**Desenvolvido por**: bybenb  
**Data**: 2026  
**Versão**: Ultra-leve (roda em qualquer PC!)
