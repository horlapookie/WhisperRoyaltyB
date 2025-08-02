
module.exports = {
    name: 'news',
    aliases: ['headlines', 'breaking'],
    description: 'Get latest news headlines',
    async execute(sock, message, args, { isOwner, settings }) {
        const from = message.key.remoteJid;

        try {
            let category = 'general';
            let country = 'us';
            
            if (args.length > 0) {
                const firstArg = args[0].toLowerCase();
                const validCategories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
                const validCountries = ['us', 'uk', 'in', 'ca', 'au', 'ng'];
                
                if (validCategories.includes(firstArg)) {
                    category = firstArg;
                    if (args[1] && validCountries.includes(args[1].toLowerCase())) {
                        country = args[1].toLowerCase();
                    }
                } else if (validCountries.includes(firstArg)) {
                    country = firstArg;
                    if (args[1] && validCategories.includes(args[1].toLowerCase())) {
                        category = args[1].toLowerCase();
                    }
                }
            }
            
            await sock.sendMessage(from, {
                text: `📰 Getting latest ${category} news... Please wait!`
            });

            const { getBuffer } = require('../utils/helpers');
            const apiKey = settings.apiKeys.news;
            const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=5&apiKey=${apiKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`News API returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.articles || data.articles.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ No news articles found for ${category} category in ${country.toUpperCase()}.`
                });
                return;
            }

            let newsMessage = `📰 **LATEST NEWS** - ${category.toUpperCase()}\n🌍 **Country:** ${country.toUpperCase()}\n📅 **Date:** ${new Date().toLocaleDateString()}\n\n`;
            
            data.articles.slice(0, 5).forEach((article, index) => {
                const publishedDate = new Date(article.publishedAt).toLocaleDateString();
                newsMessage += `**${index + 1}.** ${article.title}\n`;
                newsMessage += `📅 ${publishedDate} | 📰 ${article.source.name}\n`;
                if (article.description) {
                    newsMessage += `📝 ${article.description.substring(0, 100)}...\n`;
                }
                if (article.url) {
                    newsMessage += `🔗 ${article.url}\n`;
                }
                newsMessage += `\n`;
            });

            newsMessage += `💡 *News provided by NewsAPI*\n\n📝 **Usage:** ${settings.prefix}news [category] [country]\n🏷️ **Categories:** business, entertainment, health, science, sports, technology\n🌍 **Countries:** us, uk, in, ca, au, ng`;

            await sock.sendMessage(from, {
                text: newsMessage
            });

        } catch (error) {
            console.error('News API error:', error);
            await sock.sendMessage(from, {
                text: '❌ Failed to get news. Please try again later.'
            });
        }
    }
};
