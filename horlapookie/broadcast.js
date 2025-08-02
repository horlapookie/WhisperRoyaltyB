module.exports = {
    name: 'broadcast',
    description: 'Send a message to all groups/contacts (Owner only)',
    aliases: ['bc', 'announce', 'mass'],
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        // Check if user is owner
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is only available to the bot owner!' 
            });
        }

        if (!args.length) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide a message to broadcast!\n\nExample: ${settings.prefix}broadcast Hello everyone!` 
            });
        }

        const broadcastMessage = args.join(' ');

        try {
            await sock.sendMessage(from, { 
                text: '🔄 Starting broadcast... This may take a while.' 
            });

            // Get all chats
            const chats = await sock.store?.chats?.all() || [];
            
            let groupCount = 0;
            let dmCount = 0;
            let successCount = 0;
            let failCount = 0;

            for (const chat of chats) {
                try {
                    const chatId = chat.id;
                    
                    // Skip status broadcasts and own number
                    if (chatId.includes('status@broadcast') || chatId === sock.user?.id) continue;

                    // Send the broadcast message
                    await sock.sendMessage(chatId, { 
                        text: `📢 *BROADCAST MESSAGE*\n\n${broadcastMessage}\n\n━━━━━━━━━━━━━━━\n👑 From: ${settings.botName}` 
                    });

                    // Count and categorize
                    if (chatId.endsWith('@g.us')) {
                        groupCount++;
                    } else {
                        dmCount++;
                    }
                    successCount++;

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error('Broadcast error for chat:', chat.id, error);
                    failCount++;
                }
            }

            const summary = `✅ *Broadcast Complete!*

📊 *Results:*
• Groups: ${groupCount}
• DMs: ${dmCount}
• Success: ${successCount}
• Failed: ${failCount}
• Total: ${successCount + failCount}

📝 *Message:* ${broadcastMessage.substring(0, 100)}${broadcastMessage.length > 100 ? '...' : ''}`;

            await sock.sendMessage(from, { text: summary });

        } catch (error) {
            console.error('Broadcast command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to complete broadcast. Please try again.' 
            });
        }
    }
};