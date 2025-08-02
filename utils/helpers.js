const axios = require('axios');
const BodyForm = require('form-data');
const { fromBuffer } = require('file-type');
const nodeFetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const { spawn } = require('child_process');

// Use node-fetch with a different name to avoid conflicts
const fetch = nodeFetch;

// Get buffer from URL
async function getBuffer(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.buffer();
    } catch (error) {
        console.error('getBuffer error:', error);
        throw error;
    }
}

// Telegraph upload
function TelegraPh(Path) {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(Path)) return reject(new Error("File not Found"));
        try {
            const form = new BodyForm();
            form.append("file", fs.createReadStream(Path));
            const data = await axios({
                url: "https://telegra.ph/upload",
                method: "POST",
                headers: {
                    ...form.getHeaders()
                },
                data: form
            });
            return resolve("https://telegra.ph" + data.data[0].src);
        } catch (err) {
            return reject(new Error(String(err)));
        }
    });
}

// Uguu upload
async function UploadFileUgu(input) {
    return new Promise(async (resolve, reject) => {
        const form = new BodyForm();
        form.append("files[]", fs.createReadStream(input));
        await axios({
            url: "https://uguu.se/upload.php",
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                ...form.getHeaders()
            },
            data: form
        }).then((data) => {
            resolve(data.data.files[0]);
        }).catch((err) => reject(err));
    });
}

// WebP to MP4 converter
function webp2mp4File(path) {
    return new Promise((resolve, reject) => {
        const form = new BodyForm();
        form.append('new-image-url', '');
        form.append('new-image', fs.createReadStream(path));
        axios({
            method: 'post',
            url: 'https://s6.ezgif.com/webp-to-mp4',
            data: form,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${form._boundary}`
            }
        }).then(({ data }) => {
            const bodyFormThen = new BodyForm();
            const $ = cheerio.load(data);
            const file = $('input[name="file"]').attr('value');
            bodyFormThen.append('file', file);
            bodyFormThen.append('convert', "Convert WebP to MP4!");
            axios({
                method: 'post',
                url: 'https://ezgif.com/webp-to-mp4/' + file,
                data: bodyFormThen,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}`
                }
            }).then(({ data }) => {
                const $ = cheerio.load(data);
                const result = 'https:' + $('div#output > p.outfile > video > source').attr('src');
                resolve({
                    status: true,
                    message: "Created By MRHRTZ",
                    result: result
                });
            }).catch(reject);
        }).catch(reject);
    });
}

// FloNime upload
async function floNime(medianya, options = {}) {
    const { ext } = await fromBuffer(medianya) || options.ext;
    var form = new BodyForm();
    form.append('file', medianya, 'tmp.' + ext);
    let jsonnya = await fetch('https://flonime.my.id/upload', {
        method: 'POST',
        body: form
    })
    .then((response) => response.json());
    return jsonnya;
}

// FFmpeg wrapper
function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    return new Promise(async (resolve, reject) => {
        try {
            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            let tmp = path.join(tempDir, Date.now() + '.' + ext);
            let out = tmp + '.' + ext2;
            await fs.promises.writeFile(tmp, buffer);
            spawn('ffmpeg', [
                '-y',
                '-i', tmp,
                ...args,
                out
            ])
            .on('error', reject)
            .on('close', async (code) => {
                try {
                    await fs.promises.unlink(tmp);
                    if (code !== 0) return reject(code);
                    resolve(await fs.promises.readFile(out));
                    await fs.promises.unlink(out);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toAudio(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-ac', '2',
        '-b:a', '128k',
        '-ar', '44100',
        '-f', 'mp3'
    ], ext, 'mp3');
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toPTT(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-compression_level', '10'
    ], ext, 'opus');
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension 
 */
function toVideo(buffer, ext) {
    return ffmpeg(buffer, [
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-ab', '128k',
        '-ar', '44100',
        '-crf', '32',
        '-preset', 'slow'
    ], ext, 'mp4');
}

// Utility functions
function isUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function getRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    getBuffer,
    TelegraPh,
    UploadFileUgu,
    webp2mp4File,
    floNime,
    ffmpeg,
    toAudio,
    toPTT,
    toVideo,
    isUrl,
    getRandom,
    formatSize,
    sleep
};