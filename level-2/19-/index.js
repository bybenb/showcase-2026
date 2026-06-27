const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('dotenv').config();

const database = require('./utils/database');
const downloader = require('./utils/downloader');




// ==================== CONFIGURAÇÕES ====================
const ADMIN_IDS = process.env.ADMIN_IDS ? 
    process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : 
    []; 

// ==================== LOGGING ====================
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Criar pasta de logs
if (!fs.existsSync('logs')) { fs.mkdirSync('logs'); }

if (!process.env.BOT_TOKEN) { logger.error(' BOT_TOKEN não definido no .env'); process.exit(1); }

if (!process.env.DATABASE_URL) { logger.error('❌ DATABASE_URL não definido no .env'); process.exit(1); }

const bot = new Telegraf(process.env.BOT_TOKEN);

//  MIDDLEWARES 

bot.use(async (ctx, next) => {
    const startTime = Date.now();
    
    try {
        // Registrar usuário
        if (ctx.from) {
            await database.createOrUpdateUser(
                ctx.from.id,
                ctx.from.username || null,
                ctx.from.first_name || null,
                ctx.from.last_name || null
            );
            
            const isBanned = await database.isUserBanned(ctx.from.id);
            if (isBanned) {
                logger.warn(`Usuário banido tentou acessar: ${ctx.from.id}`);
                await ctx.reply('🚫 Você foi banido deste bot.');
                return;
            }
        }
        
        await next();
        
        const duration = Date.now() - startTime;
        logger.info({
            event: 'update',
            type: ctx.updateType,
            user: ctx.from?.id,
            username: ctx.from?.username,
            message: ctx.message?.text,
            duration: `${duration}ms`
        });
        
    } catch (error) {
        logger.error('Erro no middleware:', error);
        await ctx.reply('❌ Ocorreu um erro. Tente novamente.');
    }
});




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

bot.help(async (ctx) => {
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
});

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

bot.command('stats', async (ctx) => {
    try {
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

// ==================== COMANDOS ADMINISTRATIVOS ====================

function isAdmin(userId) { return ADMIN_IDS.includes(userId); }

bot.command('ban', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('🚫 Comando apenas para administradores.');
        return;
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Use: /ban <telegram_id> [motivo]');
        return;
    }

    const userId = parseInt(args[1]);
    const reason = args.slice(2).join(' ') || 'Sem motivo especificado';

    if (isNaN(userId)) {
        await ctx.reply('❌ ID inválido.');
        return;
    }

    try {
        const user = await database.getUser(userId);
        if (!user) {
            await ctx.reply('❌ Usuário não encontrado.');
            return;
        }

        await database.pool.query(
            'UPDATE users SET is_banned = true WHERE telegram_id = $1',
            [userId]
        );

        try {
            await bot.telegram.sendMessage(userId, 
                `🚫 *Você foi banido do bot!*\n\nMotivo: ${reason}\n\nPara contestar, entre em contato com o administrador.`,
                { parse_mode: 'Markdown' }
            );
        } catch (e) {
            logger.warn(`Não foi possível notificar usuário ${userId}:`, e.message);
        }

        logger.info(`Usuário ${userId} banido por ${ctx.from.id}. Motivo: ${reason}`);
        await ctx.reply(`✅ Usuário ${user.first_name || userId} foi banido.\nMotivo: ${reason}`);
        
    } catch (error) {
        logger.error('Erro ao banir usuário:', error);
        await ctx.reply('❌ Erro ao banir usuário.');
    }
});

bot.command('unban', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('🚫 Comando apenas para administradores.');
        return;
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Use: /unban <telegram_id>');
        return;
    }

    const userId = parseInt(args[1]);
    if (isNaN(userId)) {
        await ctx.reply('❌ ID inválido.');
        return;
    }

    try {
        const user = await database.getUser(userId);
        if (!user) {
            await ctx.reply('❌ Usuário não encontrado.');
            return;
        }

        await database.pool.query(
            'UPDATE users SET is_banned = false WHERE telegram_id = $1',
            [userId]
        );

        try {
            await bot.telegram.sendMessage(userId, 
                '✅ *Você foi desbanido do bot!*\n\nPode voltar a usar normalmente.',
                { parse_mode: 'Markdown' }
            );
        } catch (e) {
            logger.warn(`Não foi possível notificar usuário ${userId}:`, e.message);
        }

        logger.info(`Usuário ${userId} desbanido por ${ctx.from.id}`);
        await ctx.reply(`✅ Usuário ${user.first_name || userId} foi desbanido.`);
        
    } catch (error) {
        logger.error('Erro ao desbanir usuário:', error);
        await ctx.reply('❌ Erro ao desbanir usuário.');
    }
});

