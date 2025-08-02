
module.exports = {
    name: 'unblock',
    description: 'Unblock a user on WhatsApp (owner only)',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let targetJid = null;
            
            // Check if providing a number
            if (args.length > 0) {
                let number = args[0].replace(/[^\d]/g, '');
                if (number.length >= 10) {
                    targetJid = number + '@s.whatsapp.net';
                }
            } else {
                await sock.sendMessage(from, {
                    text: `❌ Please provide the number to unblock!\n\n📝 **Usage:**\n• ${settings.prefix}unblock 2349xxxxxxxx\n\n⚠️ **Note:** This command is owner-only`
                });
                return;
            }

            await sock.updateBlockStatus(targetJid, 'unblock');
            
            await sock.sendMessage(from, {
                text: `✅ *USER UNBLOCKED*\n\n👤 **Target:** ${targetJid.split('@')[0]}\n⏰ **Time:** ${new Date().toLocaleString()}\n🔓 **Status:** Unblocked on WhatsApp\n\n💡 **Note:** User can now message again`
            });

        } catch (error) {
            console.error('Unblock command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error unblocking user. Please try again.'
            });
        }
    }
};
