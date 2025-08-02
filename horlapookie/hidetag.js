module.exports = {
    name: 'hidetag',
    description: 'Send a message with hidden tag to all group members (Owner only)',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        // Check if user is owner
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is only available to the bot owner!' 
            });
        }

        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            return await sock.sendMessage(from, { 
                text: '❌ This command can only be used in groups!' 
            });
        }

        // Check if message is provided
        if (args.length === 0) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide a message to send!\n\nUsage: ${settings.prefix}hidetag <message>` 
            });
        }

        try {
            // Get group metadata
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;

            // Create mention array
            const mentions = participants.map(p => p.id);

            // Send hidden tag message
            const hiddenTagMessage = args.join(' ');

            await sock.sendMessage(from, {
                text: hiddenTagMessage,
                mentions: mentions
            });

        } catch (error) {
            console.error('Hidetag command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to send hidden tag message. Please try again.' 
            });
        }
    }
};