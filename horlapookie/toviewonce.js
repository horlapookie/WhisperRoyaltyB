
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'toviewonce',
    aliases: ['vv'],
    description: 'Convert image/video to view once message',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let mediaMessage = null;
            let targetMessage = null;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                if (quotedMsg.imageMessage || quotedMsg.videoMessage) {
                    mediaMessage = quotedMsg.imageMessage || quotedMsg.videoMessage;
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
            // Check if current message has media
            else if (message.message?.imageMessage || message.message?.videoMessage) {
                mediaMessage = message.message.imageMessage || message.message.videoMessage;
                targetMessage = message;
            }
            
            if (!mediaMessage || !targetMessage) {
                await sock.sendMessage(from, {
                    text: `❌ Please reply to an image or video!\n\n📸 **Usage:**\n• Reply to image: ${settings.prefix}toviewonce\n• Reply to video: ${settings.prefix}toviewonce\n\n💡 **Tip:** This will convert media to view once`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '👁️ Converting to view once... Please wait!'
            });
            
            try {
                // Download the media
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    throw new Error('Failed to download media');
                }

                // Send as view once
                if (mediaMessage.mimetype && mediaMessage.mimetype.startsWith('image/')) {
                    await sock.sendMessage(from, {
                        image: buffer,
                        caption: mediaMessage.caption || '',
                        viewOnce: true
                    });
                } else if (mediaMessage.mimetype && mediaMessage.mimetype.startsWith('video/')) {
                    await sock.sendMessage(from, {
                        video: buffer,
                        caption: mediaMessage.caption || '',
                        viewOnce: true
                    });
                } else {
                    throw new Error('Unsupported media type');
                }

                await sock.sendMessage(from, {
                    text: '✅ *Media converted to view once!*\n\n👁️ The media can now only be viewed once and will disappear after viewing.'
                });
                
            } catch (downloadError) {
                console.error('View once conversion error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to convert media. The media might be corrupted or in an unsupported format.'
                });
            }
            
        } catch (error) {
            console.error('ToViewOnce command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error converting to view once. Please try again.'
            });
        }
    }
};
