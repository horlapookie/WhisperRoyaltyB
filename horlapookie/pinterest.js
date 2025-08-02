
const axios = require('axios');
const { spawn } = require('child_process');

module.exports = {
    name: 'pinterest',
    description: 'Search for images based on your specific query',
    aliases: ['pin', 'pinterestdl', 'pinsearch'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            if (!args[0]) {
                await sock.sendMessage(from, {
                    text: `📌 Please provide a search query!\n\n🔍 **Usage:**\n• ${settings.prefix}pinterest nature wallpaper\n• ${settings.prefix}pin anime art\n• ${settings.prefix}pinsearch cute cats\n\n💡 **Tip:** Use specific keywords for better results`
                });
                return;
            }

            const query = args.join(' ').trim();
            
            await sock.sendMessage(from, {
                text: `📌 Searching Pinterest for "${query}" images... Please wait!`
            });

            // Use Python scraper for Pinterest search
            const pythonProcess = spawn('python3', ['utils/scraper.py', 'pinterest', query]);
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
                        reject(new Error(`Python scraper failed with code ${code}: ${error}`));
                    } else {
                        resolve();
                    }
                });

                // Set timeout for the process
                setTimeout(() => {
                    pythonProcess.kill();
                    reject(new Error('Pinterest search timeout'));
                }, 30000);
            });

            if (!result) {
                throw new Error('No response from Pinterest scraper');
            }

            const scrapedData = JSON.parse(result);
            
            if (scrapedData.error) {
                await sock.sendMessage(from, {
                    text: `❌ Pinterest search failed: ${scrapedData.error}\n\n💡 **Try:**\n• More specific keywords\n• Popular topics like: nature, art, food, travel\n• Different search terms`
                });
                return;
            }

            if (!scrapedData.images || scrapedData.images.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ No Pinterest images found for "${query}"\n\n💡 **Try:**\n• More specific keywords\n• Different search terms\n• Popular topics like: nature, art, food, travel`
                });
                return;
            }

            const imageUrls = scrapedData.images;

            // Send images with enhanced captions
            await sock.sendMessage(from, {
                text: `📌 **PINTEREST SEARCH RESULTS**\n\n🔍 **Query:** "${query}"\n📸 **Found:** ${imageUrls.length} Pinterest image(s)\n\n📤 Sending images...`
            });

            // Send up to 3 images to avoid rate limiting
            const maxImages = Math.min(3, imageUrls.length);
            let successCount = 0;

            for (let i = 0; i < maxImages; i++) {
                try {
                    console.log(`Downloading Pinterest image ${i + 1} from: ${imageUrls[i]}`);
                    
                    const imageResponse = await axios.get(imageUrls[i], { 
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'DNT': '1',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1'
                        },
                        maxRedirects: 5
                    });

                    console.log(`Pinterest image ${i + 1} response status: ${imageResponse.status}, size: ${imageResponse.data?.byteLength || 0} bytes`);

                    if (imageResponse.status === 200 && imageResponse.data && imageResponse.data.byteLength > 1000) {
                        await sock.sendMessage(from, {
                            image: Buffer.from(imageResponse.data),
                            caption: `📌 **Pinterest Image ${i + 1}**\n🔍 Query: "${query}"\n🔗 Source: Pinterest Search\n⚡ Downloaded by ${settings.botName}`
                        });
                        
                        successCount++;
                        console.log(`✅ Successfully sent Pinterest image ${i + 1}`);
                        
                        // Add delay between images
                        if (i < maxImages - 1) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    } else {
                        console.log(`❌ Pinterest image ${i + 1} failed: Invalid response or too small`);
                    }
                    
                } catch (imageError) {
                    console.log(`❌ Failed to download Pinterest image ${i + 1}:`, imageError.message);
                }
            }

            if (successCount > 0) {
                await sock.sendMessage(from, {
                    text: `✅ **Pinterest search completed for "${query}"!**\n\n📸 Successfully sent ${successCount} image(s) from Pinterest\n💡 **Tip:** Try different keywords for more variety`
                });
            } else {
                await sock.sendMessage(from, {
                    text: `❌ **Failed to download Pinterest images for "${query}"**\n\n💡 **Try:**\n• More popular search terms\n• Different keywords\n• Checking your internet connection`
                });
            }

        } catch (error) {
            console.error('Pinterest command error:', error);
            await sock.sendMessage(from, { 
                text: `❌ **Pinterest search failed for "${args.join(' ')}"**\n\nError: ${error.message}\n\n💡 **Try:**\n• Simpler search terms\n• Different keywords\n• Popular topics like "nature", "art", "food"` 
            });
        }
    }
};
