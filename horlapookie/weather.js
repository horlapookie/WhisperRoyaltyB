module.exports = {
    name: 'weather',
    description: 'Get weather information for a location',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let location = '';
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.conversation) {
                    location = quotedMsg.conversation.trim();
                } else if (quotedMsg.extendedTextMessage?.text) {
                    location = quotedMsg.extendedTextMessage.text.trim();
                }
            }
            // If no quoted text, use command arguments
            else if (args.length > 0) {
                location = args.join(' ').trim();
            }
            
            if (!location) {
                await sock.sendMessage(from, {
                    text: `❌ Please provide a location!\n\n🌤️ **Usage:**\n• ${settings.prefix}weather Lagos\n• ${settings.prefix}weather New York\n• ${settings.prefix}weather London, UK\n• Reply to location text: ${settings.prefix}weather\n\n💡 **Tip:** Be specific with city names for better results`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: `🌤️ Getting weather information for ${location}... Please wait!`
            });

            // Use OpenWeatherMap API
            const apiKey = '37bb420b5bf0cccbd8d0f49e52738e25';
            const url = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
            
            const axios = require('axios');
            const response = await axios.get(url);
            
            if (response.status !== 200) {
                if (response.status === 404) {
                    await sock.sendMessage(from, {
                        text: `❌ Location "${location}" not found. Please check the spelling and try again.`
                    });
                    return;
                }
                throw new Error(`Weather API returned ${response.status}`);
            }
            
            const data = response.data;
            
            const weatherMessage = `🌤️ *WEATHER REPORT*

📍 **Location:** ${data.name}, ${data.sys.country}
📅 **Date:** ${new Date().toLocaleDateString()}

🌡️ **Current Conditions:**
• Temperature: ${Math.round(data.main.temp)}°C (${Math.round(data.main.temp * 9/5 + 32)}°F)
• Feels like: ${Math.round(data.main.feels_like)}°C
• Condition: ${data.weather[0].description}
• Humidity: ${data.main.humidity}%
• Visibility: ${data.visibility / 1000} km

💨 **Wind:**
• Speed: ${data.wind.speed} m/s
• Direction: ${data.wind.deg}°

🌡️ **Temperature Range:**
• High: ${Math.round(data.main.temp_max)}°C
• Low: ${Math.round(data.main.temp_min)}°C

🌅 **Sun Times:**
• Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}
• Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}

💡 *Weather data provided by OpenWeatherMap*`;

            await sock.sendMessage(from, {
                text: weatherMessage
            });
            
        } catch (error) {
            console.error('Weather command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to get weather information. Please check the location and try again.'
            });
        }
    }
};