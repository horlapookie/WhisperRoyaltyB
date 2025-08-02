
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker } = require('wa-sticker-formatter');

module.exports = {
    name: 's2img',
    description: 'Convert sticker to image',
    aliases: ['stickertoimage', 'sticker2img', 'stickertoimg'],
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
                    text: '❌ Please reply to a sticker to convert to image!\n\n📝 **Usage:**\n• Reply to sticker: .s2img\n• Reply to sticker: .stickertoimage\n\n💡 **Tip:** Works with both animated and static stickers'
                });
                return;
            }
            
            // Send processing message
            await sock.sendMessage(from, {
                text: '🔄 Converting sticker to image... Please wait!'
            });
            
            try {
                // Download the sticker
                let buffer;
                if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                    // For quoted messages, use the quoted message directly
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
                    throw new Error('Failed to download sticker or empty buffer');
                }
                
                console.log('Sticker buffer size:', buffer.length);
                
                let processedBuffer;
                
                // Process sticker with wa-sticker-formatter
                try {
                    // Create sticker instance to extract image
                    const sticker = new Sticker(buffer);
                    processedBuffer = await sticker.toImage();
                    
                    console.log('wa-sticker-formatter processing successful, output size:', processedBuffer.length);
                } catch (stickerError) {
                    console.error('wa-sticker-formatter processing failed:', stickerError.message);
                    
                    // Fallback: use original buffer if it's already an image format
                    processedBuffer = buffer;
                    console.log('Using original buffer as fallback');
                }
                
                // Validate processed buffer
                if (!processedBuffer || processedBuffer.length === 0) {
                    throw new Error('Processed buffer is empty');
                }
                
                // Send as image
                await sock.sendMessage(from, {
                    image: processedBuffer,
                    caption: '✅ Sticker converted to image!',
                    mimetype: 'image/jpeg'
                });
                
                console.log('Image sent successfully');
                
            } catch (downloadError) {
                console.error('Sticker processing error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process sticker. Please try again.\n\n**Possible issues:**\n• Invalid sticker format\n• Corrupted sticker data\n• Network error\n• Processing error'
                });
            }
            
        } catch (error) {
            console.error('Sticker2Image command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error converting sticker. Please try again or contact support if the issue persists.'
            });
        }
    }
};
