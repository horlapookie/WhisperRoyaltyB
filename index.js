const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { convertAllProfiles } = require('./utils/imageConverter');
// Import settings
let settings = require('./settings');
let ownerNumbers = [
    "2349122222622@s.whatsapp.net",
    "2349122222622@lid", 
    "2349122222622",
    "182725474553986@s.whatsapp.net",
    "182725474553986@lid",
    "182725474553986"
]; // Array to hold multiple owner numbers
let sock;

// Auto features state - reduced to prevent rate limiting
let autoFeatures = {
    viewStatus: false,
    reactStatus: false,
    statusEmoji: '👀',
    autoTyping: false,
    autoRecording: false,
    autoReact: false,
    reactEmoji: '❤️',
    welcomeGreeting: false,
    leaveGreeting: false
};

// Rate limiting and caching to prevent WhatsApp API rate limits
const rateLimitCache = new Map();
const groupMetadataCache = new Map();
const jidMappingCache = new Map(); // Cache for @lid to phone number mappings

// Rate limiting helper - more aggressive limits
function canMakeRequest(key, maxRequests = 1, timeWindow = 30000) {
    const now = Date.now();
    const requests = rateLimitCache.get(key) || [];

    // Remove old requests outside time window
    const validRequests = requests.filter(time => now - time < timeWindow);

    if (validRequests.length >= maxRequests) {
        console.log(`⏰ Rate limit hit for ${key}: ${validRequests.length}/${maxRequests} requests in last ${timeWindow}ms`);
        return false;
    }

    validRequests.push(now);
    rateLimitCache.set(key, validRequests);
    return true;
}

// Enhanced JID mapping cache to remember @lid patterns
function addJidMapping(lidJid, phoneNumber) {
    if (lidJid.includes('@lid') && phoneNumber) {
        jidMappingCache.set(lidJid, phoneNumber);
        console.log(`📝 Cached JID mapping: ${lidJid} -> ${phoneNumber}`);
    }
}

// Load commands from horlapookie folder
const commands = new Map();

function loadCommands() {
    const commandsPath = path.join(__dirname, 'horlapookie');

    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    commands.clear();

    for (const file of commandFiles) {
        try {
            delete require.cache[require.resolve(path.join(commandsPath, file))];
            const command = require(path.join(commandsPath, file));

            // Add main command name
            commands.set(command.name, command);

            // Add aliases if they exist
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach(alias => {
                    commands.set(alias, command);
                });
            }

            const aliasText = command.aliases && command.aliases.length > 0 
                ? ` (aliases: ${command.aliases.join(', ')})` 
                : '';
            console.log(`✅ Loaded command: ${command.name}${aliasText}`);
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error.message);
        }
    }
}

// Watch settings file for changes
chokidar.watch('./settings.js').on('change', () => {
    delete require.cache[require.resolve('./settings')];
    settings = require('./settings');
    console.log('🔄 Settings reloaded');
});

// Watch commands folder for changes
chokidar.watch('./horlapookie').on('change', () => {
    loadCommands();
});

