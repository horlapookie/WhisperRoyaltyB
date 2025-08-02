const { exec } = require('child_process');

module.exports = {
    name: 'exec',
    description: 'Execute shell commands (Owner only)',
    aliases: ['terminal', 'cmd', 'shell'],
    ownerOnly: true,
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        // Check if user is owner
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: '❌ This command is only available to the bot owner!' 
            });
        }

        if (!args.length) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide a command to execute!\n\nExample: ${settings.prefix}exec ls -la` 
            });
        }

        const command = args.join(' ');

        // Security check - block dangerous commands
        const dangerousCommands = ['rm -rf', 'sudo', 'passwd', 'chmod 777', 'dd if=', 'mkfs', 'fdisk'];
        if (dangerousCommands.some(cmd => command.toLowerCase().includes(cmd))) {
            return await sock.sendMessage(from, { 
                text: '❌ Dangerous command blocked for security reasons!' 
            });
        }

        try {
            await sock.sendMessage(from, { 
                text: `🔄 Executing: \`${command}\`` 
            });

            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    return sock.sendMessage(from, { 
                        text: `❌ Error executing command:\n\`\`\`\n${error.message}\n\`\`\`` 
                    });
                }

                if (stderr) {
                    return sock.sendMessage(from, { 
                        text: `⚠️ Command completed with warnings:\n\`\`\`\n${stderr}\n\`\`\`` 
                    });
                }

                const output = stdout || 'Command executed successfully (no output)';
                const truncatedOutput = output.length > 2000 ? output.substring(0, 2000) + '\n...[truncated]' : output;
                
                sock.sendMessage(from, { 
                    text: `✅ Command output:\n\`\`\`\n${truncatedOutput}\n\`\`\`` 
                });
            });

        } catch (error) {
            console.error('Exec command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Failed to execute command. Please try again.' 
            });
        }
    }
};