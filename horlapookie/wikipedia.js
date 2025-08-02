
module.exports = {
    name: 'wikipedia',
    aliases: ['wiki', 'search'],
    description: 'Search Wikipedia for information',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let searchQuery = '';
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.conversation) {
                    searchQuery = quotedMsg.conversation.trim();
                } else if (quotedMsg.extendedTextMessage?.text) {
                    searchQuery = quotedMsg.extendedTextMessage.text.trim();
                }
            }
            // If no quoted text, use command arguments
            else if (args.length > 0) {
                searchQuery = args.join(' ').trim();
            }
            
            if (!searchQuery) {
                await sock.sendMessage(from, {
                    text: `📚 **WIKIPEDIA SEARCH**\n\n📝 **Usage:**\n• ${settings.prefix}wikipedia <search term>\n• ${settings.prefix}wiki artificial intelligence\n• Reply to text: ${settings.prefix}search\n\n💡 **Examples:**\n• ${settings.prefix}wiki Einstein\n• ${settings.prefix}wikipedia quantum physics\n• ${settings.prefix}search Nigeria`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: `📚 Searching Wikipedia for "${searchQuery}"... Please wait!`
            });

            const fetch = require('node-fetch');
            
            // First, search for articles
            const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`;
            
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                // If direct search fails, try opensearch API
                const opensearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchQuery)}&limit=5&format=json`;
                const opensearchResponse = await fetch(opensearchUrl);
                
                if (!opensearchResponse.ok) {
                    throw new Error('Wikipedia search failed');
                }
                
                const opensearchData = await opensearchResponse.json();
                
                if (opensearchData[1].length === 0) {
                    await sock.sendMessage(from, {
                        text: `❌ No Wikipedia articles found for "${searchQuery}". Please try a different search term.`
                    });
                    return;
                }
                
                let searchResults = `📚 **WIKIPEDIA SEARCH RESULTS**\n\n🔍 **Query:** ${searchQuery}\n\n`;
                
                for (let i = 0; i < Math.min(5, opensearchData[1].length); i++) {
                    searchResults += `**${i + 1}.** ${opensearchData[1][i]}\n`;
                    if (opensearchData[2][i]) {
                        searchResults += `📝 ${opensearchData[2][i].substring(0, 100)}...\n`;
                    }
                    if (opensearchData[3][i]) {
                        searchResults += `🔗 ${opensearchData[3][i]}\n`;
                    }
                    searchResults += `\n`;
                }
                
                searchResults += `💡 *Try searching for a more specific term for detailed information*`;
                
                await sock.sendMessage(from, {
                    text: searchResults
                });
                return;
            }
            
            const articleData = await response.json();

            let wikiMessage = `📚 **WIKIPEDIA** - ${articleData.title}\n\n`;
            
            if (articleData.description) {
                wikiMessage += `📝 **Description:** ${articleData.description}\n\n`;
            }
            
            if (articleData.extract) {
                // Limit extract length for WhatsApp
                const extract = articleData.extract.length > 800 
                    ? articleData.extract.substring(0, 800) + '...' 
                    : articleData.extract;
                wikiMessage += `📖 **Summary:**\n${extract}\n\n`;
            }
            
            if (articleData.content_urls && articleData.content_urls.desktop) {
                wikiMessage += `🔗 **Read more:** ${articleData.content_urls.desktop.page}\n\n`;
            }
            
            wikiMessage += `💡 *Information from Wikipedia*`;

            if (articleData.originalimage && articleData.originalimage.source) {
                // Send image with caption if available
                try {
                    const imageResponse = await fetch(articleData.originalimage.source);
                    const imageBuffer = await imageResponse.buffer();
                    
                    await sock.sendMessage(from, {
                        image: imageBuffer,
                        caption: wikiMessage
                    });
                } catch (imageError) {
                    // If image fails, send text only
                    await sock.sendMessage(from, {
                        text: wikiMessage
                    });
                }
            } else {
                await sock.sendMessage(from, {
                    text: wikiMessage
                });
            }

        } catch (error) {
            console.error('Wikipedia search error:', error);
            await sock.sendMessage(from, {
                text: '❌ Wikipedia search failed. Please try again with a different search term.'
            });
        }
    }
};
