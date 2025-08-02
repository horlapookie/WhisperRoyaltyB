
const axios = require('axios');

module.exports = {
    name: 'anime',
    aliases: ['animesearch', 'mal', 'myanimelist'],
    description: 'Search for anime information',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            if (!args[0]) {
                await sock.sendMessage(from, {
                    text: `🍥 **ANIME SEARCH**\n\n📝 **Usage:**\n• ${settings.prefix}anime <anime name>\n• ${settings.prefix}mal Attack on Titan\n\n💡 **Examples:**\n• ${settings.prefix}anime Naruto\n• ${settings.prefix}anime "One Piece"\n• ${settings.prefix}animesearch Attack on Titan`
                });
                return;
            }

            const query = args.join(' ').trim();

            // Regular anime search
            await sock.sendMessage(from, {
                text: `🍥 Searching for anime: "${query}"... Please wait!`
            });

            // Use Jikan API (MyAnimeList unofficial API)
            const animeResponse = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
            
            if (animeResponse.data && animeResponse.data.data && animeResponse.data.data.length > 0) {
                const anime = animeResponse.data.data[0]; // Get the top result
                
                let animeMessage = `🍥 **ANIME INFORMATION**\n\n`;
                animeMessage += `📺 **Title:** ${anime.title}\n`;
                animeMessage += `🇯🇵 **Japanese:** ${anime.title_japanese || 'N/A'}\n`;
                animeMessage += `📊 **Score:** ${anime.score || 'N/A'}/10\n`;
                animeMessage += `📅 **Year:** ${anime.year || 'N/A'}\n`;
                animeMessage += `📺 **Episodes:** ${anime.episodes || 'N/A'}\n`;
                animeMessage += `⏱️ **Duration:** ${anime.duration || 'N/A'}\n`;
                animeMessage += `🎭 **Status:** ${anime.status || 'N/A'}\n`;
                animeMessage += `🎯 **Type:** ${anime.type || 'N/A'}\n`;
                animeMessage += `🔞 **Rating:** ${anime.rating || 'N/A'}\n`;
                
                if (anime.genres && anime.genres.length > 0) {
                    animeMessage += `🏷️ **Genres:** ${anime.genres.map(g => g.name).join(', ')}\n`;
                }
                
                if (anime.studios && anime.studios.length > 0) {
                    animeMessage += `🏢 **Studio:** ${anime.studios.map(s => s.name).join(', ')}\n`;
                }
                
                animeMessage += `\n📖 **Synopsis:**\n${anime.synopsis ? anime.synopsis.substring(0, 300) + '...' : 'No synopsis available'}\n\n`;
                animeMessage += `🔗 **MyAnimeList:** ${anime.url}\n`;
                animeMessage += `\n💡 **More Results:** Use ${settings.prefix}anime for other anime searches`;

                // Send with image if available
                if (anime.images && anime.images.jpg && anime.images.jpg.large_image_url) {
                    try {
                        const imageResponse = await axios.get(anime.images.jpg.large_image_url, {
                            responseType: 'arraybuffer'
                        });
                        
                        await sock.sendMessage(from, {
                            image: Buffer.from(imageResponse.data),
                            caption: animeMessage
                        });
                    } catch (imageError) {
                        await sock.sendMessage(from, { text: animeMessage });
                    }
                } else {
                    await sock.sendMessage(from, { text: animeMessage });
                }

                // Show additional results if available
                if (animeResponse.data.data.length > 1) {
                    let moreResults = `\n🔍 **Other Results for "${query}":**\n\n`;
                    
                    animeResponse.data.data.slice(1, 5).forEach((item, index) => {
                        moreResults += `**${index + 2}.** ${item.title} (${item.year || 'N/A'})\n`;
                        moreResults += `📊 Score: ${item.score || 'N/A'}/10 | Episodes: ${item.episodes || 'N/A'}\n\n`;
                    });
                    
                    await sock.sendMessage(from, { text: moreResults });
                }

            } else {
                await sock.sendMessage(from, {
                    text: `❌ No anime found for "${query}"\n\n💡 **Try:**\n• English or Japanese title\n• More specific anime name\n• Popular anime like: Naruto, One Piece, Attack on Titan`
                });
            }

        } catch (error) {
            console.error('Anime search error:', error);
            await sock.sendMessage(from, {
                text: `❌ **Anime search failed for "${args.join(' ')}"**\n\nError: ${error.message}\n\n💡 **Try:**\n• Different anime title\n• Check your spelling\n• Try again later`
            });
        }
    }
};
