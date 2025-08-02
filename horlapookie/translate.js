
module.exports = {
    name: 'translate',
    aliases: ['tr', 'trans'],
    description: 'Translate text to any language using AI',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let textToTranslate = '';
            let targetLanguage = 'english';
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.conversation) {
                    textToTranslate = quotedMsg.conversation.trim();
                } else if (quotedMsg.extendedTextMessage?.text) {
                    textToTranslate = quotedMsg.extendedTextMessage.text.trim();
                }
                
                // Get target language from args
                if (args.length > 0) {
                    targetLanguage = args.join(' ').trim();
                }
            }
            // If no quoted text, use command arguments
            else if (args.length >= 2) {
                targetLanguage = args[0];
                textToTranslate = args.slice(1).join(' ').trim();
            }
            
            if (!textToTranslate) {
                await sock.sendMessage(from, {
                    text: `🌐 **TRANSLATOR**\n\n📝 **Usage:**\n• ${settings.prefix}translate <language> <text>\n• ${settings.prefix}translate spanish Hello world\n• Reply to message: ${settings.prefix}translate french\n\n💡 **Examples:**\n• ${settings.prefix}tr spanish How are you?\n• ${settings.prefix}trans chinese Good morning\n\n🌍 **Supported:** All major languages (english, spanish, french, chinese, arabic, etc.)`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: `🌐 Translating to ${targetLanguage}... Please wait!`
            });

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const apiKey = process.env.GEMINI_API_KEY || settings.apiKeys.gemini;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `Translate the following text to ${targetLanguage}. Only provide the translation, no explanations:\n\n"${textToTranslate}"`;
            
            const result = await model.generateContent(prompt);
            const translatedText = result.response.text().trim();

            const translationMessage = `🌐 **TRANSLATION RESULT**

📝 **Original Text:**
${textToTranslate}

🌍 **Translated to ${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)}:**
${translatedText}

🤖 *Powered by Gemini AI*`;

            await sock.sendMessage(from, {
                text: translationMessage
            });

        } catch (error) {
            console.error('Translation error:', error);
            await sock.sendMessage(from, {
                text: '❌ Translation failed. Please check your text and target language, then try again.'
            });
        }
    }
};
