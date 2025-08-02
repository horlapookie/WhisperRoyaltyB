
module.exports = {
    name: 'settings',
    description: 'View and modify bot settings (Private only)',
    privateOnly: true,
    async execute(sock, message, args, { isOwner, settings, autoFeatures, isDM }) {
        const from = message.key.remoteJid;
        
        if (args.length === 0) {
            // Show current settings
            const settingsMessage = `⚙️ *BOT SETTINGS* ⚙️\n\n` +
                `🤖 *Bot Name:* ${settings.botName}\n` +
                `🔑 *Prefix:* ${settings.prefix}\n` +
                `👑 *Owner Numbers:* ${settings.ownerNumbers.length}\n\n` +
                `🎮 *AUTO FEATURES:*\n` +
                `👀 View Status: ${autoFeatures.viewStatus ? '🟢 ON' : '🔴 OFF'}\n` +
                `🔄 React Status: ${autoFeatures.reactStatus ? '🟢 ON' : '🔴 OFF'} (${autoFeatures.statusEmoji})\n` +
                `⌨️ Auto Typing: ${autoFeatures.autoTyping ? '🟢 ON' : '🔴 OFF'}\n` +
                `🎙️ Auto Recording: ${autoFeatures.autoRecording ? '🟢 ON' : '🔴 OFF'}\n` +
                `❤️ Auto React: ${autoFeatures.autoReact ? '🟢 ON' : '🔴 OFF'} (${autoFeatures.reactEmoji})\n` +
                `👋 Welcome/Leave: ${autoFeatures.welcomeGreeting ? '🟢 ON' : '🔴 OFF'}\n\n` +
                `📝 *Usage:*\n` +
                `• ${settings.prefix}settings - View settings\n` +
                `• ${settings.prefix}settings toggle <feature> - Toggle feature\n` +
                `• ${settings.prefix}settings emoji <type> <emoji> - Change emoji\n\n` +
                `*Available features to toggle:*\n` +
                `viewstatus, reactstatus, autotyping, autorecording, autoreact, welcome`;

            await sock.sendMessage(from, { text: settingsMessage });
            return;
        }

        // Only owner can modify settings
        if (!isOwner) {
            await sock.sendMessage(from, { text: '❌ Only the owner can modify settings.' });
            return;
        }

        const action = args[0].toLowerCase();
        
        if (action === 'toggle') {
            const feature = args[1]?.toLowerCase();
            
            switch (feature) {
                case 'viewstatus':
                    autoFeatures.viewStatus = !autoFeatures.viewStatus;
                    await sock.sendMessage(from, { 
                        text: `✅ View Status ${autoFeatures.viewStatus ? 'enabled' : 'disabled'}` 
                    });
                    break;
                case 'reactstatus':
                    autoFeatures.reactStatus = !autoFeatures.reactStatus;
                    await sock.sendMessage(from, { 
                        text: `✅ React Status ${autoFeatures.reactStatus ? 'enabled' : 'disabled'}` 
                    });
                    break;
                case 'autotyping':
                    autoFeatures.autoTyping = !autoFeatures.autoTyping;
                    await sock.sendMessage(from, { 
                        text: `✅ Auto Typing ${autoFeatures.autoTyping ? 'enabled' : 'disabled'}` 
                    });
                    break;
                case 'autorecording':
                    autoFeatures.autoRecording = !autoFeatures.autoRecording;
                    await sock.sendMessage(from, { 
                        text: `✅ Auto Recording ${autoFeatures.autoRecording ? 'enabled' : 'disabled'}` 
                    });
                    break;
                case 'autoreact':
                    autoFeatures.autoReact = !autoFeatures.autoReact;
                    await sock.sendMessage(from, { 
                        text: `✅ Auto React ${autoFeatures.autoReact ? 'enabled' : 'disabled'}` 
                    });
                    break;
                case 'welcome':
                    autoFeatures.welcomeGreeting = !autoFeatures.welcomeGreeting;
                    autoFeatures.leaveGreeting = !autoFeatures.leaveGreeting;
                    await sock.sendMessage(from, { 
                        text: `✅ Welcome/Leave messages ${autoFeatures.welcomeGreeting ? 'enabled' : 'disabled'}` 
                    });
                    break;
                default:
                    await sock.sendMessage(from, { 
                        text: '❌ Invalid feature. Use: viewstatus, reactstatus, autotyping, autorecording, autoreact, welcome' 
                    });
            }
        } else if (action === 'emoji') {
            const type = args[1]?.toLowerCase();
            const emoji = args[2];
            
            if (!emoji) {
                await sock.sendMessage(from, { text: '❌ Please provide an emoji.' });
                return;
            }
            
            if (type === 'status') {
                autoFeatures.statusEmoji = emoji;
                await sock.sendMessage(from, { text: `✅ Status emoji changed to ${emoji}` });
            } else if (type === 'react') {
                autoFeatures.reactEmoji = emoji;
                await sock.sendMessage(from, { text: `✅ React emoji changed to ${emoji}` });
            } else {
                await sock.sendMessage(from, { text: '❌ Invalid emoji type. Use: status, react' });
            }
        } else {
            await sock.sendMessage(from, { 
                text: '❌ Invalid action. Use: toggle <feature> or emoji <type> <emoji>' 
            });
        }
    }
};