bot.command('broadcast', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('🚫 Comando apenas para administradores.');
        return;
    }

    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) {
        await ctx.reply('❌ Use: /broadcast <mensagem>');
        return;
    }

    const confirmMsg = await ctx.reply(
        `📢 *Confirmar envio de broadcast?*\n\nMensagem: "${message}"\n\nIsso enviará para TODOS os usuários.`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Confirmar', `confirm_broadcast_${Date.now()}`)],
                [Markup.button.callback('❌ Cancelar', 'cancel_broadcast')]
            ])
        }
    );

    ctx.session = ctx.session || {};
    ctx.session.broadcastMessage = message;
});



// Callback para confirmar broadcast
bot.action(/confirm_broadcast_(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('🚫 Apenas administradores.');
        return;
    }

    await ctx.answerCbQuery('📢 Enviando broadcast...');
    
    const message = ctx.session?.broadcastMessage;
    if (!message) {
        await ctx.reply('❌ Mensagem não encontrada.');
        return;
    }

    try {
        const users = await database.pool.query('SELECT telegram_id FROM users');
        let sent = 0;
        let failed = 0;
        const startTime = Date.now();

        for (const user of users.rows) {
            try {
                await bot.telegram.sendMessage(user.telegram_id, `📢 ${message}`);
                sent++;
                
                // Delay para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                failed++;
                if (error.message.includes('bot was blocked')) {
                    logger.warn(`Usuário ${user.telegram_id} bloqueou o bot`);
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        logger.info(`Broadcast enviado por ${ctx.from.id}. Enviados: ${sent}, Falhas: ${failed}`);
        await ctx.reply(
            `✅ *Broadcast concluído!*\n\n📤 Enviados: ${sent}\n❌ Falhas: ${failed}\n⏱️ Tempo: ${duration}s`
        );
        
        delete ctx.session.broadcastMessage;
        
    } catch (error) {
        logger.error('Erro no broadcast:', error);
        await ctx.reply('❌ Erro ao enviar broadcast.');
    }
});


bot.action('cancel_broadcast', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('🚫 Apenas administradores.');
        return;
    }
    
    await ctx.answerCbQuery('❌ Broadcast cancelado.');
    await ctx.reply('❌ Broadcast cancelado.');
    delete ctx.session?.broadcastMessage;
});


bot.command('stats_full', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('🚫 Comando apenas para administradores.');
        return;
    }

    try {
        const stats = await database.getStats();
        const userCount = await database.pool.query('SELECT COUNT(*) as count FROM users');
        const bannedUsers = await database.pool.query(
            'SELECT COUNT(*) as count FROM users WHERE is_banned = true'
        );
        const todayDownloads = await database.pool.query(
            "SELECT COUNT(*) as count FROM downloads WHERE DATE(downloaded_at) = CURRENT_DATE"
        );
        const top10Users = await database.getTopUsers(10);
        const fileTypes = await database.pool.query(
            "SELECT file_type, COUNT(*) as count FROM downloads GROUP BY file_type ORDER BY count DESC LIMIT 5"
        );

        let message = `
📊 *ESTATÍSTICAS COMPLETAS*
━━━━━━━━━━━━━━━━━━━━━

*📈 Visão Geral:*
• Total de usuários: ${userCount.rows[0].count}
• Usuários banidos: ${bannedUsers.rows[0].count}
• Downloads hoje: ${todayDownloads.rows[0].count}

*📥 Downloads:*
• Total: ${stats.total_downloads}
• Falhas: ${stats.total_failed}
• Taxa de sucesso: ${stats.total_downloads + stats.total_failed > 0 
    ? ((stats.total_downloads / (stats.total_downloads + stats.total_failed)) * 100).toFixed(1) 
    : 0}%
• Total baixado: ${(stats.total_size_bytes / 1024 / 1024).toFixed(2)}MB

*📂 Tipos de arquivo:*
`;

        if (fileTypes.rows.length > 0) {
            fileTypes.rows.forEach(ft => {
                message += `• ${ft.file_type || 'Desconhecido'}: ${ft.count}\n`;
            });
        } else {
            message += '• Nenhum dado ainda\n';
        }

        message += `
*🏆 Top 10 Usuários:*
`;

        if (top10Users.length > 0) {
            top10Users.forEach((user, index) => {
                const name = user.first_name || user.username || `User ${user.telegram_id}`;
                message += `${index + 1}. ${name} - ${user.total_downloads} downloads\n`;
            });
        } else {
            message += 'Nenhum usuário ainda.';
        }

        message += `
━━━━━━━━━━━━━━━━━━━━━
🕒 ${new Date().toLocaleString('pt-BR')}
        `;

        await ctx.reply(message, { parse_mode: 'Markdown' });
        
    } catch (error) {
        logger.error('Erro ao buscar estatísticas completas:', error);
        await ctx.reply('❌ Erro ao buscar estatísticas.');
    }
});

