module.exports = {
    name: 'calculator',
    description: 'Calculate mathematical expressions',
    aliases: ['calc', 'math', 'compute'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            let expression = '';
            
            // Check if replying to a message
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quotedMsg.conversation) {
                    expression = quotedMsg.conversation.trim();
                } else if (quotedMsg.extendedTextMessage?.text) {
                    expression = quotedMsg.extendedTextMessage.text.trim();
                }
            }
            // If no quoted text, use command arguments
            else if (args.length > 0) {
                expression = args.join(' ').trim();
            }
            
            if (!expression) {
                await sock.sendMessage(from, {
                    text: `🧮 **CALCULATOR**\n\n📝 **Usage:**\n• ${settings.prefix}calc <expression>\n• ${settings.prefix}math 2 + 2\n• Reply to expression: ${settings.prefix}calculator\n\n💡 **Examples:**\n• ${settings.prefix}calc 15 * 8 + 10\n• ${settings.prefix}calc sqrt(16) + 2^3\n• ${settings.prefix}calc sin(30) * cos(60)\n\n🔢 **Supported:**\n• Basic: +, -, *, /, %, ^\n• Functions: sqrt, sin, cos, tan, log\n• Constants: pi, e`
                });
                return;
            }
            
            // Clean and prepare expression
            expression = expression
                .replace(/[×]/g, '*')
                .replace(/[÷]/g, '/')
                .replace(/\^/g, '**')
                .replace(/pi/gi, 'Math.PI')
                .replace(/e(?![a-z])/gi, 'Math.E')
                .replace(/sqrt\(/gi, 'Math.sqrt(')
                .replace(/sin\(/gi, 'Math.sin(')
                .replace(/cos\(/gi, 'Math.cos(')
                .replace(/tan\(/gi, 'Math.tan(')
                .replace(/log\(/gi, 'Math.log(')
                .replace(/ln\(/gi, 'Math.log(')
                .replace(/abs\(/gi, 'Math.abs(')
                .replace(/ceil\(/gi, 'Math.ceil(')
                .replace(/floor\(/gi, 'Math.floor(')
                .replace(/round\(/gi, 'Math.round(');
            
            // Security check - only allow safe mathematical operations
            const dangerousPatterns = [
                /require/gi, /import/gi, /eval/gi, /function/gi, /=>/gi,
                /process/gi, /global/gi, /console/gi, /setTimeout/gi,
                /setInterval/gi, /fs/gi, /path/gi, /os/gi, /child_process/gi
            ];
            
            const isDangerous = dangerousPatterns.some(pattern => pattern.test(expression));
            
            if (isDangerous) {
                await sock.sendMessage(from, {
                    text: '❌ Invalid expression. Only mathematical operations are allowed.'
                });
                return;
            }
            
            // Only allow numbers, operators, Math functions, and parentheses
            const validPattern = /^[0-9+\-*/.()\ \t\nMath\.PIESQRT_2LN2LN10LOG2ELOGPE10sqrt\(\)sincostaablsnceilflooroundpi]{1,200}$/i;
            
            if (!validPattern.test(expression)) {
                await sock.sendMessage(from, {
                    text: '❌ Invalid characters in expression. Please use only numbers and mathematical operators.'
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '🧮 Calculating... Please wait!'
            });

            let result;
            try {
                // Use Function constructor for safer evaluation than eval
                result = new Function(`"use strict"; return (${expression})`)();
            } catch (evalError) {
                throw new Error('Invalid mathematical expression');
            }
            
            // Check if result is valid
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Result is not a valid number');
            }
            
            const calcMessage = `🧮 **CALCULATION RESULT**

📝 **Expression:**
${args.join(' ')}

🔢 **Result:**
${result}

📊 **Details:**
• Type: ${Number.isInteger(result) ? 'Integer' : 'Decimal'}
• Scientific: ${result.toExponential(6)}
• Formatted: ${result.toLocaleString()}

💡 **Tip:** You can use functions like sqrt(), sin(), cos(), pi, etc.`;

            await sock.sendMessage(from, {
                text: calcMessage
            });
            
        } catch (error) {
            console.error('Calculator command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to calculate. Please check your mathematical expression and try again.\n\n💡 **Examples:**\n• 2 + 2\n• sqrt(16) * 5\n• sin(30) + cos(60)\n• pi * 2^3'
            });
        }
    }
};