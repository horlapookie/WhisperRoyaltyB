const fetch = require('node-fetch');

module.exports = {
    name: 'meme',
    description: 'Get random memes from different subreddits',
    aliases: ['memes', 'funny'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            await sock.sendMessage(from, {
                text: '😂 Getting a fresh meme for you... Please wait!'
            });

            // List of meme subreddits
            const subreddits = [
                'memes', 'dankmemes', 'wholesomememes', 'memeeconomy',
                'funny', 'ProgrammerHumor', 'AdviceAnimals', 'comedyheaven'
            ];
            
            const randomSubreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
            const url = `https://www.reddit.com/r/${randomSubreddit}/hot.json?limit=100`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'WhatsApp-Bot/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Reddit API returned ${response.status}`);
            }
            
            const data = await response.json();
            const posts = data.data.children.filter(post => {
                return post.data.post_hint === 'image' || 
                       (post.data.url && (post.data.url.includes('.jpg') || 
                        post.data.url.includes('.png') || 
                        post.data.url.includes('.gif')));
            });
            
            if (posts.length === 0) {
                await sock.sendMessage(from, {
                    text: '❌ No image memes found at the moment. Try again!'
                });
                return;
            }
            
            const randomPost = posts[Math.floor(Math.random() * posts.length)].data;
            
            const memeMessage = `😂 **FRESH MEME**

📝 **Title:** ${randomPost.title}
👍 **Upvotes:** ${randomPost.ups.toLocaleString()}
💬 **Comments:** ${randomPost.num_comments}
🏷️ **Subreddit:** r/${randomPost.subreddit}

🔗 **Link:** https://reddit.com${randomPost.permalink}`;

            await sock.sendMessage(from, {
                image: { url: randomPost.url },
                caption: memeMessage
            });
            
        } catch (error) {
            console.error('Meme command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to fetch meme. Try again later!'
            });
        }
    }
};