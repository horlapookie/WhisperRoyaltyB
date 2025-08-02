
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const sharp = require('sharp');
const jsQR = require('jsqr');

module.exports = {
    name: 'qrscan',
    description: 'Scan QR code from image',
    aliases: ['scanqr', 'readqr', 'qrread'],
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
                    text: `❌ Please reply to an image containing a QR code!\n\n📝 **Usage:**\n• Reply to image: ${settings.prefix}qrscan\n• Send image with caption: ${settings.prefix}qrscan\n\n💡 **Tip:** Make sure the QR code is clear and visible`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🔍 Scanning QR code... Please wait!'
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
                const imagePath = path.join(tempDir, `qr_scan_${timestamp}.png`);
                
                // Convert image to PNG and get image data
                const { data, info } = await sharp(buffer)
                    .png()
                    .raw()
                    .ensureAlpha()
                    .toBuffer({ resolveWithObject: true });

                // Save processed image for debugging if needed
                await sharp(buffer).png().toFile(imagePath);

                // Create image data object for jsQR
                const imageData = {
                    data: new Uint8ClampedArray(data),
                    width: info.width,
                    height: info.height
                };

                // Scan for QR code
                const qrResult = jsQR(imageData.data, imageData.width, imageData.height);

                if (qrResult) {
                    // QR code found
                    const qrData = qrResult.data;
                    
                    // Determine QR code type
                    let qrType = 'Text';
                    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
                        qrType = 'URL';
                    } else if (qrData.startsWith('mailto:')) {
                        qrType = 'Email';
                    } else if (qrData.startsWith('tel:')) {
                        qrType = 'Phone';
                    } else if (qrData.startsWith('wifi:')) {
                        qrType = 'WiFi';
                    } else if (qrData.includes('BEGIN:VCARD')) {
                        qrType = 'Contact';
                    }

                    await sock.sendMessage(from, {
                        text: `✅ *QR Code Scanned Successfully!*\n\n📱 **Type:** ${qrType}\n📄 **Content:**\n${qrData}\n\n📍 **Position:** (${qrResult.location.topLeftCorner.x}, ${qrResult.location.topLeftCorner.y})\n\n💡 **Tip:** ${qrType === 'URL' ? 'You can click the link above' : qrType === 'WiFi' ? 'Contains WiFi credentials' : 'QR code content extracted'}`
                    });
                } else {
                    // No QR code found
                    await sock.sendMessage(from, {
                        text: '❌ No QR code found in the image.\n\n💡 **Tips:**\n• Make sure the QR code is clearly visible\n• Ensure good lighting and focus\n• Try cropping the image to focus on the QR code\n• Check if the QR code is not damaged or corrupted'
                    });
                }

                // Clean up temp file
                setTimeout(() => {
                    try {
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                    } catch (cleanupError) {
                        console.log('Cleanup error:', cleanupError);
                    }
                }, 5000);
                
            } catch (processingError) {
                console.error('QR scan processing error:', processingError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process image. Please make sure you sent a valid image file with a clear QR code.'
                });
            }
            
        } catch (error) {
            console.error('QR scan command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error scanning QR code. Please try again with a different image.'
            });
        }
    }
};
