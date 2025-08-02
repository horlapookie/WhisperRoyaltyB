const { spawn } = require('child_process');
const axios = require('axios');

module.exports = {
    name: 'pokemon',
    description: 'Search and download Pokemon images',
    aliases: ['poke', 'pokesearch', 'pokepic'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            if (!args[0]) {
                await sock.sendMessage(from, {
                    text: `🔍 Please provide a Pokemon name!\n\n🎮 **Usage:**\n• ${settings.prefix}pokemon pikachu\n• ${settings.prefix}poke charizard\n• ${settings.prefix}pokepic bulbasaur\n\n💡 **Tip:** Use English Pokemon names for best results`
                });
                return;
            }

            const pokemonName = args.join(' ').toLowerCase().trim();
            
            await sock.sendMessage(from, {
                text: `🔍 Searching for ${pokemonName} images... Please wait!`
            });

            // Use Python scraper for Pokemon API
            const pythonProcess = spawn('python3', ['utils/scraper.py', 'pokemon', pokemonName]);
            let result = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', async (code) => {
                try {
                    if (code !== 0 || error) {
                        throw new Error('Scraper failed');
                    }

                    const data = JSON.parse(result);
                    
                    if (data.error) {
                        await sock.sendMessage(from, {
                            text: `❌ Pokemon "${pokemonName}" not found!\n\n💡 **Try:**\n• Check spelling\n• Use English names\n• Try popular Pokemon like: pikachu, charizard, mewtwo`
                        });
                        return;
                    }

                    // Send Pokemon info
                    const infoText = `🎮 **POKEMON FOUND**\n\n📛 **Name:** ${data.name}\n🆔 **ID:** #${data.id.toString().padStart(3, '0')}\n🏷️ **Types:** ${data.types.join(', ')}\n\n📸 Sending image...`;
                    
                    await sock.sendMessage(from, {
                        text: infoText
                    });

                    // Send only 1 image (the first one)
                    if (data.images && data.images.length > 0) {
                        try {
                            const imageUrl = data.images[0];
                            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                            
                            await sock.sendMessage(from, {
                                image: Buffer.from(imageResponse.data),
                                caption: `🎮 ${data.name} - Pokemon Image`
                            });
                        } catch (imgError) {
                            console.log(`Failed to send image: ${imgError.message}`);
                        }
                    }

                } catch (parseError) {
                    console.error('Pokemon command parse error:', parseError);
                    await sock.sendMessage(from, {
                        text: `❌ Failed to search Pokemon images. Please try again with a different Pokemon name.\n\n💡 **Popular Pokemon:**\npikachu, charizard, blastoise, venusaur, mewtwo, mew, lucario, garchomp, rayquaza, arceus`
                    });
                }
            });

        } catch (error) {
            console.error('Pokemon command error:', error);
            await sock.sendMessage(from, {
                text: `❌ An error occurred while searching for Pokemon images.\n\n🔄 **Try again with:**\n• ${settings.prefix}pokemon pikachu\n• ${settings.prefix}poke charizard`
            });
        }
    }
};