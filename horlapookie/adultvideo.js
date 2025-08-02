
const axios = require('axios');

module.exports = {
    name: 'adultvideo',
    aliases: ['avideo', 'xvid', 'adultclip', 'nsfwvideo'],
    description: 'Search for short adult videos (18+ only)',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            if (!args[0]) {
                await sock.sendMessage(from, {
                    text: `🔞 **ADULT VIDEO SEARCH**\n\n📝 **Usage:**\n• ${settings.prefix}adultvideo <search term>\n• ${settings.prefix}avideo <category>\n• ${settings.prefix}xvid <keyword>\n\n💡 **Examples:**\n• ${settings.prefix}adultvideo anime\n• ${settings.prefix}avideo short clips\n• ${settings.prefix}nsfwvideo compilation\n\n⚠️ **Warning:** This content is for mature audiences only (18+)\n🎥 **Note:** Only short clips and previews are available`
                });
                return;
            }

            const query = args.join(' ').trim();
            
            await sock.sendMessage(from, {
                text: `🔞 Searching for adult videos: "${query}"... Please wait!\n\n⏱️ This may take a moment to find quality content...`
            });

            try {
                // Use a real adult video API (example with PornHub API-like structure)
                const response = await axios.get(`https://www.pornhub.com/webmasters/search?q=${encodeURIComponent(query)}&thumbsize=large&format=json`);
                
                let videoResults = [];
                if (response.data && response.data.videos && response.data.videos.length > 0) {
                    videoResults = response.data.videos.slice(0, 5).map(video => ({
                        title: video.title,
                        duration: video.duration,
                        views: video.views,
                        rating: video.rating,
                        category: video.category,
                        url: video.url,
                        thumb: video.thumb,
                        embed: video.embed
                    }));
                } else {
                    // Fallback with real video search APIs
                    const searchResponse = await axios.get(`https://api.redtube.com/?data=redtube.Videos.searchVideos&search=${encodeURIComponent(query)}&output=json`);
                    
                    if (searchResponse.data && searchResponse.data.videos) {
                        videoResults = searchResponse.data.videos.slice(0, 5).map(video => ({
                            title: video.video.title,
                            duration: video.video.duration,
                            views: video.video.views,
                            rating: video.video.rating,
                            category: video.video.tags.join(', '),
                            url: video.video.url,
                            thumb: video.video.thumb,
                            embed: video.video.embed
                        }));
                    }
                }

                if (videoResults.length > 0) {
                    let videoMessage = `🔞 **ADULT VIDEO RESULTS**\n\n🔍 **Query:** ${query}\n\n`;
                    
                    videoResults.forEach((video, index) => {
                        videoMessage += `**${index + 1}.** ${video.title}\n`;
                        videoMessage += `⏱️ **Duration:** ${video.duration}\n`;
                        videoMessage += `👀 **Views:** ${video.views}\n`;
                        videoMessage += `⭐ **Rating:** ${video.rating}\n`;
                        videoMessage += `📂 **Category:** ${video.category}\n`;
                        videoMessage += `🔗 **Preview:** ${video.url}\n\n`;
                    });
                    
                    videoMessage += `🔞 **Content Warning:** All videos are for mature audiences only (18+)\n`;
                    videoMessage += `🎥 **Note:** Only previews and short clips are available\n`;
                    videoMessage += `💡 **Tip:** Use specific categories for better results`;
                    
                    await sock.sendMessage(from, { text: videoMessage });
                } else {
                    await sock.sendMessage(from, {
                        text: `❌ No adult videos found for "${query}"\n\n💡 **Try:**\n• Different search terms\n• Popular categories: anime, compilation, highlights\n• More specific keywords`
                    });
                }
            } catch (error) {
                console.error('Adult video search error:', error);
                await sock.sendMessage(from, {
                    text: `❌ **Adult video search failed**\n\nError: Service temporarily unavailable\n\n💡 **Try:**\n• Different search terms\n• More specific keywords\n• Try again later\n\n🔧 **Note:** Video search APIs may have limited availability`
                });
            }

        } catch (error) {
            console.error('Adult video command error:', error);
            await sock.sendMessage(from, {
                text: `❌ **Adult video search failed for "${args.join(' ')}"**\n\nError: ${error.message}\n\n💡 **Try:**\n• Different search terms\n• Check your spelling\n• Try again later`
            });
        }
    }
};
