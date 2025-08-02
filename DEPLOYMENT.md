# Deployment Guide

This WhatsApp bot can be deployed on various platforms. Here's how to deploy it:

## Heroku Deployment

1. **Fork/Clone** this repository
2. **Create a Heroku app**:
   - Go to [Heroku Dashboard](https://dashboard.heroku.com)
   - Click "New" → "Create new app"
   - Choose a unique app name

3. **Deploy using app.json**:
   - Click "Deploy" tab
   - Connect to GitHub and select your repository
   - In "Automatic deploys" section, click "Deploy Branch"
   - Heroku will automatically use the `app.json` configuration

4. **Configure Environment Variables**:
   - Go to "Settings" tab → "Config Vars"
   - Add these required variables:
     - `SESSION_ID`: Your WhatsApp session (get from pairing)
     - `OWNER_NUMBER`: Your phone number (without +)
     - `PREFIX`: Command prefix (default: .)
     - `AUTHOR`: Your name for sticker packs

5. **Optional API Keys** (for full functionality):
   - `GEMINI_API_KEY`: For AI commands
   - `WEATHER_API_KEY`: For weather commands  
   - `NEWS_API_KEY`: For news commands

## Vercel Deployment

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import from GitHub

2. **Configure Build**:
   - Framework Preset: Other
   - Build Command: `npm install`
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Environment Variables**:
   - Add the same variables as Heroku in the Environment Variables section

## Railway Deployment

1. **Connect Repository**:
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub

2. **Environment Variables**:
   - Add variables in the "Variables" tab
   - Same variables as Heroku

## Getting WhatsApp Session ID

1. **Run locally first**:
   ```bash
   git clone <your-repo>
   cd your-bot
   npm install
   node index.js
   ```

2. **Scan QR Code** with WhatsApp
3. **Copy Session Data** from console/logs
4. **Base64 encode** the session data
5. **Use encoded string** as `SESSION_ID`

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SESSION_ID` | Yes | WhatsApp session (base64) | `eyJub2lzZUt...` |
| `OWNER_NUMBER` | Yes | Bot owner phone number | `2349122222622` |
| `PREFIX` | No | Command prefix | `.` |
| `PUBLIC` | No | Bot mode (public/private) | `public` |
| `AUTHOR` | No | Sticker pack author | `horlapookie` |
| `AUTO_REACT` | No | Auto-react to messages | `false` |
| `AUTO_STATUS_REACT` | No | Auto-react to status | `false` |
| `WELCOME` | No | Welcome new members | `true` |
| `GEMINI_API_KEY` | No | Google AI API key | `AIza...` |
| `WEATHER_API_KEY` | No | OpenWeather API key | `abc123...` |
| `NEWS_API_KEY` | No | NewsAPI key | `def456...` |

## Troubleshooting

- **Bot not responding**: Check if `SESSION_ID` is valid
- **Commands not working**: Verify `PREFIX` setting
- **Permission errors**: Check `OWNER_NUMBER` format
- **API commands failing**: Add respective API keys
- **Deployment fails**: Check all required variables are set

## Features Available After Deployment

✅ **29 Commands** ready to use
✅ **Voice Commands** with AI processing
✅ **Media Downloads** (YouTube, etc.)
✅ **Group Management** tools
✅ **AI Chat** with Gemini
✅ **Sticker Creation** with custom author
✅ **Weather & News** updates
✅ **QR Code** generation/scanning
✅ **Auto-features** configurable

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify all environment variables
3. Ensure WhatsApp session is valid
4. Check API key quotas/limits