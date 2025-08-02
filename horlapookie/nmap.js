
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
    name: 'nmap',
    description: 'Network scanning and discovery using NMAP',
    aliases: ['scan', 'portscan', 'network'],
    ownerOnly: true, // Security tool - owner only
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args.length) {
            return await sock.sendMessage(from, { 
                text: `🔍 *NMAP Network Scanner*\n\n**Usage:**\n• ${settings.prefix}nmap <target>\n• ${settings.prefix}nmap -p 80,443 <target>\n• ${settings.prefix}nmap -sV <target>\n\n**Examples:**\n• ${settings.prefix}nmap 192.168.1.1\n• ${settings.prefix}nmap -p 22,80,443 example.com\n• ${settings.prefix}nmap -sS 192.168.1.0/24\n\n⚠️ **Warning:** Use only on networks you own or have permission to scan!` 
            });
        }

        const target = args.join(' ');

        // Basic validation to prevent dangerous commands
        if (target.includes(';') || target.includes('&&') || target.includes('|') || target.includes('`')) {
            return await sock.sendMessage(from, { 
                text: '❌ Invalid characters detected. Please use only valid NMAP syntax.' 
            });
        }

        try {
            await sock.sendMessage(from, { 
                text: `🔍 Starting NMAP scan on: ${target}\n⏳ This may take a few moments...` 
            });

            // Execute NMAP with timeout
            const { stdout, stderr } = await execPromise(`timeout 60 nmap ${target}`, {
                timeout: 65000 // 65 seconds timeout
            });

            let result = stdout || stderr || 'No output';
            
            // Limit output length for WhatsApp
            if (result.length > 4000) {
                result = result.substring(0, 4000) + '\n\n... [Output truncated]';
            }

            await sock.sendMessage(from, {
                text: `🔍 *NMAP Scan Results*\n\n**Target:** ${target}\n\n\`\`\`\n${result}\n\`\`\`\n\n⚠️ **Disclaimer:** Use responsibly and only on authorized targets.`
            });

        } catch (error) {
            console.error('NMAP error:', error);
            
            let errorMessage = '❌ NMAP scan failed. ';
            if (error.message.includes('timeout')) {
                errorMessage += 'Scan timed out (60s limit).';
            } else if (error.message.includes('not found')) {
                errorMessage += 'NMAP is not installed on this system.';
            } else {
                errorMessage += 'Please check the target and try again.';
            }
            
            await sock.sendMessage(from, { text: errorMessage });
        }
    }
};
