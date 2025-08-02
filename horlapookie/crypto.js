const { getBuffer } = require('../utils/helpers');

module.exports = {
    name: 'crypto',
    description: 'Get cryptocurrency prices and information',
    aliases: ['coin', 'price', 'btc', 'eth'],
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;
        
        try {
            let symbol = args[0] || 'bitcoin';
            
            // Common crypto mappings
            const cryptoMap = {
                'btc': 'bitcoin',
                'eth': 'ethereum',
                'ada': 'cardano',
                'dot': 'polkadot',
                'link': 'chainlink',
                'ltc': 'litecoin',
                'xrp': 'ripple',
                'bnb': 'binancecoin',
                'doge': 'dogecoin',
                'matic': 'polygon'
            };
            
            symbol = cryptoMap[symbol.toLowerCase()] || symbol.toLowerCase();
            
            await sock.sendMessage(from, {
                text: `₿ Getting ${symbol} price information...`
            });

            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd,btc&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
            const axios = require('axios');
            const response = await axios.get(url);
            
            if (response.status !== 200) {
                throw new Error(`CoinGecko API returned ${response.status}`);
            }
            
            const data = response.data;
            
            if (!data[symbol]) {
                await sock.sendMessage(from, {
                    text: `❌ Cryptocurrency "${args[0] || symbol}" not found.\n\n💡 **Supported coins:**\nBTC, ETH, ADA, DOT, LINK, LTC, XRP, BNB, DOGE, MATIC\n\n📝 **Usage:**\n• ${settings.prefix}crypto btc\n• ${settings.prefix}price ethereum\n• ${settings.prefix}coin dogecoin`
                });
                return;
            }
            
            const coin = data[symbol];
            const priceChange = coin.usd_24h_change || 0;
            const changeEmoji = priceChange >= 0 ? '📈' : '📉';
            const changeColor = priceChange >= 0 ? '🟢' : '🔴';
            
            const cryptoMessage = `₿ **CRYPTO PRICE**

💰 **${symbol.toUpperCase()}**
💵 **USD:** $${coin.usd.toLocaleString()}
₿ **BTC:** ${coin.btc} BTC

📊 **24h Change:** ${changeColor} ${priceChange.toFixed(2)}%
📈 **Market Cap:** $${(coin.usd_market_cap || 0).toLocaleString()}
💧 **24h Volume:** $${(coin.usd_24h_vol || 0).toLocaleString()}

${changeEmoji} **Trend:** ${priceChange >= 0 ? 'Bullish' : 'Bearish'}

💡 **Popular coins:** BTC, ETH, ADA, DOT, LINK, LTC, XRP, BNB, DOGE, MATIC
📝 **Usage:** ${settings.prefix}crypto [symbol]

*Data from CoinGecko*`;

            await sock.sendMessage(from, {
                text: cryptoMessage
            });
            
        } catch (error) {
            console.error('Crypto command error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to fetch cryptocurrency data. Please try again later or check the coin symbol.'
            });
        }
    }
};