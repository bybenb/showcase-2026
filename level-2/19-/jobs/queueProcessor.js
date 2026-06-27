const database = require('../utils/database');
const videoDownloader = require('../utils/videoDownloader');
const logger = require('../config/logger');
const fs = require('fs');

let isProcessing = false;
let botInstance = null;

function formatDuration(seconds) {
    if (!seconds) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function processQueue() {
    if (!botInstance) {
        logger.warn('Fila acionada, mas botInstance não está configurado.');
        return;
    }
    if (isProcessing) return;
    isProcessing = true;

    try {
        while (true) {
            const queueItem = await database.getNextFromQueue();
            if (!queueItem) break;

            // Atualizar status para processing
            await database.updateQueueStatus(queueItem.id, 'processing', new Date());

            try {
                // Processar baseado no tipo
                if (queueItem.type === 'video') {
                    const options = queueItem.options || {};

                    // Baixar vídeo
                    const result = await videoDownloader.downloadVideo(queueItem.url, {
                        format: options.format || 'mp4',
                        quality: options.quality || 'highest',
                        audioOnly: options.audioOnly || false,
                        subtitles: options.subtitles || false,
                        thumbnail: options.thumbnail || false
                    });

                    // Registrar no banco
                    const videoInfo = await videoDownloader.getVideoInfo(queueItem.url);
                    await database.registerVideoDownload(
                        queueItem.user_id,
                        queueItem.url,
                        videoInfo.title || 'Vídeo',
                        videoDownloader.identifyPlatform(queueItem.url),
                        result.filename,
                        result.size,
                        'video',
                        videoInfo.duration || 0,
                        options.quality || 'highest',
                        options.format || 'mp4',
                        'completed'
                    );

                    // Enviar para o usuário
                    try {
                        const user = await database.getUserById(queueItem.user_id);
                        if (user) {
                            await botInstance.telegram.sendDocument(user.telegram_id, {
                                source: fs.createReadStream(result.filePath),
                                filename: result.filename
                            }, {
                                caption: `
🎬 *Vídeo baixado!*

📹 ${videoInfo.title || 'Vídeo'}
📱 Plataforma: ${videoDownloader.identifyPlatform(queueItem.url)}
📦 ${(result.size / 1024 / 1024).toFixed(2)}MB
${videoInfo.duration ? `⏱️ ${formatDuration(videoInfo.duration)}` : ''}

Baixado com sucesso! ✅
                                `,
                                parse_mode: 'Markdown'
                            });

                            // Enviar thumbnail se disponível
                            if (result.thumbnailPath && fs.existsSync(result.thumbnailPath)) {
                                try {
                                    await botInstance.telegram.sendPhoto(user.telegram_id, {
                                        source: fs.createReadStream(result.thumbnailPath)
                                    });
                                } catch (thumbError) {
                                    logger.error('Erro ao enviar thumbnail:', thumbError);
                                } finally {
                                    videoDownloader.cleanFile(result.thumbnailPath);
                                }
                            }
                        } else {
                            logger.error(`Tentou enviar vídeo, mas usuário ID ${queueItem.user_id} não foi encontrado.`);
                        }

                    } catch (error) {
                        logger.error('Erro ao enviar vídeo para usuário:', error);
                    } finally {
                        // Limpar arquivo
                        videoDownloader.cleanFile(result.filePath);
                    }

                } else {
                    // Outros tipos de downloads poderação ir aqui no futuro
                }

                // Atualizar status da fila para completed
                await database.updateQueueStatus(queueItem.id, 'completed', null, new Date());

            } catch (error) {
                logger.error('Erro ao processar item da fila:', error);
                await database.updateQueueStatus(queueItem.id, 'failed', null, new Date());
            }

            // Pequena pausa entre downloads
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        logger.error('Erro no processador de fila:', error);
    } finally {
        isProcessing = false;
    }
}

function initQueueProcessor(bot) {
    botInstance = bot;
    // Tenta processar caso já existam downloads na fila na inicialização
    processQueue();
}

module.exports = {
    initQueueProcessor,
    processQueue
};
