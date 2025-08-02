const axios = require('axios');
const settings = require('../settings');

module.exports = {
    name: 'lyrics',
    aliases: ['lyric', 'songlyrics', 'getlyrics'],
    description: 'Get song lyrics using Genius API',
    usage: 'lyrics <song title> [artist name]',
    category: 'media',
    cooldown: 5,

    async execute(sock, msg, args, context) {
        const { from, isOwner } = context;

        // Ensure we have a valid JID
        if (!from || typeof from !== 'string') {
            console.error('Invalid from JID:', from);
            return;
        }

        if (!args || args.length === 0) {
            return await sock.sendMessage(from, {
                text: '❌ Please provide a song title!\n\n📝 **Usage:**\n• .lyrics Shape of You\n• .lyrics Bohemian Rhapsody Queen\n• .lyrics "All of Me" John Legend'
            });
        }

        const query = args.join(' ');

        const searchingMsg = await sock.sendMessage(from, {
            text: '🔍 Searching for lyrics... Please wait!'
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
                    text: `❌ **No Results Found**\n\nCouldn't find lyrics for: "${query}"\n\n💡 Try:\n• Using more specific song title\n• Including artist name\n• Checking spelling`
                });
            }

            const song = hits[0].result;

            // Get song details
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

            // Create song info message
            let songInfo = `🎵 **${songData.title}**\n👨‍🎤 **Artist:** ${songData.primary_artist.name}`;

            if (songData.album?.name) {
                songInfo += `\n💿 **Album:** ${songData.album.name}`;
            }

            if (songData.release_date_for_display) {
                songInfo += `\n📅 **Release:** ${songData.release_date_for_display}`;
            }

            songInfo += `\n🔗 **Genius URL:** ${songData.url}`;
            songInfo += `\n\n⚠️ **Note:** Full lyrics require visiting the Genius page due to API limitations.`;

            // Send song info with thumbnail
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
            console.error('Lyrics error:', error);

            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            await sock.sendMessage(from, {
                text: `❌ **Error Getting Lyrics**\n\nError: ${error.message}\n\nPlease try again with a different search term.`
            });
        }
    }
};