//this code is from the Spotify for devolpers website with the guidance from Youtube video
const express = require('express');
const session = require('express-session');
const querystring = require('querystring');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const path = require('path');

// Import routers and utility functions
const getPlaylistRouter = require('./getPlaylist.js'); 
const dalleRouter = require('./dalle.js');
const uploadImageToSpotifyPlaylist = require('./spotifyCover');

// Initialize the Express application
const app = express();

// Session and Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(cookieParser());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); 
app.use(session({
    secret: '1234', 
    resave: false,
    saveUninitialized: true,
}));

// Use imported routers
app.use('/', getPlaylistRouter);
app.use('/', dalleRouter);

app.post('/upload-playlist-cover', async (req, res) => {
    const { playlistId, imageUrl } = req.body;
    const accessToken = req.session.access_token;

    if (!accessToken) {
        return res.status(401).send('Authentication required');
    }

    try {
        const result = await uploadImageToSpotifyPlaylist(playlistId, imageUrl, accessToken);
        res.json(result);
    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).send('Failed to upload playlist cover');
    }
});

// Spotify API credentials
const client_id = '1f41a373cee9493c94146c1db7553300'; // Replace with your client ID
const client_secret = 'a97199ef1dfc4759b23586207fef729a'; // Replace with your client secret
const redirect_uri = 'http://localhost:8081/callback'; // Make sure this matches your Spotify app settings

// Function to generate a random string for the state parameter in authentication requests
const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const stateKey = 'spotify_auth_state';

// Route to initiate user login through Spotify
app.get('/login', function(req, res) {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // Request authorization
    const scopes = ['ugc-image-upload', 'playlist-modify-public', 'playlist-modify-private'];
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scopes.join(' '),
        redirect_uri: redirect_uri,
        state: state
    })}`;

    res.redirect(authUrl);
});

// Callback route to handle the response from Spotify after user login
app.get('/callback', function(req, res) {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    } else {
        res.clearCookie(stateKey);
        const authOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(`${client_id}:${client_secret}`).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: querystring.stringify({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code',
            }),
        };

        fetch('https://accounts.spotify.com/api/token', authOptions)
            .then(response => response.json())
            .then(data => {
                const access_token = data.access_token;
                req.session.access_token = access_token;
                res.redirect('/#' + querystring.stringify({ access_token }));
            })
            .catch(error => {
                console.error('Error getting access token', error);
                res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
            });
    }
});

console.log('Listening on 8081');
app.listen(8081);


// node authorization.js

//https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
//https://www.youtube.com/watch?v=NPW4K3aMjI8