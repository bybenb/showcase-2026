const database = require('../utils/database');
const downloader = require('../utils/downloader');
const videoDownloader = require('../utils/videoDownloader');
const logger = require('../config/logger');
const fs = require('fs');

module.exports = (bot) => {
    bot.on('text', async (ctx) => {
        const message = ctx.message.text.trim();

        // Verificar se é link
        const urlRegex = /^https?:\/\/[^\s]+/;
        if (!urlRegex.test(message)) {
            return;
        }

        try {
            new URL(message);
        } catch {
            await ctx.reply('❌ URL inválida. Verifique o link.');
            return;
        }

        // Se for um link de vídeo de plataformas suportadas, oferecer opções específicas de vídeo
        if (videoDownloader.isVideoLink(message)) {
            await ctx.reply(`
🎬 *Link de vídeo detectado!*

🔗 ${message}

*Opções disponíveis:*
• Baixar vídeo: /video ${message}
• Baixar áudio: /video ${message} /audio
• Ver informações: /info ${message}
• Ver formatos: /formatos ${message}
• Baixar playlist: /playlist ${message}

Escolha uma opção acima para continuar.
            `, { parse_mode: 'Markdown' });
            return;
        }

        // Caso contrário, processar como download de arquivo comum
        let downloadRecord = null;
        try {
            const user = await database.getUser(ctx.from.id);
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
            logger.error('Erro no download de arquivo:', error);

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
};
