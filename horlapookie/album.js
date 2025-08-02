const axios = require('axios');
const settings = require('../settings');

module.exports = {
    name: 'album',
    aliases: ['albuminfo', 'disc', 'record'],
    description: 'Get album information using Genius API',
    usage: 'album <album name> [artist name]',
    category: 'media',
    cooldown: 5,

    async execute(sock, msg, args, context) {
        const { from } = context;

        if (!args || args.length === 0) {
            return await sock.sendMessage(from, {
                text: '❌ Please provide an album name!\n\n📝 **Usage:**\n• .album Scorpion\n• .album "The Dark Side of the Moon" Pink Floyd\n• .album Views Drake'
            });
        }

        const query = args.join(' ');
        
        const searchingMsg = await sock.sendMessage(from, {
            text: '🔍 Searching for album information... Please wait!'
        });

        try {
            // Search for songs/albums on Genius
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
                    text: `❌ **Album Not Found**\n\nCouldn't find information for: "${query}"\n\n💡 Try:\n• Using exact album name\n• Including artist name\n• Checking spelling`
                });
            }

            // Find a song with album information
            let albumData = null;
            let songWithAlbum = null;

            for (const hit of hits) {
                if (hit.result.album && hit.result.album.name) {
                    songWithAlbum = hit.result;
                    
                    // Get detailed album information through the song's album
                    try {
                        const songResponse = await axios.get(`https://api.genius.com/songs/${hit.result.id}`, {
                            headers: {
                                'Authorization': `Bearer ${settings.apiKeys.genius}`
                            }
                        });
                        
                        if (songResponse.data.response.song.album) {
                            albumData = songResponse.data.response.song.album;
                            break;
                        }
                    } catch (err) {
                        continue;
                    }
                }
            }

            if (!albumData) {
                // Delete searching message
                try {
                    await sock.sendMessage(from, { delete: searchingMsg.key });
                } catch {}
                
                return await sock.sendMessage(from, {
                    text: `❌ **Album Information Not Available**\n\nFound songs but no detailed album information for: "${query}"\n\n💡 Try searching for specific songs from the album instead.`
                });
            }

            // Get more songs from this album/artist
            const artistSongsResponse = await axios.get(`https://api.genius.com/artists/${songWithAlbum.primary_artist.id}/songs`, {
                params: {
                    per_page: 20
                },
                headers: {
                    'Authorization': `Bearer ${settings.apiKeys.genius}`
                }
            });

            // Filter songs from the same album
            const albumSongs = artistSongsResponse.data.response.songs.filter(song => 
                song.album && song.album.name === albumData.name
            ).slice(0, 10);

            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            // Create album info message
            let albumInfo = `💿 **${albumData.name}**\n👨‍🎤 **Artist:** ${songWithAlbum.primary_artist.name}`;
            
            if (albumData.release_date_for_display) {
                albumInfo += `\n📅 **Release Date:** ${albumData.release_date_for_display}`;
            }

            if (albumSongs.length > 0) {
                albumInfo += `\n\n🎵 **Tracks Found:**`;
                albumSongs.forEach((song, index) => {
                    albumInfo += `\n${index + 1}. ${song.title}`;
                });
                
                if (albumSongs.length >= 10) {
                    albumInfo += `\n... and more`;
                }
            }

            albumInfo += `\n\n🔗 **Artist Profile:** ${songWithAlbum.primary_artist.url}`;

            // Send album info with cover art
            await sock.sendMessage(from, {
                image: { url: albumData.cover_art_url || songWithAlbum.song_art_image_url || 'https://picsum.photos/300/300?random=album' },
                caption: albumInfo,
                contextInfo: {
                    externalAdReply: {
                        title: albumData.name,
                        body: `by ${songWithAlbum.primary_artist.name}`,
                        thumbnailUrl: albumData.cover_art_url || songWithAlbum.song_art_image_url || 'https://picsum.photos/300/300?random=album',
                        sourceUrl: songWithAlbum.primary_artist.url,
                        mediaType: 1
                    }
                }
            });

        } catch (error) {
            console.error('Album info error:', error);
            
            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            await sock.sendMessage(from, {
                text: `❌ **Error Getting Album Info**\n\nError: ${error.message}\n\nPlease try again with a different search term.`
            });
        }
    }
};