const util = require('util');

module.exports = {
    name: 'eval',
    description: 'Evaluate JavaScript code (Owner only)',
    aliases: ['js', 'evaluate', 'run'],
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
                text: `❌ Please provide JavaScript code to evaluate!\n\nExample: ${settings.prefix}eval console.log("Hello World")` 
            });
        }

        const code = args.join(' ');

        try {
            await sock.sendMessage(from, { 
                text: `🔄 Evaluating: \`${code}\`` 
            });

            // Create a safer evaluation context
            const result = eval(`(async () => {
                ${code}
            })()`);

            Promise.resolve(result).then(output => {
                const formattedOutput = util.inspect(output, { depth: 2, colors: false });
                const truncatedOutput = formattedOutput.length > 2000 ? 
                    formattedOutput.substring(0, 2000) + '\n...[truncated]' : formattedOutput;
                
                sock.sendMessage(from, { 
                    text: `✅ Result:\n\`\`\`js\n${truncatedOutput}\n\`\`\`` 
                });
            }).catch(error => {
                sock.sendMessage(from, { 
                    text: `❌ Evaluation error:\n\`\`\`\n${error.message}\n\`\`\`` 
                });
            });

        } catch (error) {
            console.error('Eval command error:', error);
            await sock.sendMessage(from, { 
                text: `❌ Syntax error:\n\`\`\`\n${error.message}\n\`\`\`` 
            });
        }
    }
};