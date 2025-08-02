module.exports = {
    name: 'promote',
    description: 'Promote a user to admin (Admin/Owner only)',
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
                    text: '❌ Bot needs admin privileges to promote members!' 
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
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;

            // Check if bot is admin using same method as tagall
            const botNumber = sock.user.id.split(':')[0];
            const botParticipant = participants.find(p => {
                const participantNumber = p.id.split('@')[0];
                return participantNumber === botNumber;
            });

            if (!botParticipant || !['admin', 'superadmin'].includes(botParticipant.admin)) {
                return await sock.sendMessage(from, { 
                    text: `❌ Bot needs to be admin to promote users!\n\n🤖 **Bot Status:** ${botParticipant ? 'Member' : 'Not Found'}\n💡 Make the bot an admin first.` 
                });
            }

            // Check if user is admin or owner using same method as del command
            const senderJid = message.key.participant || from;
            const senderParticipant = participants.find(p => p.id === senderJid);
            const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

            if (!isOwner && !isAdmin) {
                return await sock.sendMessage(from, { 
                    text: '❌ You need to be an admin to use this command!' 
                });
            }

            // Get target user from reply or mention
            let targetJid = null;
            if (message.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetJid = message.message.extendedTextMessage.contextInfo.participant;
            } else if (message.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[0]) {
                // Try to construct JID from number
                const number = args[0].replace(/[^0-9]/g, '');
                if (number) {
                    targetJid = number + '@s.whatsapp.net';
                }
            }

            if (!targetJid) {
                return await sock.sendMessage(from, { 
                    text: `❌ Please reply to a message or mention a user!\n\nUsage: ${settings.prefix}promote @user` 
                });
            }

            // Check if target is in group
            const targetParticipant = participants.find(p => p.id === targetJid);
            if (!targetParticipant) {
                return await sock.sendMessage(from, { 
                    text: '❌ User is not in this group!' 
                });
            }

            // Check if target is already admin
            if (['admin', 'superadmin'].includes(targetParticipant.admin)) {
                return await sock.sendMessage(from, { 
                    text: '❌ User is already an admin!' 
                });
            }

            // Promote user
            await sock.groupParticipantsUpdate(from, [targetJid], 'promote');

            await sock.sendMessage(from, { 
                text: `✅ @${targetJid.split('@')[0]} has been promoted to admin!`,
                mentions: [targetJid]
            });

        } catch (error) {
            console.error('Promote command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to promote user. Please try again.' 
            });
        }
    }
};