
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'vv2',
    description: 'Secretly bypass view once messages and send to owner DM',
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
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                // Check for view once messages in quoted content
                if (quotedMsg.viewOnceMessage?.message?.imageMessage) {
                    viewOnceMessage = quotedMsg.viewOnceMessage.message.imageMessage;
                    mediaType = 'image';
                } else if (quotedMsg.viewOnceMessage?.message?.videoMessage) {
                    viewOnceMessage = quotedMsg.viewOnceMessage.message.videoMessage;
                    mediaType = 'video';
                }
                // Also check for regular view once in quoted message
                else if (quotedMsg.imageMessage?.viewOnce) {
                    viewOnceMessage = quotedMsg.imageMessage;
                    mediaType = 'image';
                } else if (quotedMsg.videoMessage?.viewOnce) {
                    viewOnceMessage = quotedMsg.videoMessage;
                    mediaType = 'video';
                }
            }
            // Check if current message has view once
            else if (message.message?.viewOnceMessage?.message?.imageMessage) {
                viewOnceMessage = message.message.viewOnceMessage.message.imageMessage;
                mediaType = 'image';
            } else if (message.message?.viewOnceMessage?.message?.videoMessage) {
                viewOnceMessage = message.message.viewOnceMessage.message.videoMessage;
                mediaType = 'video';
            }
            // Check for direct view once messages
            else if (message.message?.imageMessage?.viewOnce) {
                viewOnceMessage = message.message.imageMessage;
                mediaType = 'image';
            } else if (message.message?.videoMessage?.viewOnce) {
                viewOnceMessage = message.message.videoMessage;
                mediaType = 'video';
            }
            
            if (!viewOnceMessage) {
                await sock.sendMessage(from, {
                    text: '❌ Please reply to a view once message!\n\n📝 **Usage:**\n• Reply to view once image/video: .vv2\n\n💡 **Tip:** This will secretly send the media to your DM'
                });
                return;
            }
            
            try {
                // Download the media
                let buffer;
                if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                    const quotedMessage = {
                        key: {
                            remoteJid: from,
                            id: message.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: message.message.extendedTextMessage.contextInfo.participant
                        },
                        message: message.message.extendedTextMessage.contextInfo.quotedMessage
                    };
                    buffer = await downloadMediaMessage(quotedMessage, 'buffer', {});
                } else {
                    buffer = await downloadMediaMessage(message, 'buffer', {});
                }
                
                if (!buffer) {
                    throw new Error('Failed to download view once media');
                }
                
                // Get owner's DM chat - use the first owner number from settings
                const ownerJid = settings.ownerNumbers[0];
                
                // Send the media to owner's DM
                if (mediaType === 'image') {
                    await sock.sendMessage(ownerJid, {
                        image: buffer,
                        caption: `🔒 **View Once Bypassed**\n📍 From: ${from}\n⏰ Time: ${new Date().toLocaleString()}`
                    });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(ownerJid, {
                        video: buffer,
                        caption: `🔒 **View Once Bypassed**\n📍 From: ${from}\n⏰ Time: ${new Date().toLocaleString()}`
                    });
                }
                
                // Send confirmation to the original chat (only visible to owner)
                await sock.sendMessage(from, {
                    text: '✅ View once media secretly saved to your DM!'
                });
                
            } catch (downloadError) {
                console.error('Secret view once bypass error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to secretly bypass view once. The media might be expired or corrupted.'
                });
            }
            
        } catch (error) {
            console.error('VV2 command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error bypassing view once. Please try again.'
            });
        }
    }
};
