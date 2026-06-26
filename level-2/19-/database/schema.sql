-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_downloads INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE
);

-- Tabela de downloads
CREATE TABLE IF NOT EXISTS downloads (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Tabela de estatísticas
CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY,
    total_downloads INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_downloads_downloaded_at ON downloads(downloaded_at);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Trigger para atualizar estatísticas
CREATE OR REPLACE FUNCTION update_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE stats 
        SET total_downloads = total_downloads + 1,
            total_size_bytes = total_size_bytes + COALESCE(NEW.file_size, 0),
            updated_at = CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'INSERT' AND NEW.status = 'failed' THEN
        UPDATE stats 
        SET total_failed = total_failed + 1,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_trigger
AFTER INSERT ON downloads
FOR EACH ROW
EXECUTE FUNCTION update_stats();

-- Inserir estatísticas iniciais
INSERT INTO stats (total_downloads, total_failed, total_size_bytes)
SELECT 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM stats);