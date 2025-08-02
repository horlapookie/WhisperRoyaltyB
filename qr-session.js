const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

async function generateNewSession() {
    console.log('🔄 Generating new session for bot...');
    
    // Create fresh auth directory
    const authDir = './fresh_auth';
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
    }
    fs.mkdirSync(authDir, { recursive: true });
    
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: {
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
        }
    });
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n📱 Scan this QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
            console.log('⚠️  Make sure to scan with a fresh WhatsApp account or log out from other devices first!');
        }
        
        if (connection === 'open') {
            console.log('✅ Connected successfully!');
            console.log('📱 Connected number:', sock.user.id);
            
            // Read the fresh session credentials
            const creds = JSON.parse(fs.readFileSync(`${authDir}/creds.json`, 'utf8'));
            const base64Session = Buffer.from(JSON.stringify(creds)).toString('base64');
            
            console.log('\n🔑 Your new session ID (base64):');
            console.log('='.repeat(50));
            console.log(base64Session);
            console.log('='.repeat(50));
            console.log('\n📝 Copy this session ID and replace it in settings.js');
            console.log('✨ Then restart your bot!');
            
            process.exit(0);
        }
        
        if (connection === 'close') {
            console.log('❌ Connection failed:', lastDisconnect?.error);
            process.exit(1);
        }
    });
    
    sock.ev.on('creds.update', saveCreds);
}

generateNewSession().catch(console.error);