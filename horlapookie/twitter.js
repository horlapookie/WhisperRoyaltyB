require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports = {
    name: 'twitter',
    description: 'Download Twitter/X videos',
    aliases: ['tw', 'x', 'twitterdl'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args[0]) {
            return await sock.sendMessage(from, { 
                text: `❌ *Enter Twitter/X URL*\n\nExample: ${settings.prefix}twitter https://twitter.com/user/status/123` 
            }, { quoted: message });
        }

        let input = args[0];
        
        // Check if it's a username search (starts with @) or URL
        if (input.startsWith('@') || (!input.startsWith('http') && !input.includes('twitter.com') && !input.includes('x.com'))) {
            return await sock.sendMessage(from, { 
                text: `💡 *For user profiles, use:*\n${settings.prefix}twitteruser ${input.replace('@', '')}\n\n*For video downloads, provide a tweet URL:*\n${settings.prefix}twitter https://twitter.com/user/status/123` 
            }, { quoted: message });
        }
        
        let tweetUrl = input;
        if (!tweetUrl.startsWith("http")) {
            return await sock.sendMessage(from, { 
                text: `❌ *Invalid URL*\n\nProvide a valid Twitter/X video URL` 
            }, { quoted: message });
        }

        const processingMsg = await sock.sendMessage(from, { 
            text: '🐦 Processing Twitter video download...' 
        }, { quoted: message });

        const fileDown = `./temp/${getRandom(".mp4")}`;

        try {
            // Create temp directory
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Check if it's using Twitter API or fallback method
            const TWITTER_BEARER_TOKEN = settings.TWITTER_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
            
            if (TWITTER_BEARER_TOKEN) {
                // Use Twitter API if available
                const { TwitterApi } = require("twitter-api-v2");
                const client = new TwitterApi(TWITTER_BEARER_TOKEN);

                const tweetId = tweetUrl.split("/").pop().split("?")[0];
                const tweet = await client.v2.singleTweet(tweetId, {
                    expansions: ["attachments.media_keys"],
                    "media.fields": ["variants"],
                });

                const media = tweet.includes?.media?.[0];
                if (!media || media.type !== "video") {
                    throw new Error("No video found in this tweet");
                }

                const highestBitrateVariant = media.variants
                    .filter((variant) => variant.content_type === "video/mp4")
                    .reduce((prev, current) => (prev.bit_rate > current.bit_rate ? prev : current));

                const videoUrl = highestBitrateVariant.url;
                
                // Download video
                const response = await axios({
                    url: videoUrl,
                    method: "GET",
                    responseType: "stream",
                    timeout: 60000
                });

                const writer = fs.createWriteStream(fileDown);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on("finish", resolve);
                    writer.on("error", reject);
                });

            } else {
                // Fallback: Use a Twitter video download service
                await sock.sendMessage(from, { 
                    text: `⚠️ *Twitter API not configured*\n\nTo use this feature, add your Twitter Bearer Token:\n${settings.prefix}settings TWITTER_BEARER_TOKEN your_token\n\nGet token from: https://developer.twitter.com/` 
                }, { quoted: message });
                
                await sock.sendMessage(from, { delete: processingMsg.key });
                return;
            }

            await sock.sendMessage(from, { delete: processingMsg.key });

            // Send the video
            if (fs.existsSync(fileDown)) {
                const stats = fs.statSync(fileDown);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                await sock.sendMessage(from, {
                    video: fs.readFileSync(fileDown),
                    mimetype: "video/mp4",
                    caption: `🐦 *Twitter Video Downloaded*\n\n📦 Size: ${fileSizeMB} MB\n⬇️ Downloaded by ${settings.botName}`
                }, { quoted: message });

                fs.unlinkSync(fileDown);
                console.log("Twitter video sent successfully");
            } else {
                throw new Error("Video file not created");
            }

        } catch (error) {
            console.log("Twitter download error:", error);
            
            await sock.sendMessage(from, { delete: processingMsg.key });
            
            let errorMsg = '❌ Failed to download Twitter video.';
            if (error.message.includes('No video found')) {
                errorMsg += '\n\n📹 This tweet doesn\'t contain a video or the video is not accessible.';
            } else if (error.response?.status === 429) {
                errorMsg += '\n\n⏱️ Rate limit exceeded. Try again later.';
            } else {
                errorMsg += '\n\n🔧 Check the URL or try again later.';
            }
            
            await sock.sendMessage(from, { 
                text: errorMsg 
            }, { quoted: message });

            // Cleanup
            if (fs.existsSync(fileDown)) {
                try {
                    fs.unlinkSync(fileDown);
                } catch (e) {}
            }
        }
    }
};