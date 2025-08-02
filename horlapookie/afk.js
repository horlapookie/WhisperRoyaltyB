const { addAfkUser, checkAfkUser, getAfkReason, getAfkTime, removeAfkUser } = require('../utils/afkHandler');

module.exports = {
    name: 'afk',
    description: 'Set yourself as Away From Keyboard',
    usage: 'afk [reason] | afk cancel',
    category: 'utility',
    cooldown: 3,

    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        try {
            // Check for cancel argument
            if (args[0] && args[0].toLowerCase() === 'cancel') {
                // Check if user is AFK
                if (!checkAfkUser(sender)) {
                    await sock.sendMessage(from, {
                        text: '⚠️ You are not currently marked as AFK!'
                    });
                    return;
                }

                // Get AFK details before removing
                const afkReason = getAfkReason(sender);
                const afkTime = getAfkTime(sender);

                // Remove user from AFK list
                removeAfkUser(sender);

                await sock.sendMessage(from, {
                    text: `✅ *AFK Status Cancelled*\n\n👤 *User:* @${sender.split('@')[0]}\n💭 *Previous Reason:* ${afkReason}\n⏰ *Was AFK Since:* ${new Date(afkTime).toLocaleString()}\n\n🎉 Welcome back!`,
                    mentions: [sender]
                });
                return;
            }

            const reason = args.join(' ') || 'No reason provided';
            const currentTime = new Date().toISOString();

            // Check if user is already AFK
            if (checkAfkUser(sender)) {
                await sock.sendMessage(from, {
                    text: '⚠️ You are already marked as AFK!'
                });
                return;
            }

            // Add user to AFK list
            addAfkUser(sender, currentTime, reason);

            await sock.sendMessage(from, {
                text: `✅ *AFK Status Set*\n\n👤 *User:* @${sender.split('@')[0]}\n💭 *Reason:* ${reason}\n⏰ *Time:* ${new Date(currentTime).toLocaleString()}\n\n📱 I'll notify others when they mention you!\n\n💡 Use \`${settings.prefix}afk cancel\` to remove AFK status`,
                mentions: [sender]
            });

        } catch (error) {
            console.error('AFK command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to process AFK command. Please try again.'
            });
        }
    }
};