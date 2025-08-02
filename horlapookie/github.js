const axios = require('axios');

module.exports = {
    name: 'github',
    aliases: ['gh', 'repo', 'repository'],
    description: 'Get GitHub repository information',
    usage: 'github <username/repository>',
    category: 'utility',
    cooldown: 5,

    async execute(sock, msg, args, context) {
        const { from } = context;

        if (!args || args.length === 0) {
            return await sock.sendMessage(from, {
                text: '❌ Please provide a GitHub repository!\n\n📝 **Usage:**\n• .github facebook/react\n• .gh microsoft/vscode\n• .repo nodejs/node'
            });
        }

        const repo = args.join(' ');

        // Validate repository format
        if (!repo.includes('/') || repo.split('/').length !== 2) {
            return await sock.sendMessage(from, {
                text: '❌ Invalid repository format!\n\n📝 **Correct format:** username/repository\n\n**Example:** .github facebook/react'
            });
        }

        const searchingMsg = await sock.sendMessage(from, {
            text: '🔍 Fetching repository information... Please wait!'
        });

        try {
            const response = await axios.get(`https://api.github.com/repos/${repo}`, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'WhatsApp-Bot'
                }
            });

            const repoData = response.data;

            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            // Format repository information
            const repoInfo = `🐙 **GitHub Repository**\n\n` +
                `📦 **Name:** ${repoData.name}\n` +
                `👤 **Owner:** ${repoData.owner.login}\n` +
                `📝 **Description:** ${repoData.description || 'No description available'}\n\n` +
                `🌟 **Stars:** ${repoData.stargazers_count.toLocaleString()}\n` +
                `🍴 **Forks:** ${repoData.forks_count.toLocaleString()}\n` +
                `👀 **Watchers:** ${repoData.watchers_count.toLocaleString()}\n` +
                `🐛 **Open Issues:** ${repoData.open_issues_count}\n\n` +
                `💻 **Language:** ${repoData.language || 'Not specified'}\n` +
                `📅 **Created:** ${new Date(repoData.created_at).toLocaleDateString()}\n` +
                `🔄 **Updated:** ${new Date(repoData.updated_at).toLocaleDateString()}\n` +
                `📏 **Size:** ${(repoData.size / 1024).toFixed(2)} MB\n\n` +
                `🔗 **URL:** ${repoData.html_url}\n` +
                `📋 **Clone:** \`git clone ${repoData.clone_url}\``;

            // Send repository information
            await sock.sendMessage(from, {
                text: repoInfo,
                contextInfo: {
                    externalAdReply: {
                        title: `${repoData.owner.login}/${repoData.name}`,
                        body: repoData.description || 'GitHub Repository',
                        thumbnailUrl: repoData.owner.avatar_url,
                        sourceUrl: repoData.html_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });

        } catch (error) {
            console.error('GitHub search error:', error);
            console.error('Error details:', error.response?.data || error.message);

            // Delete searching message
            try {
                await sock.sendMessage(from, { delete: searchingMsg.key });
            } catch {}

            let errorMessage = '❌ Failed to fetch GitHub repository. ';
            if (error.response?.status === 403) {
                errorMessage += 'API rate limit exceeded. Please try again later.';
            } else if (error.response?.status === 404) {
                errorMessage += 'Repository not found. Please check the username/repository format.';
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
                errorMessage += 'Network connection error. Please try again.';
            } else if (error.message.includes('timeout')) {
                errorMessage += 'Request timed out. Please try again.';
            } else {
                errorMessage += 'Please try again later or check if the repository exists.';
            }

            await sock.sendMessage(from, { text: errorMessage });
        }
    }
};