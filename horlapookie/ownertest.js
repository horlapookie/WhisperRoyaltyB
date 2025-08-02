module.exports = {
    name: 'ownertest',
    description: 'Test owner detection (Owner only)',
    aliases: ['ot', 'test'],
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        // Enhanced owner detection specifically for this test
        const connectedId = sock.user?.id?.split(':')[0] || '';
        const isGroup = from.includes('@g.us');
        let senderJid = from;
        
        if (isGroup && message.key.participant) {
            senderJid = message.key.participant;
        }
        
        const senderPhone = senderJid.split('@')[0].split(':')[0].replace(/^\D+/, '');
        
        // Multiple checks
        const check1 = senderPhone === connectedId;
        const check2 = senderJid === `${connectedId}@s.whatsapp.net`;
        const check3 = message.key.fromMe;
        const check4 = settings.ownerNumbers.includes(senderJid);
        const check5 = settings.ownerNumbers.includes(senderPhone);
        const check6 = settings.ownerNumbers.some(num => {
            const ownerPhone = num.split('@')[0].split(':')[0].replace(/^\D+/, '');
            return ownerPhone === senderPhone;
        });
        
        const testResult = `🧪 **OWNER TEST RESULTS**

**Your Info:**
• Connected ID: ${connectedId}
• Sender JID: ${senderJid}
• Sender Phone: ${senderPhone}
• From Me: ${message.key.fromMe}
• Is Owner (passed): ${isOwner}

**Owner Detection Checks:**
• Check 1 (Phone = Connected): ${check1}
• Check 2 (JID Match): ${check2}
• Check 3 (From Me): ${check3}
• Check 4 (JID in Owner List): ${check4}
• Check 5 (Phone in Owner List): ${check5}
• Check 6 (Smart Phone Match): ${check6}

**Owner Numbers:** ${JSON.stringify(settings.ownerNumbers)}
**Group:** ${isGroup ? 'Yes' : 'No'}

**Final Result:** ${check1 || check2 || check3 || check4 || check5 || check6 ? '✅ OWNER' : '❌ NOT OWNER'}`;

        await sock.sendMessage(from, { text: testResult });
    }
};