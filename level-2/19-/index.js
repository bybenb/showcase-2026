const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const database = require('./utils/database');
const downloader = require('./utils/downloader');

// Verificar variáveis de ambiente
if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN não definido no .env');
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não definido no .env');
    process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware de autenticação e logging
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
            
            // Verificar se está banido
            const isBanned = await database.isUserBanned(ctx.from.id);
            if (isBanned) {
                await ctx.reply('🚫 Você foi banido deste bot.');
                return;
            }
        }
        
        await next();
        
        // Log da requisição
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${ctx.from?.username || 'anon'} - ${ctx.message?.text || ctx.updateType} - ${duration}ms`);
    } catch (error) {
        console.error('Erro no middleware:', error);
        await ctx.reply('❌ Ocorreu um erro. Tente novamente.');
    }
});

// Comando /start
bot.start(async (ctx) => {
    const user = await database.getUser(ctx.from.id);
    
    await ctx.reply(`
🤖 *Bot de Download Profissional*

Olá ${user?.first_name || 'usuário'}! 👋

Envie qualquer link para download:
• 📁 Arquivos
• 🖼️ Imagens
• 🎬 Vídeos
• 📄 Documentos

*Comandos:*
/start - Iniciar
/help - Ajuda
/status - Status do bot
/historico - Seu histórico
/stats - Estatísticas do bot
/top - Top usuários

*Limites:*
• Tamanho: ${process.env.MAX_FILE_SIZE || 50}MB
• Tempo: ${(process.env.DOWNLOAD_TIMEOUT || 30000) / 1000}s
    `, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.url('📚 GitHub', 'https://github.com/seu-bot')],
            [Markup.button.callback('❓ Ajuda', 'help')]
        ])
    });
});

// Comando /help
bot.help(async (ctx) => {
    await ctx.reply(`
📖 *Guia de Uso*

1️⃣ Envie um link direto para download
2️⃣ Aguarde o download
3️⃣ Receba o arquivo

*Links suportados:*
• HTTP/HTTPS
• URLs diretas de arquivos
• Imagens, vídeos, documentos

*Dicas:*
• Links de serviços como Google Drive, Dropbox podem não funcionar
• Para vídeos do YouTube, use serviços de conversão primeiro
• O arquivo é deletado após o envio

*Comandos disponíveis:*
/start - Menu principal
/help - Esta ajuda
/status - Status do bot
/historico - Ver seus downloads
/stats - Estatísticas gerais
/top - Top usuários
    `, { parse_mode: 'Markdown' });
});

// Comando /status
bot.command('status', async (ctx) => {
    const stats = await database.getStats();
    const userCount = await database.pool.query('SELECT COUNT(*) as count FROM users');
    const recentDownloads = await database.pool.query(
        'SELECT COUNT(*) as count FROM downloads WHERE downloaded_at > NOW() - INTERVAL \'24 hours\''
    );

    await ctx.reply(`
📊 *Status do Bot*

🤖 Bot: Online
👥 Usuários: ${userCount.rows[0].count}
📥 Downloads totais: ${stats.total_downloads}
📤 Falhas: ${stats.total_failed}
📦 Total baixado: ${(stats.total_size_bytes / 1024 / 1024).toFixed(2)}MB
🔄 Últimas 24h: ${recentDownloads.rows[0].count}

📡 Conexão com BD: ✅
⏰ ${new Date().toLocaleString('pt-BR')}
    `, { parse_mode: 'Markdown' });
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
        });
        
        message += '\n📌 Mostrando últimos 10 downloads';
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        await ctx.reply('❌ Erro ao buscar histórico.');
    }
});

// Comando /stats
bot.command('stats', async (ctx) => {
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

🏆 *Top Usuários*\n`;

    if (topUsers.length === 0) {
        message += 'Nenhum usuário ainda.';
    } else {
        topUsers.forEach((user, index) => {
            const name = user.first_name || user.username || `User ${user.telegram_id}`;
            message += `${index + 1}. ${name} - ${user.total_downloads} downloads\n`;
        });
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
});

