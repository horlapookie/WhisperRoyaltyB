
module.exports = {
    name: 'take',
    description: 'Take ownership of a sticker or add watermark',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let packName = args.join(' ').trim();
            let authorName = settings.botName || 'Bot';
            
            // Parse custom pack and author names
            if (packName.includes('|')) {
                const parts = packName.split('|');
                packName = parts[0].trim();
                authorName = parts[1].trim();
            }
            
            if (!packName) {
                packName = settings.botName || 'My Stickers';
            }

            // Check if replying to a sticker
            let stickerMessage = null;
            let targetMessage = null;
            
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                if (quotedMsg.stickerMessage) {
                    stickerMessage = quotedMsg.stickerMessage;
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
            
            if (!stickerMessage || !targetMessage) {
                await sock.sendMessage(from, {
                    text: `❌ Please reply to a sticker!\n\n🏷️ **Usage:**\n• ${settings.prefix}take MyPack\n• ${settings.prefix}take MyPack | MyName\n\n💡 **Tip:** This will change the sticker's pack name and author`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🏷️ Taking sticker ownership... Please wait!'
            });

            try {
                const { downloadMediaMessage } = require('@whiskeysockets/baileys');
                
                // Download the sticker
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    throw new Error('Failed to download sticker');
                }

                // Create metadata for the sticker
                const metadata = {
                    pack: packName,
                    author: authorName,
                    type: 'full',
                    categories: ['😀', '🎉'],
                    quality: 100
                };

                // Send the sticker with new metadata
                await sock.sendMessage(from, {
                    sticker: buffer,
                    ...metadata
                });

                await sock.sendMessage(from, {
                    text: `✅ *Sticker Ownership Taken!*\n\n🏷️ **Pack Name:** ${packName}\n👤 **Author:** ${authorName}\n🎯 **Status:** Successfully updated metadata`
                });

            } catch (downloadError) {
                console.error('Take sticker error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process sticker. Please try again.'
                });
            }

        } catch (error) {
            console.error('Take command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error taking sticker ownership. Please try again.'
            });
        }
    }
};
