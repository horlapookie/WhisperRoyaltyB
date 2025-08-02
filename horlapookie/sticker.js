
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'sticker',
    description: 'Convert image or video to sticker',
    aliases: ['s', 'stick', 'tosticker'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            let mediaMessage = null;
            let isVideo = false;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.imageMessage) {
                    mediaMessage = quotedMsg.imageMessage;
                } else if (quotedMsg.videoMessage) {
                    mediaMessage = quotedMsg.videoMessage;
                    isVideo = true;
                }
            }
            // Check if current message has media
            else if (message.message?.imageMessage) {
                mediaMessage = message.message.imageMessage;
            } else if (message.message?.videoMessage) {
                mediaMessage = message.message.videoMessage;
                isVideo = true;
            }
            
            if (!mediaMessage) {
                await sock.sendMessage(from, {
                    text: '❌ Please reply to an image or video to convert to sticker!\n\n📝 **Usage:**\n• Reply to image: .sticker\n• Reply to video: .sticker\n\n💡 **Tip:** Videos should be short (max 10 seconds)',
                });
                return;
            }
            
            // Send processing message
            await sock.sendMessage(from, {
                text: '🔄 Converting to sticker... Please wait!'
            });
            
            try {
                // Download the media
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
                
                if (!buffer || buffer.length === 0) {
                    throw new Error('Failed to download media or empty buffer');
                }
                
                console.log('Media buffer size:', buffer.length);
                let processedBuffer = buffer;
                
                // Process media based on type
                if (!isVideo) {
                    // Process image with Sharp
                    try {
                        processedBuffer = await sharp(buffer)
                            .resize(512, 512, {
                                fit: 'contain',
                                background: { r: 0, g: 0, b: 0, alpha: 0 }
                            })
                            .webp({ quality: 80 })
                            .toBuffer();
                        
                        console.log('Sharp processing successful, output size:', processedBuffer.length);
                    } catch (sharpError) {
                        console.error('Sharp processing failed:', sharpError.message);
                        throw new Error('Failed to process image with Sharp');
                    }
                } else {
                    // For videos, just use the original buffer (WhatsApp will handle conversion)
                    console.log('Processing video for sticker conversion');
                    processedBuffer = buffer;
                }
                
                // Validate processed buffer
                if (!processedBuffer || processedBuffer.length === 0) {
                    throw new Error('Processed buffer is empty');
                }
                
                // Create sticker using wa-sticker-formatter
                const sticker = new Sticker(processedBuffer, {
                    pack: settings.botName || "your hïghñëss v1 beta",
                    author: settings.stickerAuthor || "horlapookie",
                    type: isVideo ? StickerTypes.FULL : StickerTypes.DEFAULT,
                    categories: ['🤖'],
                    id: '12345',
                    quality: 50
                });

                const stickerBuffer = await sticker.toBuffer();
                
                await sock.sendMessage(from, {
                    sticker: stickerBuffer
                });
                
                console.log('Sticker sent successfully');
                
            } catch (downloadError) {
                console.error('Media processing error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process media. Please try again with a different image/video.\n\n**Possible issues:**\n• File too large\n• Unsupported format\n• Processing error\n• Network error'
                });
            }
            
        } catch (error) {
            console.error('Sticker command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error creating sticker. Please try again or contact support if the issue persists.'
            });
        }
    }
};
