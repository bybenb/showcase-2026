const { Telegraf, session } = require('telegraf');
const path = require('path');
require('dotenv').config();

const logger = require('./config/logger');
const database = require('./utils/database');
const registerUserCommands = require('./commands/user');
const registerAdminCommands = require('./commands/admin');
const registerVideoCommands = require('./commands/video');
const registerMessageHandler = require('./handlers/messageHandler');
const { initQueueProcessor, processQueue } = require('./jobs/queueProcessor');

// ==================== CONFIGURAÇÕES PRINCIPAIS ====================
if (!process.env.BOT_TOKEN) {
    logger.error('❌ BOT_TOKEN não definido no .env');
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    logger.error(' DATABASE_URL não definido no .env');
    process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Registrar Middleware de Sessão (necessário para processos como broadcast)
bot.use(session());

// ==================== MIDDLEWARE PRINCIPAL (AUTH & LOGS) ====================
bot.use(async (ctx, next) => {
    const startTime = Date.now();

    try {
        // Registrar e atualizar usuário
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
        logger.error('Erro no middleware principal:', error);
        await ctx.reply('❌ Ocorreu um erro interno. Tente novamente.');
    }
});

// ==================== REGISTRAR MÓDULOS DE COMANDOS ====================
registerUserCommands(bot);
registerAdminCommands(bot);
registerVideoCommands(bot, processQueue);
registerMessageHandler(bot);

// ==================== TRATAMENTO DE ERROS ====================
bot.catch((err, ctx) => {
    logger.error(`Erro para atualização do tipo ${ctx.updateType}:`, err);
    ctx.reply('❌ Ocorreu um erro inesperado. Tente novamente mais tarde.')
        .catch(console.error);
});

// ==================== INICIALIZAR BOT ====================
async function startBot() {
    try {
        // Inicializar tabelas do Banco de Dados
        await database.init();

        // Inicializar o processador de fila em background
        initQueueProcessor(bot);

        // Iniciar bot no Telegram
        await bot.launch();

        const adminEnvIds = process.env.ADMIN_IDS ?
            process.env.ADMIN_IDS.split(',').map(id => id.trim()) :
            [];

        logger.info('✅ Bot de Download iniciado com sucesso!');
        logger.info(`📁 Pasta de downloads: ${path.join(__dirname, 'downloads')}`);
        logger.info(`🗄️ Banco: Conectado ao PostgreSQL`);
        logger.info(`👑 Admins do ENV configurados: ${adminEnvIds.length > 0 ? adminEnvIds.join(', ') : 'Nenhum'}`);
        logger.info(`📦 Limite Máximo de Arquivos: ${process.env.MAX_FILE_SIZE || 50}MB`);
        logger.info(`⏱️ Tempo Limite (Timeout): ${(process.env.DOWNLOAD_TIMEOUT || 30000) / 1000}s`);

    } catch (error) {
        logger.error('❌ Erro crítico ao iniciar bot:', error);
        process.exit(1);
    }
}

startBot();

// ==================== GRACEFUL SHUTDOWN ====================
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

process.on('uncaughtException', (error) => {
    logger.error('Exceção não capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Rejeição não tratada:', reason);
});

module.exports = bot;
