const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        this.pool.on('error', (err) => {
            console.error('Erro inesperado no pool do banco:', err);
        });
    }

    async init() {
        try {
            // Criar tabelas se não existirem
            const schema = fs.readFileSync(
                path.join(__dirname, '../database/schema.sql'),
                'utf8'
            );

            // Dividir em comandos individuais
            const commands = schema.split(';').filter(cmd => cmd.trim());

            for (const command of commands) {
                await this.pool.query(command);
            }

            console.log('✅ Banco de dados inicializado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar banco:', error);
            throw error;
        }
    }

    // Criar ou atualizar usuário
    async createOrUpdateUser(telegramId, username, firstName, lastName) {
        const query = `
            INSERT INTO users (telegram_id, username, first_name, last_name, last_active)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (telegram_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                last_active = CURRENT_TIMESTAMP,
                total_downloads = users.total_downloads + 1
            RETURNING *
        `;

        const values = [telegramId, username, firstName, lastName];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Registrar download
    async registerDownload(userId, url, filename, fileSize, fileType, status = 'pending', errorMessage = null) {
        const query = `
            INSERT INTO downloads (user_id, url, filename, file_size, file_type, status, error_message)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [userId, url, filename, fileSize, fileType, status, errorMessage];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Atualizar status do download
    async updateDownloadStatus(downloadId, status, errorMessage = null) {
        const query = `
            UPDATE downloads 
            SET status = $1, 
                error_message = $2,
                downloaded_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;

        const values = [status, errorMessage, downloadId];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Obter usuário
    async getUser(telegramId) {
        const query = 'SELECT * FROM users WHERE telegram_id = $1';
        const result = await this.pool.query(query, [telegramId]);
        return result.rows[0] || null;
    }

    // Obter usuário por ID interno do BD
    async getUserById(userId) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await this.pool.query(query, [userId]);
        return result.rows[0] || null;
    }

    // Verificar se usuário é um administrador
    async isAdmin(telegramId) {
        const adminEnvIds = process.env.ADMIN_IDS ?
            process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) :
            [];
        if (adminEnvIds.includes(telegramId)) {
            return true;
        }

        try {
            const query = 'SELECT 1 FROM admins WHERE telegram_id = $1';
            const result = await this.pool.query(query, [telegramId]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Erro ao verificar administrador no BD:', error);
            return false;
        }
    }

    // Verificar se usuário está banido
    async isUserBanned(telegramId) {
        const user = await this.getUser(telegramId);
        return user ? user.is_banned : false;
    }

    // Obter histórico de downloads do usuário
    async getUserHistory(telegramId, limit = 10) {
        const query = `
            SELECT d.*, u.username, u.first_name
            FROM downloads d
            JOIN users u ON d.user_id = u.id
            WHERE u.telegram_id = $1
            ORDER BY d.downloaded_at DESC
            LIMIT $2
        `;

        const result = await this.pool.query(query, [telegramId, limit]);
        return result.rows;
    }

    // Obter estatísticas gerais
    async getStats() {
        const query = 'SELECT * FROM stats LIMIT 1';
        const result = await this.pool.query(query);
        return result.rows[0] || { total_downloads: 0, total_failed: 0, total_size_bytes: 0 };
    }

    // Obter top usuários
    async getTopUsers(limit = 5) {
        const query = `
            SELECT telegram_id, username, first_name, total_downloads
            FROM users
            WHERE total_downloads > 0
            ORDER BY total_downloads DESC
            LIMIT $1
        `;

        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }

















    // Adicionar ao arquivo database.js existente

    // Registrar download de vídeo
    async registerVideoDownload(userId, url, title, platform, filename, fileSize, fileType, duration, quality, format, status = 'pending') {
        const query = `
            INSERT INTO video_downloads (user_id, url, title, platform, filename, file_size, file_type, duration, quality, format, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [userId, url, title, platform, filename, fileSize, fileType, duration, quality, format, status];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Atualizar status do download de vídeo
    async updateVideoDownloadStatus(downloadId, status, errorMessage = null) {
        const query = `
            UPDATE video_downloads 
            SET status = $1, 
                error_message = $2,
                downloaded_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;

        const values = [status, errorMessage, downloadId];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Obter histórico de downloads de vídeo do usuário
    async getUserVideoHistory(telegramId, limit = 10) {
        const query = `
            SELECT vd.*, u.username, u.first_name
            FROM video_downloads vd
            JOIN users u ON vd.user_id = u.id
            WHERE u.telegram_id = $1
            ORDER BY vd.downloaded_at DESC
            LIMIT $2
        `;

        const result = await this.pool.query(query, [telegramId, limit]);
        return result.rows;
    }

    // Adicionar à fila de download
    async addToQueue(userId, url, type = 'video', options = {}) {
        const query = `
            INSERT INTO download_queue (user_id, url, type, options, status, priority)
            VALUES ($1, $2, $3, $4, 'queued', 0)
            RETURNING *
        `;

        const result = await this.pool.query(query, [userId, url, type, options]);
        return result.rows[0];
    }

    // Obter próximo da fila
    async getNextFromQueue() {
        const query = `
            SELECT * FROM download_queue
            WHERE status = 'queued'
            ORDER BY priority DESC, created_at ASC
            LIMIT 1
        `;

        const result = await this.pool.query(query);
        return result.rows[0] || null;
    }

    // Atualizar status da fila
    async updateQueueStatus(queueId, status, startedAt = null, completedAt = null) {
        const query = `
            UPDATE download_queue 
            SET status = $1,
                started_at = COALESCE($2, started_at),
                completed_at = COALESCE($3, completed_at)
            WHERE id = $4
            RETURNING *
        `;

        const values = [status, startedAt, completedAt, queueId];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }








































    // Limpar downloads antigos (30 dias)
    async cleanOldDownloads(days = 30) {
        // Limpar downloads normais
        const queryDownloads = `
            DELETE FROM downloads 
            WHERE downloaded_at < NOW() - INTERVAL '${days} days'
        `;
        // Limpar downloads de vídeo
        const queryVideoDownloads = `
            DELETE FROM video_downloads
            WHERE downloaded_at < NOW() - INTERVAL '${days} days'
        `;
        // Limpar fila de downloads resolvida
        const queryQueue = `
            DELETE FROM download_queue
            WHERE completed_at < NOW() - INTERVAL '${days} days'
            OR (status = 'failed' AND created_at < NOW() - INTERVAL '${days} days')
        `;

        const res1 = await this.pool.query(queryDownloads);
        const res2 = await this.pool.query(queryVideoDownloads);
        await this.pool.query(queryQueue);

        return (res1.rowCount || 0) + (res2.rowCount || 0);
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = new Database();