bot.command('clean', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('🚫 Comando apenas para administradores.');
        return;
    }

    try {
        const days = parseInt(ctx.message.text.split(' ')[1]) || 30;
        
        const confirmMsg = await ctx.reply(
            `🧹 *Confirmar limpeza?*\n\nRemover downloads com mais de ${days} dias.\n\nIsso é irreversível!`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('✅ Confirmar', `confirm_clean_${days}`)],
                    [Markup.button.callback('❌ Cancelar', 'cancel_clean')]
                ])
            }
        );
        
    } catch (error) {
        logger.error('Erro ao iniciar limpeza:', error);
        await ctx.reply('❌ Erro ao iniciar limpeza.');
    }
});

bot.action(/confirm_clean_(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('🚫 Apenas administradores.');
        return;
    }

    await ctx.answerCbQuery('🧹 Limpando...');
    
    const days = parseInt(ctx.match[1]) || 30;
    
    try {
        const count = await database.cleanOldDownloads(days);
        
        logger.info(`Limpeza realizada por ${ctx.from.id}. ${count} registros removidos.`);
        await ctx.reply(`🧹 *Limpeza concluída!*\n\n📊 ${count} downloads antigos removidos.\n📅 Período: ${days} dias`);
        
    } catch (error) {
        logger.error('Erro na limpeza:', error);
        await ctx.reply('❌ Erro ao realizar limpeza.');
    }
});

bot.action('cancel_clean', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('🚫 Apenas administradores.');
        return;
    }
    
    await ctx.answerCbQuery('❌ Limpeza cancelada.');
    await ctx.reply('❌ Limpeza cancelada.');
});

bot.command('add_admin', async (ctx) => {
    if (ADMIN_IDS.length === 0 || ctx.from.id !== ADMIN_IDS[0]) {
        await ctx.reply('🚫 Apenas o administrador principal pode adicionar novos admins.');
        return;
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        await ctx.reply('❌ Use: /add_admin <telegram_id>');
        return;
    }

    const userId = parseInt(args[1]);
    if (isNaN(userId)) {
        await ctx.reply('❌ ID inválido.');
        return;
    }

    try {
        await database.pool.query(
            'INSERT INTO admins (telegram_id, added_by, added_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (telegram_id) DO NOTHING',
            [userId, ctx.from.id]
        );
        
        try {
            await bot.telegram.sendMessage(userId, 
                '👑 *Você agora é um administrador do bot!*\n\nUse /help para ver os comandos disponíveis.',
                { parse_mode: 'Markdown' }
            );
        } catch (e) {
            logger.warn(`Não foi possível notificar novo admin ${userId}:`, e.message);
        }
        
        logger.info(`Novo admin adicionado: ${userId} por ${ctx.from.id}`);
        await ctx.reply(`✅ Usuário ${userId} adicionado como administrador.`);
        
        await ctx.reply('⚠️ Recomendo reiniciar o bot para aplicar as mudanças.');
        
    } catch (error) {
        logger.error('Erro ao adicionar admin:', error);
        await ctx.reply('❌ Erro ao adicionar administrador.');
    }
});







// ==================== PROCESSAR DOWNLOADS ====================

