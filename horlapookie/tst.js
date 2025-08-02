
const { createCanvas, loadImage } = require("canvas");
const { Sticker } = require("wa-sticker-formatter");
const fs = require("fs");

const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

module.exports = {
    name: 'tst',
    description: 'Convert text to sticker',
    aliases: ['attp', 'textsticker', 'textst'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let textInput = args.join(' ').trim();

            // Check if replying to a message
            if (!textInput && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.conversation) {
                    textInput = quotedMsg.conversation;
                } else if (quotedMsg.extendedTextMessage?.text) {
                    textInput = quotedMsg.extendedTextMessage.text;
                }
            }

            if (!textInput) {
                await sock.sendMessage(from, {
                    text: `❌ Please provide text to convert to sticker!\n\n📝 **Usage:**\n• ${settings.prefix}tst Hello World\n• ${settings.prefix}attp Your Text Here\n• Reply to text message: ${settings.prefix}tst\n\n💡 **Tip:** Text will be styled with red font on white background`
                });
                return;
            }

            // Replace colons with newlines for better formatting
            const message_text = textInput.split(":").join("\n");

            await sock.sendMessage(from, {
                text: '🎨 Creating text sticker... Please wait!'
            });

            // Create temp directory if it doesn't exist
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const canvas = createCanvas(512, 512);
            const ctx = canvas.getContext("2d");

            // Background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Text styling
            ctx.font = "bold 60px Arial";
            ctx.fillStyle = "#ff0000";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Handle multi-line text
            const lines = message_text.split('\n');
            const lineHeight = 80;
            const totalHeight = lines.length * lineHeight;
            const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;

            lines.forEach((line, index) => {
                const y = startY + (index * lineHeight);
                ctx.fillText(line, canvas.width / 2, y);
            });

            const filename = getRandom(".png");
            const filepath = `${tempDir}/${filename}`;
            const out = fs.createWriteStream(filepath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);

            out.on("finish", async () => {
                try {
                    const sticker = new Sticker(filepath, {
                        pack: settings.botName || "Bot",
                        author: "horlapookie",
                        type: 'full',
                        categories: ['📝'],
                        quality: 50
                    });

                    await sticker.build();
                    const stickerBuffer = await sticker.get();
                    
                    await sock.sendMessage(from, { 
                        sticker: Buffer.from(stickerBuffer) 
                    });

                    // Clean up
                    setTimeout(() => {
                        try {
                            if (fs.existsSync(filepath)) {
                                fs.unlinkSync(filepath);
                            }
                        } catch (cleanupError) {
                            console.log('Cleanup error:', cleanupError);
                        }
                    }, 5000);

                } catch (stickerError) {
                    console.error('Sticker creation error:', stickerError);
                    await sock.sendMessage(from, {
                        text: '❌ Failed to create sticker. Please try again with shorter text.'
                    });
                }
            });

            out.on("error", async (error) => {
                console.error('Canvas stream error:', error);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process text. Please try again.'
                });
            });

        } catch (error) {
            console.error('Text-to-sticker command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error creating text sticker. Please try again or contact support if the issue persists.'
            });
        }
    }
};
