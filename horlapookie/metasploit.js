
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
    name: 'metasploit',
    description: 'Metasploit Framework interface',
    aliases: ['msf', 'exploit', 'metasploit-console'],
    ownerOnly: true, // Security tool - owner only
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        if (!args.length) {
            return await sock.sendMessage(from, { 
                text: `🎯 *Metasploit Framework*\n\n**Usage:**\n• ${settings.prefix}metasploit search <term>\n• ${settings.prefix}metasploit info <exploit>\n• ${settings.prefix}metasploit db_status\n\n**Examples:**\n• ${settings.prefix}metasploit search apache\n• ${settings.prefix}metasploit info exploit/windows/smb/ms17_010_eternalblue\n• ${settings.prefix}metasploit db_rebuild_cache\n\n⚠️ **Warning:** Educational purposes only! Use only on authorized targets!` 
            });
        }

        const command = args.join(' ');

        // Whitelist safe commands only
        const allowedCommands = [
            'search', 'info', 'db_status', 'db_rebuild_cache', 
            'version', 'help', 'show exploits', 'show payloads', 
            'show auxiliary', 'show encoders', 'show options'
        ];

        const isAllowed = allowedCommands.some(cmd => command.startsWith(cmd));
        
        if (!isAllowed) {
            return await sock.sendMessage(from, { 
                text: `❌ Command not allowed. Only safe informational commands are permitted:\n\n${allowedCommands.map(cmd => `• ${cmd}`).join('\n')}\n\n🛡️ **Security:** Exploit execution is disabled for safety.` 
            });
        }

        try {
            await sock.sendMessage(from, { 
                text: `🎯 Executing Metasploit command: ${command}\n⏳ Please wait...` 
            });

            // Execute msfconsole with the command
            const { stdout, stderr } = await execPromise(`echo "${command}" | timeout 30 msfconsole -q`, {
                timeout: 35000 // 35 seconds timeout
            });

            let result = stdout || stderr || 'No output';
            
            // Clean up the output
            result = result.replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI colors
            result = result.replace(/msf6[^>]*>\s*/g, ''); // Remove prompts
            
            // Limit output length
            if (result.length > 4000) {
                result = result.substring(0, 4000) + '\n\n... [Output truncated]';
            }

            await sock.sendMessage(from, {
                text: `🎯 *Metasploit Results*\n\n**Command:** ${command}\n\n\`\`\`\n${result}\n\`\`\`\n\n⚠️ **Disclaimer:** Educational purposes only. Use responsibly!`
            });

        } catch (error) {
            console.error('Metasploit error:', error);
            
            let errorMessage = '❌ Metasploit command failed. ';
            if (error.message.includes('timeout')) {
                errorMessage += 'Command timed out (30s limit).';
            } else if (error.message.includes('not found')) {
                errorMessage += 'Metasploit is not installed on this system.';
            } else {
                errorMessage += 'Please check the command syntax.';
            }
            
            await sock.sendMessage(from, { text: errorMessage });
        }
    }
};
