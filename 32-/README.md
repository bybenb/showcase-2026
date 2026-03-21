# Sayllingo - Duolingo Recriado

Uma plataforma de aprendizado de idiomas de código aberto e **ultra-leve**, construída com tecnologias simples e de custo zero - roda em qualquer PC!

## Stack 

- **Framework**: Flutter (Dart) - 
- **Gerenciamento de Estado**: Provider/Riverpod
- **Armazenamento Local**: SQLite

- **Framework**: Flask
- **ORM**: SQLAlchemy com SQLite
- **Validação**: Marshmallow
- **Autenticação**: JWT
- **API**: REST simples


## Estrutura

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

## Como Começar


Quick Start para o Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
python run.py
```

A API rodará (geralmente)  em `http://localhost:5000` 

Quick Start p'ro Frontend

```bash
cd frontend
flutter pub get
flutter run
```

##  Licença

Copyright (c) 2026-presente Beny Basawulo Kiamvu. All rights reserved.


O código, o design e os artigos neste repositório são propriedade intelectual do indivíduo mencionado acima (salvo indicação em contrário) e, portanto, NÃO podem ser copiados, modificados, sublicenciados ou redistribuídos sem autorização do autor.


---

**Desenvolvido por**: @bybenb  
**Oiça (listen)**: [@MHrap](https://youtu.be/YNOQJZ91t4A?si=JKe5GkJqVTRO1lQd&t=40)      
