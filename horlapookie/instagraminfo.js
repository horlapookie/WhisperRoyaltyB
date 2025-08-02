module.exports = {
    name: 'instagraminfo',
    description: 'Instagram downloader information and settings',
    aliases: ['instainfo', 'iginfo', 'instasettings'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        const infoMessage = `📱 *Instagram Downloader Information*

⚠️ *Current Status:* Temporarily Limited
Instagram has implemented strict rate limiting and policy changes that affect automated downloads.

🔧 *Available Commands:*
• ${settings.prefix}insta <post_url> - Download Instagram posts
• ${settings.prefix}i <post_url> - Download Instagram (alias)
• ${settings.prefix}ig <post_url> - Download Instagram (alias)
• ${settings.prefix}instagram <post_url> - Download Instagram (alias)

📋 *Supported Content:*
✅ Photos (single and multiple)
✅ Videos and Reels
✅ IGTV videos
✅ Story highlights (when available)

⚙️ *Settings Information:*
Currently, the Instagram downloader uses built-in methods and doesn't require API keys. However, due to Instagram's restrictions, success rates may vary.

💡 *Tips for Better Success:*
• Use direct post URLs (not shortened links)
• Try again if first attempt fails
• Public posts work better than private ones
• Recent posts have higher success rates

🔗 *URL Format Examples:*
• https://www.instagram.com/p/ABC123/
• https://www.instagram.com/reel/DEF456/
• https://instagram.com/p/GHI789/

⚠️ *Note:* If you encounter frequent failures, Instagram may have updated their protection mechanisms. The bot will be updated accordingly.

🤖 Information provided by ${settings.botName}`;

        await sock.sendMessage(from, { 
            text: infoMessage 
        }, { quoted: message });
    }
};