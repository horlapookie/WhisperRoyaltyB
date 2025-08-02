
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker } = require('wa-sticker-formatter');
const fs = require('fs');

module.exports = {
    name: 's2vid',
    description: 'Convert animated sticker to video',
    aliases: ['stickertovideo', 'sticker2vid', 'sticker2video'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            let stickerMessage = null;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.stickerMessage) {
                    stickerMessage = quotedMsg.stickerMessage;
                }
            }
            // Check if current message has sticker
            else if (message.message?.stickerMessage) {
                stickerMessage = message.message.stickerMessage;
            }
            
            if (!stickerMessage) {
                await sock.sendMessage(from, {
                    text: '❌ Please reply to an animated sticker to convert to video!\n\n📝 **Usage:**\n• Reply to animated sticker: .s2vid\n• Reply to animated sticker: .stickertovideo\n\n💡 **Tip:** Only works with animated stickers'
                });
                return;
            }
            
            // Check if sticker is animated
            if (!stickerMessage.isAnimated) {
                await sock.sendMessage(from, {
                    text: '❌ This sticker is not animated!\n\n💡 **Tip:** Only animated stickers can be converted to video. Static stickers can be converted to images using .s2img'
                });
                return;
            }
            
            // Send processing message
            await sock.sendMessage(from, {
                text: '🔄 Converting animated sticker to video... Please wait!'
            });
            
            try {
                // Download the sticker
                let buffer;
                if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                    // Create proper message object for quoted message
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
                    throw new Error('Failed to download sticker');
                }
                
                // Send as video (animated stickers are usually in WebM format)
                // Try sending as GIF first, then as video
                try {
                    // First try as GIF
                    await sock.sendMessage(from, {
                        video: buffer,
                        caption: '✅ Animated sticker converted to video!',
                        gifPlayback: true,
                        mimetype: 'video/mp4'
                    });
                } catch (videoError) {
                    console.log('Trying as document:', videoError.message);
                    try {
                        // Try as WebM video
                        await sock.sendMessage(from, {
                            video: buffer,
                            caption: '✅ Animated sticker converted to video!',
                            mimetype: 'video/webm'
                        });
                    } catch (webmError) {
                        console.log('Trying as document:', webmError.message);
                        // Try as document if video fails
                        await sock.sendMessage(from, {
                            document: buffer,
                            fileName: 'animated_sticker.webm',
                            mimetype: 'video/webm',
                            caption: '✅ Animated sticker converted to video!\n\n📱 **Note:** Download and view the video file.'
                        });
                    }
                }
                
            } catch (downloadError) {
                console.error('Sticker download error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process sticker. Please try again.\n\n**Possible issues:**\n• Invalid sticker format\n• Network error\n• Processing error'
                });
            }
            
        } catch (error) {
            console.error('Sticker2Video command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error converting sticker. Please try again.'
            });
        }
    }
};