async function connectToWhatsApp() {
    try {


        // Decode base64 session
        const sessionData = JSON.parse(Buffer.from(settings.sessionId, 'base64').toString());

        // Create auth directory if it doesn't exist
        const authDir = './auth_info';
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        // Write session data to auth files
        fs.writeFileSync(path.join(authDir, 'creds.json'), JSON.stringify(sessionData, null, 2));

        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();

        console.log(`🚀 Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        // Create a proper logger that implements all required methods
        const logger = {
            level: 'silent',
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            fatal: () => {},
            child: () => ({
                level: 'silent',
                trace: () => {},
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
                fatal: () => {}
            })
        };

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: logger
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Connection closed due to:', lastDisconnect?.error, ', reconnecting:', shouldReconnect);

                // Handle different disconnect reasons
                if (lastDisconnect?.error?.output?.statusCode === 440) {
                    console.log('🔄 Session conflict - WhatsApp is active on another device. Waiting 30 seconds...');
                    setTimeout(connectToWhatsApp, 30000);
                } else if (lastDisconnect?.error?.output?.statusCode === 401) {
                    console.log('❌ Session expired. Please provide a fresh session ID.');
                    return;
                } else if (shouldReconnect) {
                    setTimeout(connectToWhatsApp, 15000);
                }
            } else if (connection === 'open') {
                console.log('✅ Connected to WhatsApp');

                // Set up multiple owner numbers from settings and connected account
                ownerNumbers = [
                    "2349122222622@s.whatsapp.net",
                    "2349122222622@lid", 
                    "2349122222622",
                    "182725474553986@s.whatsapp.net",
                    "182725474553986@lid",
                    "182725474553986"
                ];

                // Also add the connected account as owner
                const connectedOwner = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                if (!ownerNumbers.includes(connectedOwner)) {
                    ownerNumbers.push(connectedOwner);
                }

                console.log('👑 Owner numbers configured:', ownerNumbers);

                // Send Throne of Seal audio on connection
                if (fs.existsSync('./throne_audio.mp3')) {
                    await sock.sendMessage(connectedOwner, {
                        audio: fs.readFileSync('./throne_audio.mp3'),
                        mimetype: 'audio/mpeg',
                        fileName: 'throne_of_seal.mp3',
                        caption: '🎵 *Previously on Throne of Seal...* 🎵\n\n👑 The legendary tale continues with YOUR HIGHNESS V1 BETA!'
                    }).catch(() => {});
                }

                // Send connection status message with profile picture
                const statusMessage = `╔〘 *🇳🇬 ${settings.botName.toUpperCase()} 🇳🇬* 〙
║ 👑 *Creator:* horlapookie
║ 🧩 *Prefix:* [ ${settings.prefix} ]
║ ⚙️ *Mode:* ${(settings.mode || 'public').charAt(0).toUpperCase() + (settings.mode || 'public').slice(1)}
║ 🔧 *Version:* v1 beta
║ 📱 *Works In:* DMs, Groups & Channels
║ ✅ *Status:* ONLINE & CONNECTED
╚═〘 *Bot Ready* 〙

⎾═╼▣ *AUTO FEATURES STATUS*
︱👀 View Status: ${autoFeatures.viewStatus ? '🟢 ON' : '🔴 OFF'}
︱⌨️ Auto Typing: ${autoFeatures.autoTyping ? '🟢 ON' : '🔴 OFF'}
︱❤️ Auto React: ${autoFeatures.autoReact ? '🟢 ON' : '🔴 OFF'} (${autoFeatures.reactEmoji})
︱🎙️ Auto Recording: ${autoFeatures.autoRecording ? '🟢 ON' : '🔴 OFF'}
︱👋 Welcome/Leave: ${autoFeatures.welcomeGreeting ? '🟢 ON' : '🔴 OFF'}
⎿═╼▣

⎾═╼▣ *QUICK COMMANDS*
︱✗ ${settings.prefix}ping - Check bot status
︱✗ ${settings.prefix}help - Show all commands
︱✗ ${settings.prefix}music <song> - Download music
︱✗ ${settings.prefix}video <search> - Download video
⎿═╼▣

🔥 *BOT IS READY TO SERVE!* 🔥
Type ${settings.prefix}help to see all commands!`;

                try {
                    // Send status message to first owner number (main owner)
                    const mainOwner = ownerNumbers[0] || connectedOwner;

                    // Send single profile picture with connection status
                    let imageSent = false;

                    // Try PNG first, then SVG
                    if (fs.existsSync('./profile1.png')) {
                        await sock.sendMessage(mainOwner, { 
                            image: fs.readFileSync('./profile1.png'),
                            caption: statusMessage
                        });
                        imageSent = true;
                    } else if (fs.existsSync('./profile1.svg')) {
                        await sock.sendMessage(mainOwner, { 
                            image: fs.readFileSync('./profile1.svg'),
                            caption: statusMessage
                        });
                        imageSent = true;
                    }

                    if (imageSent) {
                        console.log('✅ Connection status with profile picture sent to main owner');
                    } else {
                        await sock.sendMessage(mainOwner, { text: statusMessage });
                        console.log('✅ Connection status sent to main owner (text only)');
                    }
                } catch (error) {
                    console.log('Failed to send status message:', error);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            for (const message of messages) {
                // Skip if no message
                if (!message.message) continue;

                const from = message.key.remoteJid;
                const isDM = !from.includes('@g.us') && !from.includes('@newsletter');
                const isChannel = from.includes('@newsletter');
                const isGroup = from.includes('@g.us');
                const messageText = message.message.conversation || 
                                 message.message.extendedTextMessage?.text || '';

                // Check if sender is owner (works for DM, groups, and channels)
                const senderJid = message.key.participant || from;

                // Extract phone number from JIDs for comparison
                const extractNumber = (jid) => {
                    if (!jid) return null;

                    // Don't extract numbers from group or channel JIDs directly
                    if (jid.includes('@g.us') || jid.includes('@newsletter')) {
                        return null;
                    }

                    // Extract phone number from user JID (handles both @s.whatsapp.net and @lid formats)
                    let number = jid.split('@')[0];

                    // Handle colon separators (like in some JID formats)
                    if (number.includes(':')) {
                        number = number.split(':')[0];
                    }

                    // Remove any non-numeric characters
                    number = number.replace(/\D/g, '');

                    // For @lid format, WhatsApp sometimes uses internal IDs that don't match phone numbers
                    // We need to handle this differently - @lid often contains encrypted/hashed numbers
                    if (jid.includes('@lid')) {
                        // For @lid, we can't reliably extract the actual phone number
                        // We'll need to rely on other detection methods
                        return null;
                    }

                    // Ensure we have a valid phone number (at least 10 digits)
                    if (number && number.length >= 10 && /^\d+$/.test(number)) {
                        return number;
                    }

                    return null;
                };

                // Get connected account ID
                const connectedId = sock.user?.id?.split(':')[0] || '';
                const senderPhone = extractNumber(senderJid);

                // Enhanced owner detection for both DM and group messages
                const isOwner = (message.key.fromMe) || // Bot's own messages
                               (senderPhone && senderPhone === connectedId) || // Connected account match
                               (senderJid === `${connectedId}@s.whatsapp.net`) || // Direct JID match
                               // Check against configured owner numbers
                               ownerNumbers.some(ownerNumber => {
                                   // Direct JID match (for exact JID matches)
                                   if (senderJid === ownerNumber) return true;
                                   if (senderJid === `${ownerNumber}@s.whatsapp.net`) return true;
                                   if (senderJid === `${ownerNumber}@lid`) return true;

                                   // Extract and compare phone numbers from owner number (if possible)
                                   const ownerPhone = extractNumber(ownerNumber);
                                   if (ownerPhone && senderPhone && ownerPhone === senderPhone) return true;

                                   // Direct number match
                                   if (senderPhone === ownerNumber) return true;

                                   // For @lid format, check cached mappings
                                   if (senderJid.includes('@lid')) {
                                       const cachedPhone = jidMappingCache.get(senderJid);
                                       if (cachedPhone && cachedPhone === ownerNumber) {
                                           return true;
                                       }
                                       return false; // We'll handle @lid differently below
                                   }

                                   return false;
                               });

                // Enhanced admin detection for groups
                let isGroupAdmin = false;
                if (isGroup && messageText.startsWith(settings.prefix)) {
                    // Use rate limiting to prevent API overload
                    const groupMetadataKey = `groupMetadata:${from}`;
                    if (canMakeRequest(groupMetadataKey, 2, 30000)) {
                        try {
                            // Check cache first
                            let groupMetadata = groupMetadataCache.get(from);
                            if (!groupMetadata) {
                                groupMetadata = await sock.groupMetadata(from);
                                // Cache for 5 minutes
                                groupMetadataCache.set(from, groupMetadata);
                                setTimeout(() => groupMetadataCache.delete(from), 300000);
                            }

                            const participant = groupMetadata.participants.find(p => p.id === senderJid);
                            isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

                            console.log(`📊 Admin Check - Sender: ${senderJid}, Found Participant: ${!!participant}, Admin Status: ${participant?.admin || 'member'}, IsAdmin: ${isGroupAdmin}`);

                            // If this is an @lid JID and we detected them as admin, cache the mapping
                            if (isGroupAdmin && senderJid.includes('@lid')) {
                                // Try to find their actual phone number from group metadata
                                const phoneParticipant = groupMetadata.participants.find(p => 
                                    p.id.includes('@s.whatsapp.net') && 
                                    ownerNumbers.some(owner => p.id.includes(owner.replace('@s.whatsapp.net', '').replace('@lid', '')))
                                );
                                if (phoneParticipant) {
                                    const phoneNumber = extractNumber(phoneParticipant.id);
                                    if (phoneNumber) addJidMapping(senderJid, phoneNumber);
                                }
                            }
                        } catch (error) {
                            console.log('Could not fetch group admin status (rate limited):', error.message);
                            isGroupAdmin = false;
                        }
                    } else {
                        console.log('Skipping group metadata fetch due to rate limiting');
                        // Check if we have cached admin status
                        const cachedMetadata = groupMetadataCache.get(from);
                        if (cachedMetadata) {
                            const participant = cachedMetadata.participants.find(p => p.id === senderJid);
                            isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                        }
                    }
                }

                // Also check for fromMe messages (bot's own messages) - these should be treated as owner
                const isFromBot = message.key.fromMe;

                const finalIsOwner = isOwner || isFromBot;

                // Debug logging (only for commands to reduce noise)
                if (messageText.startsWith(settings.prefix)) {
                    console.log('🔍 Command Debug:');
                    console.log('  From:', from);
                    console.log('  Type:', isDM ? 'DM' : isChannel ? 'Channel' : 'Group');
                    console.log('  Sender JID:', senderJid, '(Phone:', senderPhone || 'N/A' + ')');
                    console.log('  Is Group Admin:', isGroupAdmin || false);
                    console.log('  Is Owner:', finalIsOwner);
                }

                // Enhanced debugging for owner detection
                if (messageText.startsWith(settings.prefix)) {
                    console.log('  📊 Owner Detection Analysis:');
                    console.log('    - Phone match with connected:', senderPhone === connectedId);
                    console.log('    - JID match with connected:', senderJid === `${connectedId}@s.whatsapp.net`);
                    console.log('    - FromMe:', message.key.fromMe);
                    console.log('    - Owner number matches:', ownerNumbers.some(ownerNumber => {
                        const ownerPhone = extractNumber(ownerNumber);
                        const directMatch = senderJid === ownerNumber;
                        const phoneMatch = ownerPhone && senderPhone && ownerPhone === senderPhone;
                        const numberMatch = senderPhone === ownerNumber;
                        console.log(`      * ${ownerNumber}: direct=${directMatch}, phone=${phoneMatch}, number=${numberMatch}`);
                        return directMatch || phoneMatch || numberMatch;
                    }));
                }

                // Additional check: see if the raw message contains owner info
                if (isGroup && messageText.startsWith(settings.prefix)) {
                    console.log('  Raw Message Key:', JSON.stringify(message.key, null, 2));
                }

                // Only show participant list for debugging when really needed (owner testing)
                if (isGroup && messageText.includes('ownertest') && finalIsOwner) {
                    try {
                        const groupMetadata = await sock.groupMetadata(from);
                        const participantNumbers = groupMetadata.participants.map(p => extractNumber(p.id)).filter(Boolean);
                        console.log('  Group Participants:', participantNumbers);
                    } catch (error) {
                        console.log('Could not fetch group participants:', error.message);
                    }
                }

                // Auto react to all messages if enabled
                if (autoFeatures.autoReact && !message.key.fromMe) {
                    try {
                        await sock.sendMessage(from, {
                            react: {
                                text: autoFeatures.reactEmoji,
                                key: message.key
                            }
                        });
                    } catch (error) {
                        console.log('Auto react failed:', error);
                    }
                }

                // React to command usage with specific emojis
                if (messageText.startsWith(settings.prefix) && !message.key.fromMe) {
                    try {
                        const commandName = messageText.slice(settings.prefix.length).trim().split(' ')[0].toLowerCase();

                        // Define command-specific reactions
                        const commandReactions = {
                            'music': '🎵',
                            'song': '🎵',
                            'video': '🎬',
                            'vid': '🎬',
                            'help': '📋',
                            'menu': '📋',
                            'ping': '🏓',
                            'qr': '📱',
                            'qrscan': '🔍',
                            'tts': '🗣️',
                            'stt': '🎤',
                            'nmap': '🔍',
                            'metasploit': '🎯',
                            'toon': '🎨',
                            'sticker': '🔖',
                            'promote': '⬆️',
                            'demote': '⬇️',
                            'tagall': '📢',
                            'hidetag': '👻'
                        };

                        const reactionEmoji = commandReactions[commandName] || '⚡';

                        await sock.sendMessage(from, {
                            react: {
                                text: reactionEmoji,
                                key: message.key
                            }
                        });
                    } catch (error) {
                        console.log('Command reaction failed:', error);
                    }
                }

                // Auto typing
                if (autoFeatures.autoTyping && messageText.startsWith(settings.prefix)) {
                    try {
                        await sock.sendMessage(from, {
                            react: {
                                text: '⌨️',
                                key: message.key
                            }
                        });
                        await sock.sendPresenceUpdate('composing', from);
                        setTimeout(() => sock.sendPresenceUpdate('available', from), 2000);
                    } catch (error) {
                        console.log('Auto typing failed:', error);
                    }
                }

                // Auto recording
                if (autoFeatures.autoRecording && messageText.startsWith(settings.prefix)) {
                    try {
                        await sock.sendPresenceUpdate('recording', from);
                        setTimeout(() => sock.sendPresenceUpdate('available', from), 2000);
                    } catch (error) {
                        console.log('Auto recording failed:', error);
                    }
                }

                // Handle commands
                if (messageText.startsWith(settings.prefix)) {
                    const args = messageText.slice(settings.prefix.length).trim().split(' ');
                    const commandName = args.shift().toLowerCase();

                    const command = commands.get(commandName);
                    if (command) {
                        // Check if user is banned (except owner)
                        if (!finalIsOwner) {
                            try {
                                const fs = require('fs');
                                const banFile = './banned_users.json';
                                if (fs.existsSync(banFile)) {
                                    const bannedUsers = JSON.parse(fs.readFileSync(banFile, 'utf8'));
                                    if (bannedUsers.includes(senderJid)) {
                                        await sock.sendMessage(from, { 
                                            text: '🚫 *You are banned from using this bot*\n\nContact the bot owner if you think this is a mistake.' 
                                        });
                                        continue;
                                    }
                                }
                            } catch (banCheckError) {
                                console.log('Ban check failed:', banCheckError);
                            }
                        }

                        // Check bot mode permissions first
                        if (settings.mode === 'private' && !finalIsOwner) {
                            await sock.sendMessage(from, { 
                                text: '🔒 *Bot is in Private Mode*\n\nOnly the bot owner can use commands.\nContact the owner for access.' 
                            });
                            continue;
                        }

                        // Check command permissions
                        const canExecute = await checkCommandPermissions(command, finalIsOwner, isDM, isGroup, isChannel, sock, from, senderJid, isGroupAdmin);

                        if (!canExecute) {
                            let errorMsg = '❌ ';
                            if (command.ownerOnly) {
                                errorMsg += 'This command is owner-only.';
                            } else if (command.privateOnly) {
                                errorMsg += 'This command can only be used in private messages.';
                            } else if (command.adminOnly) {
                                errorMsg += 'This command requires admin privileges.';
                            } else {
                                errorMsg += 'You do not have permission to use this command.';
                            }

                            await sock.sendMessage(from, { text: errorMsg });
                            continue;
                        }

                        try {
                            await command.execute(sock, message, args, { 
                                isOwner: finalIsOwner, 
                                isGroupAdmin,
                                settings, 
                                autoFeatures, 
                                isDM, 
                                isChannel, 
                                isGroup 
                            });
                        } catch (error) {
                            console.error(`Error executing command ${commandName}:`, error);

                            // Handle rate limiting errors specifically
                            if (error.message && (error.message.includes('rate-overlimit') || error.message.includes('429'))) {
                                console.log('⏰ Command hit rate limit, implementing backoff...');
                                await sock.sendMessage(from, { 
                                    text: `⏰ WhatsApp is rate limiting the bot. Please wait 30 seconds before trying again.` 
                                });
                                // Add a delay before allowing more commands
                                setTimeout(() => {
                                    console.log('Rate limit cooldown completed');
                                }, 30000);
                            } else {
                                await sock.sendMessage(from, { text: '❌ An error occurred while executing this command.' });
                            }
                        }
                    } else {
                        // Only show command not found if bot is public or user is owner
                        if (settings.mode === 'public' || finalIsOwner) {
                            await sock.sendMessage(from, { 
                                text: `❌ Command "${commandName}" not found!\nType ${settings.prefix}help to see available commands.` 
                            });
                        }
                    }
                }

                
                
            }
        });

        // Status handling temporarily disabled to prevent rate limiting
        // Will be re-enabled with proper throttling in future update

        // Handle group events
        sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
            if (!autoFeatures.welcomeGreeting && !autoFeatures.leaveGreeting) return;

            try {
                const groupMetadata = await sock.groupMetadata(id);

                for (const participant of participants) {
                    if (action === 'add' && autoFeatures.welcomeGreeting) {
                        const welcomeMessage = `👋 Welcome to *${groupMetadata.subject}*!\n\n` +
                            `Hope you enjoy your stay here! 🎉`;

                        await sock.sendMessage(id, { 
                            text: welcomeMessage,
                            mentions: [participant]
                        });
                    } else if (action === 'remove' && autoFeatures.leaveGreeting) {
                        const leaveMessage = `👋 Goodbye! Thanks for being part of *${groupMetadata.subject}*`;

                        await sock.sendMessage(id, { text: leaveMessage });
                    }
                }
            } catch (error) {
                console.log('Group event handling failed:', error);
            }
        });

    } catch (error) {
        console.error('❌ Connection failed:', error);
        setTimeout(connectToWhatsApp, 5000);
    }
}

// Initialize bot
async function init() {
    console.log(`🤖 Starting ${settings.botName}...`);
    console.log(`📁 Loading commands from horlapookie folder...`);

    loadCommands();

    // Convert SVG profile pictures to PNG for better WhatsApp compatibility
    console.log('🖼️ Converting profile pictures...');
    try {
        await convertAllProfiles();
        console.log('✅ Profile pictures ready');
    } catch (error) {
        console.log('⚠️ Profile conversion failed, proceeding anyway:', error);
    }

    await connectToWhatsApp();
}

// Start the bot
init().catch(console.error);

// Permission checking function
async function checkCommandPermissions(command, isOwner, isDM, isGroup, isChannel, sock, from, senderJid, isGroupAdmin = false) {
    // Owner can use any command anywhere (DM, group, or channel)
    if (isOwner) return true;

    // Check if command is owner-only
    if (command.ownerOnly) return false;

    // Check if command is private-only and we're not in DM
    if (command.privateOnly && !isDM) return false;

    // Check if command is admin-only
    if (command.adminOnly) {
        // In groups, check admin status (already determined in main handler)
        if (isGroup) {
            console.log(`🔐 Admin Permission Check - Command: ${command.name}, IsGroupAdmin: ${isGroupAdmin}, IsOwner: ${isOwner}`);
            return isGroupAdmin || isOwner;
        }
        // Admin-only commands in non-group contexts are not allowed for non-owners
        return false;
    }

    // All other commands are allowed in all contexts (DM, group, channel)
    return true;
}

// Export for use in commands
module.exports = { sock, ownerNumbers, settings, autoFeatures };