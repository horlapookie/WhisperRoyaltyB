const axios = require('axios');
const settings = require('../settings');

module.exports = {
    name: 'artist',
    aliases: ['artistinfo', 'musician', 'singer'],
    description: 'Get detailed artist information using Genius API',
    usage: 'artist <artist name>',
    category: 'media',
    cooldown: 5,

    async execute(sock, msg, args, context) {
        const { from } = context;

        if (!args || args.length === 0) {
            return await sock.sendMessage(from, {
                text: '❌ Please provide an artist name!\n\n📝 **Usage:**\n• .artist Drake\n• .artist "Taylor Swift"\n• .artist Eminem'
            });
        }

        const artistName = args.join(' ');

        const searchingMsg = await sock.sendMessage(from, {
            text: '🔍 Searching for artist information... Please wait!'
        });

        try {
            // Search for the artist on Genius
            const searchResponse = await axios.get('https://api.genius.com/search', {
                params: {
                    q: artistName
                },
                headers: {
                    'Authorization': `Bearer ${settings.apiKeys.genius}`
                }
            });

            const hits = searchResponse.data.response.hits;

            if (!hits || hits.length === 0) {
                // Delete searching message
                try {
                    await sock.sendMessage(from, { delete: searchingMsg.key });
                } catch {}

                return await sock.sendMessage(from, {
                    text: `❌ **Artist Not Found**\n\nCouldn't find information for: "${artistName}"\n\n💡 Try:\n• Using exact artist name\n• Checking spelling\n• Using alternative names`
                });
            }

            // Get the first artist from search results
            const artist = hits[0].result.primary_artist;

            // Get detailed artist information
            const artistResponse = await axios.get(`https://api.genius.com/artists/${artist.id}`, {
                headers: {
                    'Authorization': `Bearer ${settings.apiKeys.genius}`
                }
            });

            const artistData = artistResponse.data.response.artist;

            // Get artist's popular songs
            const songsResponse = await axios.get(`https://api.genius.com/artists/${artist.id}/songs`, {
                params: {
                    sort: 'popularity',
                    per_page: 5
                },
                headers: {
                    'Authorization': `Bearer ${settings.apiKeys.genius}`
                }
            });

            const popularSongs = songsResponse.data.response.songs;

            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            // Create artist info message
            let artistInfo = `🎤 **${artistData.name}**\n`;

            if (artistData.alternate_names && artistData.alternate_names.length > 0) {
                artistInfo += `🏷️ **Also Known As:** ${artistData.alternate_names.slice(0, 3).join(', ')}\n`;
            }

            if (artistData.followers_count) {
                artistInfo += `👥 **Followers:** ${artistData.followers_count.toLocaleString()}\n`;
            }

            if (artistData.description && artistData.description.plain) {
                const description = artistData.description.plain;
                const shortDescription = description.length > 200 
                    ? description.substring(0, 200) + '...' 
                    : description;
                artistInfo += `\n📝 **Bio:**\n${shortDescription}\n`;
            }

            artistInfo += `\n🔗 **Genius Profile:** ${artistData.url}`;

            // Add popular songs
            if (popularSongs && popularSongs.length > 0) {
                artistInfo += `\n\n🔥 **Popular Songs:**`;
                popularSongs.slice(0, 5).forEach((song, index) => {
                    artistInfo += `\n${index + 1}. ${song.title}`;
                });
            }

            // Send artist info with image
            await sock.sendMessage(from, {
                image: { url: artistData.image_url || 'https://picsum.photos/300/300?random=artist' },
                caption: artistInfo,
                contextInfo: {
                    externalAdReply: {
                        title: artistData.name,
                        body: `${artistData.followers_count ? artistData.followers_count.toLocaleString() + ' followers' : 'Artist Info'}`,
                        thumbnailUrl: artistData.image_url || 'https://picsum.photos/300/300?random=artist',
                        sourceUrl: artistData.url,
                        mediaType: 1
                    }
                }
            });

        } catch (error) {
            console.error('Artist search error:', error);
            console.error('Genius API Key exists:', !!settings.apiKeys.genius);
            console.error('Error stack:', error.stack);
            console.error('Error response:', error.response?.data);

            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            await sock.sendMessage(from, {
                text: `❌ **Error Getting Artist Info**\n\nError: ${error.message}\n\nPlease try again with a different artist name.`
            });
        }
    }
};