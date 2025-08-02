const { exec } = require('child_process');
const fs = require('fs');

const getRandom = (ext) => { 
    return `${Math.floor(Math.random() * 10000)}${ext}` 
};

module.exports = {
    name: 'song',
    description: 'Download song as document',
    aliases: ['play'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args[0]) {
            return await sock.sendMessage(from, { 
                text: `❌ *Enter song name*\n\nExample: ${settings.prefix}song Despacito` 
            }, { quoted: message });
        }

        const query = args.join(' ');
        let downloadMsg;
        let filepath;

        try {
            downloadMsg = await sock.sendMessage(from, { 
                text: '🔍 Searching and downloading song...' 
            }, { quoted: message });

            // Create temp directory
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const filename = getRandom('.mp3');
            filepath = `${tempDir}/${filename}`;

            // Use yt-dlp with Python path for reliable downloads
            const command = `python3 -m yt_dlp -x --audio-format mp3 --audio-quality 0 --add-metadata -o "${filepath}" "ytsearch:${query}"`;
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Download timeout'));
                }, 90000); // 90 seconds for song downloads

                exec(command, (error, stdout, stderr) => {
                    clearTimeout(timeout);
                    if (error) {
                        console.log('Song download error:', error);
                        reject(error);
                    } else {
                        console.log('Song download success');
                        resolve(stdout);
                    }
                });
            });

            await sock.sendMessage(from, { delete: downloadMsg.key });

            // Find the downloaded file
            const files = fs.readdirSync(tempDir).filter(f => f.includes(filename.replace('.mp3', '')));
            const actualFile = files.length > 0 ? `${tempDir}/${files[0]}` : filepath;

            if (fs.existsSync(actualFile)) {
                const stats = fs.statSync(actualFile);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                // Check file size
                if (stats.size > 50 * 1024 * 1024) {
                    fs.unlinkSync(actualFile);
                    return await sock.sendMessage(from, { 
                        text: `❌ Song file too large (${fileSizeMB}MB). Try a shorter song.` 
                    }, { quoted: message });
                }

                // Extract title from filename or use query
                const title = files[0] ? files[0].replace('.mp3', '').replace(/^\d+\./, '') : query;

                await sock.sendMessage(from, {
                    document: fs.readFileSync(actualFile),
                    mimetype: "audio/mpeg", 
                    fileName: `${title}.mp3`,
                    caption: `🎵 *${title}*\n\n📦 Size: ${fileSizeMB} MB\n⬇️ Downloaded by ${settings.botName}`
                }, { quoted: message });

                fs.unlinkSync(actualFile);
                console.log("Song sent successfully");

            } else {
                throw new Error("Song file not found");
            }

        } catch (err) {
            console.log("Song error:", err);
            
            if (downloadMsg) {
                try {
                    await sock.sendMessage(from, { delete: downloadMsg.key });
                } catch (e) {}
            }
            
            await sock.sendMessage(from, { 
                text: `❌ Failed to download song. Try:\n1. A different search term\n2. A more specific song name\n3. Adding artist name` 
            }, { quoted: message });
        } finally {
            // Cleanup
            if (filepath && fs.existsSync(filepath)) {
                try {
                    fs.unlinkSync(filepath);
                } catch (e) {}
            }
        }
    }
};