// Comando /top
bot.command('top', async (ctx) => {
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
});

// Comando para limpar histórico (admin)
bot.command('clean', async (ctx) => {
    // Verificar se é admin (você pode definir uma lista de admins)
    const adminIds = [123456789]; // Substitua pelo seu ID
    if (!adminIds.includes(ctx.from.id)) {
        await ctx.reply('🚫 Comando apenas para administradores.');
        return;
    }

    const count = await database.cleanOldDownloads(30);
    await ctx.reply(`🧹 Limpeza concluída! ${count} downloads antigos removidos.`);
});

// Processar mensagens com links
bot.on('text', async (ctx) => {
    const message = ctx.message.text.trim();
    
    // Verificar se é uma URL
    const urlRegex = /^https?:\/\/[^\s]+/;
    if (!urlRegex.test(message)) {
        // Não é URL, ignorar (comandos já foram processados)
        return;
    }

    let downloadRecord = null;
    let user = null;

    try {
        // Verificar URL
        try {
            new URL(message);
        } catch {
            await ctx.reply('❌ URL inválida. Verifique o link.');
            return;
        }

        // Registrar início do download
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

        await ctx.reply(`⏳ Baixando: ${filename}\n📦 ${fileInfo.size > 0 ? `${(fileInfo.size / 1024 / 1024).toFixed(2)}MB` : 'Tamanho desconhecido'}`);

        // Baixar arquivo
        const result = await downloader.downloadFile(message, filename);
        
        // Atualizar status para completed
        await database.updateDownloadStatus(downloadRecord.id, 'completed');
        
        // Enviar arquivo
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

Use /historico para ver todos os seus downloads.
            `,
            parse_mode: 'Markdown'
        });
        
        // Limpar arquivo
        downloader.cleanFile(result.filePath);
        
    } catch (error) {
        console.error('Erro no download:', error);
        
        // Atualizar status para failed
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
                errorMessage = '❌ Arquivo não encontrado (404).';
            } else if (error.response.status === 403) {
                errorMessage = '❌ Acesso negado (403).';
            } else if (error.response.status === 413) {
                errorMessage = `❌ Arquivo muito grande. Limite: ${process.env.MAX_FILE_SIZE || 50}MB`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '⏰ Timeout: O servidor demorou muito para responder.';
        } else if (error.message && error.message.includes('muito grande')) {
            errorMessage = `❌ ${error.message}`;
        }
        
        await ctx.reply(errorMessage);
    }
});

// Callback queries
bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(await ctx.help());
});

// Tratamento de erros
bot.catch((err, ctx) => {
    console.error(`Erro para ${ctx.updateType}:`, err);
    ctx.reply('❌ Ocorreu um erro inesperado. Tente novamente mais tarde.')
        .catch(console.error);
});

// Iniciar bot
async function startBot() {
    try {
        // Inicializar banco de dados
        await database.init();
        
        // Iniciar bot
        await bot.launch();
        
        console.log('✅ Bot iniciado com sucesso!');
        console.log(`📁 Pasta de downloads: ${path.join(__dirname, 'downloads')}`);
        console.log(`🗄️ Banco: ${process.env.DATABASE_URL ? 'Conectado' : 'Não conectado'}`);
        
    } catch (error) {
        console.error('❌ Erro ao iniciar bot:', error);
        process.exit(1);
    }
}

startBot();

// Graceful shutdown
process.once('SIGINT', async () => {
    console.log('🛑 Desligando...');
    await bot.stop('SIGINT');
    await database.close();
    process.exit(0);
});

process.once('SIGTERM', async () => {
    console.log('🛑 Desligando...');
    await bot.stop('SIGTERM');
    await database.close();
    process.exit(0);
});