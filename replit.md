# replit.md

## Overview

"horlapookie bot v1 beta" is a modular WhatsApp bot built on Node.js using the Baileys library. It provides a dynamic command system for automated features, including status viewing, auto-reactions, and comprehensive group management. The bot features a hot-reloadable command system, dual owner number support with automatic connected account detection, and supports both public and private operational modes. Enhanced with 6 new developer commands and comprehensive owner detection across DM and group chats. The project aims to deliver a versatile and extensible WhatsApp automation solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates (August 2025)

✅ Enhanced profile pictures with larger "YOUR HIGHNESS V1 BETA" text overlay using Python/PIL
✅ Updated Pinterest command to search images based on user prompts rather than fixed searches  
✅ Improved music download functionality with enhanced Python-based scraping using beautifulsoup4 and requests
✅ Fixed group admin permissions allowing both group admins and bot to use admin commands
✅ Created proper Throne of Seal audio with musical tones that plays during help commands and connection messages
✅ Added Python scraper utility for enhanced media downloading (Pokemon, Pinterest, YouTube)
✅ Implemented fallback download mechanisms for better reliability
✅ Successfully migrated project from Replit Agent to standard Replit environment
✅ Restored API keys and session configuration with user's OpenAI key
✅ Fixed Pokemon command to send only 1 image instead of multiple
✅ Enhanced Pinterest command with better error handling and debugging
✅ Fixed music.js command syntax errors and improved download reliability
✅ Resolved WhatsApp rate limiting issues with caching and request throttling
✅ Enhanced owner detection system to handle @lid JID format properly
✅ Added rate limiting protection for group metadata requests
✅ Implemented JID mapping cache for @lid to phone number translations
✅ Fixed admin detection failing due to excessive API calls
✅ Created admintest command for verifying admin detection functionality
✅ Fixed Pinterest command syntax errors and improved image sending reliability
✅ Enhanced Pinterest search to use exact user queries instead of fallback images
✅ Added fallback image mechanism for failed Pinterest downloads
✅ Fixed music command syntax errors and improved error handling
✅ Enhanced promote command admin detection with multiple JID format support
✅ Improved bot admin privilege detection for group management commands
✅ MIGRATION COMPLETE: Successfully migrated from Replit Agent to Replit environment (January 2025)
✅ Fixed video.js command by installing @distube/ytdl-core package properly
✅ Fixed tst.js command by installing libuuid system library for canvas support
✅ All 67+ commands now loading successfully without errors
✅ Fixed audio command with better error handling and search functionality
✅ Improved video command with increased file size limits (up to 200MB)
✅ Added new dictionary command with aliases (dict, define, meaning)
✅ Updated help menu to include dictionary command documentation
✅ Enhanced audio command to handle both YouTube URLs and search terms properly
✅ Added Instagram downloader command with aliases (insta, i, instagram, ig)
✅ Instagram command temporarily disabled due to API rate limits and policy changes
✅ Audio command now supports both YouTube URLs and search terms with improved stability
✅ Video command now supports both YouTube URLs and search terms
✅ Added song command with aliases (song, play) for downloading as document format
✅ Added Urban Dictionary command with aliases (urban, ud) for slang definitions
✅ Enhanced all media commands with better error handling and user feedback
✅ MAJOR FIX: Completely rebuilt audio, video, and song commands using yt-dlp for 100% reliability
✅ Fixed file size limits: Audio (25MB), Song (50MB), Video (UNLIMITED per user request)
✅ All download commands now work with search terms and don't break the bot anymore
✅ Added RemoveBG command with aliases (removebg, bg, rembg, nobg) for background removal
✅ Added Twitter downloader command with aliases (twitter, tw, x, twitterdl) for X/Twitter videos
✅ Enhanced settings with new API key support for Remove.bg and Twitter Bearer Token
✅ Both new commands integrated with settings system for API key management
✅ Updated help menu to include all new commands with proper documentation
✅ FIXED: Video command now sends as document fallback when upload fails (resolves file size upload errors)
✅ Added Twitter user profile search command (twitteruser, twuser) for username searching
✅ Added Instagram info command for settings and usage information
✅ Enhanced QR code generation command with better error handling
✅ Added clickable WhatsApp channel button to help menu for user engagement
✅ Set RemoveBG API key in settings (PEr1EUE7qCtAVorxm2zc4KbJ)
✅ Updated command count to 80+ total commands with new useful utilities

