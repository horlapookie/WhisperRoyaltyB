
module.exports = {
    name: 'ban',
    description: 'Ban a user from using the bot (owner only)',
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
                    text: `❌ Please specify who to ban!\n\n📝 **Usage:**\n• Reply to message: ${settings.prefix}ban\n• Mention user: ${settings.prefix}ban @user\n• Use number: ${settings.prefix}ban 2349xxxxxxxx\n\n⚠️ **Note:** This command is owner-only`
                });
                return;
            }

            // Load or create ban list
            const fs = require('fs');
            const banFile = './banned_users.json';
            let bannedUsers = [];
            
            if (fs.existsSync(banFile)) {
                bannedUsers = JSON.parse(fs.readFileSync(banFile, 'utf8'));
            }

            if (bannedUsers.includes(targetJid)) {
                await sock.sendMessage(from, {
                    text: '❌ User is already banned!'
                });
                return;
            }

            bannedUsers.push(targetJid);
            fs.writeFileSync(banFile, JSON.stringify(bannedUsers, null, 2));

            await sock.sendMessage(from, {
                text: `🚫 *USER BANNED*\n\n👤 **Target:** ${targetJid.split('@')[0]}\n⏰ **Time:** ${new Date().toLocaleString()}\n🔒 **Status:** Banned from using bot\n\n⚠️ **Note:** User can no longer use bot commands`
            });

        } catch (error) {
            console.error('Ban command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error banning user. Please try again.'
            });
        }
    }
};
