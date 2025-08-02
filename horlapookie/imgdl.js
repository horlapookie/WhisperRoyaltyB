
const axios = require('axios');
const { spawn } = require('child_process');

module.exports = {
    name: 'imgdl',
    description: 'Download images based on your search query from multiple sources',
    aliases: ['imagedownload', 'imgdownload', 'imagedl', 'getimg', 'searchimg'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            if (!args[0]) {
                await sock.sendMessage(from, {
                    text: `🖼️ Please provide a search query!\n\n🔍 **Usage:**\n• ${settings.prefix}imgdl sunset beach\n• ${settings.prefix}imagedownload anime girl\n• ${settings.prefix}getimg mountain landscape\n\n💡 **Tip:** Use specific keywords for better results`
                });
                return;
            }

            const query = args.join(' ').trim();
            
            await sock.sendMessage(from, {
                text: `🖼️ Searching for "${query}" images... Please wait!`
            });

            // Use Python scraper for image search
            const pythonProcess = spawn('python3', ['utils/scraper.py', 'image_search', query]);
            let result = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            await new Promise((resolve, reject) => {
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Image search failed with code ${code}: ${error}`));
                    } else {
                        resolve();
                    }
                });

                // Set timeout for the process
                setTimeout(() => {
                    pythonProcess.kill();
                    reject(new Error('Image search timeout'));
                }, 30000);
            });

            if (!result) {
                throw new Error('No response from image search');
            }

            const scrapedData = JSON.parse(result);
            
            if (scrapedData.error) {
                await sock.sendMessage(from, {
                    text: `❌ Image search failed: ${scrapedData.error}\n\n💡 **Try:**\n• More specific keywords\n• Popular topics like: nature, art, cars, anime\n• Different search terms`
                });
                return;
            }

            if (!scrapedData.images || scrapedData.images.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ No images found for "${query}"\n\n💡 **Try:**\n• More specific keywords\n• Different search terms\n• Popular topics like: nature, art, cars, anime`
                });
                return;
            }

            const imageUrls = scrapedData.images;
            const source = scrapedData.source || 'Multiple Sources';

            // Send images with enhanced captions
            await sock.sendMessage(from, {
                text: `🖼️ **IMAGE SEARCH RESULTS**\n\n🔍 **Query:** "${query}"\n📸 **Found:** ${imageUrls.length} image(s)\n📂 **Source:** ${source}\n\n📤 Sending images...`
            });

            // Send up to 4 images to avoid rate limiting
            const maxImages = Math.min(4, imageUrls.length);
            let successCount = 0;

            for (let i = 0; i < maxImages; i++) {
                try {
                    console.log(`Downloading image ${i + 1} from: ${imageUrls[i]}`);
                    
                    const imageResponse = await axios.get(imageUrls[i], { 
                        responseType: 'arraybuffer',
                        timeout: 20000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'DNT': '1',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'Referer': 'https://www.google.com/',
                            'Sec-Fetch-Dest': 'image',
                            'Sec-Fetch-Mode': 'no-cors',
                            'Sec-Fetch-Site': 'cross-site'
                        },
                        maxRedirects: 5
                    });

                    console.log(`Image ${i + 1} response status: ${imageResponse.status}, size: ${imageResponse.data?.byteLength || 0} bytes`);

                    if (imageResponse.status === 200 && imageResponse.data && imageResponse.data.byteLength > 1000) {
                        await sock.sendMessage(from, {
                            image: Buffer.from(imageResponse.data),
                            caption: `🖼️ **Image ${i + 1} of ${maxImages}**\n🔍 Query: "${query}"\n📂 Source: ${source}\n⚡ Downloaded by ${settings.botName}`
                        });
                        
                        successCount++;
                        console.log(`✅ Successfully sent image ${i + 1}`);
                        
                        // Add delay between images
                        if (i < maxImages - 1) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    } else {
                        console.log(`❌ Image ${i + 1} failed: Invalid response or too small`);
                    }
                    
                } catch (imageError) {
                    console.log(`❌ Failed to download image ${i + 1}:`, imageError.message);
                }
            }

            if (successCount > 0) {
                await sock.sendMessage(from, {
                    text: `✅ **Image search completed for "${query}"!**\n\n📸 Successfully sent ${successCount} image(s)\n📂 Source: ${source}\n💡 **Tip:** Try different keywords for more variety`
                });
            } else {
                await sock.sendMessage(from, {
                    text: `❌ **Failed to download images for "${query}"**\n\n💡 **Try:**\n• More popular search terms\n• Different keywords\n• Checking your internet connection`
                });
            }

        } catch (error) {
            console.error('Image download command error:', error);
            await sock.sendMessage(from, { 
                text: `❌ **Image search failed for "${args.join(' ')}"**\n\nError: ${error.message}\n\n💡 **Try:**\n• Simpler search terms\n• Different keywords\n• Popular topics like "nature", "art", "cars"` 
            });
        }
    }
};
