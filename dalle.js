const cors = require('cors');
app.use(cors());
const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Configure session middleware
app.use(session({
    secret: '1234', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true } 
}));

app.use(express.json());
app.use(express.static('public')); 

// Endpoint to handle image generation
app.post('/generate-image', async (req, res) => {
    const prompt = req.body.prompt;
    const apiKey = process.env.OPENAI_API_KEY;
    const endpoint = 'https://api.openai.com/v1/images/generations';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ prompt: prompt, n: 1, size: "1024x1024" })
        });

        const data = await response.json();
        res.json({ url: data.data[0].url }); 
    } catch (error) {
        console.error('Error in generateImage:', error);
        res.status(500).send('Error generating image');
    }
});

// Endpoint to retrieve session data
app.get('/session-data', (req, res) => {
    if (!req.session.artistsData || !req.session.genreData) {
        return res.status(404).send('Session data not found');
    }
    res.json({
        artists: req.session.artistsData,
        mostPopularGenre: req.session.genreData
    });
});



const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
