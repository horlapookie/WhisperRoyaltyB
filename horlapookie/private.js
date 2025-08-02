module.exports = {
    name: 'private',
    description: 'Switch bot to private mode (Owner only)',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is for bot owner only!' 
            });
        }

        try {
            // Update settings to private mode
            const fs = require('fs');
            const path = require('path');
            const settingsPath = path.join(__dirname, '..', 'settings.js');
            
            let settingsContent = fs.readFileSync(settingsPath, 'utf8');
            
            // Add or update mode property
            if (settingsContent.includes('mode:')) {
                settingsContent = settingsContent.replace(/mode:\s*["'].*["'],?/g, 'mode: "private",');
            } else {
                settingsContent = settingsContent.replace(
                    /prefix:\s*["'].*["'],?/g, 
                    'prefix: ".",\n    mode: "private",'
                );
            }
            
            fs.writeFileSync(settingsPath, settingsContent);
            
            // Clear cache and reload
            delete require.cache[require.resolve('../settings.js')];
            
            await sock.sendMessage(from, { 
                text: '🔒 *Bot switched to PRIVATE mode*\n\n' +
                      '• Only bot owner can use commands\n' +
                      '• Other users will get access denied message\n' +
                      '• Use .public to switch back to public mode\n\n' +
                      '✅ Settings updated successfully!'
            });
            
        } catch (error) {
            console.error('Private command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to switch to private mode. Please try again.' 
            });
        }
    }
};