bot.on('text', async (ctx) => {
    const message = ctx.message.text.trim();
    
    const urlRegex = /^https?:\/\/[^\s]+/;
    if (!urlRegex.test(message)) {
        // Se Não é URL
        return;
    }

    let downloadRecord = null;
    let user = null;

    try {
        try {
            new URL(message);
        } catch {
            await ctx.reply('❌ URL inválida. Verifique o link.');
            return;
        }

        user = await database.getUser(ctx.from.id);
        
        const fileInfo = await downloader.getFileInfo(message);
        const filename = fileInfo.filename || downloader.getFilenameFromUrl(message);
        
        downloadRecord = await database.registerDownload(
            user.id,
            message,
            filename,
            fileInfo.size || 0,
            fileInfo.type || 'unknown',
            'pending'
        );

        const sizeDisplay = fileInfo.size > 0 ? 
            `${(fileInfo.size / 1024 / 1024).toFixed(2)}MB` : 
            'Tamanho desconhecido';

        await ctx.reply(`⏳ *Baixando arquivo...*\n\n📁 ${filename}\n📦 ${sizeDisplay}`, {
            parse_mode: 'Markdown'
        });

        const result = await downloader.downloadFile(message, filename);
        
        await database.updateDownloadStatus(downloadRecord.id, 'completed');
        
        await ctx.reply('📤 Enviando arquivo...');
        
        await ctx.replyWithDocument({
            source: fs.createReadStream(result.filePath),
            filename: result.filename
        }, {
            caption: `
✅ *Download concluído!*
📁 ${result.filename}
📦 ${(result.size / 1024 / 1024).toFixed(2)}MB
👤 ${ctx.from.first_name || 'Usuário'}

📊 Use /historico para ver todos os seus downloads.
            `,
            parse_mode: 'Markdown'
        });
        
        // Limpar arquivo
        downloader.cleanFile(result.filePath);
        
        logger.info(`Download concluído: ${result.filename} por ${ctx.from.id} (${(result.size / 1024 / 1024).toFixed(2)}MB)`);
        
    } catch (error) {
        logger.error('Erro no download:', error);
        
        if (downloadRecord) {
            await database.updateDownloadStatus(
                downloadRecord.id,
                'failed',
                error.message || 'Erro desconhecido'
            );
        }
        
        let errorMessage = '❌ Erro ao processar o link.';
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMessage = '❌ Arquivo não encontrado (404). Verifique o link.';
            } else if (error.response.status === 403) {
                errorMessage = '❌ Acesso negado (403). O servidor não permite download.';
            } else if (error.response.status === 413) {
                errorMessage = `❌ Arquivo muito grande. Limite: ${process.env.MAX_FILE_SIZE || 50}MB`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '⏰ Tempo limite excedido. O servidor demorou muito para responder.';
        } else if (error.message && error.message.includes('muito grande')) {
            errorMessage = `❌ ${error.message}`;
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = '❌ Servidor não encontrado. Verifique o link.';
        }
        
        await ctx.reply(errorMessage);
    }
});




// ==================== CALLBACK QUERIES ====================

bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(await ctx.help());
});

bot.action('view_stats', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(await ctx.commands.stats());
});

bot.action('view_more_stats', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(await ctx.commands.stats_full ? await ctx.commands.stats_full() : 'Use /stats_full para mais detalhes.');
});

// ==================== TRATAMENTO DE ERROS ====================

bot.catch((err, ctx) => {
    logger.error(`Erro para ${ctx.updateType}:`, err);
    ctx.reply('❌ Ocorreu um erro inesperado. Tente novamente mais tarde.')
        .catch(console.error);
});

// ==================== INICIAR BOT ====================

async function startBot() {
    try {
        await database.init();
                
        // Iniciar bot
        await bot.launch();
        
        logger.info('✅ Bot iniciado com sucesso!');
        logger.info(`📁 Pasta de downloads: ${path.join(__dirname, 'downloads')}`);
        logger.info(`🗄️ Banco: Conectado ao PostgreSQL`);
        logger.info(`👑 Admins configurados: ${ADMIN_IDS.length > 0 ? ADMIN_IDS.join(', ') : 'Nenhum'}`);
        logger.info(`📦 Limite: ${process.env.MAX_FILE_SIZE || 50}MB`);
        logger.info(`⏱️ Timeout: ${(process.env.DOWNLOAD_TIMEOUT || 30000) / 1000}s`);
        
    } catch (error) {
        logger.error('❌ Erro ao iniciar bot:', error);
        process.exit(1);
    }
}

startBot();




process.once('SIGINT', async () => {
    logger.info('🛑 Recebido SIGINT. Desligando...');
    await bot.stop('SIGINT');
    await database.close();
    logger.info('✅ Bot desligado com sucesso.');
    process.exit(0);
});

process.once('SIGTERM', async () => {
    logger.info('🛑 Recebido SIGTERM. Desligando...');
    await bot.stop('SIGTERM');
    await database.close();
    logger.info('✅ Bot desligado com sucesso.');
    process.exit(0);
});

process.on('uncaughtException', (error) => { logger.error('Exceção não capturada:', error); });

process.on('unhandledRejection', (reason, promise) => { logger.error('Rejeição não tratada:', reason); });

module.exports = bot;