const sharp = require('sharp');
const fs = require('fs');

async function convertSvgToPng(svgPath, outputPath) {
    try {
        const svgBuffer = fs.readFileSync(svgPath);
        
        await sharp(svgBuffer)
            .png()
            .resize(512, 512)
            .toFile(outputPath);
            
        console.log(`✅ Converted ${svgPath} to ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to convert ${svgPath}:`, error);
        return false;
    }
}

async function convertAllProfiles() {
    const conversions = [
        { svg: './profile1.svg', png: './profile1.png' },
        { svg: './profile2.svg', png: './profile2.png' }
    ];
    
    for (const { svg, png } of conversions) {
        if (fs.existsSync(svg)) {
            await convertSvgToPng(svg, png);
        }
    }
}

module.exports = {
    convertSvgToPng,
    convertAllProfiles
};