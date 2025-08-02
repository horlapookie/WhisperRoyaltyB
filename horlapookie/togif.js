
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

module.exports = {
    name: 'togif',
    description: 'Convert video to GIF',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let videoMessage = null;
            let targetMessage = null;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                if (quotedMsg.videoMessage) {
                    videoMessage = quotedMsg.videoMessage;
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
            // Check if current message has video
            else if (message.message?.videoMessage) {
                videoMessage = message.message.videoMessage;
                targetMessage = message;
            }
            
            if (!videoMessage || !targetMessage) {
                await sock.sendMessage(from, {
                    text: `❌ Please reply to a video!\n\n🎬 **Usage:**\n• Reply to video: ${settings.prefix}togif\n\n💡 **Tip:** This will convert video to animated GIF`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🎬 Converting video to GIF... Please wait!'
            });
            
            try {
                // Download the video
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    throw new Error('Failed to download video');
                }

                // Create temp directory if it doesn't exist
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const timestamp = randomBytes(3).toString('hex');
                const videoPath = path.join(tempDir, `video_${timestamp}.mp4`);
                const gifPath = path.join(tempDir, `gif_${timestamp}.gif`);
                
                // Save video file
                fs.writeFileSync(videoPath, buffer);

                // Convert to GIF using FFmpeg
                const { exec } = require('child_process');
                const util = require('util');
                const execPromise = util.promisify(exec);

                try {
                    // Convert to GIF with optimized settings
                    await execPromise(`ffmpeg -i "${videoPath}" -vf "fps=10,scale=320:-1:flags=lanczos,palettegen" -t 10 "${gifPath.replace('.gif', '_palette.png')}"`);
                    await execPromise(`ffmpeg -i "${videoPath}" -i "${gifPath.replace('.gif', '_palette.png')}" -filter_complex "fps=10,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse" -t 10 "${gifPath}"`);
                    
                    if (fs.existsSync(gifPath)) {
                        const gifBuffer = fs.readFileSync(gifPath);
                        
                        await sock.sendMessage(from, {
                            video: gifBuffer,
                            gifPlayback: true,
                            caption: '🎬 *Video to GIF Conversion*\n\n✅ Successfully converted to animated GIF!'
                        });

                        // Clean up files
                        setTimeout(() => {
                            try {
                                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                                if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
                                if (fs.existsSync(gifPath.replace('.gif', '_palette.png'))) {
                                    fs.unlinkSync(gifPath.replace('.gif', '_palette.png'));
                                }
                            } catch (cleanupError) {
                                console.log('Cleanup error:', cleanupError);
                            }
                        }, 5000);
                        
                    } else {
                        throw new Error('GIF conversion failed');
                    }
                    
                } catch (ffmpegError) {
                    console.error('FFmpeg conversion error:', ffmpegError);
                    await sock.sendMessage(from, {
                        text: '❌ GIF conversion failed. Please ensure the video is in a supported format and try again.\n\n💡 **Tip:** Shorter videos (under 30 seconds) work best for GIF conversion.'
                    });
                }
                
            } catch (downloadError) {
                console.error('GIF conversion processing error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process video. The video might be corrupted or in an unsupported format.'
                });
            }
            
        } catch (error) {
            console.error('ToGIF command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error converting video to GIF. Please try again.'
            });
        }
    }
};
