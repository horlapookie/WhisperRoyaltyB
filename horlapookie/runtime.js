
module.exports = {
    name: 'runtime',
    description: 'Show bot runtime and system information',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            const os = require('os');
            
            // Calculate uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            // Memory usage
            const memUsage = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memPercent = ((usedMem / totalMem) * 100).toFixed(2);

            // CPU information
            const cpus = os.cpus();
            const platform = os.platform();
            const arch = os.arch();
            const nodeVersion = process.version;

            const runtimeMessage = `🚀 *BOT RUNTIME INFORMATION*

⏱️ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s
🧠 *Memory Usage:* ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB
📊 *Total System Memory:* ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB
🔄 *Memory Used:* ${memPercent}%
💾 *Free Memory:* ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB

💻 *System Information:*
• Platform: ${platform}
• Architecture: ${arch}
• Node.js Version: ${nodeVersion}
• CPU Cores: ${cpus.length}
• CPU Model: ${cpus[0]?.model || 'Unknown'}

📈 *Process Information:*
• PID: ${process.pid}
• Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
• Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
• External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB

🔧 *Bot Status:* Active & Running
⚡ *Performance:* Optimal`;

            await sock.sendMessage(from, { text: runtimeMessage });

        } catch (error) {
            console.error('Runtime command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to get runtime information. Please try again.' 
            });
        }
    }
};
