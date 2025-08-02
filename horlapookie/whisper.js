const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const settings = require('../settings');

module.exports = {
    name: 'whisper',
    aliases: ['transcribe', 'stt', 'voicetotext'],
    description: 'Convert speech to text using OpenAI Whisper',
    usage: 'whisper (reply to audio/voice message)',
    category: 'ai',
    cooldown: 10,

    async execute(sock, msg, args, context) {
        const { from } = context;

        // Check if replying to a message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg) {
            return await sock.sendMessage(from, {
                text: '❌ Please reply to an audio message or voice note!\n\n📝 **How to use:**\n• Reply to voice message: .whisper\n• Reply to audio file: .whisper\n• Reply to video (for audio): .whisper'
            });
        }

        const messageType = Object.keys(quotedMsg)[0];

        if (!['audioMessage', 'videoMessage', 'documentMessage'].includes(messageType)) {
            return await sock.sendMessage(from, {
                text: '❌ Please reply to an audio message, voice note, or video file!'
            });
        }

        const processingMsg = await sock.sendMessage(from, {
            text: '🎤 Transcribing audio... Please wait!'
        });

        try {
            // Download the media using proper Baileys method
            let media;
            const mediaMessage = quotedMsg[messageType];
            
            if (messageType === 'audioMessage' || messageType === 'videoMessage') {
                const stream = await downloadContentFromMessage(mediaMessage, messageType.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                media = buffer;
            } else if (messageType === 'documentMessage') {
                const doc = quotedMsg.documentMessage;
                if (doc.mimetype && (doc.mimetype.includes('audio') || doc.mimetype.includes('video'))) {
                    const stream = await downloadContentFromMessage(doc, 'document');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    media = buffer;
                } else {
                    throw new Error('Unsupported file type');
                }
            }

            if (!media || media.length === 0) {
                throw new Error('Failed to download media or empty buffer');
            }

            // Check file size (OpenAI Whisper has a 25MB limit)
            if (media.length > 25 * 1024 * 1024) {
                throw new Error('Audio file too large. Maximum size is 25MB.');
            }

            // Prepare form data for OpenAI Whisper API
            const formData = new FormData();
            formData.append('file', media, 'audio.mp3');
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'json');

            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    'Authorization': `Bearer ${settings.apiKeys.openai}`,
                    ...formData.getHeaders()
                },
                timeout: 60000
            });

            const transcription = response.data.text;

            // Delete processing message
            try {
                await sock.sendMessage(from, { delete: processingMsg.key });
            } catch {}

            if (transcription && transcription.trim()) {
                await sock.sendMessage(from, {
                    text: `🎤 **Audio Transcription**\n\n📝 **Text:** ${transcription}\n\n✨ **Powered by OpenAI Whisper**`,
                    contextInfo: {
                        externalAdReply: {
                            title: "Audio Transcription",
                            body: "Powered by OpenAI Whisper",
                            thumbnailUrl: "https://picsum.photos/300/300?random=audio",
                            sourceUrl: "https://openai.com/research/whisper",
                            mediaType: 1
                        }
                    }
                });
            } else {
                await sock.sendMessage(from, {
                    text: '❌ **No Speech Detected**\n\nCouldn\'t detect any speech in the audio. This might be because:\n• Audio is too quiet or unclear\n• No speech content in the file\n• Background noise is too loud\n\n💡 Try with clearer audio!'
                });
            }

        } catch (error) {
            console.error('Whisper error:', error);

            // Delete processing message
            try {
                await sock.sendMessage(from, { delete: processingMsg.key });
            } catch {}

            let errorMessage = '❌ **Error Transcribing Audio**\n\n';
            
            if (error.response?.status === 400) {
                errorMessage += 'Invalid audio format or corrupted file.';
            } else if (error.response?.status === 429) {
                errorMessage += 'Rate limit exceeded. Please wait before trying again.';
            } else if (error.response?.status === 401) {
                errorMessage += 'API key issue. Please contact the bot owner.';
            } else {
                errorMessage += `Error: ${error.message}`;
            }
            
            errorMessage += '\n\nPlease try with:\n• Clear audio quality\n• Supported format (MP3, WAV, etc.)\n• File size under 25MB';

            await sock.sendMessage(from, { text: errorMessage });
        }
    }
};