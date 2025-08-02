const axios = require('axios');
const settings = require('../settings');

module.exports = {
    name: 'dalle',
    aliases: ['dall-e', 'imagegen', 'createimage'],
    description: 'Generate images using DALL-E AI',
    usage: 'dalle <description>',
    category: 'ai',
    cooldown: 15,

    async execute(sock, msg, args, context) {
        const { from } = context;
        
        // Ensure we have a valid JID
        if (!from || typeof from !== 'string') {
            console.error('Invalid from JID:', from);
            return;
        }

        if (!args || args.length === 0) {
            try {
                return await sock.sendMessage(from, {
                text: '❌ Please provide a description for the image!\n\n📝 **Usage:**\n• .dalle a cat wearing sunglasses\n• .dalle futuristic city at sunset\n• .dalle abstract art with blue and gold colors'
                });
            } catch (sendError) {
                console.error('Error sending message:', sendError);
                return;
            }
        }

        const prompt = args.join(' ');
        
        if (prompt.length > 1000) {
            try {
                return await sock.sendMessage(from, {
                    text: '❌ Description too long! Please keep it under 1000 characters.'
                });
            } catch (sendError) {
                console.error('Error sending message:', sendError);
                return;
            }
        }

        let generatingMsg;
        try {
            generatingMsg = await sock.sendMessage(from, {
                text: '🎨 Generating image... This may take a few moments!'
            });
        } catch (sendError) {
            console.error('Error sending generating message:', sendError);
            return;
        }

        try {
            const response = await axios.post('https://api.openai.com/v1/images/generations', {
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                response_format: "url"
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });

            const imageUrl = response.data.data[0].url;
            const revisedPrompt = response.data.data[0].revised_prompt;

            // Delete generating message
            try {
                await sock.sendMessage(from, { delete: generatingMsg.key });
            } catch {}

            // Send the generated image
            try {
                await sock.sendMessage(from, {
                image: { url: imageUrl },
                caption: `🎨 **Image Generated Successfully!**\n\n🖼️ **Your Prompt:** ${prompt}\n\n🤖 **AI Enhanced Prompt:** ${revisedPrompt}\n\n✨ **Powered by DALL-E 3**`,
                contextInfo: {
                    externalAdReply: {
                        title: "DALL-E Image Generation",
                        body: prompt,
                        thumbnailUrl: imageUrl,
                        sourceUrl: "https://openai.com/dall-e-3",
                        mediaType: 1
                    }
                }
                });
            } catch (sendError) {
                console.error('Error sending generated image:', sendError);
            }

        } catch (error) {
            console.error('DALL-E error:', error);
            console.error('API Key exists:', !!settings.apiKeys.openai);
            console.error('Error response:', error.response?.data);
            
            // Delete generating message
            try {
                await sock.sendMessage(from, { delete: generatingMsg.key });
            } catch {}

            let errorMessage = '❌ **Error Generating Image**\n\n';
            
            if (error.response?.status === 400) {
                errorMessage += 'Your request was rejected. Please ensure your prompt:\n• Does not contain inappropriate content\n• Is clear and descriptive\n• Follows OpenAI usage policies';
            } else if (error.response?.status === 429) {
                errorMessage += 'Rate limit exceeded. Please wait a moment before trying again.';
            } else if (error.response?.status === 401) {
                errorMessage += 'API key issue. Please contact the bot owner.';
            } else {
                errorMessage += `Error: ${error.message}\n\nPlease try again with a different prompt.`;
            }

            try {
                await sock.sendMessage(from, { text: errorMessage });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
};