module.exports = {
    name: 'open',
    description: 'Open group - all members can send messages (Admin/Owner only)',
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
                    text: '❌ Bot needs admin privileges to open the group!' 
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
            // Get group metadata
            // const groupMetadata = await sock.groupMetadata(from); //groupMetadata is already passed as argument
            // const participants = groupMetadata.participants;

            // Get bot's JID properly
            //const botJid = sock.user.id.replace(':54@s.whatsapp.net', '@s.whatsapp.net');

            // Check if bot is admin using same method as tagall
            //const botNumber = sock.user.id.split(':')[0];
            //const botParticipant = participants.find(p => {
            //    const participantNumber = p.id.split('@')[0];
            //    return participantNumber === botNumber;
            //});

            //if (!botParticipant || !botParticipant.admin) {
            //    return await sock.sendMessage(from, { 
            //        text: '❌ Bot needs admin privileges to open the group!' 
            //    });
            //}

            // Check if user is admin or owner using same method as del command
            //const senderJid = message.key.participant || from;
            //const senderParticipant = participants.find(p => p.id === senderJid);
            //const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

            //if (!isOwner && !isAdmin) {
            //    return await sock.sendMessage(from, { 
            //        text: '❌ You need to be an admin to use this command!' 
            //    });
            //}

            // Open group (allow all members)
            await sock.groupSettingUpdate(from, 'not_announcement');

            await sock.sendMessage(from, { 
                text: '🔓 Group has been opened! All members can send messages now.' 
            }, { quoted: message });

        } catch (error) {
            console.error('Open command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to open group. Make sure bot has admin privileges!' 
            }, { quoted: message });
        }
    }
};