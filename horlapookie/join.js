
module.exports = {
    name: 'join',
    description: 'Join a WhatsApp group using invite link',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            const inviteLink = args.join(' ').trim();
            
            if (!inviteLink) {
                await sock.sendMessage(from, {
                    text: `❌ Please provide a group invite link!\n\n🔗 **Usage:**\n${settings.prefix}join https://chat.whatsapp.com/xxxxxxxx\n\n💡 **Tip:** Paste the complete WhatsApp group invite link`
                });
                return;
            }

            // Extract invite code from the link
            const inviteCodeMatch = inviteLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
            
            if (!inviteCodeMatch) {
                await sock.sendMessage(from, {
                    text: '❌ Invalid WhatsApp group invite link format!\n\nPlease use a valid link like:\nhttps://chat.whatsapp.com/xxxxxxxx'
                });
                return;
            }

            const inviteCode = inviteCodeMatch[1];
            
            await sock.sendMessage(from, {
                text: '🔄 Attempting to join group... Please wait!'
            });

            try {
                // Accept group invite
                const result = await sock.groupAcceptInvite(inviteCode);
                
                await sock.sendMessage(from, {
                    text: `✅ *Successfully joined group!*\n\n📱 **Group ID:** ${result}\n🎉 **Status:** Bot is now active in the group\n\n💡 **Note:** The bot will now respond to commands in this group according to your settings.`
                });

                // Send a welcome message to the group
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(result, {
                            text: `👋 *Hello everyone!*\n\n🤖 I'm ${settings.botName} and I've just joined this group!\n\n🔧 **Quick Info:**\n• Prefix: ${settings.prefix}\n• Type ${settings.prefix}help to see all commands\n• Owner only commands require permission\n\n🎉 **Ready to serve!**`
                        });
                    } catch (welcomeError) {
                        console.log('Failed to send welcome message to group:', welcomeError);
                    }
                }, 2000);

            } catch (joinError) {
                console.error('Failed to join group:', joinError);
                
                let errorMessage = '❌ Failed to join group. ';
                
                if (joinError.message?.includes('invite')) {
                    errorMessage += 'The invite link may be invalid or expired.';
                } else if (joinError.message?.includes('not-authorized')) {
                    errorMessage += 'Bot is not authorized to join this group.';
                } else if (joinError.message?.includes('group-not-found')) {
                    errorMessage += 'Group not found or invite has been revoked.';
                } else {
                    errorMessage += 'Please check the invite link and try again.';
                }

                await sock.sendMessage(from, { text: errorMessage });
            }

        } catch (error) {
            console.error('Join command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error processing join command. Please try again with a valid group invite link.'
            });
        }
    }
};
