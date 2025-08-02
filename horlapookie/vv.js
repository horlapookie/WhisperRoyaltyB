
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'vv',
    description: 'Bypass view once messages',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is for bot owner only!' 
            });
        }
        
        try {
            let viewOnceMessage = null;
            let mediaType = '';
            let targetMessage = null;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                // Check for view once in quoted message
                if (quotedMsg.viewOnceMessage?.message?.imageMessage) {
                    viewOnceMessage = quotedMsg.viewOnceMessage.message.imageMessage;
                    mediaType = 'image';
                    targetMessage = {
                        key: {
                            remoteJid: from,
                            id: message.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: message.message.extendedTextMessage.contextInfo.participant
                        },
                        message: quotedMsg
                    };
                } else if (quotedMsg.viewOnceMessage?.message?.videoMessage) {
                    viewOnceMessage = quotedMsg.viewOnceMessage.message.videoMessage;
                    mediaType = 'video';
                    targetMessage = {
                        key: {
                            remoteJid: from,
                            id: message.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: message.message.extendedTextMessage.contextInfo.participant
                        },
                        message: quotedMsg
                    };
                }
                
                // Also check if the quoted message itself is a regular image/video
                else if (quotedMsg.imageMessage) {
                    viewOnceMessage = quotedMsg.imageMessage;
                    mediaType = 'image';
                    targetMessage = {
                        key: {
                            remoteJid: from,
                            id: message.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: message.message.extendedTextMessage.contextInfo.participant
                        },
                        message: quotedMsg
                    };
                } else if (quotedMsg.videoMessage) {
                    viewOnceMessage = quotedMsg.videoMessage;
                    mediaType = 'video';
                    targetMessage = {
                        key: {
                            remoteJid: from,
                            id: message.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: message.message.extendedTextMessage.contextInfo.participant
                        },
                        message: quotedMsg
                    };
                }
            }
            // Check if current message has view once
            else if (message.message?.viewOnceMessage?.message?.imageMessage) {
                viewOnceMessage = message.message.viewOnceMessage.message.imageMessage;
                mediaType = 'image';
                targetMessage = message;
            } else if (message.message?.viewOnceMessage?.message?.videoMessage) {
                viewOnceMessage = message.message.viewOnceMessage.message.videoMessage;
                mediaType = 'video';
                targetMessage = message;
            }
            
            if (!viewOnceMessage || !targetMessage) {
                await sock.sendMessage(from, {
                    text: '❌ Please reply to a view once message or media message!\n\n📝 **Usage:**\n• Reply to view once image/video: .vv\n• Reply to regular image/video: .vv\n\n💡 **Tip:** This will bypass the view once restriction'
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🔄 Processing media... Please wait!'
            });
            
            try {
                // Download the media
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    throw new Error('Failed to download media');
                }
                
                // Send the media without view once restriction
                if (mediaType === 'image') {
                    await sock.sendMessage(from, {
                        image: buffer,
                        caption: '✅ Media processed successfully!'
                    });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(from, {
                        video: buffer,
                        caption: '✅ Media processed successfully!'
                    });
                }
                
            } catch (downloadError) {
                console.error('Media processing error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process media. The media might be expired or corrupted.'
                });
            }
            
        } catch (error) {
            console.error('VV command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error processing media. Please try again.'
            });
        }
    }
};
