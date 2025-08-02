const os = require('os');
const fs = require('fs');

module.exports = {
    name: 'system',
    description: 'Show system information (Owner only)',
    aliases: ['sys', 'sysinfo', 'server'],
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        // Check if user is owner
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is only available to the bot owner!' 
            });
        }

        try {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const memory = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;

            // Get storage info
            let storageInfo = 'N/A';
            try {
                const stats = fs.statSync('./');
                storageInfo = 'Available';
            } catch (e) {
                storageInfo = 'Error reading';
            }

            const systemInfo = `🖥️ *SYSTEM INFORMATION*

📊 *Process Info:*
• Uptime: ${hours}h ${minutes}m ${seconds}s
• Node.js: ${process.version}
• Platform: ${os.platform()} ${os.arch()}
• CPU: ${os.cpus()[0].model}

💾 *Memory Usage:*
• Used: ${(memory.rss / 1024 / 1024).toFixed(2)} MB
• Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
• Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB
• System Used: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB
• System Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB

🔧 *System Stats:*
• OS: ${os.type()} ${os.release()}
• Architecture: ${os.arch()}
• CPU Cores: ${os.cpus().length}
• Load Average: ${os.loadavg().map(l => l.toFixed(2)).join(', ')}
• Storage: ${storageInfo}

🤖 *Bot Stats:*
• Process ID: ${process.pid}
• Environment: ${process.env.NODE_ENV || 'development'}
• Bot Name: ${settings.botName}
• Prefix: ${settings.prefix}
• Mode: ${settings.mode}`;

            await sock.sendMessage(from, { text: systemInfo });

        } catch (error) {
            console.error('System command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to get system information. Please try again.' 
            });
        }
    }
};