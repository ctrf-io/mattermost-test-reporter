import https from 'https';

export const sendMattermostMessage = (message: object): Promise<void> => {
    const mattermostWebhookUrl = process.env.MATTERMOST_WEBHOOK_URL;

    if (!mattermostWebhookUrl) {
        return Promise.reject(new Error('MATTERMOST_WEBHOOK_URL is not defined in the environment variables'));
    }

    return new Promise((resolve, reject) => {
        const url = new URL(mattermostWebhookUrl);
        const data = JSON.stringify(message);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        };

        const req = https.request(options, (res) => {
            let response = '';
            res.on('data', (chunk) => {
                response += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`Failed to send message, status code: ${res.statusCode}, response: ${response}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
};
