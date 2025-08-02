const axios = require('axios');
const settings = require('../settings');

module.exports = {
    name: 'chatgpt',
    aliases: ['gpt', 'openai', 'chat'],
    description: 'Chat with ChatGPT AI (GPT-4)',
    usage: 'chatgpt <your message>',
    category: 'ai',
    cooldown: 5,

    async execute(sock, msg, args, context) {
        const { from } = context;

        if (!args || args.length === 0) {
            return await sock.sendMessage(from, {
                text: '❌ Please provide a message to chat with ChatGPT!\n\n📝 **Usage:**\n• .chatgpt Hello, how are you?\n• .gpt Explain quantum physics\n• .chat Write a poem about nature'
            });
        }

        const userMessage = args.join(' ');

        if (userMessage.length > 4000) {
            return await sock.sendMessage(from, {
                text: '❌ Message too long! Please keep it under 4000 characters.'
            });
        }

        const thinkingMsg = await sock.sendMessage(from, {
            text: '🤖 ChatGPT is thinking... Please wait!'
        });

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful AI assistant integrated into a WhatsApp bot. Provide helpful, accurate, and concise responses. Keep responses under 2000 characters to fit WhatsApp message limits."
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const aiResponse = response.data.choices[0].message.content;

            // Delete thinking message
            try {
                await sock.sendMessage(from, { delete: thinkingMsg.key });
            } catch {}

            // Send ChatGPT response
            await sock.sendMessage(from, {
                text: `🤖 **ChatGPT Response**\n\n${aiResponse}\n\n✨ **Powered by GPT-4**`,
                contextInfo: {
                    externalAdReply: {
                        title: "ChatGPT AI Assistant",
                        body: "Powered by OpenAI GPT-4",
                        thumbnailUrl: "https://picsum.photos/300/300?random=ai",
                        sourceUrl: "https://openai.com/gpt-4",
                        mediaType: 1
                    }
                }
            });

        } catch (error) {
            console.error('ChatGPT error:', error);
            console.error('API Key exists:', !!settings.apiKeys.openai);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error message:', error.message);

            // Delete generating message
            try {
                await sock.sendMessage(from, { delete: thinkingMsg.key });
            } catch {}

            let errorMessage = '❌ **ChatGPT Error**\n\n';

            if (error.response?.status === 400) {
                errorMessage += 'Invalid request. Please check your message content.';
            } else if (error.response?.status === 429) {
                errorMessage += 'Rate limit exceeded. Please wait before trying again.';
            } else if (error.response?.status === 401) {
                errorMessage += 'API key issue. Please contact the bot owner.';
            } else {
                errorMessage += `Error: ${error.message}`;
            }

            await sock.sendMessage(from, { text: errorMessage });
        }
    }
};