
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

module.exports = {
    name: 'toon',
    description: 'Apply cartoon/toon filter to image',
    aliases: ['cartoon', 'anime', 'filter'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let imageMessage = null;
            let targetMessage = null;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                if (quotedMsg.imageMessage) {
                    imageMessage = quotedMsg.imageMessage;
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
            // Check if current message has image
            else if (message.message?.imageMessage) {
                imageMessage = message.message.imageMessage;
                targetMessage = message;
            }
            
            if (!imageMessage || !targetMessage) {
                await sock.sendMessage(from, {
                    text: `❌ Please reply to an image!\n\n📝 **Usage:**\n• Reply to image: ${settings.prefix}toon\n\n💡 **Tip:** This will apply a cartoon filter to the image`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🎨 Applying cartoon filter... Please wait!'
            });
            
            try {
                // Download the image
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    throw new Error('Failed to download image');
                }

                // Create temp directory if it doesn't exist
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const timestamp = randomBytes(3).toString('hex');
                const inputPath = path.join(tempDir, `input_${timestamp}.jpg`);
                const outputPath = path.join(tempDir, `toon_${timestamp}.jpg`);
                
                // Save input image
                fs.writeFileSync(inputPath, buffer);

                // Load image with Jimp
                const image = await Jimp.read(inputPath);
                
                // Apply better cartoon-like effects
                image
                    .resize(512, Jimp.AUTO) // Resize for processing
                    .quality(95) // Higher quality
                    .posterize(6) // More dramatic color reduction for cartoon effect
                    .contrast(0.5) // Higher contrast for cartoon look
                    .brightness(0.15) // Slight brightness boost
                    .normalize() // Normalize colors
                    .greyscale() // Convert to grayscale first
                    .invert() // Invert colors
                    .blur(2) // Blur the inverted image
                    .invert() // Invert back
                    .opaque() // Remove transparency
                    .posterize(8); // Final posterization for cartoon effect

                // Save processed image
                await image.writeAsync(outputPath);

                // Check if processed file exists
                if (fs.existsSync(outputPath)) {
                    // Send the processed image
                    await sock.sendMessage(from, {
                        image: fs.readFileSync(outputPath),
                        caption: `🎨 *Cartoon Filter Applied*\n\n✨ *Effect:* Toon/Cartoon style\n🖼️ *Processing:* Color reduction, contrast enhancement\n\n💡 *Tip:* Try different images for various cartoon effects!`
                    });
                } else {
                    throw new Error('Failed to process image');
                }

                // Clean up temp files
                setTimeout(() => {
                    try {
                        if (fs.existsSync(inputPath)) {
                            fs.unlinkSync(inputPath);
                        }
                        if (fs.existsSync(outputPath)) {
                            fs.unlinkSync(outputPath);
                        }
                    } catch (cleanupError) {
                        console.log('Cleanup error:', cleanupError);
                    }
                }, 5000);
                
            } catch (processError) {
                console.error('Image processing error:', processError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process image. Please make sure it\'s a valid image file.'
                });
            }
            
        } catch (error) {
            console.error('Toon command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error applying cartoon filter. Please try again.'
            });
        }
    }
};
