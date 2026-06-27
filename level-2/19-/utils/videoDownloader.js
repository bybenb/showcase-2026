const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

class VideoDownloader {
    constructor() {
        this.downloadDir = path.join(__dirname, '../downloads/videos');
        this.tempDir = path.join(__dirname, '../downloads/temp');
        
        // Criar diretórios
        [this.downloadDir, this.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        this.maxSize = (process.env.MAX_FILE_SIZE || 50) * 1024 * 1024;
        this.supportedPlatforms = [
            'youtube.com', 'youtu.be',
            'instagram.com', 'twitter.com', 'x.com',
            'facebook.com', 'fb.watch', 'tiktok.com',
            'vimeo.com', 'dailymotion.com'
        ];
    }

    // Verificar se é link do YouTube
    isYouTubeUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('youtube.com') || 
                   urlObj.hostname.includes('youtu.be');
        } catch {
            return false;
        }
    }

    // Verificar se é link de vídeo suportado
    isVideoLink(url) {
        try {
            const urlObj = new URL(url);
            return this.supportedPlatforms.some(platform => 
                urlObj.hostname.includes(platform) || urlObj.hostname.endsWith(platform)
            );
        } catch {
            return false;
        }
    }

    // Identificar plataforma
    identifyPlatform(url) {
        try {
            const urlObj = new URL(url);
            if (this.isYouTubeUrl(url)) return 'youtube';
            
            for (const platform of this.supportedPlatforms) {
                if (urlObj.hostname.includes(platform) || urlObj.hostname.endsWith(platform)) {
                    return platform.split('.')[0];
                }
            }
            return 'unknown';
        } catch {
            return 'unknown';
        }
    }

    // Baixar vídeo do YouTube (usando ytdl-core)
    async downloadYouTubeVideo(url, options = {}) {
        const {
            format = 'mp4',
            quality = 'highest',
            audioOnly = false,
            filter = audioOnly ? 'audioonly' : 'audioandvideo'
        } = options;

        try {
            // Obter informações do vídeo
            const info = await ytdl.getInfo(url);
            
            // Escolher formato
            let formatOptions = {
                quality: quality === 'highest' ? 'highest' : 'lowest',
                filter: filter
            };

            // Se for apenas áudio
            if (audioOnly) {
                formatOptions = {
                    quality: 'highestaudio',
                    filter: 'audioonly'
                };
            }

            // Criar stream
            const stream = ytdl(url, formatOptions);
            
            // Gerar nome do arquivo
            const timestamp = Date.now();
            const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
            const extension = audioOnly ? 'mp3' : format;
            const filename = `${videoTitle}_${timestamp}.${extension}`;
            const filePath = path.join(this.downloadDir, filename);

            // Salvar arquivo
            const writeStream = fs.createWriteStream(filePath);
            await pipeline(stream, writeStream);

            // Verificar tamanho
            const stats = fs.statSync(filePath);
            if (stats.size > this.maxSize) {
                fs.unlinkSync(filePath);
                throw new Error(`Arquivo muito grande (${(stats.size / 1024 / 1024).toFixed(2)}MB). Limite: ${this.maxSize / 1024 / 1024}MB`);
            }

            // Baixar thumbnail
            let thumbnailPath = null;
            try {
                thumbnailPath = await this.downloadThumbnail(info.videoDetails.thumbnails, filename);
            } catch (error) {
                console.error('Erro ao baixar thumbnail:', error);
            }

            return {
                filePath: filePath,
                filename: filename,
                size: stats.size,
                platform: 'youtube',
                format: extension,
                thumbnailPath: thumbnailPath,
                videoInfo: {
                    title: info.videoDetails.title,
                    duration: parseInt(info.videoDetails.lengthSeconds),
                    views: parseInt(info.videoDetails.viewCount),
                    likes: parseInt(info.videoDetails.likes || 0),
                    uploader: info.videoDetails.author.name,
                    uploadDate: info.videoDetails.publishDate,
                    description: info.videoDetails.description?.substring(0, 200) || ''
                }
            };

        } catch (error) {
            console.error('Erro no download do YouTube:', error);
            throw error;
        }
    }

    // Baixar thumbnail
    async downloadThumbnail(thumbnails, filename) {
        try {
            if (!thumbnails || thumbnails.length === 0) return null;
            
            // Pegar a thumbnail de maior qualidade
            const thumbnail = thumbnails[thumbnails.length - 1];
            const thumbnailUrl = thumbnail.url;
            
            const response = await axios({
                method: 'get',
                url: thumbnailUrl,
                responseType: 'stream',
                timeout: 10000
            });

            const thumbnailPath = path.join(this.downloadDir, `${filename}_thumb.jpg`);
            const writer = fs.createWriteStream(thumbnailPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(thumbnailPath));
                writer.on('error', reject);
            });

        } catch (error) {
            console.error('Erro ao baixar thumbnail:', error);
            return null;
        }
    }

    // Baixar vídeo (wrapper)
    async downloadVideo(url, options = {}) {
        if (this.isYouTubeUrl(url)) {
            return await this.downloadYouTubeVideo(url, options);
        } else {
            // Para outras plataformas, tentar usar ytdl-core com proxy
            try {
                return await this.downloadYouTubeVideo(url, options);
            } catch (error) {
                throw new Error(`Plataforma não suportada: ${this.identifyPlatform(url)}. Use links do YouTube.`);
            }
        }
    }

    // Baixar apenas áudio
    async downloadAudio(url, options = {}) {
        const {
            format = 'mp3',
            quality = 'highestaudio'
        } = options;

        return await this.downloadVideo(url, {
            ...options,
            audioOnly: true,
            format: format,
            quality: quality
        });
    }

    // Baixar playlist
    async downloadPlaylist(url, options = {}) {
        const {
            maxItems = 10,
            format = 'mp4',
            quality = 'highest'
        } = options;

        try {
            if (!this.isYouTubeUrl(url)) {
                throw new Error('Playlist suportada apenas para YouTube no momento.');
            }

            const playlist = await ytpl(url);
            const videos = playlist.items.slice(0, Math.min(maxItems, 10));
            const results = [];

            for (const video of videos) {
                try {
                    const videoUrl = video.shortUrl || `https://youtube.com/watch?v=${video.id}`;
                    const result = await this.downloadYouTubeVideo(videoUrl, {
                        format: format,
                        quality: quality,
                        audioOnly: false
                    });
                    
                    results.push({
                        title: video.title,
                        url: videoUrl,
                        ...result
                    });

                } catch (error) {
                    console.error(`Erro ao baixar ${video.title}:`, error);
                    results.push({
                        title: video.title,
                        url: video.url,
                        error: error.message
                    });
                }
            }

            return {
                playlistName: playlist.title,
                totalItems: playlist.items.length,
                downloadedItems: results.filter(r => !r.error).length,
                results: results
            };

        } catch (error) {
            console.error('Erro no download da playlist:', error);
            throw error;
        }
    }

    // Obter informações do vídeo
    async getVideoInfo(url) {
        try {
            if (this.isYouTubeUrl(url)) {
                const info = await ytdl.getInfo(url);
                return {
                    title: info.videoDetails.title,
                    duration: parseInt(info.videoDetails.lengthSeconds),
                    views: parseInt(info.videoDetails.viewCount),
                    likes: parseInt(info.videoDetails.likes || 0),
                    uploader: info.videoDetails.author.name,
                    uploadDate: info.videoDetails.publishDate,
                    description: info.videoDetails.description?.substring(0, 200) || '',
                    thumbnail: info.videoDetails.thumbnails?.pop()?.url || null,
                    platform: 'youtube',
                    formats: info.formats.map(f => ({
                        quality: f.qualityLabel || f.quality || 'unknown',
                        format: f.container || f.mimeType?.split('/')[1] || 'unknown',
                        size: f.contentLength ? parseInt(f.contentLength) : 0,
                        url: f.url,
                        hasAudio: f.hasAudio,
                        hasVideo: f.hasVideo
                    }))
                };
            } else {
                throw new Error('Apenas links do YouTube são suportados para informações detalhadas.');
            }

        } catch (error) {
            console.error('Erro ao obter informações:', error);
            throw error;
        }
    }

    // Listar formatos disponíveis
    async listFormats(url) {
        try {
            const info = await this.getVideoInfo(url);
            const formats = info.formats || [];
            
            const videoFormats = formats.filter(f => f.hasVideo);
            const audioFormats = formats.filter(f => f.hasAudio && !f.hasVideo);
            
            return {
                video: videoFormats.slice(0, 10),
                audio: audioFormats.slice(0, 5),
                best: formats.length > 0 ? formats[0] : null,
                platform: info.platform
            };

        } catch (error) {
            console.error('Erro ao listar formatos:', error);
            throw error;
        }
    }

    // Limpar arquivos temporários
    cleanTempFiles(filename) {
        try {
            const files = fs.readdirSync(this.tempDir);
            for (const file of files) {
                if (file.includes(filename)) {
                    const filePath = path.join(this.tempDir, file);
                    fs.unlinkSync(filePath);
                }
            }
        } catch (error) {
            console.error('Erro ao limpar arquivos temporários:', error);
        }
    }

    // Limpar arquivo
    cleanFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
        } catch (error) {
            console.error('Erro ao limpar arquivo:', error);
        }
        return false;
    }

    // Criar stream para envio
    createFileStream(filePath) {
        return fs.createReadStream(filePath);
    }
}

module.exports = new VideoDownloader();