module.exports = {
    name: 'help',
    aliases: ['menu', 'info'],
    description: 'Show all available commands and bot information',
    async execute(sock, message, args, { isOwner, settings, autoFeatures, isGroup, isDM, isChannel }) {
        const from = message.key.remoteJid;

        try {
            // Send Throne of Seal audio first
            const fs = require('fs');
            if (fs.existsSync('./throne_audio.mp3')) {
                await sock.sendMessage(from, {
                    audio: fs.readFileSync('./throne_audio.mp3'),
                    mimetype: 'audio/mpeg',
                    fileName: 'throne_of_seal.mp3',
                    caption: '🎵 *Previously on Throne of Seal...* 🎵\n\n👑 The legendary tale continues with YOUR HIGHNESS V1 BETA!'
                });
            }
            const path = require('path');
            const os = require('os');

            // Calculate uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            // Calculate memory usage
            const memUsage = process.memoryUsage();
            const totalMem = os.totalmem();
            const usedMem = memUsage.rss;
            const memPercent = ((usedMem / totalMem) * 100).toFixed(2);

            // Get all commands from horlapookie folder
            const commandFiles = fs.readdirSync('./horlapookie').filter(file => file.endsWith('.js'));
            let commandCount = commandFiles.length;

            // Categorize commands
            const categories = {
                'DOWNLOADER MENU': ['music', 'song', 'mp3', 'audio', 'video', 'vid', 'mp4', 'youtube'],
                'GROUP MENU': ['promote', 'demote', 'add', 'del', 'kick', 'close', 'open', 'tagall', 'hidetag'],
                'DEVELOPER MENU': ['exec', 'eval', 'system', 'logs', 'restart', 'broadcast'],
                'UTILITY MENU': ['sticker', 's2img', 's2vid', 'weather', 'translate', 'calculator'],
                'AI MENU': ['horlaai', 'ai', 'gemini', 'ask', 'chatgpt', 'gpt', 'dalle'],
                'FUN MENU': ['meme', 'joke', 'quote', 'fact', 'toon'],
                'OWNER MENU': ['ping', 'settings', 'private', 'public', 'runtime'],
                'OTHER MENU': ['help', 'menu', 'info', 'github', 'wikipedia', 'news', 'crypto']
            };

            const helpMessage = `╔〘 *🇳🇬 ${settings.botName.toUpperCase()} 🇳🇬* 〙
║ 👑 *Owner:* horlapookie 
║ 🧩 *Prefix:* [ ${settings.prefix} ]
║ 🖥️ *Host:* linux
║ 🧠 *Commands:* ${commandCount}
║ ⚙️ *Mode:* ${(settings.mode || 'public').charAt(0).toUpperCase() + (settings.mode || 'public').slice(1)}
║ ⏱️ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s
║ ⚡ *Ping:* Active
║ 📊 *RAM Used:* ${(usedMem / 1024 / 1024).toFixed(2)} MB / ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB
║ 🧬 *RAM:* [${memPercent < 20 ? '█' : '□'}${memPercent < 40 ? '█' : '□'}${memPercent < 60 ? '█' : '□'}${memPercent < 80 ? '█' : '□'}${memPercent < 100 ? '█' : '□'}] ${memPercent}%
╚═〘 *System Status* 〙

⎾═╼▣ *DOWNLOADER MENU*
︱✗ ${settings.prefix}music - Download audio from YouTube
︱✗ ${settings.prefix}video - Download video from YouTube (enhanced)
︱✗ ${settings.prefix}song - Download song as document
︱✗ ${settings.prefix}play - Download song (alias)
︱✗ ${settings.prefix}twitter - Download Twitter/X videos
︱✗ ${settings.prefix}tw - Download Twitter (alias)
︱✗ ${settings.prefix}x - Download X videos (alias)
︱✗ ${settings.prefix}twitteruser - Get Twitter user profile
︱✗ ${settings.prefix}twuser - Twitter user info (alias)
︱✗ ${settings.prefix}insta - Download Instagram posts/reels
︱✗ ${settings.prefix}i - Download Instagram (alias)
︱✗ ${settings.prefix}instagraminfo - Instagram settings & info
︱✗ ${settings.prefix}instainfo - Instagram info (alias)
︱✗ ${settings.prefix}yt - Download video by URL
︱✗ ${settings.prefix}ytv - Download video by URL (alias)
︱✗ ${settings.prefix}vs - Video search and download
︱✗ ${settings.prefix}mp3 - Download MP3 (alias)
︱✗ ${settings.prefix}audio - Download audio (alias)
︱✗ ${settings.prefix}mp4 - Download MP4 (alias)
︱✗ ${settings.prefix}vid - Download video (alias)
︱✗ ${settings.prefix}youtube - Download from YouTube (alias)
⎿═╼▣

⎾═╼▣ *ANIME & ADULT CONTENT*
︱✗ ${settings.prefix}anime - Search for anime information
︱✗ ${settings.prefix}animed - Download anime episodes
︱✗ ${settings.prefix}adult - Search adult content (18+)
︱✗ ${settings.prefix}hentai-link - Download from direct link (18+)
︱✗ ${settings.prefix}adultvideo - Search adult videos with real links (18+)
︱✗ ${settings.prefix}xvid - Adult video search (18+)
⎿═╼▣

⎾═╼▣ *IMAGE DOWNLOADER*
︱✗ ${settings.prefix}pokemon - Download Pokemon images by name
︱✗ ${settings.prefix}pinterest - Download Pinterest images by search
︱✗ ${settings.prefix}poke - Pokemon search (alias)
︱✗ ${settings.prefix}pin - Pinterest search (alias)
⎿═╼▣

⎾═╼▣ *ANIME MENU*
︱✗ ${settings.prefix}anime - Search for anime information
︱✗ ${settings.prefix}animesearch - Search anime (alias)
︱✗ ${settings.prefix}mal - MyAnimeList search (alias)
⎿═╼▣

⎾═╼▣ *ADULT CONTENT MENU* 🔞
︱✗ ${settings.prefix}adult - Search adult content
︱✗ ${settings.prefix}hentai - Search hentai content (alias)
︱✗ ${settings.prefix}nsfw - Search NSFW content (alias)
︱✗ ${settings.prefix}adultvideo - Search short adult videos
︱✗ ${settings.prefix}avideo - Adult video search (alias)
︱✗ ${settings.prefix}xvid - Adult clips search (alias)
︱✗ ${settings.prefix}nsfwvideo - NSFW video search (alias)
⎿═╼▣

⎾═╼▣ *MUSIC IDENTIFICATION*
︱✗ ${settings.prefix}shazam - Identify song from audio
︱✗ ${settings.prefix}lyrics - Get song lyrics
︱✗ ${settings.prefix}songinfo - Get detailed song info
︱✗ ${settings.prefix}artist - Get artist information
︱✗ ${settings.prefix}album - Get album information
⎿═╼▣

⎾═╼▣ *GROUP MENU*
︱✗ ${settings.prefix}promote - Promote user to admin 🛡️
︱✗ ${settings.prefix}demote - Demote admin to user 🛡️
︱✗ ${settings.prefix}add - Add user to group 🛡️
︱✗ ${settings.prefix}del - Remove user from group 🛡️
︱✗ ${settings.prefix}close - Close group (admins only) 🛡️
︱✗ ${settings.prefix}open - Open group (all members) 🛡️
︱✗ ${settings.prefix}tagall - Tag all members 👑
︱✗ ${settings.prefix}hidetag - Hidden tag message 👑
⎿═╼▣

⎾═╼▣ *DEVELOPER MENU*
︱✗ ${settings.prefix}exec - Execute shell commands 👑
︱✗ ${settings.prefix}eval - Evaluate JavaScript code 👑
︱✗ ${settings.prefix}system - Show system information 👑
︱✗ ${settings.prefix}logs - View recent bot logs 👑
︱✗ ${settings.prefix}restart - Restart the bot 👑
︱✗ ${settings.prefix}broadcast - Send message to all chats 👑
⎿═╼▣

⎾═╼▣ *AFK MENU*
︱✗ ${settings.prefix}afk [reason] - Set yourself as Away From Keyboard
︱✗ ${settings.prefix}afk cancel - Remove your AFK status
⎿═╼▣

⎾═╼▣ *AI & UTILITY MENU*
︱✗ ${settings.prefix}ai - Chat with Gemini AI
︱✗ ${settings.prefix}chatgpt - Chat with GPT-4
︱✗ ${settings.prefix}gpt - Chat with ChatGPT (alias)
︱✗ ${settings.prefix}dalle - Generate images with AI
︱✗ ${settings.prefix}whisper - Speech to text conversion
︱✗ ${settings.prefix}translate - Translate text
︱✗ ${settings.prefix}weather - Get weather info
︱✗ ${settings.prefix}calculator - Mathematical calculator
︱✗ ${settings.prefix}dictionary - Get word definitions
︱✗ ${settings.prefix}dict - Dictionary lookup (alias)
︱✗ ${settings.prefix}define - Get word meaning (alias)
︱✗ ${settings.prefix}urban - Get Urban Dictionary meanings
︱✗ ${settings.prefix}ud - Urban Dictionary (alias)
︱✗ ${settings.prefix}sticker - Create sticker from image
︱✗ ${settings.prefix}s2img - Convert sticker to image
︱✗ ${settings.prefix}s2vid - Convert sticker to video
⎿═╼▣

⎾═╼▣ *FUN & INFO MENU*
︱✗ ${settings.prefix}meme - Get random memes
︱✗ ${settings.prefix}joke - Get random jokes
︱✗ ${settings.prefix}quote - Get inspirational quotes
︱✗ ${settings.prefix}fact - Get interesting facts
︱✗ ${settings.prefix}crypto - Cryptocurrency prices
︱✗ ${settings.prefix}news - Latest news headlines
︱✗ ${settings.prefix}github - GitHub user info
︱✗ ${settings.prefix}wikipedia - Search Wikipedia
⎿═╼▣

⎾═╼▣ *OWNER MENU*
︱✗ ${settings.prefix}ping - Check bot status 👑
︱✗ ${settings.prefix}runtime - Show bot runtime 👑
︱✗ ${settings.prefix}settings - Bot configuration 👑
︱✗ ${settings.prefix}private - Set private mode 👑
︱✗ ${settings.prefix}public - Set public mode 👑
︱✗ ${settings.prefix}vv - Bypass view once 👑
︱✗ ${settings.prefix}vv2 - Secret bypass view once 👑
︱✗ ${settings.prefix}toviewonce - Convert to view once 👑
︱✗ ${settings.prefix}save - Save media from status 👑
︱✗ ${settings.prefix}ban - Ban user 👑
︱✗ ${settings.prefix}unban - Unban user 👑
︱✗ ${settings.prefix}block - Block user 👑
︱✗ ${settings.prefix}unblock - Unblock user 👑
︱✗ ${settings.prefix}clearchat - Clear chat 👑
⎿═╼▣

⎾═╼▣ *AUTO FEATURES STATUS*
︱👀 View Status: ${autoFeatures.viewStatus ? '🟢 ON' : '🔴 OFF'}
︱⌨️ Auto Typing: ${autoFeatures.autoTyping ? '🟢 ON' : '🔴 OFF'}
︱❤️ Auto React: ${autoFeatures.autoReact ? '🟢 ON' : '🔴 OFF'} (${autoFeatures.reactEmoji})
︱🎙️ Auto Recording: ${autoFeatures.autoRecording ? '🟢 ON' : '🔴 OFF'}
︱👋 Welcome/Leave: ${autoFeatures.welcomeGreeting ? '🟢 ON' : '🔴 OFF'}
︱🎤 Voice Commands: ${settings.voiceCommands ? '🟢 ON' : '🔴 OFF'}
⎿═╼▣

⎾═╼▣ *TOOLS MENU*
︱✗ ${settings.prefix}sticker - Convert image/video to sticker
︱✗ ${settings.prefix}s2img - Sticker to image
︱✗ ${settings.prefix}s2vid - Sticker to video
︱✗ ${settings.prefix}tst - Convert text to sticker
︱✗ ${settings.prefix}attp - Text to sticker (alias)
︱✗ ${settings.prefix}removebg - Remove background from image
︱✗ ${settings.prefix}bg - Remove background (alias)
︱✗ ${settings.prefix}rembg - Remove background (alias)
︱✗ ${settings.prefix}tovideo - Convert to video
︱✗ ${settings.prefix}toimage - Convert to image
︱✗ ${settings.prefix}qr - Generate QR code (enhanced)
︱✗ ${settings.prefix}qrcode - Generate QR code (alias)
︱✗ ${settings.prefix}qrscan - Scan QR code from image
︱✗ ${settings.prefix}togif - Convert video to GIF
︱✗ ${settings.prefix}fliptext - Flip text upside down
︱✗ ${settings.prefix}tts - Text to speech
︱✗ ${settings.prefix}stt - Speech to text
︱✗ ${settings.prefix}toon - Image to cartoon
︱✗ ${settings.prefix}text2pdf - Text to PDF document
︱✗ ${settings.prefix}take - Take sticker ownership
︱✗ ${settings.prefix}time - Show current time
︱✗ ${settings.prefix}weather - Get weather info
⎿═╼▣

⎾═╼▣ *SECURITY MENU* (Owner Only)
︱✗ ${settings.prefix}nmap - Perform network mapping 👑
︱✗ ${settings.prefix}metasploit - Run Metasploit commands 👑
⎿═╼▣

⎾═╼▣ *VOICE ACCESSIBILITY*
︱🎤 Send voice messages starting with "${settings.prefix}"
︱🗣️ Example: Say "${settings.prefix}ping" or "${settings.prefix}weather London"
︱⚙️ ${settings.prefix}voicecmd - Manage voice command settings
⎿═╼▣

⎾═╼▣ *OTHER MENU*
︱✗ ${settings.prefix}help - Show this menu
︱✗ ${settings.prefix}menu - Show this menu (alias)
︱✗ ${settings.prefix}info - Show this menu (alias)
︱✗ ${settings.prefix}profile - Get user profile
⎿═╼▣

*LEGEND:*
👑 Owner Only | 🛡️ Admin Only | 🔒 Private Only

*Your Status:* ${isOwner ? 'Owner 👑' : 'User'}
*Chat Type:* ${isGroup ? 'Group' : isDM ? 'Private' : 'Channel'}
*Bot Version:* v1 beta

🚀 *Ready to serve!* Type ${settings.prefix}ping to test

📢 *JOIN OUR OFFICIAL CHANNEL*
Click here to join for updates & announcements:
https://whatsapp.com/channel/0029Vb6AZrY2f3EMgD8kRQ01`;

            // Send with profile picture
            try {
                let imageSent = false;

                // Try PNG first, then SVG
                if (fs.existsSync('./profile2.png')) {
                    await sock.sendMessage(from, { 
                        image: fs.readFileSync('./profile2.png'),
                        caption: helpMessage
                    });
                    imageSent = true;
                } else if (fs.existsSync('./profile2.svg')) {
                    await sock.sendMessage(from, { 
                        image: fs.readFileSync('./profile2.svg'),
                        caption: helpMessage
                    });
                    imageSent = true;
                }

                if (!imageSent) {
                    await sock.sendMessage(from, { text: helpMessage });
                }
            } catch (imgError) {
                await sock.sendMessage(from, { text: helpMessage });
            }

        } catch (error) {
            console.error('Help command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to load help information. Please try again.' 
            });
        }
    }
};