module.exports = {
    name: 'tagall',
    description: 'Tag all members in a group (Owner only)',
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
        
        try {
            // Get group metadata
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            
            // Create mention array
            const mentions = participants.map(p => p.id);
            
            // Create tag message
            const tagMessage = args.length > 0 ? args.join(' ') : 'Everyone has been tagged!';
            let text = `📢 *${tagMessage}*\n\n`;
            
            // Add all participants
            participants.forEach((participant, index) => {
                const number = participant.id.split('@')[0];
                text += `${index + 1}. @${number}\n`;
            });
            
            text += `\n👑 Tagged by: ${settings.botName}`;
            
            await sock.sendMessage(from, {
                text: text,
                mentions: mentions
            });
            
        } catch (error) {
            console.error('Tagall command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to tag all members. Please try again.' 
            });
        }
    }
};
