require("dotenv").config();
const axios = require("axios");

module.exports = {
    name: 'twitteruser',
    description: 'Search Twitter user profile and get info',
    aliases: ['twuser', 'xuser', 'twitterprofile'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args[0]) {
            return await sock.sendMessage(from, { 
                text: `❌ *Enter Twitter Username*\n\nExample: ${settings.prefix}twitteruser elonmusk` 
            }, { quoted: message });
        }

        let username = args[0].replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '');

        const processingMsg = await sock.sendMessage(from, { 
            text: '🔍 Searching Twitter user profile...' 
        }, { quoted: message });

        try {
            // Check if it's using Twitter API or fallback method
            const TWITTER_BEARER_TOKEN = settings.TWITTER_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
            
            if (TWITTER_BEARER_TOKEN) {
                const { TwitterApi } = require("twitter-api-v2");
                const client = new TwitterApi(TWITTER_BEARER_TOKEN);

                const user = await client.v2.userByUsername(username, {
                    'user.fields': ['created_at', 'description', 'public_metrics', 'verified', 'location', 'url']
                });

                if (!user.data) {
                    throw new Error("User not found");
                }

                const userData = user.data;
                const metrics = userData.public_metrics;

                const userInfo = `🐦 *Twitter User Profile*

👤 *Name:* ${userData.name}
🔗 *Username:* @${userData.username}
${userData.verified ? '✅ *Verified Account*' : ''}

📊 *Statistics:*
👥 Followers: ${metrics.followers_count.toLocaleString()}
👤 Following: ${metrics.following_count.toLocaleString()}
📝 Tweets: ${metrics.tweet_count.toLocaleString()}
❤️ Listed: ${metrics.listed_count.toLocaleString()}

📅 *Joined:* ${new Date(userData.created_at).toLocaleDateString()}
${userData.location ? `📍 *Location:* ${userData.location}` : ''}
${userData.url ? `🌐 *Website:* ${userData.url}` : ''}

📝 *Bio:*
${userData.description || 'No bio available'}

🔗 *Profile:* https://twitter.com/${userData.username}

🤖 Fetched by ${settings.botName}`;

                await sock.sendMessage(from, { delete: processingMsg.key });
                await sock.sendMessage(from, { 
                    text: userInfo 
                }, { quoted: message });

                console.log("Twitter user profile fetched successfully");

            } else {
                await sock.sendMessage(from, { 
                    text: `⚠️ *Twitter API not configured*\n\nTo use this feature, add your Twitter Bearer Token:\n${settings.prefix}settings TWITTER_BEARER_TOKEN your_token\n\nGet token from: https://developer.twitter.com/` 
                }, { quoted: message });
                
                await sock.sendMessage(from, { delete: processingMsg.key });
                return;
            }

        } catch (error) {
            console.log("Twitter user search error:", error);
            
            await sock.sendMessage(from, { delete: processingMsg.key });
            
            let errorMsg = '❌ Failed to fetch Twitter user profile.';
            if (error.message.includes('User not found')) {
                errorMsg += '\n\n👤 User not found. Check the username spelling.';
            } else if (error.response?.status === 429) {
                errorMsg += '\n\n⏱️ Rate limit exceeded. Try again later.';
            } else {
                errorMsg += '\n\n🔧 Check the username or try again later.';
            }
            
            await sock.sendMessage(from, { 
                text: errorMsg 
            }, { quoted: message });
        }
    }
};