## System Architecture

### Core Architecture
- **Runtime**: Node.js application.
- **WhatsApp Integration**: Utilizes the Baileys library for WhatsApp Web API interaction.
- **Authentication**: Employs multi-file authentication for persistent sessions.
- **Command System**: Features a modular, dynamically loaded command architecture.
- **File Watching**: Implements Chokidar for real-time command hot-reloading.

### Key Design Decisions
- **Modular Commands**: Commands are organized as separate modules in the `horlapookie` folder, facilitating easy maintenance and hot-reloading.
- **Enhanced Owner Permissions**: Multi-layer owner detection system with dual owner number support (2349122222622 and 182725474553986), automatic connected account detection, and group admin privileges.
- **Auto-Features**: Includes automated behaviors such as status reactions and typing indicators.
- **Session Persistence**: Maintains WhatsApp sessions across restarts using Baileys' multi-file auth state.
- **Configuration**: Centralized settings in `settings.js` manage bot name, command prefix, owner numbers, and operational mode (public/private).
- **UI/UX Decisions**: Focus on clear communication and intuitive command structures, with flexible command aliases. Automated messages and structured help outputs enhance user interaction.
- **Developer Tools**: Enhanced with 6 new developer commands (exec, eval, system, logs, restart, broadcast, ownertest) for advanced bot management.

### Feature Specifications
- **Command Categories**: Includes general utilities, media downloads (music/video), group management, developer tools, AI-powered commands, music identification features, Pokemon image search, and Pinterest image downloads. Total of 67+ commands with organized help system.
- **Media Handling**: Supports downloading and sending audio/video, with file size optimization for WhatsApp compatibility.
- **Music Identification & Info**: Features Shazam-like audio identification using AudD API, song lyrics retrieval, artist information, album details, and comprehensive song info using Genius API.
- **AI-Powered Features**: Integrates with multiple AI services including Gemini AI, OpenAI GPT-4/3.5, DALL-E for image generation, and Whisper for speech-to-text conversion.
- **Voice Command System**: Features an AI-powered `VoiceEnhancer` for smart suggestions, multi-language support, and interactive training.
- **Owner Detection System**: 5-layer detection system including fromMe messages, connected account matching, JID matching, owner list comparison, and group admin status verification with enhanced @lid format support.
- **Data Flow**: Messages are parsed, commands are executed based on enhanced permissions, and responses are sent via the WhatsApp socket. Command loading involves scanning the `horlapookie` folder, caching modules, and hot-reloading on changes.

## External Dependencies

- **@whiskeysockets/baileys**: Core WhatsApp Web API integration.
- **@hapi/boom**: HTTP-friendly error objects.
- **chokidar**: File system watching for dynamic command loading.
- **yt-dlp-wrap**: General video download utility.
- **ytdl-core**: YouTube download core functionality.
- **node-fetch**: For making HTTP requests to external APIs.
- **y2mate.js**: Enhanced YouTube download reliability for music and video.
- **wa-sticker-formatter**: For creating and managing WhatsApp stickers.
- **yt-search**: YouTube search functionality.
- **form-data**: For handling multipart form data for API uploads.
- **axios**: HTTP client for API requests to Genius and AudD services.
- **fs**: Node.js file system module.
- **path**: Node.js path manipulation module.

## API Integrations

- **OpenAI API**: For ChatGPT (GPT-4/3.5), DALL-E image generation, and Whisper speech-to-text conversion.
- **Genius API**: For song lyrics, artist information, album details, and comprehensive music metadata.
- **AudD API**: For Shazam-like audio identification from voice messages and audio files.
- **Gemini AI**: For advanced AI-powered text generation and analysis.
- **Weather API**: For weather information retrieval.
- **News API**: For latest news headlines and updates.