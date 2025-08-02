// Load environment variables
require('dotenv').config();

// Helper function to parse owner numbers from env
function parseOwnerNumbers(envValue) {
    if (!envValue) return [];
    
    const numbers = envValue.split(',').map(num => num.trim());
    const formatted = [];
    
    numbers.forEach(num => {
        if (num) {
            // Add multiple formats for each number
            formatted.push(
                `${num}@s.whatsapp.net`,
                `${num}@lid`,
                num
            );
        }
    });
    
    return formatted;
}

// Helper function to convert string to boolean
function toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return false;
}

module.exports = {
    // Bot configuration with environment variable support
    botName: "your hïghñëss v1 beta",
    prefix: process.env.PREFIX || ".",
    mode: process.env.PUBLIC === 'private' ? 'private' : 'public',
    
    // Session ID from environment or fallback to hardcoded (for development)
    sessionId: process.env.SESSION_ID || "eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiWU4zMW52TmY4NkFrc0R4VDNwUm5wQTUzR1JPNGxXaXU2K2Z1NlFyejNVdz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiNDI5Si9ZR3dzZkZoRjN5c0d2WlAwdmNhTDg1VGJXNHFHbmJ1T3B5Z3poZz0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJBSHBVWWJZYUV1UWg4ZTJlcmN0enVUMU9hemMveno5UTExNk82bFo3TGtNPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJhalpXaDJYMC9yWmxPbVpvcWFVdG5jaFpRVjJjaTUzbkF6ZDRYWk4yUHdFPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImlLbmkzQ3RMQ1J1dWRLWkJxcVBndFE4WDNCeHJHV2F0UlJpUVBEMVI3M1E9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Im5MUkhFTGJpZEJ0bzhJU252aHBOOC9hZFhRS0JGLy9PbVVOWFZHSDlBbDg9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiTUZDdW1vV2t6SFlrYWErTHFzbjB0c3YweEdxTDFQa3FIWUR4aWswUzVHQT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiTm84dnFLUGlvS3pqRHFoeWtJODkrQ2JJU2lPY2htVVgwb0FtR2orRFV4TT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Iis0Znp3c3ZQV2UrMXZoR3hZK1pMSFl1Y1JVOEhyWXUxS2p3RllvUGRCQWpGOWtiM2ZLc3g2dzF5d1BRSElZMG4rN1lNYmpHNnB2eFlKMHdCTFpUWUFRPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MTQyLCJhZHZTZWNyZXRLZXkiOiIvbmNaaGhSOW1kblVrREpTOG5mL1lCTE13MUNSUVlhVnNrc3JJaUF4cjlBPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W3sia2V5Ijp7InJlbW90ZUppZCI6IjIzNDkxMjIyMjI2MjJAcy53aGF0c2FwcC5uZXQiLCJmcm9tTWUiOnRydWUsImlkIjoiNzJBMkE3MjhEQkQ5M0M3OUI1RjY0MUM3NTA3N0VEMjMifSwibWVzc2FnZVRpbWVzdGFtcCI6MTc1NDA1Nzc0OH0seyJrZXkiOnsicmVtb3RlSmlkIjoiMjM0OTEyMjIyMjYyMkBzLndoYXRzYXBwLm5ldCIsImZyb21NZSI6dHJ1ZSwiaWQiOiI4MkUyMTU4RjdGNTdERDAyRDlBNTVCREZGODMzQjE3MiJ9LCJtZXNzYWdlVGltZXN0YW1wIjoxNzU0MDU3NzU0fV0sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjoxLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiI3QUgzOE5ETCIsIm1lIjp7ImlkIjoiMjM0OTEyMjIyMjYyMjo1NUBzLndoYXRzYXBwLm5ldCIsImxpZCI6IjE4MjcyNTQ3NDU1Mzk4Njo1NUBsaWQiLCJuYW1lIjoiaG9ybGFwb29raWUifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0wvYjFZWUdFUCtYczhRR0dBRWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6IlB5ZHdpNDdRTndSdFlzUWVRYzZrdHRFbnp0d2I5ZTQ4emJBV2xya1NkbVk9IiwiYWNjb3VudFNpZ25hdHVyZSI6Iis4UmdOWWxLZ3FhYlhvQTFJcS9Oajk2cC9UdHlUbWdlWWxPcFFlZXhOaE9EcFgyWGEyT3BrTDJ2eWZFUUVzR0R2bm1xTmNLU2ZIOUhVcGVLYjI4a0NBPT0iLCJkZXZpY2VTaWduYXR1cmUiOiJkd0EzUFBOb3ZpOXNlZDFZcWhqb0RhOUFOdXpYR3gzSUE2b044dEg5SFhadllGRlVOWW1sSXF0bVE1VUxhY3BWMzVPMkhKRi93MlJSQjFZTTZYVTJDUT09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6IjIzNDkxMjIyMjI2MjI6NTVAcy53aGF0c2FwcC5uZXQiLCJkZXZpY2VJZCI6MH0sImlkZW50aWZpZXJLZXkiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJCVDhuY0l1TzBEY0ViV0xFSGtIT3BMYlJKODdjRy9YdVBNMndGcGE1RW5abSJ9fV0sInBsYXRmb3JtIjoiYW5kcm9pZCIsInJvdXRpbmdJbmZvIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0FJSUNBPT0ifSwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzU0MDU3NzQxLCJsYXN0UHJvcEhhc2giOiJubTNCYiIsIm15QXBwU3RhdGVLZXlJZCI6IkFBQUFBQ0QyIn0=",
    
    // Parse owner numbers from environment variable or use fallback
    ownerNumbers: parseOwnerNumbers(process.env.OWNER_NUMBER) || [
        "2349122222622@s.whatsapp.net",
        "2349122222622@lid", 
        "2349122222622",
        "182725474553986@s.whatsapp.net",
        "182725474553986@lid",
        "182725474553986"
    ],
    
    // API Keys with environment variable support
    apiKeys: {
        weather: process.env.WEATHER_API_KEY || "37bb420b5bf0cccbd8d0f49e52738e25",
        gemini: process.env.GEMINI_API_KEY || "AIzaSyArdMt3se0P2U5PCWjprpBZlzGZ2bHJklg",
        news: process.env.NEWS_API_KEY || "5b33111d7c55463ca9d58307182373d9",
        genius: process.env.GENIUS_API_KEY || "NrGLCWeRCNlny8qtUzXhxalvAwWWjcjWdwyCe3aUrXJZLlzs3lwSd5ddu_Iy3q5O",
        audd: process.env.AUDD_API_KEY || "583afeb81eebfed8c59a404242418635",
        openai: process.env.OPENAI_API_KEY || "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"
    },

    // New API keys for additional commands
    REMOVE_BG_KEY: process.env.REMOVE_BG_KEY || "PEr1EUE7qCtAVorxm2zc4KbJ",
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN || "",
    
    // Auto features with environment variable support
    autoFeatures: {
        autoReact: toBoolean(process.env.AUTO_REACT),
        autoStatusReact: toBoolean(process.env.AUTO_STATUS_REACT),
        antiDelete: toBoolean(process.env.ANTIDELETE),
        welcome: toBoolean(process.env.WELCOME),
        autoViewStatus: toBoolean(process.env.AUTO_VIEW_STATUS),
        chatbot: toBoolean(process.env.CHATBOT),
        autoReadMessages: toBoolean(process.env.AUTO_READ_MESSAGES)
    },
    
    // Sticker pack author
    stickerAuthor: process.env.AUTHOR || "horlapookie",
    
    // Voice command accessibility feature
    voiceCommands: true,
    voiceLanguage: 'en',
    voiceTraining: false
};
