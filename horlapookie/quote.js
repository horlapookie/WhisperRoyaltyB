const fetch = require('node-fetch');

module.exports = {
    name: 'quote',
    description: 'Get inspirational quotes or quotes by category',
    aliases: ['quotes', 'inspire', 'wisdom'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            let category = args[0] || 'inspirational';
            
            // Map common categories
            const categoryMap = {
                'motivational': 'motivational',
                'love': 'love',
                'life': 'life',
                'success': 'success',
                'wisdom': 'wisdom',
                'funny': 'funny',
                'inspirational': 'inspirational',
                'friendship': 'friendship',
                'happiness': 'happiness'
            };
            
            category = categoryMap[category.toLowerCase()] || 'inspirational';
            
            await sock.sendMessage(from, {
                text: `💭 Getting a ${category} quote for you...`
            });

            const url = `https://api.quotable.io/random?tags=${category}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Quote API returned ${response.status}`);
            }
            
            const quote = await response.json();
            
            const quoteMessage = `💭 **DAILY QUOTE**

"${quote.content}"

👤 **Author:** ${quote.author}
🏷️ **Category:** ${quote.tags.join(', ')}
📏 **Length:** ${quote.length} characters

💡 **Available categories:**
motivational, love, life, success, wisdom, funny, inspirational, friendship, happiness

📝 **Usage:** ${settings.prefix}quote [category]`;

            await sock.sendMessage(from, {
                text: quoteMessage
            });
            
        } catch (error) {
            console.error('Quote command error:', error);
            
            // Fallback quotes
            const fallbackQuotes = [
                '"The only way to do great work is to love what you do." - Steve Jobs',
                '"Life is what happens to you while you\'re busy making other plans." - John Lennon',
                '"The future belongs to those who believe in the beauty of their dreams." - Eleanor Roosevelt',
                '"It is during our darkest moments that we must focus to see the light." - Aristotle',
                '"The only impossible journey is the one you never begin." - Tony Robbins'
            ];
            
            const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
            
            await sock.sendMessage(from, {
                text: `💭 **DAILY QUOTE**\n\n${randomQuote}\n\n✨ *From the bot's collection*`
            });
        }
    }
};