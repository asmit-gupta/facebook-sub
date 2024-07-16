const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 8000;


const appId = '1536476830334014'; 
const appSecret = 'b155a1461167c901554ace602fd5d75e'; 

app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to receive short-lived user access token from the client
app.post('/exchange-token', async (req, res) => {
    const shortLivedUserAccessToken = req.body.token;

    try {
        // Exchange short-lived token for long-lived token
        const longLivedUserAccessToken = await getLongLivedUserAccessToken(shortLivedUserAccessToken);
        
        res.json({ success: true, data: { longLivedUserAccessToken } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint to subscribe to multiple pages
app.post('/subscribe-pages', async (req, res) => {
    const { pages } = req.body;

    try {
        const results = await Promise.all(pages.map(page => subscribeAppToPage(page.pageId, page.pageAccessToken)));
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Function to subscribe the app to a page
async function subscribeAppToPage(pageId, pageAccessToken) {
    const url = `https://graph.facebook.com/${pageId}/subscribed_apps`;
    const params = {
        access_token: pageAccessToken,
        subscribed_fields: 'leadgen'
    };
    const response = await axios.post(url, null, { params });
    return response.data;
}

// Function to get a Long-Lived User Access Token
async function getLongLivedUserAccessToken(shortLivedUserAccessToken) {
    const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedUserAccessToken}`;
    const response = await axios.get(url);
    return response.data.access_token;
}



// Serve index.html on the root path
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});