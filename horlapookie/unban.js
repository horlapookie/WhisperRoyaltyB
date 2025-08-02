
module.exports = {
    name: 'unban',
    description: 'Unban a user from using the bot (owner only)',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let targetJid = null;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetJid = message.message.extendedTextMessage.contextInfo.participant || from;
            }
            // Check if mentioning someone
            else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // Check if providing a number
            else if (args.length > 0) {
                let number = args[0].replace(/[^\d]/g, '');
                if (number.length >= 10) {
                    targetJid = number + '@s.whatsapp.net';
                }
            }

            if (!targetJid) {
                await sock.sendMessage(from, {
                    text: `❌ Please specify who to unban!\n\n📝 **Usage:**\n• Reply to message: ${settings.prefix}unban\n• Mention user: ${settings.prefix}unban @user\n• Use number: ${settings.prefix}unban 2349xxxxxxxx\n\n⚠️ **Note:** This command is owner-only`
                });
                return;
            }

            // Load ban list
            const fs = require('fs');
            const banFile = './banned_users.json';
            let bannedUsers = [];
            
            if (fs.existsSync(banFile)) {
                bannedUsers = JSON.parse(fs.readFileSync(banFile, 'utf8'));
            }

            if (!bannedUsers.includes(targetJid)) {
                await sock.sendMessage(from, {
                    text: '❌ User is not banned!'
                });
                return;
            }

            bannedUsers = bannedUsers.filter(user => user !== targetJid);
            fs.writeFileSync(banFile, JSON.stringify(bannedUsers, null, 2));

            await sock.sendMessage(from, {
                text: `✅ *USER UNBANNED*\n\n👤 **Target:** ${targetJid.split('@')[0]}\n⏰ **Time:** ${new Date().toLocaleString()}\n🔓 **Status:** Can now use bot commands\n\n💡 **Note:** User access has been restored`
            });

        } catch (error) {
            console.error('Unban command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error unbanning user. Please try again.'
            });
        }
    }
};
