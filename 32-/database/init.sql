-- Sayllingo - Database Schema (SQLite)
-- Este arquivo é apenas referência.
-- O banco é criado automaticamente por SQLAlchemy ao rodar o backend.

-- SQLite não suporta extensions como PostgreSQL
-- Tabelas são criadas através de models.py + SQLAlchemy

-- Referência de tabelas:
-- users: armazena usuários e autenticação
-- courses: cursos de idioma
-- lessons: lições dentro de cursos
-- exercises: exercícios dentro de lições
-- user_progress: progresso do usuário em cursos
-- user_answers: histórico de respostas
-- fsrs_state: estado de spaced repetition por exercício

-- Para resetar o banco (desenvovimento):
-- 1. Delete arquivo sayllingo.db
-- 2. Execute: python run.py
-- 3. (Opcional) Execute: python seed.py para popular com dados de teste

