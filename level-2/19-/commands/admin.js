const { Markup } = require('telegraf');
const database = require('../utils/database');
const logger = require('../config/logger');

async function getStatsFullMessage() {
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

    return message;
}

module.exports = (bot) => {
    // Middleware local para certificar de que é admin
    async function checkAdminMiddleware(ctx, next) {
        const isAdmin = await database.isAdmin(ctx.from.id);
        if (!isAdmin) {
            await ctx.reply('🚫 Comando apenas para administradores.');
            return;
        }
        await next();
    }

    // Comando /ban
    bot.command('ban', checkAdminMiddleware, async (ctx) => {
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
                logger.warn(`Não foi possível notificar usuário ${userId}: ${e.message}`);
            }

            logger.info(`Usuário ${userId} banido por ${ctx.from.id}. Motivo: ${reason}`);
            await ctx.reply(`✅ Usuário ${user.first_name || userId} foi banido.\nMotivo: ${reason}`);

        } catch (error) {
            logger.error('Erro ao banir usuário:', error);
            await ctx.reply('❌ Erro ao banir usuário.');
        }
    });

    // Comando /unban
    bot.command('unban', checkAdminMiddleware, async (ctx) => {
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
                logger.warn(`Não foi possível notificar usuário ${userId}: ${e.message}`);
            }

            logger.info(`Usuário ${userId} desbanido por ${ctx.from.id}`);
            await ctx.reply(`✅ Usuário ${user.first_name || userId} foi desbanido.`);

        } catch (error) {
            logger.error('Erro ao desbanir usuário:', error);
            await ctx.reply('❌ Erro ao desbanir usuário.');
        }
    });

    // Comando /broadcast
    bot.command('broadcast', checkAdminMiddleware, async (ctx) => {
        const message = ctx.message.text.split(' ').slice(1).join(' ');
        if (!message) {
            await ctx.reply('❌ Use: /broadcast <mensagem>');
            return;
        }

        await ctx.reply(
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
        const isAdmin = await database.isAdmin(ctx.from.id);
        if (!isAdmin) {
            await ctx.answerCbQuery('🚫 Apenas administradores.');
            return;
        }

        await ctx.answerCbQuery('📢 Enviando broadcast...');

        const message = ctx.session?.broadcastMessage;
        if (!message) {
            await ctx.reply('❌ Mensagem não encontrada ou expirada.');
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

            if (ctx.session) delete ctx.session.broadcastMessage;

        } catch (error) {
            logger.error('Erro no broadcast:', error);
            await ctx.reply('❌ Erro ao enviar broadcast.');
        }
    });

    // Callback para cancelar broadcast
    bot.action('cancel_broadcast', async (ctx) => {
        const isAdmin = await database.isAdmin(ctx.from.id);
        if (!isAdmin) {
            await ctx.answerCbQuery('🚫 Apenas administradores.');
            return;
        }

        await ctx.answerCbQuery('❌ Broadcast cancelado.');
        await ctx.reply('❌ Broadcast cancelado.');
        if (ctx.session) delete ctx.session.broadcastMessage;
    });

    // Comando /stats_full
    bot.command('stats_full', checkAdminMiddleware, async (ctx) => {
        try {
            const message = await getStatsFullMessage();
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            logger.error('Erro ao buscar estatísticas completas:', error);
            await ctx.reply('❌ Erro ao buscar estatísticas.');
        }
    });

    // Action para ver mais estatísticas (integrado com stats_full)
    bot.action('view_more_stats', async (ctx) => {
        await ctx.answerCbQuery();

        const isAdmin = await database.isAdmin(ctx.from.id);
        if (!isAdmin) {
            await ctx.reply('🚫 Apenas administradores podem ver estatísticas avançadas.');
            return;
        }

        try {
            const message = await getStatsFullMessage();
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            logger.error('Erro no callback view_more_stats:', error);
        }
    });

    // Comando /clean
    bot.command('clean', checkAdminMiddleware, async (ctx) => {
        try {
            const days = parseInt(ctx.message.text.split(' ')[1]) || 30;

            await ctx.reply(
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

    // Callback para confirmar limpeza
    bot.action(/confirm_clean_(.+)/, async (ctx) => {
        const isAdmin = await database.isAdmin(ctx.from.id);
        if (!isAdmin) {
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

    // Callback para cancelar limpeza
    bot.action('cancel_clean', async (ctx) => {
        const isAdmin = await database.isAdmin(ctx.from.id);
        if (!isAdmin) {
            await ctx.answerCbQuery('🚫 Apenas administradores.');
            return;
        }

        await ctx.answerCbQuery('❌ Limpeza cancelada.');
        await ctx.reply('❌ Limpeza cancelada.');
    });

    // Comando /add_admin
    bot.command('add_admin', async (ctx) => {
        const adminEnvIds = process.env.ADMIN_IDS ?
            process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) :
            [];

        // Apenas o primeiro admin principal do env pode delegar novos admins
        if (adminEnvIds.length === 0 || ctx.from.id !== adminEnvIds[0]) {
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
                logger.warn(`Não foi possível notificar novo admin ${userId}: ${e.message}`);
            }

            logger.info(`Novo admin adicionado: ${userId} por ${ctx.from.id}`);
            await ctx.reply(`✅ Usuário ${userId} adicionado como administrador.`);

        } catch (error) {
            logger.error('Erro ao adicionar admin:', error);
            await ctx.reply('❌ Erro ao adicionar administrador.');
        }
    });
};
