const database = require('../utils/database');
const videoDownloader = require('../utils/videoDownloader');
const logger = require('../config/logger');
const fs = require('fs');

function formatDuration(seconds) {
    if (!seconds) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

module.exports = (bot, processQueue) => {
    // Comando /video - Baixar vídeo
    bot.command('video', async (ctx) => {
        const args = ctx.message.text.split(' ');
        args.shift(); // Remove o comando

        if (args.length === 0) {
            await ctx.reply(`
🎬 *Como baixar vídeos*

Use: /video <link> [opções]

*Opções disponíveis:*
/formato mp4 - Formato do vídeo (mp4, webm, avi)
/qualidade alta - Qualidade (alta, media, baixa)
/audio - Baixar apenas áudio
/playlist - Baixar playlist (limite 10)

*Exemplos:*
/video https://youtube.com/watch?v=abc123
/video https://youtube.com/watch?v=abc123 /qualidade alta
/video https://youtube.com/watch?v=abc123 /audio
/video https://youtube.com/playlist?list=abc /playlist

*Plataformas suportadas:*
YouTube, Instagram, Twitter/X, TikTok, Facebook, Vimeo, Dailymotion, Twitch, Reddit
            `, { parse_mode: 'Markdown' });
            return;
        }

        const url = args[0];
        const options = {
            format: 'mp4',
            quality: 'highest',
            audioOnly: false,
            subtitles: false,
            thumbnail: false,
            isPlaylist: false
        };

        // Parsear opções
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg === '/formato' && args[i + 1]) {
                options.format = args[++i];
            } else if (arg === '/qualidade' && args[i + 1]) {
                options.quality = args[++i];
            } else if (arg === '/audio') {
                options.audioOnly = true;
            } else if (arg === '/playlist') {
                options.isPlaylist = true;
            } else if (arg === '/legenda') {
                options.subtitles = true;
            } else if (arg === '/thumb') {
                options.thumbnail = true;
            }
        }

        // Validar URL
        try {
            new URL(url);
        } catch {
            await ctx.reply('❌ URL inválida.');
            return;
        }

        // Verificar se é link de vídeo
        if (!videoDownloader.isVideoLink(url)) {
            await ctx.reply('❌ Link não suportado. Envie um link de vídeo suportado.');
            return;
        }

        try {
            const user = await database.getUser(ctx.from.id);

            // Adicionar à fila
            const queueItem = await database.addToQueue(user.id, url, 'video', options);

            await ctx.reply(`
⏳ *Adicionado à fila de download!*

🔗 ${url}
📱 Plataforma: ${videoDownloader.identifyPlatform(url)}
🎯 Tipo: ${options.audioOnly ? 'Áudio' : 'Vídeo'}
📋 Formato: ${options.format}
🔄 Posição na fila: ${queueItem.id}

Vou te avisar quando estiver pronto!
            `, { parse_mode: 'Markdown' });

            // Processar fila em background
            if (processQueue) processQueue();

        } catch (error) {
            logger.error('Erro ao adicionar à fila:', error);
            await ctx.reply('❌ Erro ao processar solicitação.');
        }
    });

    // Comando /info - Obter informações do vídeo
    bot.command('info', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            await ctx.reply('❌ Use: /info <link_do_video>');
            return;
        }

        const url = args[1];

        try {
            new URL(url);
        } catch {
            await ctx.reply('❌ URL inválida.');
            return;
        }

        try {
            const info = await videoDownloader.getVideoInfo(url);

            const message = `
📹 *Informações do Vídeo*

*Título:* ${info.title}
*Plataforma:* ${info.platform}
*Duração:* ${formatDuration(info.duration)}
*Visualizações:* ${formatNumber(info.views)}
*Likes:* ${formatNumber(info.likes)}
*Uploader:* ${info.uploader}
*Data:* ${info.uploadDate}

*Descrição:*
${info.description || 'Sem descrição'}

💡 Para baixar: /video ${url}
            `;

            await ctx.reply(message, { parse_mode: 'Markdown' });

        } catch (error) {
            logger.error('Erro ao obter informações:', error);
            await ctx.reply('❌ Erro ao obter informações do vídeo.');
        }
    });

    // Comando /playlist - Baixar playlist
    bot.command('playlist', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            await ctx.reply('❌ Use: /playlist <link_playlist> [max_items]');
            return;
        }

        const url = args[1];
        const maxItems = parseInt(args[2]) || 5;

        if (maxItems > 10) {
            await ctx.reply('⚠️ Limite máximo de 10 vídeos por playlist.');
            return;
        }

        try {
            await ctx.reply(`⏳ Baixando playlist com até ${maxItems} vídeos...`);

            const result = await videoDownloader.downloadPlaylist(url, {
                maxItems: maxItems,
                format: 'mp4',
                quality: 'highest'
            });

            const user = await database.getUser(ctx.from.id);

            // Registrar downloads
            let successCount = 0;
            for (const item of result.results) {
                if (!item.error) {
                    await database.registerVideoDownload(
                        user.id,
                        item.url,
                        item.title || 'Playlist item',
                        'youtube',
                        item.filename,
                        item.size,
                        'video',
                        0,
                        'highest',
                        'mp4',
                        'completed'
                    );
                    successCount++;
                }
            }

            await ctx.reply(`
✅ *Playlist baixada com sucesso!*

🎵 ${result.playlistName}
📊 Total: ${result.totalItems} vídeos
✅ Baixados: ${result.downloadedItems}
📁 Salvos em: ${formatNumber(successCount)} arquivos

${result.results.map((item, i) =>
                `• ${i + 1}. ${item.error ? '❌' : '✅'} ${item.title || 'Sem título'}`
            ).join('\n')}
            `, { parse_mode: 'Markdown' });

            // Enviar arquivos
            for (const item of result.results) {
                if (!item.error) {
                    try {
                        await ctx.replyWithDocument({
                            source: fs.createReadStream(item.filePath),
                            filename: item.filename
                        }, {
                            caption: `🎬 ${item.title || 'Vídeo'}`
                        });
                        videoDownloader.cleanFile(item.filePath);
                    } catch (error) {
                        logger.error('Erro ao enviar arquivo:', error);
                    }
                }
            }

        } catch (error) {
            logger.error('Erro ao baixar playlist:', error);
            await ctx.reply('❌ Erro ao baixar playlist.');
        }
    });

    // Comando /formatos - Listar formatos disponíveis
    bot.command('formatos', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            await ctx.reply('❌ Use: /formatos <link_do_video>');
            return;
        }

        const url = args[1];

        try {
            const formats = await videoDownloader.listFormats(url);

            let message = '📋 *Formatos Disponíveis*\n\n';

            if (formats.video.length > 0) {
                message += '*🎬 Vídeo:*\n';
                formats.video.slice(0, 10).forEach(f => {
                    message += `• ${f.quality || 'Desconhecido'} (${f.format}) - ${f.size ? (f.size / 1024 / 1024).toFixed(2) + 'MB' : '?'}\n`;
                });
            }

            if (formats.audio.length > 0) {
                message += '\n*🎵 Áudio:*\n';
                formats.audio.slice(0, 5).forEach(f => {
                    message += `• ${f.quality || 'Desconhecido'} (${f.format}) - ${f.size ? (f.size / 1024 / 1024).toFixed(2) + 'MB' : '?'}\n`;
                });
            }

            message += '\n💡 Use: /video <link> /formato <formato>';

            await ctx.reply(message, { parse_mode: 'Markdown' });

        } catch (error) {
            logger.error('Erro ao listar formatos:', error);
            await ctx.reply('❌ Erro ao obter formatos.');
        }
    });

    // Comando /fila - Ver fila de downloads
    bot.command('fila', async (ctx) => {
        try {
            const result = await database.pool.query(
                `SELECT * FROM download_queue 
                WHERE user_id = (SELECT id FROM users WHERE telegram_id = $1)
                AND status = 'queued'
                ORDER BY priority DESC, created_at ASC`,
                [ctx.from.id]
            );

            if (result.rows.length === 0) {
                await ctx.reply('📭 Nenhum download na fila.');
                return;
            }

            let message = '⏳ *Fila de Downloads*\n\n';
            result.rows.forEach((item, index) => {
                const type = item.type === 'video' ? '🎬 Vídeo' : '📄 Arquivo';
                message += `${index + 1}. ${type} - ${item.url.substring(0, 50)}...\n`;
            });

            await ctx.reply(message, { parse_mode: 'Markdown' });

        } catch (error) {
            logger.error('Erro ao ver fila:', error);
            await ctx.reply('❌ Erro ao ver fila.');
        }
    });
};
