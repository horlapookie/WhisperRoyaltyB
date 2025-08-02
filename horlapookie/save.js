
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'save',
    description: 'Save status when replying to it (Owner only)',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is for bot owner only!' 
            });
        }
        
        try {
            // Check if replying to a message
            if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                await sock.sendMessage(from, {
                    text: '❌ Please reply to a status message to save it!\n\n📝 **Usage:**\n• Reply to status: .save\n\n💡 **Tip:** This will save the status to your DM'
                });
                return;
            }

            const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
            let mediaType = '';
            let mediaMessage = null;
            
            // Determine media type
            if (quotedMsg.imageMessage) {
                mediaType = 'image';
                mediaMessage = quotedMsg.imageMessage;
            } else if (quotedMsg.videoMessage) {
                mediaType = 'video';
                mediaMessage = quotedMsg.videoMessage;
            } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
                mediaType = 'text';
            } else {
                await sock.sendMessage(from, {
                    text: '❌ Unsupported media type. Please reply to an image, video, or text status.'
                });
                return;
            }
            
            const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            
            if (mediaType === 'text') {
                // Handle text status
                const textContent = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || 'No text content';
                
                await sock.sendMessage(ownerJid, {
                    text: `💾 **Status Saved**\n\n📝 **Content:**\n${textContent}\n\n📍 **From:** ${from}\n⏰ **Time:** ${new Date().toLocaleString()}`
                });
                
                await sock.sendMessage(from, {
                    text: '✅ Text status saved to your DM!'
                });
            } else {
                // Handle media status
                try {
                    const quotedMessage = {
                        key: {
                            remoteJid: from,
                            id: message.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: message.message.extendedTextMessage.contextInfo.participant
                        },
                        message: quotedMsg
                    };
                    
                    const buffer = await downloadMediaMessage(quotedMessage, 'buffer', {});
                    
                    if (!buffer) {
                        throw new Error('Failed to download media');
                    }
                    
                    const caption = `💾 **Status Saved**\n\n📍 **From:** ${from}\n⏰ **Time:** ${new Date().toLocaleString()}`;
                    
                    if (mediaType === 'image') {
                        await sock.sendMessage(ownerJid, {
                            image: buffer,
                            caption: caption
                        });
                    } else if (mediaType === 'video') {
                        await sock.sendMessage(ownerJid, {
                            video: buffer,
                            caption: caption
                        });
                    }
                    
                    await sock.sendMessage(from, {
                        text: '✅ Status media saved to your DM!'
                    });
                    
                } catch (downloadError) {
                    console.error('Status save error:', downloadError);
                    await sock.sendMessage(from, {
                        text: '❌ Failed to save status media. The media might be expired or corrupted.'
                    });
                }
            }
            
        } catch (error) {
            console.error('Save command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error saving status. Please try again.'
            });
        }
    }
};
