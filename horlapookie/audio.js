const { exec } = require('child_process');
const fs = require('fs');
const yts = require('yt-search');

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports = {
    name: 'audio',
    description: 'Download youtube audio',
    aliases: ['aud', 'yta', 'mp3'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args[0]) {
            return await sock.sendMessage(from, { 
                text: `❎ *Enter search term or YouTube URL*\n\nExample: ${settings.prefix}audio Despacito` 
            }, { quoted: message });
        }

        const query = args.join(' ');
        let downloadMsg;
        let filepath;
        
        try {
            downloadMsg = await sock.sendMessage(from, { 
                text: '🔍 Searching and downloading audio...' 
            }, { quoted: message });

            // Create temp directory
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const filename = getRandom('.mp3');
            filepath = `${tempDir}/${filename}`;

            // Use yt-dlp with Python path for reliable downloads
            const command = `python3 -m yt_dlp -x --audio-format mp3 --audio-quality 0 -o "${filepath}" "ytsearch:${query}"`;
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Download timeout'));
                }, 60000);

                exec(command, (error, stdout, stderr) => {
                    clearTimeout(timeout);
                    if (error) {
                        console.log('yt-dlp error:', error);
                        reject(error);
                    } else {
                        console.log('yt-dlp success:', stdout);
                        resolve(stdout);
                    }
                });
            });

            await sock.sendMessage(from, { delete: downloadMsg.key });

            // Find the downloaded file (yt-dlp might add extra info to filename)
            const files = fs.readdirSync(tempDir).filter(f => f.includes(filename.replace('.mp3', '')));
            const actualFile = files.length > 0 ? `${tempDir}/${files[0]}` : filepath;

            if (fs.existsSync(actualFile)) {
                const stats = fs.statSync(actualFile);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                // Check file size
                if (stats.size > 25 * 1024 * 1024) {
                    fs.unlinkSync(actualFile);
                    return await sock.sendMessage(from, { 
                        text: `❌ Audio file too large (${fileSizeMB}MB). Try a shorter song.` 
                    }, { quoted: message });
                }

                await sock.sendMessage(from, {
                    audio: fs.readFileSync(actualFile),
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: message });

                fs.unlinkSync(actualFile);
                console.log("Audio sent successfully");
            } else {
                throw new Error("Audio file not found");
            }
            
        } catch (err) {
            console.log("Audio error:", err);
            
            if (downloadMsg) {
                try {
                    await sock.sendMessage(from, { delete: downloadMsg.key });
                } catch (e) {}
            }
            
            await sock.sendMessage(from, { 
                text: `❌ Failed to download audio. Try a different search term or check if the song exists.` 
            }, { quoted: message });
        } finally {
            // Cleanup any remaining files
            if (filepath && fs.existsSync(filepath)) {
                try {
                    fs.unlinkSync(filepath);
                } catch (e) {}
            }
        }
    }
};