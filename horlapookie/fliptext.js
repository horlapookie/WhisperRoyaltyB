
module.exports = {
    name: 'fliptext',
    description: 'Flip text upside down',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let textToFlip = args.join(' ').trim();
            
            // Check if replying to a message
            if (!textToFlip && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                textToFlip = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
            }
            
            if (!textToFlip) {
                await sock.sendMessage(from, {
                    text: `❌ Please provide text to flip!\n\n🔄 **Usage:**\n• ${settings.prefix}fliptext Hello World\n• Reply to a message: ${settings.prefix}fliptext\n\n💡 **Example:** "Hello" becomes "oƃǝll∀"`
                });
                return;
            }
            
            // Character mapping for flipped text
            const flipMap = {
                'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ',
                'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd',
                'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x',
                'y': 'ʎ', 'z': 'z',
                'A': '∀', 'B': 'ᗺ', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'ᖴ', 'G': 'פ', 'H': 'H',
                'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O', 'P': 'Ԁ',
                'Q': 'Q', 'R': 'ᴿ', 'S': 'S', 'T': '┴', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X',
                'Y': '⅄', 'Z': 'Z',
                '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ',
                '8': '8', '9': '6',
                '!': '¡', '?': '¿', '.': '˙', ',': "'", "'": '‛', '"': '„', '(': ')', ')': '(',
                '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋',
                '_': '‾', ';': '؛', ' ': ' '
            };

            // Flip the text
            let flippedText = '';
            for (let i = textToFlip.length - 1; i >= 0; i--) {
                const char = textToFlip[i];
                flippedText += flipMap[char] || char;
            }

            const response = `🔄 *Text Flip*

📝 **Original:**
${textToFlip}

🔃 **Flipped:**
${flippedText}

💡 **Tip:** Copy the flipped text to use it anywhere!`;

            await sock.sendMessage(from, { text: response });

        } catch (error) {
            console.error('FlipText command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error flipping text. Please try again.'
            });
        }
    }
};
