module.exports = {
    name: 'admintest',
    description: 'Test admin detection and show detailed JID information',
    aliases: ['at', 'testadmin'],
    adminOnly: true,
    async execute(sock, message, args, { isOwner, isGroupAdmin, settings }) {
        const from = message.key.remoteJid;
        const senderJid = message.key.participant || from;
        const isGroup = from.includes('@g.us');
        
        let responseText = '🔧 **ADMIN TEST RESULTS**\n\n';
        
        responseText += `📱 **Your JID:** ${senderJid}\n`;
        responseText += `👑 **Detected as Owner:** ${isOwner ? '✅ YES' : '❌ NO'}\n`;
        responseText += `👨‍💼 **Detected as Admin:** ${isGroupAdmin ? '✅ YES' : '❌ NO'}\n`;
        responseText += `💬 **Chat Type:** ${isGroup ? 'Group' : 'DM'}\n\n`;
        
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participant = groupMetadata.participants.find(p => p.id === senderJid);
                
                responseText += `🏢 **Group Info:**\n`;
                responseText += `📋 **Group Name:** ${groupMetadata.subject}\n`;
                responseText += `👥 **Total Members:** ${groupMetadata.participants.length}\n`;
                responseText += `🎭 **Your Role:** ${participant?.admin || 'Member'}\n\n`;
                
                // Show owner numbers being checked
                responseText += `🔍 **Owner Numbers in Config:**\n`;
                const ownerNumbers = [
                    "2349122222622@s.whatsapp.net",
                    "2349122222622@lid", 
                    "2349122222622",
                    "182725474553986@s.whatsapp.net",
                    "182725474553986@lid",
                    "182725474553986"
                ];
                
                ownerNumbers.forEach(owner => {
                    const matches = senderJid === owner || senderJid.includes(owner.replace('@s.whatsapp.net', '').replace('@lid', ''));
                    responseText += `• ${owner}: ${matches ? '✅' : '❌'}\n`;
                });
                
            } catch (error) {
                responseText += `❌ **Error getting group info:** ${error.message}\n`;
            }
        }
        
        responseText += `\n💡 **Note:** If you can see this message, admin detection is working!`;
        
        await sock.sendMessage(from, { text: responseText });
    }
};