module.exports = {
    name: 'restart',
    description: 'Restart the bot (Owner only)',
    aliases: ['reboot', 'reload'],
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
            await sock.sendMessage(from, { 
                text: '🔄 Restarting bot... Please wait!' 
            });

            // Close the socket connection gracefully
            if (sock.ws) {
                sock.ws.close();
            }

            // Exit the process - PM2 or similar process manager should restart it
            setTimeout(() => {
                process.exit(0);
            }, 2000);

        } catch (error) {
            console.error('Restart command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to restart bot. Please try again.' 
            });
        }
    }
};