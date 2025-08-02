const ytSearch = require('yt-search');
const { yta, ytIdRegex } = require('../y2mate');
const { getBuffer } = require('../utils/helpers');

module.exports = {
    name: 'music',
    description: 'Search and download music from YouTube',
    aliases: ['song', 'audio', 'mp3', 'play'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args.length) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide a song name or YouTube URL!\n\nExample: ${settings.prefix}music Despacito` 
            });
        }

        const query = args.join(' ');

        try {
            const searchingMsg = await sock.sendMessage(from, { 
                text: '🔍 Searching for music... Please wait!' 
            });

            let videoUrl = '';
            let videoInfo = null;

            // Check if it's already a YouTube URL
            if (ytIdRegex.test(query)) {
                videoUrl = query;
            } else {
                // Search using yt-search
                const searchResults = await ytSearch(query);

                if (!searchResults.videos || !searchResults.videos.length) {
                    await sock.sendMessage(from, { delete: searchingMsg.key });
                    return await sock.sendMessage(from, { 
                        text: '❌ No results found for your search. Please try a different search term.' 
                    });
                }

                const video = searchResults.videos[0];
                videoUrl = video.url;
                videoInfo = video;

                // Check duration (max 10 minutes for WhatsApp)
                if (video.duration.seconds > 600) {
                    await sock.sendMessage(from, { delete: searchingMsg.key });
                    return await sock.sendMessage(from, { 
                        text: '❌ Audio is too long (max 10 minutes allowed for WhatsApp).' 
                    });
                }
            }

            // Delete searching message and send processing message
            await sock.sendMessage(from, { delete: searchingMsg.key });
            const processingMsg = await sock.sendMessage(from, { 
                text: `🎵 Processing: *${videoInfo ? videoInfo.title : 'Your request'}*\n⚡ Converting to audio...` 
            });

            // Try to get audio info using y2mate
            let audioInfo;
            try {
                audioInfo = await yta(videoUrl, '128kbps');
                
                if (!audioInfo || !audioInfo.dl_link) {
                    throw new Error('No download link available');
                }
            } catch (y2mateError) {
                console.log('Y2mate failed, trying fallback...', y2mateError.message);
                
                // Fallback: Use Python scraper
                try {
                    const { spawn } = require('child_process');
                    const pythonProcess = spawn('python3', ['utils/scraper.py', 'youtube', query]);
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
                            if (code !== 0 || error) {
                                reject(new Error('Python scraper failed'));
                            } else {
                                resolve();
                            }
                        });
                    });
                    
                    const scraperData = JSON.parse(result);
                    if (scraperData.error) {
                        throw new Error('No download available');
                    }
                    
                    // Use scraped info directly for simple cases
                    audioInfo = {
                        title: scraperData.title || 'Unknown Title',
                        dl_link: scraperData.url,
                        filesizeF: 'Unknown Size'
                    };
                    
                    // Try y2mate as backup
                    try {
                        const y2mateInfo = await yta(scraperData.url, '128kbps');
                        if (y2mateInfo && y2mateInfo.dl_link) {
                            audioInfo = y2mateInfo;
                        }
                    } catch (y2Error) {
                        console.log('Y2mate backup also failed, using direct link');
                    }
                } catch (scraperError) {
                    console.log('Python scraper also failed:', scraperError.message);
                    await sock.sendMessage(from, { delete: processingMsg.key });
                    return await sock.sendMessage(from, { 
                        text: '❌ Unable to download audio. The video might be restricted or unavailable.\n\n💡 Try:\n• A different song\n• Direct YouTube link\n• Popular songs' 
                    });
                }
            }

            console.log('Download info received:', {
                title: audioInfo.title,
                filesize: audioInfo.filesizeF,
                hasLink: !!audioInfo.dl_link
            });

            // Update processing message
            await sock.sendMessage(from, { delete: processingMsg.key });
            const downloadMsg = await sock.sendMessage(from, { 
                text: `🎵 Found: *${audioInfo.title}*\n⬇️ Downloading audio (${audioInfo.filesizeF})...` 
            });

            // Download the audio buffer
            const audioBuffer = await getBuffer(audioInfo.dl_link);

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('Failed to download audio file - empty buffer');
            }

            // Check buffer size (WhatsApp limit ~64MB)
            if (audioBuffer.length > 64 * 1024 * 1024) {
                await sock.sendMessage(from, { delete: downloadMsg.key });
                return await sock.sendMessage(from, { 
                    text: '❌ Audio file is too large for WhatsApp (max 64MB). Try a shorter song.' 
                });
            }

            // Delete download message
            await sock.sendMessage(from, { delete: downloadMsg.key });

            // Send the audio file
            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: audioInfo.title,
                        body: `Downloaded by ${settings.botName}`,
                        thumbnailUrl: audioInfo.thumb || 'https://picsum.photos/300/300?random=music',
                        sourceUrl: videoUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });

            await sock.sendMessage(from, { 
                text: `✅ *Music downloaded successfully!*\n\n🎵 *Title:* ${audioInfo.title}\n📦 *Size:* ${audioInfo.filesizeF}` 
            });

        } catch (error) {
            console.error('Music download error:', error);

            let errorMessage = '❌ Failed to download music. ';

            if (error.message.includes('No download link')) {
                errorMessage += 'The video might be unavailable or region-locked.';
            } else if (error.message.includes('Video unavailable')) {
                errorMessage += 'The video is not available or has been removed.';
            } else if (error.message.includes('Private video')) {
                errorMessage += 'Cannot download private videos.';
            } else if (error.message.includes('empty buffer')) {
                errorMessage += 'The download link is invalid or expired.';
            } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
                errorMessage += 'Network connection error. Please try again.';
            } else {
                errorMessage += 'Please try a different search term or check if the URL is valid.\n\n💡 Tip: Try searching with simpler terms like "song title artist name"';
            }

            await sock.sendMessage(from, { text: errorMessage });
        }
    }
};