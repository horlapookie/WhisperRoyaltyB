module.exports = {
    name: 'public',
    description: 'Switch bot to public mode (Owner only)',
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is for bot owner only!' 
            });
        }

        try {
            // Update settings to public mode
            const fs = require('fs');
            const path = require('path');
            const settingsPath = path.join(__dirname, '..', 'settings.js');
            
            let settingsContent = fs.readFileSync(settingsPath, 'utf8');
            
            // Add or update mode property
            if (settingsContent.includes('mode:')) {
                settingsContent = settingsContent.replace(/mode:\s*["'].*["'],?/g, 'mode: "public",');
            } else {
                settingsContent = settingsContent.replace(
                    /prefix:\s*["'].*["'],?/g, 
                    'prefix: ".",\n    mode: "public",'
                );
            }
            
            fs.writeFileSync(settingsPath, settingsContent);
            
            // Clear cache and reload
            delete require.cache[require.resolve('../settings.js')];
            
            await sock.sendMessage(from, { 
                text: '🌍 *Bot switched to PUBLIC mode*\n\n' +
                      '• All users can use public commands\n' +
                      '• Owner-only commands still restricted\n' +
                      '• Admin commands work in groups\n' +
                      '• Use .private to switch back to private mode\n\n' +
                      '✅ Settings updated successfully!'
            });
            
        } catch (error) {
            console.error('Public command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to switch to public mode. Please try again.' 
            });
        }
    }
};