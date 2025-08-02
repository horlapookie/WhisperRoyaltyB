
module.exports = {
    name: 'horlaai',
    aliases: ['ai', 'gemini', 'ask'],
    description: 'Chat with Horla AI powered by Gemini',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let userQuery = '';
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.conversation) {
                    userQuery = quotedMsg.conversation.trim();
                } else if (quotedMsg.extendedTextMessage?.text) {
                    userQuery = quotedMsg.extendedTextMessage.text.trim();
                }
                
                // Add args as additional context
                if (args.length > 0) {
                    userQuery += ' ' + args.join(' ');
                }
            }
            // If no quoted text, use command arguments
            else if (args.length > 0) {
                userQuery = args.join(' ').trim();
            }
            
            if (!userQuery) {
                await sock.sendMessage(from, {
                    text: `🤖 **HORLA AI**\n\n💬 **Usage:**\n• ${settings.prefix}horlaai <your question>\n• ${settings.prefix}ai What is the weather like?\n• Reply to message: ${settings.prefix}ask\n\n💡 **Examples:**\n• ${settings.prefix}horlaai Explain quantum physics\n• ${settings.prefix}ai Write a poem about nature\n• ${settings.prefix}ask Tell me a joke\n\n🧠 *Powered by Google Gemini AI*`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: `🤖 Horla AI is thinking... Please wait!`
            });

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const apiKey = process.env.GEMINI_API_KEY || settings.apiKeys.gemini;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // Add personality to the AI
            const systemPrompt = `You are Horla AI, a helpful and friendly AI assistant created by horlapookie. You are knowledgeable, conversational, and always try to be helpful. Keep responses informative but concise for WhatsApp format. Use emojis appropriately.`;
            
            const fullPrompt = `${systemPrompt}\n\nUser question: ${userQuery}`;
            
            const result = await model.generateContent(fullPrompt);
            const aiResponse = result.response.text().trim();

            // Split response if too long
            const maxLength = 2000;
            if (aiResponse.length > maxLength) {
                const chunks = aiResponse.match(new RegExp(`.{1,${maxLength}}`, 'g'));
                for (let i = 0; i < chunks.length; i++) {
                    const chunkMessage = i === 0 
                        ? `🤖 **HORLA AI RESPONSE** (${i+1}/${chunks.length})\n\n${chunks[i]}`
                        : `🤖 **HORLA AI RESPONSE** (${i+1}/${chunks.length})\n\n${chunks[i]}`;
                    
                    await sock.sendMessage(from, { text: chunkMessage });
                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } else {
                const responseMessage = `🤖 **HORLA AI RESPONSE**\n\n${aiResponse}\n\n💡 *Powered by Google Gemini AI*`;
                await sock.sendMessage(from, { text: responseMessage });
            }

        } catch (error) {
            console.error('Horla AI error:', error);
            await sock.sendMessage(from, {
                text: '❌ Horla AI is currently unavailable. Please try again later.'
            });
        }
    }
};
