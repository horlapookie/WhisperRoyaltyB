const axios = require('axios');
const fs = require('fs');
const path = require('path');

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports = {
    name: 'animed',
    aliases: ['animedownload', 'anidown', 'episodedown'],
    description: 'Download anime episodes by name, season, and episode number',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            if (!args[0]) {
                await sock.sendMessage(from, {
                    text: `🍥 **ANIME EPISODE DOWNLOAD**\n\n📝 **Usage:**\n• ${settings.prefix}animed <anime_name> | <season> | <episode>\n\n💡 **Examples:**\n• ${settings.prefix}animed Solo Leveling | 1 | 4\n• ${settings.prefix}animed Attack on Titan | 4 | 16\n• ${settings.prefix}animed Naruto | 1 | 25\n\n📋 **Format:**\n• Anime Name | Season Number | Episode Number\n• Use "|" to separate parameters`
                });
                return;
            }

            const fullQuery = args.join(' ');
            const parts = fullQuery.split('|').map(part => part.trim());

            if (parts.length !== 3) {
                await sock.sendMessage(from, {
                    text: `❌ **Invalid format**\n\n📝 **Correct Usage:**\n${settings.prefix}animed <anime_name> | <season> | <episode>\n\n💡 **Example:**\n${settings.prefix}animed Solo Leveling | 1 | 4`
                });
                return;
            }

            const [animeName, season, episode] = parts;
            const seasonNum = parseInt(season);
            const episodeNum = parseInt(episode);

            if (isNaN(seasonNum) || isNaN(episodeNum) || seasonNum < 1 || episodeNum < 1) {
                await sock.sendMessage(from, {
                    text: `❌ **Invalid season or episode number**\n\nSeason and episode must be positive numbers.\n\n💡 **Example:**\n${settings.prefix}animed Solo Leveling | 1 | 4`
                });
                return;
            }

            await sock.sendMessage(from, {
                text: `🍥 **Searching for anime episode...**\n\n📺 **Anime:** ${animeName}\n🎬 **Season:** ${seasonNum}\n📝 **Episode:** ${episodeNum}\n\n⏳ Please wait while we find the episode...`
            });

            try {
                // Search for anime using multiple APIs
                let downloadUrl = null;
                let episodeInfo = null;

                // Try Gogoanime API
                try {
                    // Search for anime
                    const searchResponse = await fetch(`https://api.consumet.org/anime/gogoanime/${encodeURIComponent(animeName)}`);
                    if (!searchResponse.ok) {
                        return await sock.sendMessage(from, { 
                            text: '❌ Failed to search for anime. Please check the name and try again.' 
                        });
                    }

                    const searchResults = await searchResponse.json();
                    if (!searchResults.results || searchResults.results.length === 0) {
                        return await sock.sendMessage(from, { 
                            text: `❌ No anime found with name "${animeName}". Please check spelling and try again.` 
                        });
                    }

                    const anime = searchResults.results[0];

                    // Get anime info
                    const infoResponse = await fetch(`https://api.consumet.org/anime/gogoanime/info/${anime.id}`);
                    if (!infoResponse.ok) {
                        return await sock.sendMessage(from, { 
                            text: '❌ Failed to get anime information.' 
                        });
                    }

                    const animeInfo = await infoResponse.json();

                    if (!animeInfo.episodes || animeInfo.episodes.length === 0) {
                        return await sock.sendMessage(from, { 
                            text: `❌ No episodes found for "${anime.title}"!` 
                        });
                    }

                    // Check if episode number is valid
                    const episodeNumber = parseInt(episode);
                    if (episodeNumber > animeInfo.episodes.length || episodeNumber < 1) {
                        return await sock.sendMessage(from, { 
                            text: `❌ Episode ${episodeNumber} not available!\n\n📺 **${anime.title}**\n📊 Available episodes: 1-${animeInfo.episodes.length}\n\nPlease choose an episode between 1 and ${animeInfo.episodes.length}.` 
                        });
                    }

                    // Find the specific episode
                    const episodeData = animeInfo.episodes.find(ep => 
                        ep.number === episodeNumber || 
                        ep.id.includes(`episode-${episodeNumber}`) ||
                        ep.id.includes(`-${episodeNumber}`)
                    );

                    if (!episodeData) {
                        return await sock.sendMessage(from, { 
                            text: `❌ Episode ${episodeNumber} data not found!\n\n📺 **${anime.title}**\n📊 Total episodes: ${animeInfo.episodes.length}\n\nTry with a different episode number.` 
                        });
                    }
                } catch (error) {
                    console.log('Gogoanime API failed, trying alternative...');
                }

                // Try Aniwatch API as fallback
                if (!downloadUrl) {
                    try {
                        const aniwatchResponse = await axios.get(`https://aniwatch-api.vercel.app/anime/search?q=${encodeURIComponent(animeName)}`);
                        if (aniwatchResponse.data && aniwatchResponse.data.results && aniwatchResponse.data.results.length > 0) {
                            const anime = aniwatchResponse.data.results[0];
                            const episodeResponse = await axios.get(`https://aniwatch-api.vercel.app/anime/episodes/${anime.id}?ep=${episodeNum}`);

                            if (episodeResponse.data && episodeResponse.data.download) {
                                downloadUrl = episodeResponse.data.download;
                                episodeInfo = {
                                    title: `${animeName} - Season ${seasonNum} Episode ${episodeNum}`,
                                    anime: anime.name,
                                    episode: episodeNum,
                                    season: seasonNum
                                };
                            }
                        }
                    } catch (error) {
                        console.log('Aniwatch API failed, trying third option...');
                    }
                }

                // Try Zoro.to API as another fallback
                if (!downloadUrl) {
                    try {
                        const zoroResponse = await axios.get(`https://zoro-api.vercel.app/search?q=${encodeURIComponent(animeName)}`);
                        if (zoroResponse.data && zoroResponse.data.results && zoroResponse.data.results.length > 0) {
                            const anime = zoroResponse.data.results[0];
                            const episodeResponse = await axios.get(`https://zoro-api.vercel.app/watch?episodeId=${anime.id}-${episodeNum}`);

                            if (episodeResponse.data && episodeResponse.data.sources) {
                                downloadUrl = episodeResponse.data.sources[0]?.url;
                                episodeInfo = {
                                    title: `${animeName} - Season ${seasonNum} Episode ${episodeNum}`,
                                    anime: anime.title,
                                    episode: episodeNum,
                                    season: seasonNum
                                };
                            }
                        }
                    } catch (error) {
                        console.log('All anime APIs failed');
                    }
                }

                if (downloadUrl && episodeInfo) {
                    await sock.sendMessage(from, {
                        text: `🍥 **Episode found! Downloading...**\n\n📺 **${episodeInfo.title}**\n\n⬇️ Starting download... This may take a few minutes.`
                    });

                    try {
                        const response = await axios.get(downloadUrl, {
                            responseType: 'arraybuffer',
                            timeout: 300000, // 5 minutes timeout
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                'Referer': 'https://gogoanime.consumet.org/'
                            }
                        });

                        // Create temp directory if it doesn't exist
                        if (!fs.existsSync('./temp')) {
                            fs.mkdirSync('./temp', { recursive: true });
                        }

                        const fileName = `anime_${getRandom('.mp4')}`;
                        const filePath = `./temp/${fileName}`;

                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        const fileSize = fs.statSync(filePath).size;
                        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

                        if (fileSize > 100 * 1024 * 1024) { // 100MB limit
                            fs.unlinkSync(filePath);
                            await sock.sendMessage(from, {
                                text: `❌ **Episode file too large (${fileSizeMB}MB)**\n\nMaximum file size is 100MB for WhatsApp.\n\n💡 **Alternative:** Try requesting a compressed version or use a video streaming link instead.`
                            });
                            return;
                        }

                        await sock.sendMessage(from, {
                            video: fs.readFileSync(filePath),
                            caption: `🍥 **${episodeInfo.title}**\n\n📺 **Anime:** ${episodeInfo.anime}\n🎬 **Season:** ${episodeInfo.season}\n📝 **Episode:** ${episodeInfo.episode}\n📁 **Size:** ${fileSizeMB}MB\n\n✨ **Downloaded successfully!**`
                        });

                        // Clean up
                        fs.unlinkSync(filePath);

                    } catch (downloadError) {
                        console.error('Episode download error:', downloadError);
                        await sock.sendMessage(from, {
                            text: `❌ **Download failed**\n\nError: ${downloadError.response?.status === 404 ? 'Episode not found' : 'Download server error'}\n\n💡 **Try:**\n• Check if the episode number exists\n• Try a different season number\n• Verify the anime name spelling\n• Try again later`
                        });
                    }

                } else {
                    await sock.sendMessage(from, {
                        text: `❌ **Episode not found**\n\n📺 **Searched for:** ${animeName}\n🎬 **Season:** ${seasonNum}\n📝 **Episode:** ${episodeNum}\n\n💡 **Try:**\n• Check the anime name spelling\n• Verify season and episode numbers\n• Popular anime: "Naruto", "One Piece", "Attack on Titan"\n• Use English anime titles when possible`
                    });
                }

            } catch (error) {
                console.error('Anime search error:', error);
                await sock.sendMessage(from, {
                    text: `❌ **Search failed**\n\nError: Anime database temporarily unavailable\n\n💡 **Try:**\n• Check your internet connection\n• Verify anime name spelling\n• Try again in a few minutes\n• Use popular anime titles`
                });
            }

        } catch (error) {
            console.error('Animed command error:', error);
            await sock.sendMessage(from, {
                text: `❌ **Command failed**\n\nError: ${error.message}\n\n💡 **Usage:**\n${settings.prefix}animed <anime_name> | <season> | <episode>`
            });
        }
    }
};