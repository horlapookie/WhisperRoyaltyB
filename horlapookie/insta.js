const axios = require('axios');

module.exports = {
    name: 'insta',
    description: 'Download Instagram posts, reels, and videos',
    aliases: ['i', 'instagram', 'ig'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(from, { 
                text: `❎ URL is empty!\n\nExample: ${settings.prefix}insta https://www.instagram.com/p/...` 
            }, { quoted: message });
        }

        let urlInstagram = args[0];

        // Validate Instagram URL
        if (!(
            urlInstagram.includes("instagram.com/") ||
            urlInstagram.includes("instagram.com/p/") ||
            urlInstagram.includes("instagram.com/reel/") ||
            urlInstagram.includes("instagram.com/tv/")
        )) {
            return await sock.sendMessage(from, { 
                text: `❎ Wrong URL! Only Instagram posts, reels, and TV videos can be downloaded.` 
            }, { quoted: message });
        }

        // Clean URL
        if (urlInstagram.includes("?")) {
            urlInstagram = urlInstagram.split("/?")[0];
        }

        console.log('Instagram URL:', urlInstagram);

        const processingMsg = await sock.sendMessage(from, { 
            text: '⬇️ Processing Instagram download...' 
        }, { quoted: message });

        try {
            // Try using a simple Instagram scraper approach
            await sock.sendMessage(from, { 
                text: `⚠️ Instagram download is currently under maintenance.\n\nInstagram has strict rate limits and API changes. The feature will be restored in a future update.\n\nFor now, you can:\n• Use other download tools\n• Save the content manually\n• Use ${settings.prefix}video for YouTube videos` 
            }, { quoted: message });
            
            await sock.sendMessage(from, { delete: processingMsg.key });

        } catch (error) {
            console.log('Instagram download error:', error);
            await sock.sendMessage(from, { delete: processingMsg.key });
            await sock.sendMessage(from, { 
                text: `❌ Failed to download Instagram content.\n\nPossible reasons:\n• Post is private\n• Invalid URL\n• Content not available\n\nPlease try again with a different post.` 
            }, { quoted: message });
        }
    }
};