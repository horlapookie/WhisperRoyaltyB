
module.exports = {
    name: 'del',
    description: 'Delete a message (Admin/Owner only)',
    ownerOnly: false,
    adminOnly: true,
    async execute(sock, message, args, { isOwner, settings, isDM, isChannel, isGroup }) {
        const from = message.key.remoteJid;

        try {
            // Check if user is admin or owner (for groups)
            if (isGroup) {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                
                const senderJid = message.key.participant || from;
                const senderParticipant = participants.find(p => p.id === senderJid);
                const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);
                
                if (!isOwner && !isAdmin) {
                    return await sock.sendMessage(from, { 
                        text: '❌ You need to be an admin to delete messages!' 
                    });
                }
            } else if (!isOwner) {
                // In DMs or channels, only owner can delete
                return await sock.sendMessage(from, { 
                    text: '❌ Only the owner can delete messages!' 
                });
            }

            // Check if this is a reply to a message
            if (!message.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                return await sock.sendMessage(from, { 
                    text: `❌ Please reply to a message to delete it!\n\nUsage: Reply to a message and type ${settings.prefix}del` 
                });
            }

            // Get the quoted message key
            const quotedKey = {
                remoteJid: from,
                id: message.message.extendedTextMessage.contextInfo.stanzaId,
                participant: message.message.extendedTextMessage.contextInfo.participant
            };

            // Delete the message
            await sock.sendMessage(from, { delete: quotedKey });
            
            // Send confirmation (this will also be deleted after 3 seconds)
            const confirmMsg = await sock.sendMessage(from, { 
                text: '✅ Message deleted!' 
            });

            // Auto-delete confirmation after 3 seconds
            setTimeout(async () => {
                try {
                    await sock.sendMessage(from, { delete: confirmMsg.key });
                } catch (error) {
                    // Ignore errors when deleting confirmation
                }
            }, 3000);

        } catch (error) {
            console.error('Delete command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to delete message. Make sure I have permission to delete messages.' 
            });
        }
    }
};
