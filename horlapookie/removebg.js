require('dotenv').config();

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const getRandom = ext => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const getRemoveBg = async (inputPath, apiKey) => {
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append(
        'image_file',
        fs.createReadStream(inputPath),
        path.basename(inputPath)
    );

    const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: formData,
        responseType: 'arraybuffer',
        headers: {
            ...formData.getHeaders(),
            'X-Api-Key': apiKey
        },
        encoding: null
    });

    if (response.status !== 200) {
        throw new Error('API request failed');
    }

    return response.data;
};

module.exports = {
    name: 'removebg',
    description: 'Remove background from image',
    aliases: ['bg', 'rembg', 'nobg'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        // Check if API key is available
        const REMOVE_BG_KEY = process.env.REMOVE_BG_KEY || settings.REMOVE_BG_KEY;
        if (!REMOVE_BG_KEY) {
            return await sock.sendMessage(from, { 
                text: `❌ *Remove.bg API Key Missing*\n\nAdd your API key to settings:\n${settings.prefix}settings REMOVE_BG_KEY your_api_key\n\nGet API key from: https://remove.bg/api` 
            }, { quoted: message });
        }

        // Check if image is present
        const isTaggedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        const isDirectImage = message.message?.imageMessage;

        if (!isTaggedImage && !isDirectImage) {
            return await sock.sendMessage(from, { 
                text: `❌ *Reply to an image or send an image*\n\nExample: Send image then type ${settings.prefix}removebg` 
            }, { quoted: message });
        }

        const processingMsg = await sock.sendMessage(from, { 
            text: '🖼️ Removing background... Please wait!' 
        }, { quoted: message });

        let tempFile;
        let outputFile = './temp/bg_removed.png';

        try {
            // Create temp directory
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Download the image
            let downloadFilePath;
            if (isDirectImage) {
                downloadFilePath = message.message.imageMessage;
            } else {
                downloadFilePath = message.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }

            const stream = await downloadContentFromMessage(downloadFilePath, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            tempFile = `./temp/${getRandom('.jpeg')}`;
            fs.writeFileSync(tempFile, buffer);

            // Remove background
            const resultBuffer = await getRemoveBg(tempFile, REMOVE_BG_KEY);
            fs.writeFileSync(outputFile, resultBuffer);

            // Send result
            await sock.sendMessage(from, { delete: processingMsg.key });
            
            await sock.sendMessage(from, {
                image: fs.readFileSync(outputFile),
                mimetype: 'image/png',
                caption: `✅ *Background Removed Successfully*\n\n🤖 Processed by ${settings.botName}`
            }, { quoted: message });

            console.log("Background removed successfully");

        } catch (error) {
            console.log("RemoveBG error:", error);
            
            await sock.sendMessage(from, { delete: processingMsg.key });
            
            let errorMsg = '❌ Failed to remove background.';
            if (error.response?.status === 402) {
                errorMsg += '\n\n💳 API quota exceeded. Check your Remove.bg account.';
            } else if (error.response?.status === 403) {
                errorMsg += '\n\n🔑 Invalid API key. Check your Remove.bg API key.';
            } else {
                errorMsg += '\n\n🔧 Try with a different image or check your API key.';
            }
            
            await sock.sendMessage(from, { 
                text: errorMsg 
            }, { quoted: message });

        } finally {
            // Cleanup files
            if (tempFile && fs.existsSync(tempFile)) {
                try {
                    fs.unlinkSync(tempFile);
                } catch (e) {}
            }
            if (fs.existsSync(outputFile)) {
                try {
                    fs.unlinkSync(outputFile);
                } catch (e) {}
            }
        }
    }
};