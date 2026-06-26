const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class Downloader {
    constructor() {
        this.downloadDir = path.join(__dirname, '../downloads');
        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
        this.maxSize = (process.env.MAX_FILE_SIZE || 50) * 1024 * 1024;
        this.timeout = parseInt(process.env.DOWNLOAD_TIMEOUT) || 30000;
    }

    async downloadFile(url, filename) {
        const filePath = path.join(this.downloadDir, filename);
        const writer = fs.createWriteStream(filePath);
        
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: this.timeout,
            maxContentLength: this.maxSize,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const contentLength = parseInt(response.headers['content-length'] || 0);
        
        if (contentLength > this.maxSize) {
            throw new Error(`Arquivo muito grande (${(contentLength / 1024 / 1024).toFixed(2)}MB). Limite: ${this.maxSize / 1024 / 1024}MB`);
        }

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const stats = fs.statSync(filePath);
                resolve({
                    filePath,
                    size: stats.size,
                    filename: path.basename(filePath)
                });
            });
            writer.on('error', reject);
            response.data.on('error', reject);
        });
    }

    getFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            let filename = path.basename(urlObj.pathname);
            
            if (!filename || !filename.includes('.')) {
                // Tentar pegar do header Content-Disposition (será feito no download)
                const timestamp = Date.now();
                const ext = this.getExtensionFromUrl(url) || 'file';
                return `download_${timestamp}.${ext}`;
            }
            
            return filename;
        } catch {
            const timestamp = Date.now();
            return `download_${timestamp}.file`;
        }
    }

    getExtensionFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const ext = path.extname(urlObj.pathname);
            return ext ? ext.substring(1) : null;
        } catch {
            return null;
        }
    }

    async getFileInfo(url) {
        try {
            const response = await axios.head(url, {
                timeout: 10000
            });
            
            return {
                size: parseInt(response.headers['content-length'] || 0),
                type: response.headers['content-type'] || 'unknown',
                filename: this.getFilenameFromHeader(response.headers) || this.getFilenameFromUrl(url)
            };
        } catch (error) {
            return {
                size: 0,
                type: 'unknown',
                filename: this.getFilenameFromUrl(url)
            };
        }
    }

    getFilenameFromHeader(headers) {
        const disposition = headers['content-disposition'];
        if (disposition) {
            const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                return match[1].replace(/['"]/g, '');
            }
        }
        return null;
    }

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
}

module.exports = new Downloader();