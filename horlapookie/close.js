module.exports = {
    name: 'close',
    description: 'Close group - only admins can send messages (Admin/Owner only)',
    ownerOnly: false,
    adminOnly: true,
    async execute(sock, message, args, { isOwner, isAdmin, groupMetadata }) {
        const from = message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup) {
            return await sock.sendMessage(from, { 
                text: '❌ This command can only be used in groups!' 
            }, { quoted: message });
        }

        // Check if bot is admin
        try {
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = groupMetadata?.participants?.find(p => p.id === botNumber);
            const isBotAdmin = botParticipant?.admin !== null;

            if (!isBotAdmin) {
                return await sock.sendMessage(from, { 
                    text: '❌ Bot needs admin privileges to close the group!' 
                }, { quoted: message });
            }
        } catch (error) {
            console.log('Bot admin check error:', error);
        }

        if (!isAdmin && !isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ You need admin privileges to use this command!' 
            }, { quoted: message });
        }

        try {
            // Close group (restrict to admins only)
            await sock.groupSettingUpdate(from, 'announcement');

            await sock.sendMessage(from, { 
                text: '🔒 Group has been closed! Only admins can send messages now.' 
            }, { quoted: message });

        } catch (error) {
            console.error('Close command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to close group. Make sure bot has admin privileges!' 
            }, { quoted: message });
        }
    }
};