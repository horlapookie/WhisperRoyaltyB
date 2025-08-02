
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

module.exports = {
    name: 'stt',
    description: 'Convert speech/audio to text',
    aliases: ['speech', 'transcribe'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let audioMessage = null;
            let targetMessage = null;
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                if (quotedMsg.audioMessage) {
                    audioMessage = quotedMsg.audioMessage;
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
            // Check if current message has audio
            else if (message.message?.audioMessage) {
                audioMessage = message.message.audioMessage;
                targetMessage = message;
            }
            
            if (!audioMessage || !targetMessage) {
                await sock.sendMessage(from, {
                    text: `❌ Please reply to an audio message!\n\n📝 **Usage:**\n• Reply to voice note: ${settings.prefix}stt\n• Reply to audio file: ${settings.prefix}stt\n\n💡 **Tip:** This will convert speech to text`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🎤 Converting speech to text... Please wait!'
            });
            
            try {
                // Download the audio
                const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
                
                if (!buffer) {
                    throw new Error('Failed to download audio');
                }

                // Create temp directory if it doesn't exist
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const timestamp = randomBytes(3).toString('hex');
                const audioPath = path.join(tempDir, `audio_${timestamp}.ogg`);
                
                // Save audio file
                fs.writeFileSync(audioPath, buffer);

                // Try to transcribe using available tools
                let transcriptionText = '';
                
                try {
                    // Method 1: Try using speech recognition if available
                    const { exec } = require('child_process');
                    const util = require('util');
                    const execPromise = util.promisify(exec);
                    
                    // Convert to wav format first for better compatibility
                    const wavPath = audioPath.replace('.ogg', '.wav');
                    
                    try {
                        // Check if FFmpeg is available
                        try {
                            await execPromise('ffmpeg -version');
                        } catch (ffmpegCheck) {
                            throw new Error('FFmpeg not found');
                        }

                        await execPromise(`ffmpeg -i "${audioPath}" -ar 16000 -ac 1 -y "${wavPath}"`);
                        
                        // Try using available STT tools
                        try {
                            // Try Whisper first
                            const { stdout } = await execPromise(`whisper "${wavPath}" --model tiny --output_format txt --language auto --output_dir "${tempDir}"`);
                            
                            // Read the output file
                            const outputFile = path.join(tempDir, `audio_${timestamp}.txt`);
                            if (fs.existsSync(outputFile)) {
                                transcriptionText = fs.readFileSync(outputFile, 'utf8').trim() || 'Could not transcribe audio clearly';
                                fs.unlinkSync(outputFile);
                            } else {
                                transcriptionText = stdout.trim() || 'Could not transcribe audio clearly';
                            }
                        } catch (whisperError) {
                            console.log('Whisper not available, trying alternative methods...');
                            
                            // Alternative: Use speech-to-text if available
                            try {
                                const speech = require('@google-cloud/speech');
                                const client = new speech.SpeechClient();
                                
                                const audioBytes = fs.readFileSync(wavPath).toString('base64');
                                const request = {
                                    audio: { content: audioBytes },
                                    config: {
                                        encoding: 'LINEAR16',
                                        sampleRateHertz: 16000,
                                        languageCode: 'en-US',
                                    },
                                };
                                
                                const [response] = await client.recognize(request);
                                const transcription = response.results
                                    .map(result => result.alternatives[0].transcript)
                                    .join('\n');
                                transcriptionText = transcription || 'Could not transcribe audio clearly';
                            } catch (googleError) {
                                transcriptionText = '[Audio detected. Please note: For accurate transcription, install Whisper (pip install openai-whisper) or configure Google Cloud Speech API.]';
                            }
                        }
                        
                        // Clean up wav file
                        if (fs.existsSync(wavPath)) {
                            fs.unlinkSync(wavPath);
                        }
                        
                    } catch (ffmpegError) {
                        console.log('FFmpeg processing failed:', ffmpegError);
                        if (ffmpegError.message.includes('FFmpeg not found')) {
                            transcriptionText = '[FFmpeg is required for audio processing. Please install FFmpeg to use this feature.]';
                        } else {
                            transcriptionText = '[Audio format conversion failed. Please try with a different audio format.]';
                        }
                    }
                    
                } catch (sttError) {
                    console.log('STT processing error:', sttError);
                    transcriptionText = '[Speech-to-text processing failed. Please try with a clearer audio.]';
                }

                await sock.sendMessage(from, {
                    text: `🎤 *Speech-to-Text*\n\n📄 *Transcribed Text:*\n"${transcriptionText}"\n\n🔧 *Audio Info:*\n• Duration: ${audioMessage.seconds || 'Unknown'} seconds\n• Size: ${(buffer.length/1024).toFixed(2)} KB\n\n💡 *Tip:* For better results, ensure clear speech and minimal background noise`
                });

                // Clean up temp file
                setTimeout(() => {
                    try {
                        if (fs.existsSync(audioPath)) {
                            fs.unlinkSync(audioPath);
                        }
                    } catch (cleanupError) {
                        console.log('Cleanup error:', cleanupError);
                    }
                }, 5000);
                
            } catch (downloadError) {
                console.error('Speech-to-text processing error:', downloadError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to process audio. The audio might be corrupted or in an unsupported format.'
                });
            }
            
        } catch (error) {
            console.error('STT command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error processing speech-to-text. Please try again.'
            });
        }
    }
};
