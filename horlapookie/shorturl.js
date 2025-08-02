const fetch = require('node-fetch');

module.exports = {
    name: 'shorturl',
    description: 'Shorten long URLs using TinyURL',
    aliases: ['short', 'tinyurl', 'shorten'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            let url = '';
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.conversation) {
                    url = quotedMsg.conversation.trim();
                } else if (quotedMsg.extendedTextMessage?.text) {
                    url = quotedMsg.extendedTextMessage.text.trim();
                }
            }
            // If no quoted text, use command arguments
            else if (args.length > 0) {
                url = args.join(' ').trim();
            }
            
            if (!url) {
                await sock.sendMessage(from, {
                    text: `🔗 **URL SHORTENER**\n\n📝 **Usage:**\n• ${settings.prefix}shorturl <url>\n• ${settings.prefix}short https://example.com\n• Reply to URL: ${settings.prefix}shorturl\n\n💡 **Example:**\n• ${settings.prefix}shorturl https://www.google.com/search?q=very+long+url+here`
                });
                return;
            }
            
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            // Validate URL format
            try {
                new URL(url);
            } catch {
                await sock.sendMessage(from, {
                    text: '❌ Invalid URL format. Please provide a valid URL.'
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🔗 Shortening URL... Please wait!'
            });

            const tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
            const response = await fetch(tinyUrlApi);
            
            if (!response.ok) {
                throw new Error(`TinyURL API returned ${response.status}`);
            }
            
            const shortUrl = await response.text();
            
            if (shortUrl.includes('Error') || !shortUrl.startsWith('http')) {
                throw new Error('Failed to create short URL');
            }
            
            const urlMessage = `🔗 **URL SHORTENED**

📝 **Original URL:**
${url}

✂️ **Short URL:**
${shortUrl}

📊 **Stats:**
• Original Length: ${url.length} characters
• Short Length: ${shortUrl.length} characters
• Saved: ${url.length - shortUrl.length} characters

💡 **Tip:** The short URL never expires and redirects to your original link!`;

            await sock.sendMessage(from, {
                text: urlMessage
            });
            
        } catch (error) {
            console.error('ShortURL command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to shorten URL. Please check the URL and try again.'
            });
        }
    }
};