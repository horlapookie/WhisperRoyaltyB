module.exports = {
    name: 'ping',
    description: 'Check bot response time and status',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            const start = Date.now();
            
            // Send initial ping message
            const sentMessage = await sock.sendMessage(from, { 
                text: '🏓 Pinging...' 
            });
            
            const end = Date.now();
            const responseTime = end - start;
            
            // Calculate uptime
            const uptime = process.uptime();
            const uptimeHours = Math.floor(uptime / 3600);
            const uptimeMinutes = Math.floor((uptime % 3600) / 60);
            const uptimeSeconds = Math.floor(uptime % 60);
            
            // Get memory usage
            const memoryUsage = process.memoryUsage();
            const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
            
            const pongMessage = `🏓 *Pong!*\n\n` +
                `⚡ *Response Time:* ${responseTime}ms\n` +
                `🤖 *Bot:* ${settings.botName}\n` +
                `🔑 *Prefix:* ${settings.prefix}\n` +
                `⏰ *Uptime:* ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s\n` +
                `💾 *Memory Usage:* ${memoryUsedMB}MB\n` +
                `📱 *Platform:* Node.js ${process.version}\n` +
                `👑 *Owner:* ${isOwner ? 'Yes' : 'No'}\n\n` +
                `✅ Bot is running smoothly!`;
            
            // Send pong with profile picture
            const fs = require('fs');
            try {
                let imageSent = false;
                
                // Try PNG first, then SVG
                if (fs.existsSync('./profile1.png')) {
                    await sock.sendMessage(from, { 
                        image: fs.readFileSync('./profile1.png'),
                        caption: pongMessage
                    });
                    imageSent = true;
                } else if (fs.existsSync('./profile1.svg')) {
                    await sock.sendMessage(from, { 
                        image: fs.readFileSync('./profile1.svg'),
                        caption: pongMessage
                    });
                    imageSent = true;
                }
                
                if (!imageSent) {
                    await sock.sendMessage(from, { text: pongMessage });
                }
            } catch (imgError) {
                await sock.sendMessage(from, { text: pongMessage });
            }
            
        } catch (error) {
            console.error('Ping command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to ping. Please try again.' 
            });
        }
    }
};
