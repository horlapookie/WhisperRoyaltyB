const fetch = require('node-fetch');

module.exports = {
    name: 'joke',
    description: 'Get random jokes from different categories',
    aliases: ['jokes', 'funny', 'laugh'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            let category = args[0] || 'any';
            
            // Available categories
            const validCategories = [
                'programming', 'misc', 'dark', 'pun', 'spooky', 'christmas', 'any'
            ];
            
            if (!validCategories.includes(category.toLowerCase())) {
                category = 'any';
            }
            
            await sock.sendMessage(from, {
                text: '😂 Getting a joke for you... Please wait!'
            });

            const url = `https://v2.jokeapi.dev/joke/${category}?blacklistFlags=nsfw,religious,political,racist,sexist,explicit`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Joke API returned ${response.status}`);
            }
            
            const joke = await response.json();
            
            let jokeText;
            if (joke.type === 'single') {
                jokeText = joke.joke;
            } else {
                jokeText = `${joke.setup}\n\n${joke.delivery}`;
            }
            
            const jokeMessage = `😂 **JOKE TIME**

${jokeText}

🏷️ **Category:** ${joke.category}
⭐ **Rating:** Safe for work
🎭 **Type:** ${joke.type === 'single' ? 'One-liner' : 'Setup & Punchline'}

💡 **Available categories:**
programming, misc, pun, spooky, christmas, any

📝 **Usage:** ${settings.prefix}joke [category]`;

            await sock.sendMessage(from, {
                text: jokeMessage
            });
            
        } catch (error) {
            console.error('Joke command error:', error);
            
            // Fallback jokes
            const fallbackJokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "Why did the scarecrow win an award? He was outstanding in his field!",
                "Why don't eggs tell jokes? They'd crack each other up!",
                "What do you call a fake noodle? An impasta!",
                "Why did the math book look so sad? Because it had too many problems!"
            ];
            
            const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
            
            await sock.sendMessage(from, {
                text: `😂 **JOKE TIME**\n\n${randomJoke}\n\n✨ *From the bot's collection*`
            });
        }
    }
};