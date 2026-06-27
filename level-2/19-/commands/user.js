const { Markup } = require('telegraf');
const database = require('../utils/database');
const logger = require('../config/logger');

async function getStatsMessage() {
    const stats = await database.getStats();
    const topUsers = await database.getTopUsers(5);

    let message = `
📊 *Estatísticas do Bot*

📥 Downloads: ${stats.total_downloads}
❌ Falhas: ${stats.total_failed}
📦 Total: ${(stats.total_size_bytes / 1024 / 1024).toFixed(2)}MB
📈 Taxa de sucesso: ${stats.total_downloads + stats.total_failed > 0
            ? ((stats.total_downloads / (stats.total_downloads + stats.total_failed)) * 100).toFixed(1)
            : 0}%

🏆 *Top 5 Usuários*\n`;

    if (topUsers.length === 0) {
        message += 'Nenhum usuário ainda.';
    } else {
        topUsers.forEach((user, index) => {
            const name = user.first_name || user.username || `User ${user.telegram_id}`;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            message += `${medal} ${name} - ${user.total_downloads} downloads\n`;
        });
    }
    return message;
}

module.exports = (bot) => {
    // Comando /start
    bot.start(async (ctx) => {
        const user = await database.getUser(ctx.from.id);

        const welcomeMessage = `
🤖 *Bot de Download Profissional*

Olá ${user?.first_name || 'usuário'}! 👋

Envie qualquer link para download:
• 📁 Arquivos
• 🖼️ Imagens
• 🎬 Vídeos
• 📄 Documentos

*Comandos:*
/start - Menu principal
/help - Ajuda detalhada
/status - Status do bot
/historico - Seu histórico
/stats - Estatísticas gerais
/top - Top usuários

*Limites:*
• Tamanho: ${process.env.MAX_FILE_SIZE || 50}MB
• Tempo: ${(process.env.DOWNLOAD_TIMEOUT || 30000) / 1000}s

*Versão:* 2.0.0
        `;

        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('📚 GitHub', 'https://github.com/seu-repo')],
                [Markup.button.callback('❓ Ajuda', 'help')]
            ])
        });
    });

    // Helper de ajuda
    const helpHandler = async (ctx) => {
        await ctx.reply(`
📖 *Guia de Uso Completo*

*Como usar:*
1️⃣ Envie um link direto para download
2️⃣ Aguarde o processamento
3️⃣ Receba o arquivo

*Links suportados:*
• HTTP/HTTPS
• URLs diretas de arquivos
• Imagens, vídeos, documentos
• Arquivos ZIP, PDF, MP3, MP4

*Dicas importantes:*
• Links do Google Drive/Dropbox podem não funcionar
• Para vídeos do YouTube, use serviços de conversão
• O arquivo é deletado após o envio
• Limite de 50MB por arquivo

*Comandos disponíveis:*
/start - Menu principal
/help - Esta ajuda
/status - Status do bot
/historico - Ver seus downloads
/stats - Estatísticas gerais
/top - Top usuários

*Comandos admin:*
/ban <id> - Banir usuário
/unban <id> - Desbanir usuário
/broadcast <msg> - Enviar mensagem
/stats_full - Estatísticas completas
/clean - Limpar downloads antigos
        `, { parse_mode: 'Markdown' });
    };

    bot.help(helpHandler);
    bot.action('help', async (ctx) => {
        await ctx.answerCbQuery();
        await helpHandler(ctx);
    });

    // Comando /status
    bot.command('status', async (ctx) => {
        try {
            const stats = await database.getStats();
            const userCount = await database.pool.query('SELECT COUNT(*) as count FROM users');
            const recentDownloads = await database.pool.query(
                'SELECT COUNT(*) as count FROM downloads WHERE downloaded_at > NOW() - INTERVAL \'24 hours\''
            );
            const pendingDownloads = await database.pool.query(
                "SELECT COUNT(*) as count FROM downloads WHERE status = 'pending' AND downloaded_at > NOW() - INTERVAL '1 hour'"
            );

            await ctx.reply(`
📊 *Status do Bot*

🤖 Bot: Online ✅
👥 Usuários totais: ${userCount.rows[0].count}
📥 Downloads totais: ${stats.total_downloads}
❌ Falhas: ${stats.total_failed}
📦 Total baixado: ${(stats.total_size_bytes / 1024 / 1024).toFixed(2)}MB
🔄 Últimas 24h: ${recentDownloads.rows[0].count}
⏳ Downloads pendentes: ${pendingDownloads.rows[0].count}

📡 Conexão com BD: ✅
⏰ ${new Date().toLocaleString('pt-BR')}

💾 Memória: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
🕒 Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
            `, { parse_mode: 'Markdown' });

            logger.info(`Status solicitado por: ${ctx.from.id}`);
        } catch (error) {
            logger.error('Erro ao buscar status:', error);
            await ctx.reply('❌ Erro ao buscar status.');
        }
    });

    // Comando /historico
    bot.command('historico', async (ctx) => {
        try {
            const history = await database.getUserHistory(ctx.from.id, 10);

            if (history.length === 0) {
                await ctx.reply('📭 Você ainda não fez nenhum download.');
                return;
            }

            let message = '📜 *Seu Histórico de Downloads*\n\n';
            history.forEach((item, index) => {
                const status = item.status === 'completed' ? '✅' : '❌';
                const size = item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)}MB` : '?';
                const date = new Date(item.downloaded_at).toLocaleString('pt-BR');
                message += `${index + 1}. ${status} ${item.filename || 'arquivo'}\n`;
                message += `   📦 ${size} | 📅 ${date}\n`;
                if (item.status === 'failed' && item.error_message) {
                    message += `   ⚠️ Erro: ${item.error_message.substring(0, 50)}\n`;
                }
            });

            message += '\n📌 Mostrando últimos 10 downloads';

            await ctx.reply(message, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 Ver estatísticas', 'view_stats')]
                ])
            });

        } catch (error) {
            logger.error('Erro ao buscar histórico:', error);
            await ctx.reply('❌ Erro ao buscar histórico.');
        }
    });

    // Comando /stats
    bot.command('stats', async (ctx) => {
        try {
            const message = await getStatsMessage();
            await ctx.reply(message, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📈 Ver mais', 'view_more_stats')]
                ])
            });
        } catch (error) {
            logger.error('Erro ao buscar estatísticas:', error);
            await ctx.reply('❌ Erro ao buscar estatísticas.');
        }
    });

    bot.action('view_stats', async (ctx) => {
        try {
            await ctx.answerCbQuery();
            const message = await getStatsMessage();
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            logger.error('Erro no callback view_stats:', error);
        }
    });

    // Comando /top
    bot.command('top', async (ctx) => {
        try {
            const topUsers = await database.getTopUsers(10);

            if (topUsers.length === 0) {
                await ctx.reply('🏆 Nenhum usuário ainda.');
                return;
            }

            let message = '🏆 *Top 10 Usuários*\n\n';
            topUsers.forEach((user, index) => {
                const name = user.first_name || user.username || `User ${user.telegram_id}`;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                message += `${medal} ${name} - ${user.total_downloads} downloads\n`;
            });

            await ctx.reply(message, { parse_mode: 'Markdown' });

        } catch (error) {
            logger.error('Erro ao buscar top usuários:', error);
            await ctx.reply('❌ Erro ao buscar top usuários.');
        }
    });
};
