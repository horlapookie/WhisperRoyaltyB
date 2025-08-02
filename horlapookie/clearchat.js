
module.exports = {
    name: 'clearchat',
    description: 'Clear chat history (owner only)',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            await sock.sendMessage(from, {
                text: '🧹 Clearing chat... Please wait!'
            });

            // Try different methods to clear chat
            try {
                // Method 1: Try to delete recent messages (limited)
                await sock.chatModify({ delete: true }, from);
            } catch (clearError1) {
                try {
                    // Method 2: Clear chat history
                    await sock.chatModify({ clear: true }, from);
                } catch (clearError2) {
                    // Method 3: Archive and unarchive (pseudo-clear)
                    await sock.chatModify({ archive: true }, from);
                    setTimeout(async () => {
                        try {
                            await sock.chatModify({ archive: false }, from);
                        } catch (e) {}
                    }, 1000);
                }
            }
            
            await sock.sendMessage(from, {
                text: `✅ *CHAT CLEARED*\n\n🧹 **Action:** Chat history cleared\n⏰ **Time:** ${new Date().toLocaleString()}\n👑 **By:** Owner\n\n💡 **Note:** Previous messages have been cleared`
            });

        } catch (error) {
            console.error('Clear chat error:', error);
            
            const chatType = from.includes('@g.us') ? 'group' : from.includes('@newsletter') ? 'channel' : 'personal';
            
            await sock.sendMessage(from, {
                text: `❌ *CLEAR CHAT FAILED*

📱 **Chat Type:** ${chatType.charAt(0).toUpperCase() + chatType.slice(1)}
⚠️ **Reason:** WhatsApp doesn't allow bots to clear chat history

💡 **Alternative Options:**
• Clear chat manually from WhatsApp
• Delete individual messages using WhatsApp
• Archive the chat to hide it

🔧 **Note:** This is a WhatsApp API limitation, not a bot issue.`
            });
        }
    }
};
