
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

module.exports = {
    name: 'qr',
    description: 'Generate QR code from text',
    aliases: ['qrcode', 'qrgen'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        let text = '';
        
        // Check if replying to a message
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quotedMsg.conversation) {
                text = quotedMsg.conversation;
            } else if (quotedMsg.extendedTextMessage?.text) {
                text = quotedMsg.extendedTextMessage.text;
            }
        }
        
        // If no quoted text, use command arguments
        if (!text && args.length > 0) {
            text = args.join(' ');
        }

        if (!text) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide text to convert to QR code!\n\nUsage:\n• ${settings.prefix}qr Hello world\n• Reply to a text message with ${settings.prefix}qr` 
            });
        }

        if (text.length > 1000) {
            return await sock.sendMessage(from, { 
                text: '❌ Text is too long! Maximum 1000 characters allowed for QR code.' 
            });
        }

        try {
            await sock.sendMessage(from, { 
                text: '📱 Generating QR code... Please wait!' 
            });

            // Create temp directory if it doesn't exist
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = randomBytes(3).toString('hex');
            const qrPath = path.join(tempDir, `qr_${timestamp}.png`);

            // Generate QR code
            await QRCode.toFile(qrPath, text, {
                width: 512,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Check if file was created
            if (fs.existsSync(qrPath)) {
                // Send the QR code
                await sock.sendMessage(from, {
                    image: fs.readFileSync(qrPath),
                    caption: `✅ *QR Code Generated*\n\n📝 *Text:* ${text.length > 100 ? text.substring(0, 100) + '...' : text}\n\n💡 *Tip:* Scan this QR code with any QR scanner app`
                });

                // Clean up temp file
                setTimeout(() => {
                    try {
                        if (fs.existsSync(qrPath)) {
                            fs.unlinkSync(qrPath);
                        }
                    } catch (cleanupError) {
                        console.log('Cleanup error:', cleanupError);
                    }
                }, 5000);
            } else {
                throw new Error('Failed to generate QR code file');
            }

        } catch (error) {
            console.error('QR generation error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to generate QR code. Please try again with shorter text.' 
            });
        }
    }
};
