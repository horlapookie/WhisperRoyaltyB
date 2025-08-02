
module.exports = {
    name: 'time',
    description: 'Show current time and date',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            const timezone = args[0] || 'UTC';
            
            const now = new Date();
            const utcTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
            
            // Common timezone offsets
            const timezones = {
                'UTC': 0, 'GMT': 0,
                'WAT': 1, 'CET': 1, 'WEST': 1, 'BST': 1,
                'EET': 2, 'CAT': 2, 'SAST': 2,
                'EAT': 3, 'MSK': 3,
                'GST': 4, 'AST': 4,
                'PKT': 5, 'IST': 5.5,
                'BST': 6, 'ICT': 7,
                'CST': 8, 'JST': 9,
                'AEST': 10, 'NZST': 12,
                'EST': -5, 'CST': -6, 'MST': -7, 'PST': -8
            };

            let targetTime = utcTime;
            let timezoneDisplay = 'UTC';
            
            if (timezones.hasOwnProperty(timezone.toUpperCase())) {
                const offset = timezones[timezone.toUpperCase()];
                targetTime = new Date(utcTime.getTime() + (offset * 3600000));
                timezoneDisplay = timezone.toUpperCase();
            }

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];

            const dayName = days[targetTime.getDay()];
            const monthName = months[targetTime.getMonth()];
            const date = targetTime.getDate();
            const year = targetTime.getFullYear();
            
            const hours = targetTime.getHours().toString().padStart(2, '0');
            const minutes = targetTime.getMinutes().toString().padStart(2, '0');
            const seconds = targetTime.getSeconds().toString().padStart(2, '0');
            
            const timeString = `${hours}:${minutes}:${seconds}`;
            const dateString = `${dayName}, ${monthName} ${date}, ${year}`;
            
            // Get 12-hour format
            const hour12 = targetTime.getHours() % 12 || 12;
            const ampm = targetTime.getHours() >= 12 ? 'PM' : 'AM';
            const time12 = `${hour12}:${minutes}:${seconds} ${ampm}`;

            const timeMessage = `🕐 *CURRENT TIME & DATE*

📅 **Date:** ${dateString}
🕐 **24-Hour:** ${timeString}
🕒 **12-Hour:** ${time12}
🌍 **Timezone:** ${timezoneDisplay}

⏰ **Other Timezones:**
• UTC: ${utcTime.getHours().toString().padStart(2, '0')}:${utcTime.getMinutes().toString().padStart(2, '0')}
• WAT (Nigeria): ${new Date(utcTime.getTime() + 3600000).getHours().toString().padStart(2, '0')}:${new Date(utcTime.getTime() + 3600000).getMinutes().toString().padStart(2, '0')}
• EST (US East): ${new Date(utcTime.getTime() - 18000000).getHours().toString().padStart(2, '0')}:${new Date(utcTime.getTime() - 18000000).getMinutes().toString().padStart(2, '0')}
• JST (Japan): ${new Date(utcTime.getTime() + 32400000).getHours().toString().padStart(2, '0')}:${new Date(utcTime.getTime() + 32400000).getMinutes().toString().padStart(2, '0')}

💡 **Usage:** ${settings.prefix}time [timezone]
**Example:** ${settings.prefix}time WAT`;

            await sock.sendMessage(from, { text: timeMessage });

        } catch (error) {
            console.error('Time command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error getting time information. Please try again.'
            });
        }
    }
};
