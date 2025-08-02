const axios = require('axios');

const fs = require('fs');
const path = require('path');

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

module.exports = {
    name: 'adult',
    aliases: ['hentai', 'nsfw', 'xxx', 'hentai-link'],
    description: 'Search for adult content or download hentai from link (18+ only)',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            // Check if this is a link download request
            const isLinkDownload = message.message?.conversation?.startsWith(`${settings.prefix}hentai-link`) || 
                                  message.message?.extendedTextMessage?.text?.startsWith(`${settings.prefix}hentai-link`);

            if (isLinkDownload) {
                if (!args[0] || !args[0].startsWith('http')) {
                    await sock.sendMessage(from, {
                        text: `🔞 **HENTAI LINK DOWNLOAD**\n\n📝 **Usage:**\n• ${settings.prefix}hentai-link <direct_link>\n\n💡 **Example:**\n• ${settings.prefix}hentai-link https://example.com/hentai.mp4\n\n⚠️ **Note:** Only direct video/image links are supported`
                    });
                    return;
                }

                const downloadUrl = args[0];
                await sock.sendMessage(from, {
                    text: `🔞 Downloading hentai content from link... Please wait!`
                });

                try {
                    const response = await axios.get(downloadUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });

                    const contentType = response.headers['content-type'];
                    let fileExt = '.mp4';
                    let messageType = 'video';

                    if (contentType?.includes('image')) {
                        fileExt = contentType.includes('gif') ? '.gif' : '.jpg';
                        messageType = 'image';
                    } else if (contentType?.includes('video')) {
                        fileExt = '.mp4';
                        messageType = 'video';
                    }

                    // Create temp directory if it doesn't exist
                    if (!fs.existsSync('./temp')) {
                        fs.mkdirSync('./temp', { recursive: true });
                    }

                    const fileName = `hentai_${getRandom(fileExt)}`;
                    const filePath = `./temp/${fileName}`;

                    fs.writeFileSync(filePath, Buffer.from(response.data));

                    const fileSize = fs.statSync(filePath).size;
                    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

                    if (fileSize > 50 * 1024 * 1024) { // 50MB limit
                        fs.unlinkSync(filePath);
                        await sock.sendMessage(from, {
                            text: `❌ File too large (${fileSizeMB}MB). Maximum size is 50MB.`
                        });
                        return;
                    }

                    const mediaMessage = messageType === 'video' ? 
                        { video: fs.readFileSync(filePath), caption: `🔞 **Downloaded Hentai Content**\n\n📁 **Size:** ${fileSizeMB}MB\n⚠️ **Warning:** 18+ content` } :
                        { image: fs.readFileSync(filePath), caption: `🔞 **Downloaded Hentai Content**\n\n📁 **Size:** ${fileSizeMB}MB\n⚠️ **Warning:** 18+ content` };

                    await sock.sendMessage(from, mediaMessage);

                    // Clean up
                    fs.unlinkSync(filePath);

                } catch (downloadError) {
                    console.error('Hentai download error:', downloadError);
                    await sock.sendMessage(from, {
                        text: `❌ **Download failed**\n\nError: ${downloadError.response?.status === 404 ? 'File not found' : 'Invalid or inaccessible link'}\n\n💡 **Try:**\n• Direct video/image links only\n• Check if the link is accessible\n• Ensure the file size is under 50MB`
                    });
                }
                return;
            }

            if (!args[0]) {
                await sock.sendMessage(from, {
                    text: `🔞 **ADULT CONTENT SEARCH**\n\n📝 **Usage:**\n• ${settings.prefix}adult <search term>\n• ${settings.prefix}hentai <category>\n• ${settings.prefix}nsfw <keyword>\n• ${settings.prefix}hentai-link <direct_link>\n\n💡 **Examples:**\n• ${settings.prefix}adult romance\n• ${settings.prefix}hentai fantasy\n• ${settings.prefix}nsfw anime\n• ${settings.prefix}hentai-link https://example.com/video.mp4\n\n⚠️ **Warning:** This content is for mature audiences only (18+)`
                });
                return;
            }

            const query = args.join(' ').trim();

            await sock.sendMessage(from, { 
                text: `🔍 **Searching for manga content...**\n\n🎯 **Query:** ${query}\n⏳ Please wait while I find manga for you...` 
            });

            // Simulate manga search results (replace with actual manga API)
            const results = [
                {
                    title: `${query} - Manga`,
                    link: `https://example-manga.com/manga/${encodeURIComponent(query)}`,
                    thumbnail: 'https://via.placeholder.com/300x400',
                    description: 'Manga matching your search query',
                    chapters: Math.floor(Math.random() * 50) + 10,
                    status: 'Ongoing'
                }
            ];

            let resultText = `📚 **MANGA SEARCH RESULTS**\n\n`;
            resultText += `🎯 **Query:** ${query}\n`;
            resultText += `📊 **Results found:** ${results.length}\n\n`;

            results.forEach((result, index) => {
                resultText += `**${index + 1}.** ${result.title}\n`;
                resultText += `🔗 **Link:** ${result.link}\n`;
                resultText += `📖 **Chapters:** ${result.chapters}\n`;
                resultText += `📊 **Status:** ${result.status}\n`;
                resultText += `📝 **Description:** ${result.description}\n\n`;
            });

            resultText += `💡 **Usage:** Use \`.hentai-link <url>\` to download manga pack\n`;
            resultText += `⚠️ **Note:** Content is for adults only (18+)`;

            await sock.sendMessage(from, { 
                text: resultText 
            });

        } catch (error) {
            console.error('Adult command error:', error);
            await sock.sendMessage(from, {
                text: `❌ **Adult content search failed for "${args.join(' ')}"**\n\nError: ${error.message}\n\n💡 **Try:**\n• Different search terms\n• Check your spelling\n• Try again later`
            });
        }
    }
};
if (command === 'hentai-link') {
            if (!url) {
                return await sock.sendMessage(from, { 
                    text: `❌ Please provide a manga URL!\n\nUsage: ${settings.prefix}hentai-link <url>` 
                });
            }

            try {
                await sock.sendMessage(from, { 
                    text: `📚 **Downloading manga pack...**\n\n🔗 **URL:** ${url}\n⏳ Please wait while I prepare your manga pack...` 
                });

                // Simulate manga pack preparation
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Send a placeholder document (replace with actual manga pack download logic)
                const mangaPackText = `📚 **MANGA PACK DOWNLOAD**\n\n`;
                mangaPackText += `🔗 **Source:** ${url}\n`;
                mangaPackText += `📦 **Type:** Manga Collection\n`;
                mangaPackText += `📖 **Format:** CBZ/PDF\n`;
                mangaPackText += `⚠️ **Note:** Content is for adults only (18+)\n\n`;
                mangaPackText += `💡 **How to read:** Use a comic reader app or extract the archive`;

                await sock.sendMessage(from, {
                    document: { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
                    fileName: `manga-pack-${Date.now()}.pdf`,
                    mimetype: 'application/pdf',
                    caption: `✅ **Manga Pack Ready!**\n\n🔗 **Source:** ${url}\n📁 **Type:** Adult Manga\n⚠️ **Content for 18+ only**`
                });

            } catch (error) {
                console.error('Hentai-link error:', error);
                await sock.sendMessage(from, { 
                    text: '❌ Failed to download manga pack. Please check the URL and try again.' 
                });
            }
        }