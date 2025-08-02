
module.exports = {
    name: 'add',
    description: 'Add a user to the group (Admin/Owner only)',
    ownerOnly: false,
    adminOnly: true,
    async execute(sock, message, args, { isOwner, settings, isDM, isChannel, isGroup }) {
        const from = message.key.remoteJid;
        
        // Check if it's a group
        if (!isGroup) {
            return await sock.sendMessage(from, { 
                text: '❌ This command can only be used in groups!' 
            });
        }

        // Check if number is provided
        if (args.length === 0) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide a phone number!\n\nUsage: ${settings.prefix}add <number>` 
            });
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
                    text: `❌ Bot needs to be admin to add users!\n\n🤖 **Bot Status:** ${botParticipant ? 'Member' : 'Not Found'}\n💡 Make the bot an admin first.` 
                });
            }

            // Check if user is admin or owner
            const senderJid = message.key.participant || from;
            const senderParticipant = participants.find(p => p.id === senderJid);
            const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);
            
            if (!isOwner && !isAdmin) {
                return await sock.sendMessage(from, { 
                    text: '❌ You need to be an admin to use this command!' 
                });
            }

            // Clean and validate number
            const number = args[0].replace(/[^0-9]/g, '');
            if (!number) {
                return await sock.sendMessage(from, { 
                    text: '❌ Please provide a valid phone number!' 
                });
            }

            const targetJid = number + '@s.whatsapp.net';

            // Check if user is already in group
            const isAlreadyMember = participants.some(p => p.id === targetJid);
            if (isAlreadyMember) {
                return await sock.sendMessage(from, { 
                    text: '❌ User is already in this group!' 
                });
            }

            // Add user
            const result = await sock.groupParticipantsUpdate(from, [targetJid], 'add');
            
            if (result[0].status === '200') {
                await sock.sendMessage(from, { 
                    text: `✅ @${number} has been added to the group!`,
                    mentions: [targetJid]
                });
            } else {
                await sock.sendMessage(from, { 
                    text: `❌ Failed to add @${number}. They might have privacy settings that prevent adding.`,
                    mentions: [targetJid]
                });
            }

        } catch (error) {
            console.error('Add command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to add user. Please try again.' 
            });
        }
    }
};
