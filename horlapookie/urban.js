const axios = require('axios');

module.exports = {
    name: 'urban',
    description: 'Get Urban Dictionary meaning',
    aliases: ['ud'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args[0]) {
            return await sock.sendMessage(from, { 
                text: `*Provide any word to search*\n\nExample: ${settings.prefix}urban yolo` 
            }, { quoted: message });
        }

        const word = args.join(' ');
        
        try {
            const searchingMsg = await sock.sendMessage(from, { 
                text: '🔍 Searching Urban Dictionary...' 
            }, { quoted: message });

            // Use Urban Dictionary API directly
            const response = await axios.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`);
            let result = response.data.list;
            
            if (!result || !result[0]) {
                await sock.sendMessage(from, { delete: searchingMsg.key });
                return await sock.sendMessage(from, { 
                    text: `❌ No definition found for "${word}" in Urban Dictionary.` 
                }, { quoted: message });
            }

            let term = result[0].word;
            let definition = result[0].definition;
            let example = result[0].example || 'No example available';
            
            // Clean up the text (Urban Dictionary often has brackets and formatting issues)
            definition = definition.replace(/\[|\]/g, '');
            example = example.replace(/\[|\]/g, '');
            
            // Truncate if too long
            if (definition.length > 1000) {
                definition = definition.substring(0, 1000) + '...';
            }
            if (example.length > 500) {
                example = example.substring(0, 500) + '...';
            }

            await sock.sendMessage(from, { delete: searchingMsg.key });
            
            await sock.sendMessage(from, {
                text: `📖 *Urban Dictionary*\n\n*Term*: ${term}\n\n*Definition*: ${definition}\n\n*Example*: ${example}\n\n⚠️ *Note*: Urban Dictionary contains user-generated content that may be inappropriate.`
            }, { quoted: message });

        } catch (err) {
            console.log('Urban Dictionary error:', err);
            await sock.sendMessage(from, { 
                text: `❌ Error searching Urban Dictionary: ${err.message || 'Unknown error'}` 
            }, { quoted: message });
        }
    }
};