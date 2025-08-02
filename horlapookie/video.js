
const fs = require("fs");
const yts = require("yt-search");
const cp = require("child_process");
const readline = require("readline");
const ffmpeg = require("ffmpeg-static");
const ytdl = require("@distube/ytdl-core");

const agent = ytdl.createAgent();

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const findVideoURL = async (name) => {
    const r = await yts(`${name}`);
    return r.all[0].url + "&bpctr=9999999999&has_verified=1";
};

module.exports = {
    name: 'video',
    description: 'Download videos from YouTube with enhanced quality',
    aliases: ['vid', 'mp4', 'youtube', 'yt', 'ytv', 'vs', 'ytdl'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let URL;
            
            // Get the command text from message
            const msgText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
            
            // Handle both URLs and search terms
            if (!args[0]) {
                return await sock.sendMessage(from, { 
                    text: `❌ *Enter YouTube URL or search term*\n\nExample: ${settings.prefix}video https://youtu.be/...\nOr: ${settings.prefix}video Despacito` 
                }, { quoted: message });
            }

            const query = args.join(' ');
            
            if (ytdl.validateURL(query)) {
                URL = query;
            } else {
                // Search for video
                const searchResults = await yts(query);
                if (!searchResults.videos || !searchResults.videos.length) {
                    return await sock.sendMessage(from, { 
                        text: '❌ No results found for your search.' 
                    }, { quoted: message });
                }
                URL = searchResults.videos[0].url;
            }

            const searchingMsg = await sock.sendMessage(from, { 
                text: '🔍 Processing video download... Please wait!' 
            });

            let fileDown = `./temp/${getRandom(".mp4")}`;

            try {
                let title = await ytdl.getBasicInfo(URL, { agent }).then((info) => info.videoDetails.title);
                console.log('Video Title:', title, 'URL:', URL);

                const tracker = {
                    start: Date.now(),
                    audio: { downloaded: 0, total: Infinity },
                    video: { downloaded: 0, total: Infinity },
                    merged: { frame: 0, speed: "0x", fps: 0 },
                };

                // Delete searching message
                await sock.sendMessage(from, { delete: searchingMsg.key });

                const processingMsg = await sock.sendMessage(from, { 
                    text: `🎬 Found: *${title}*\n⬇️ Downloading high quality video...` 
                });

                // Get audio and video streams
                const audio = ytdl(URL, {
                    agent,
                    quality: "highestaudio",
                })
                .on("progress", (_, downloaded, total) => {
                    tracker.audio = { downloaded, total };
                })
                .on("error", (err) => {
                    console.log('Audio stream error:', err);
                });

                const video = ytdl(URL, {
                    agent,
                    quality: "highestvideo",
                })
                .on("progress", (_, downloaded, total) => {
                    tracker.video = { downloaded, total };
                })
                .on("error", (err) => {
                    console.log('Video stream error:', err);
                });

                // Progress tracking
                let progressBarHandle = null;
                const progressBarInterval = 2000;

                const showProgress = () => {
                    const toMB = (i) => (i / 1024 / 1024).toFixed(2);
                    const audioProgress = ((tracker.audio.downloaded / tracker.audio.total) * 100).toFixed(1);
                    const videoProgress = ((tracker.video.downloaded / tracker.video.total) * 100).toFixed(1);
                    
                    console.log(`Audio: ${audioProgress}% (${toMB(tracker.audio.downloaded)}MB)`);
                    console.log(`Video: ${videoProgress}% (${toMB(tracker.video.downloaded)}MB)`);
                    console.log(`Merging: Frame ${tracker.merged.frame} at ${tracker.merged.fps} fps`);
                };

                // Start the ffmpeg child process
                const ffmpegProcess = cp.spawn(
                    ffmpeg,
                    [
                        "-loglevel", "8",
                        "-hide_banner",
                        "-progress", "pipe:3",
                        "-i", "pipe:4",
                        "-i", "pipe:5",
                        "-map", "0:a",
                        "-map", "1:v",
                        "-c:v", "copy",
                        "-c:a", "aac",
                        fileDown,
                    ],
                    {
                        windowsHide: true,
                        stdio: [
                            "inherit", "inherit", "inherit",
                            "pipe", "pipe", "pipe",
                        ],
                    }
                );

                ffmpegProcess.on("close", async (code) => {
                    console.log('FFmpeg process completed with code:', code);
                    
                    // Cleanup progress tracking
                    if (progressBarHandle) clearInterval(progressBarHandle);

                    try {
                        // Delete processing message
                        await sock.sendMessage(from, { delete: processingMsg.key });

                        if (fs.existsSync(fileDown)) {
                            const stats = fs.statSync(fileDown);
                            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                            // Log file size but no limits - user requested unlimited
                            console.log(`Video file size: ${fileSizeMB} MB`);

                            // Try sending as video first, fallback to document if it fails
                            try {
                                await sock.sendMessage(from, {
                                    video: fs.readFileSync(fileDown),
                                    caption: `🎬 *${title}*\n\n📦 Size: ${fileSizeMB} MB\n⬇️ Downloaded by ${settings.botName}`,
                                    contextInfo: {
                                        externalAdReply: {
                                            title: title,
                                            body: `Downloaded by ${settings.botName}`,
                                            thumbnailUrl: 'https://picsum.photos/300/300?random=video',
                                            sourceUrl: URL,
                                            mediaType: 1,
                                            renderLargerThumbnail: true
                                        }
                                    }
                                }, { quoted: message });
                            } catch (uploadError) {
                                console.log("Video upload failed, sending as document:", uploadError.message);
                                await sock.sendMessage(from, {
                                    document: fs.readFileSync(fileDown),
                                    mimetype: "video/mp4",
                                    fileName: `${title.replace(/[^\w\s]/gi, '').substring(0, 50)}.mp4`,
                                    caption: `🎬 *${title}*\n\n📦 Size: ${fileSizeMB} MB\n💡 Sent as document due to size\n⬇️ Downloaded by ${settings.botName}`
                                }, { quoted: message });
                            }

                            // Clean up file
                            fs.unlinkSync(fileDown);

                            await sock.sendMessage(from, { 
                                text: `✅ *Video downloaded successfully!*\n\n🎬 *Title:* ${title}\n📦 *Size:* ${fileSizeMB} MB` 
                            });
                        } else {
                            throw new Error('Video file was not created');
                        }
                    } catch (sendError) {
                        console.error('Error sending video:', sendError);
                        await sock.sendMessage(from, {
                            text: '❌ Failed to send video. Please try again with a shorter video.'
                        });
                        if (fs.existsSync(fileDown)) fs.unlinkSync(fileDown);
                    }
                });

                ffmpegProcess.on("error", async (err) => {
                    console.error("FFmpeg error:", err);
                    if (progressBarHandle) clearInterval(progressBarHandle);
                    await sock.sendMessage(from, {
                        text: '❌ Error processing video. Please try again.'
                    });
                    if (fs.existsSync(fileDown)) fs.unlinkSync(fileDown);
                });

                // Handle ffmpeg progress
                ffmpegProcess.stdio[3].on("data", (chunk) => {
                    if (!progressBarHandle) progressBarHandle = setInterval(showProgress, progressBarInterval);
                    
                    const lines = chunk.toString().trim().split("\n");
                    const args = {};
                    for (const l of lines) {
                        const [key, value] = l.split("=");
                        if (key && value) {
                            args[key.trim()] = value.trim();
                        }
                    }
                    tracker.merged = { ...tracker.merged, ...args };
                });

                // Pipe streams to ffmpeg
                audio.pipe(ffmpegProcess.stdio[4]);
                video.pipe(ffmpegProcess.stdio[5]);

            } catch (error) {
                console.error('Video download error:', error);
                
                let errorMessage = '❌ Failed to download video. ';
                
                if (error.message.includes('Video unavailable')) {
                    errorMessage += 'The video is not available or has been removed.';
                } else if (error.message.includes('Private video')) {
                    errorMessage += 'Cannot download private videos.';
                } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
                    errorMessage += 'Network connection error. Please try again.';
                } else {
                    errorMessage += 'Please try a different video or check if the URL is valid.';
                }

                await sock.sendMessage(from, { text: errorMessage });
                
                // Clean up if file exists
                if (fs.existsSync(fileDown)) fs.unlinkSync(fileDown);
            }

        } catch (error) {
            console.error('Video command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error processing video command. Please try again.'
            });
        }
    }
};
