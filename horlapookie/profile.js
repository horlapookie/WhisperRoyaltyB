
module.exports = {
    name: 'profile',
    description: 'Get user profile information and picture',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let targetJid = null;
            let targetName = 'Unknown';
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const participant = message.message.extendedTextMessage.contextInfo.participant;
                // Only use participant if it's a user JID, not group/channel JID
                if (participant && participant.includes('@s.whatsapp.net')) {
                    targetJid = participant;
                } else if (from.includes('@s.whatsapp.net')) {
                    targetJid = from;
                }
            }
            // Check if mentioning someone
            else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                const mentioned = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
                // Only use mentioned if it's a user JID
                if (mentioned && mentioned.includes('@s.whatsapp.net')) {
                    targetJid = mentioned;
                }
            }
            // If in DM and no target specified, use the DM contact
            else if (from.includes('@s.whatsapp.net')) {
                targetJid = from;
            }
            // Check if providing a number
            else if (args.length > 0) {
                let number = args[0].replace(/[^\d]/g, '');
                if (number.length >= 10) {
                    targetJid = number + '@s.whatsapp.net';
                }
            }

            if (!targetJid || !targetJid.includes('@s.whatsapp.net')) {
                await sock.sendMessage(from, {
                    text: `❌ Please specify a valid user whose profile to fetch!\n\n📝 **Usage:**\n• In DM: ${settings.prefix}profile (gets DM contact's profile)\n• Reply to user message: ${settings.prefix}profile\n• Mention user: ${settings.prefix}profile @user\n• Use number: ${settings.prefix}profile 2349xxxxxxxx\n\n💡 **Note:** Can only fetch individual user profiles, not groups or channels`
                });
                return;
            }

            await sock.sendMessage(from, {
                text: '👤 Fetching profile information... Please wait!'
            });

            try {
                // Get user info first
                const userInfo = targetJid.split('@')[0];
                
                // Check if user exists on WhatsApp
                let userExists = false;
                try {
                    const onWhatsApp = await sock.onWhatsApp(targetJid);
                    if (onWhatsApp && onWhatsApp.length > 0) {
                        userExists = true;
                        if (onWhatsApp[0].name) {
                            targetName = onWhatsApp[0].name;
                        }
                    }
                } catch (existsError) {
                    console.log('User existence check failed');
                }
                
                if (!userExists) {
                    await sock.sendMessage(from, {
                        text: `❌ User +${userInfo} is not on WhatsApp or doesn't exist.`
                    });
                    return;
                }

                // Get profile picture
                let profilePicUrl = null;
                try {
                    profilePicUrl = await sock.profilePictureUrl(targetJid, 'image');
                } catch (ppError) {
                    console.log('No profile picture available or privacy restricted');
                }

                // Get user status/bio
                let userStatus = 'Status not available or privacy restricted';
                try {
                    const status = await sock.fetchStatus(targetJid);
                    if (status && status.status) {
                        userStatus = status.status;
                    }
                } catch (statusError) {
                    console.log('Status fetch failed - privacy settings');
                }

                const profileMessage = `👤 *USER PROFILE*

📱 **Number:** +${userInfo}
👨‍💼 **Name:** ${targetName}
📝 **Bio/Status:** ${userStatus}
🕒 **Fetched:** ${new Date().toLocaleString()}

💡 **Note:** Profile information fetched successfully`;

                if (profilePicUrl) {
                    // Send profile picture with caption
                    const fetch = require('node-fetch');
                    const response = await fetch(profilePicUrl);
                    const buffer = await response.buffer();
                    
                    await sock.sendMessage(from, {
                        image: buffer,
                        caption: profileMessage
                    });
                } else {
                    // Send text only if no profile picture
                    await sock.sendMessage(from, {
                        text: profileMessage + '\n\n📷 **Profile Picture:** Not available'
                    });
                }

            } catch (fetchError) {
                console.error('Profile fetch error:', fetchError);
                await sock.sendMessage(from, {
                    text: `❌ Failed to fetch profile for ${targetJid.split('@')[0]}. The user might have privacy settings enabled or doesn't exist.`
                });
            }

        } catch (error) {
            console.error('Profile command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error fetching profile. Please try again.'
            });
        }
    }
};
