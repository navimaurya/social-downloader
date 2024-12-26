// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
});
// Middleware to parse JSON and URL-encoded bodies
app.use(cors());
app.use(helmet());
app.use(limiter)

app.use(express.static('public'));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// app.use(createProxyMiddleware({
//     target: 'https://www.instagram.com',
//     changeOrigin: true,
//     // pathRewrite: { '^/instagram': '' },
//   }))
// Proxy route for Instagram GraphQL API

function extractReelId(url) {
    const regex = /\/reel\/([A-Za-z0-9_-]+)(?:\?|\/|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}


// const ejs = require('ejs');
// const path = require('path');

// Set EJS as the templating engine
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// // GET route to render the index file with details
// app.get('/', (req, res) => {
//     res.render('index', { title: 'Instagram Reel Downloader' });
// });

async function getImgBinary(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const imgBase64 = Buffer.from(response.data, 'binary').toString('base64');
        return imgBase64;
    } catch (error) {
        console.error('Error fetching image:', error);
        return "";
    }
}

app.post('/proxy/instagram', async (req, res) => {
    try {
        // Extract data from the client request
        let { url } = req.body;
        if(!url){
            return res.status(400).json({ error: 'Invalid url'});
        }
        
        shortcode =  extractReelId(url)
        const doc_id = 8845758582119845
        
        // Prepare the payload
        const myHeaders = new Headers();
        myHeaders.append("accept", "*/*");
        myHeaders.append("accept-language", "en-US,en;q=0.9,hi;q=0.8");
        myHeaders.append("content-type", "application/x-www-form-urlencoded");
        myHeaders.append("origin", "https://www.instagram.com");
        myHeaders.append("priority", "u=1, i");
        myHeaders.append("referer", "https://www.instagram.com");
        myHeaders.append("sec-ch-prefers-color-scheme", "dark");
        myHeaders.append("sec-ch-ua", "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"");
        myHeaders.append("sec-ch-ua-full-version-list", "\"Microsoft Edge\";v=\"131.0.2903.112\", \"Chromium\";v=\"131.0.6778.205\", \"Not_A Brand\";v=\"24.0.0.0\"");
        myHeaders.append("sec-ch-ua-mobile", "?0");
        myHeaders.append("sec-ch-ua-model", "\"\"");
        myHeaders.append("sec-ch-ua-platform", "\"macOS\"");
        myHeaders.append("sec-ch-ua-platform-version", "\"14.5.0\"");
        myHeaders.append("sec-fetch-dest", "empty");
        myHeaders.append("sec-fetch-mode", "cors");
        myHeaders.append("sec-fetch-site", "same-origin");
        myHeaders.append("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0");
        myHeaders.append("x-fb-friendly-name", "PolarisPostActionLoadPostQueryQuery");
        // myHeaders.append("Cookie", "csrftoken=IbxvbYP0Chp-0WvSqRvTSx; ig_did=F5EFF301-6CD1-4706-815E-016F6EE96AE0; ig_nrcb=1; mid=Z2w1hwAEAAE8PvL7lorlOBbDyP8v");
        
        const urlencoded = new URLSearchParams();
        urlencoded.append("av", "0");
        urlencoded.append("fb_api_caller_class", "RelayModern");
        urlencoded.append("fb_api_req_friendly_name", "PolarisPostActionLoadPostQueryQuery");
        urlencoded.append("variables", `{"shortcode":"${shortcode}","fetch_tagged_user_count":null,"hoisted_comment_id":null,"hoisted_reply_id":null}`);
        urlencoded.append("server_timestamps", "true");
        urlencoded.append("doc_id", doc_id);


        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: urlencoded,
            redirect: "follow"
        };
          

        const response = await fetch("https://www.instagram.com/graphql/query", requestOptions);
        const result = await response.text();
        const jsonResponse = JSON.parse(result);

        // Check for empty data.xdt_shortcode_media or error key
        if (!jsonResponse.data || !jsonResponse.data.xdt_shortcode_media || jsonResponse.error) {
            return res.status(400).json({ error: 'Invalid response from Instagram', res:  jsonResponse});
        }

        res.status(200).json({data:{...jsonResponse.data, poster: await getImgBinary(jsonResponse.data.xdt_shortcode_media.display_url)}});
        // Respond with the data from Instagram
        
    } catch (error) {
        console.error('Error in proxy:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Instagram' });
    }
});

app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});