const fetch = require('node-fetch');

module.exports = {
    name: 'fact',
    description: 'Get random interesting facts',
    aliases: ['facts', 'trivia', 'knowledge'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            await sock.sendMessage(from, {
                text: '🧠 Getting an interesting fact for you...'
            });

            // Try different fact APIs
            let factText = '';
            let source = '';
            
            try {
                // Primary API - Cat Facts (reliable)
                const catResponse = await fetch('https://catfact.ninja/fact');
                if (catResponse.ok) {
                    const catData = await catResponse.json();
                    factText = catData.fact;
                    source = 'Cat Facts';
                }
            } catch (catError) {
                console.log('Cat facts API failed:', catError.message);
            }
            
            // Fallback to Numbers API if cat facts failed
            if (!factText) {
                try {
                    const numbersResponse = await fetch('http://numbersapi.com/random/trivia');
                    if (numbersResponse.ok) {
                        factText = await numbersResponse.text();
                        source = 'Numbers API';
                    }
                } catch (numbersError) {
                    console.log('Numbers API failed:', numbersError.message);
                }
            }
            
            // Final fallback to local facts
            if (!factText) {
                const fallbackFacts = [
                    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.",
                    "A group of flamingos is called a 'flamboyance'.",
                    "Bananas are berries, but strawberries aren't.",
                    "Octopuses have three hearts and blue blood.",
                    "A shrimp's heart is in its head.",
                    "It's impossible to hum while holding your nose closed.",
                    "The human brain uses about 20% of the body's total energy.",
                    "A bolt of lightning is six times hotter than the surface of the Sun.",
                    "Butterflies taste with their feet.",
                    "A group of pandas is called an 'embarrassment'.",
                    "The shortest war in history lasted 38-45 minutes between Britain and Zanzibar in 1896.",
                    "Your stomach gets entirely new lining every 3-4 days because stomach acid would otherwise digest it.",
                    "There are more possible games of chess than atoms in the observable universe.",
                    "Dolphins have names for each other - unique whistle signatures.",
                    "The Great Wall of China isn't visible from space with the naked eye, contrary to popular belief."
                ];
                
                factText = fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
                source = 'Bot Collection';
            }
            
            const factMessage = `🧠 **INTERESTING FACT**

${factText}

📚 **Source:** ${source}
🎯 **Category:** ${source === 'Cat Facts' ? 'Animals' : source === 'Numbers API' ? 'Numbers & Trivia' : 'General Knowledge'}

💡 **Did you know?** Facts help exercise your brain and make great conversation starters!

📝 **Get more:** Use ${settings.prefix}fact again for another interesting fact!`;

            await sock.sendMessage(from, {
                text: factMessage
            });
            
        } catch (error) {
            console.error('Fact command error:', error);
            
            // Emergency fallback
            const emergencyFacts = [
                "The human heart beats about 100,000 times per day!",
                "There are more stars in the universe than grains of sand on all Earth's beaches!",
                "A group of owls is called a 'parliament'!",
                "The longest recorded flight of a chicken is 13 seconds!",
                "Penguins can jump as high as 6 feet in the air!"
            ];
            
            const randomFact = emergencyFacts[Math.floor(Math.random() * emergencyFacts.length)];
            
            await sock.sendMessage(from, {
                text: `🧠 **INTERESTING FACT**\n\n${randomFact}\n\n✨ *From emergency collection*`
            });
        }
    }
};