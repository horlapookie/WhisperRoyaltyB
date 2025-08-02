
module.exports = {
    name: 'text2pdf',
    description: 'Convert text to PDF document',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let textContent = args.join(' ').trim();
            
            // Check if replying to a message
            if (!textContent && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
                textContent = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
            }
            
            if (!textContent) {
                await sock.sendMessage(from, {
                    text: `❌ Please provide text to convert!\n\n📄 **Usage:**\n• ${settings.prefix}text2pdf Your text here\n• Reply to a message: ${settings.prefix}text2pdf\n\n💡 **Tip:** This will create a PDF document from your text`
                });
                return;
            }
            
            await sock.sendMessage(from, {
                text: '📄 Converting text to PDF... Please wait!'
            });

            try {
                const fs = require('fs');
                const path = require('path');
                const { randomBytes } = require('crypto');

                // Create temp directory if it doesn't exist
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const timestamp = randomBytes(3).toString('hex');
                const pdfPath = path.join(tempDir, `text_${timestamp}.pdf`);

                // Simple PDF creation using basic PDF structure
                const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length ${textContent.length + 100}
>>
stream
BT
/F1 12 Tf
50 750 Td
(${textContent.replace(/[()\\]/g, '\\$&')}) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000264 00000 n 
0000000337 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${400 + textContent.length}
%%EOF`;

                // Write PDF content
                fs.writeFileSync(pdfPath, pdfContent);

                // Send the PDF
                const pdfBuffer = fs.readFileSync(pdfPath);
                
                await sock.sendMessage(from, {
                    document: pdfBuffer,
                    mimetype: 'application/pdf',
                    fileName: `text_document_${timestamp}.pdf`,
                    caption: `📄 *Text to PDF Conversion*\n\n✅ Successfully converted text to PDF!\n📝 **Content:** ${textContent.substring(0, 50)}${textContent.length > 50 ? '...' : ''}\n💾 **File:** text_document_${timestamp}.pdf`
                });

                // Clean up temp file
                setTimeout(() => {
                    try {
                        if (fs.existsSync(pdfPath)) {
                            fs.unlinkSync(pdfPath);
                        }
                    } catch (cleanupError) {
                        console.log('Cleanup error:', cleanupError);
                    }
                }, 5000);

            } catch (pdfError) {
                console.error('PDF creation error:', pdfError);
                await sock.sendMessage(from, {
                    text: '❌ Failed to create PDF. Please try again with shorter text or contact support.'
                });
            }

        } catch (error) {
            console.error('Text2PDF command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Error converting text to PDF. Please try again.'
            });
        }
    }
};
