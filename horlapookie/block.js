
module.exports = {
    name: 'block',
    description: 'Block a user on WhatsApp (owner only)',
    ownerOnly: true,
    privateOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            // In DM, block the person you're chatting with
            if (from.includes('@s.whatsapp.net')) {
                await sock.updateBlockStatus(from, 'block');
                
                await sock.sendMessage(from, {
                    text: `🚫 *USER BLOCKED*\n\n👤 **Target:** ${from.split('@')[0]}\n⏰ **Time:** ${new Date().toLocaleString()}\n🔒 **Status:** Blocked on WhatsApp\n\n⚠️ **Note:** This user is now blocked`
                });
            } else {
                await sock.sendMessage(from, {
                    text: '❌ This command can only be used in DMs to block that specific user!'
                });
            }

        } catch (error) {
            console.error('Block command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error blocking user. Please try again.'
            });
        }
    }
};
