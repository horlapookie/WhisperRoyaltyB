const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'logs',
    description: 'View recent bot logs (Owner only)',
    aliases: ['log', 'debug', 'console'],
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
            // Get number of lines to show (default 50, max 200)
            const lines = Math.min(parseInt(args[0]) || 50, 200);

            // Capture recent console logs
            const recentLogs = [];
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            // Create a simple log capture (this would need to be set up globally in a real implementation)
            const logHistory = global.logHistory || [];
            
            if (logHistory.length === 0) {
                return await sock.sendMessage(from, { 
                    text: '📝 No recent logs available.\n\n💡 Tip: Logs are captured in real-time. Use the bot for a while then check logs again.' 
                });
            }

            const recentEntries = logHistory.slice(-lines);
            const logText = recentEntries.map(entry => {
                const timestamp = new Date(entry.timestamp).toLocaleTimeString();
                return `[${timestamp}] ${entry.level}: ${entry.message}`;
            }).join('\n');

            const truncatedLogs = logText.length > 3000 ? 
                logText.substring(0, 3000) + '\n...[truncated]' : logText;

            await sock.sendMessage(from, { 
                text: `📝 *Recent Bot Logs* (${recentEntries.length} entries)\n\`\`\`\n${truncatedLogs}\n\`\`\`` 
            });

        } catch (error) {
            console.error('Logs command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to retrieve logs. Please try again.' 
            });
        }
    }
};