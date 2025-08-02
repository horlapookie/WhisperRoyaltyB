const axios = require('axios');
const settings = require('../settings');

module.exports = {
    name: 'songinfo',
    aliases: ['song-info', 'trackinfo', 'musicinfo'],
    description: 'Get detailed song information using Genius API',
    usage: 'songinfo <song title> [artist name]',
    category: 'media',
    cooldown: 5,

    async execute(sock, msg, args, context) {
        const { from } = context;

        if (!args || args.length === 0) {
            return await sock.sendMessage(from, {
                text: '❌ Please provide a song title!\n\n📝 **Usage:**\n• .songinfo Blinding Lights\n• .songinfo "God\'s Plan" Drake\n• .songinfo Bad Guy Billie Eilish'
            });
        }

        const query = args.join(' ');
        
        const searchingMsg = await sock.sendMessage(from, {
            text: '🔍 Searching for song information... Please wait!'
        });

        try {
            // Search for the song on Genius
            const searchResponse = await axios.get('https://api.genius.com/search', {
                params: {
                    q: query
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
                    text: `❌ **No Results Found**\n\nCouldn't find information for: "${query}"\n\n💡 Try:\n• Using more specific song title\n• Including artist name\n• Checking spelling`
                });
            }

            const song = hits[0].result;
            
            // Get detailed song information
            const songResponse = await axios.get(`https://api.genius.com/songs/${song.id}`, {
                headers: {
                    'Authorization': `Bearer ${settings.apiKeys.genius}`
                }
            });

            const songData = songResponse.data.response.song;

            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            // Create detailed song info message
            let songInfo = `🎵 **${songData.title}**\n👨‍🎤 **Artist:** ${songData.primary_artist.name}`;
            
            if (songData.featured_artists && songData.featured_artists.length > 0) {
                const featuredNames = songData.featured_artists.map(artist => artist.name).join(', ');
                songInfo += `\n🤝 **Featured:** ${featuredNames}`;
            }

            if (songData.album?.name) {
                songInfo += `\n💿 **Album:** ${songData.album.name}`;
            }
            
            if (songData.release_date_for_display) {
                songInfo += `\n📅 **Release:** ${songData.release_date_for_display}`;
            }

            if (songData.stats?.pageviews) {
                songInfo += `\n👀 **Views:** ${songData.stats.pageviews.toLocaleString()}`;
            }

            if (songData.producer_artists && songData.producer_artists.length > 0) {
                const producerNames = songData.producer_artists.map(producer => producer.name).join(', ');
                songInfo += `\n🎛️ **Producers:** ${producerNames}`;
            }

            if (songData.writer_artists && songData.writer_artists.length > 0) {
                const writerNames = songData.writer_artists.slice(0, 3).map(writer => writer.name).join(', ');
                songInfo += `\n✍️ **Writers:** ${writerNames}${songData.writer_artists.length > 3 ? ' +more' : ''}`;
            }

            songInfo += `\n\n🔗 **Genius URL:** ${songData.url}`;

            if (songData.description && songData.description.plain) {
                const description = songData.description.plain;
                const shortDescription = description.length > 150 
                    ? description.substring(0, 150) + '...' 
                    : description;
                songInfo += `\n\n📖 **About:**\n${shortDescription}`;
            }

            // Send song info with artwork
            await sock.sendMessage(from, {
                image: { url: songData.song_art_image_url || 'https://picsum.photos/300/300?random=music' },
                caption: songInfo,
                contextInfo: {
                    externalAdReply: {
                        title: songData.title,
                        body: `by ${songData.primary_artist.name}`,
                        thumbnailUrl: songData.song_art_image_url || 'https://picsum.photos/300/300?random=music',
                        sourceUrl: songData.url,
                        mediaType: 1
                    }
                }
            });

        } catch (error) {
            console.error('Song info error:', error);
            
            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            await sock.sendMessage(from, {
                text: `❌ **Error Getting Song Info**\n\nError: ${error.message}\n\nPlease try again with a different search term.`
            });
        }
    }
};