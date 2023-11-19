const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/playlists', async function (req, res) {
    if (!req.session.access_token) {
        return res.status(401).send('Access token is missing');
    }

    const playlistsEndpoint = 'https://api.spotify.com/v1/me/playlists';
    const authOptions = {
        headers: { 'Authorization': 'Bearer ' + req.session.access_token }
    };

    try {
        const response = await fetch(playlistsEndpoint, authOptions);
        if (response.ok) {
            const data = await response.json();
            res.send(data); // Send playlist data to the client
        } else {
            res.status(response.status).send('Failed to fetch playlists');
        }
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;

// ... existing code ...

router.get('/artists', async function (req, res) {
    if (!req.session.access_token) {
        return res.status(401).send('Access token is missing');
    }

    const playlistId = req.query.playlistId;
    const playlistTracksEndpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const authOptions = {
        headers: { 'Authorization': 'Bearer ' + req.session.access_token }
    };

    try {
        const response = await fetch(playlistTracksEndpoint, authOptions);
        if (response.ok) {
            const data = await response.json();
            const artists = extractPopularArtists(data.items); // Implement this function
            res.send(artists);
        } else {
            res.status(response.status).send('Failed to fetch playlist tracks');
        }
    } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        res.status(500).send('Internal Server Error');
    }
});

function extractPopularArtists(tracks) {
    // Implement logic to extract and return popular artists from tracks
    // This might involve additional API calls to Spotify to get artist popularity
}

// ... existing code ...

module.exports = router;

