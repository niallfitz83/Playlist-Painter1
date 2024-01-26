const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/playlists', async function (req, res) {
    if (!req.session.access_token) {
        return res.status(401).send('Access token is missing');
    }
// Code from Spotify for Developers website
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
            // Call extractPopularArtists with await and pass the access token
            const artists = await extractPopularArtists(data.items, req.session.access_token);
            res.send(artists);
        } else {
            res.status(response.status).send('Failed to fetch playlist tracks');
        }
    } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        res.status(500).send('Internal Server Error');
    }
});


async function extractPopularArtists(tracks, access_token) {
    const artistCounts = {};
    const genreCounts = {};
    const authOptions = {
        headers: { 'Authorization': 'Bearer ' + access_token }
    };
//loop over the tracks, it increments the artist by one with each appearance of the name
    for (const track of tracks) {
        const artists = track.track.artists;
        for (const artist of artists) {
            artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;

            try {
                const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}`, authOptions); 
                if (artistResponse.ok) {
                    const artistData = await artistResponse.json();
                    if (artistData.genres && artistData.genres.length > 0) {
                        artistData.genres.forEach(genre => {
                            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                        });
                    }
                } else {
                    console.error(`Failed to fetch genres for artist ${artist.name}`);
                }
            } catch (error) {
                console.error(`Error fetching genres for artist ${artist.name}:`, error);
            }
        }
    }
// Finding the max value of a property in an array of objects- stackoverflow

    const mostPopularGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b, null);

    const sortedArtists = Object.keys(artistCounts)
        .map(name => ({ name, count: artistCounts[name] }))
        .sort((a, b) => b.count - a.count);

    return {
        artists: sortedArtists.slice(0, 3).map(artist => artist.name), // top 3 from list of artists 
        mostPopularGenre
    };
}

router.get('/session-data', async (req, res) => {
    try {
        // Implement the logic to fetch artists and genre data here
        // You can use your existing logic to fetch this data
        const artistsData = await extractPopularArtists;
        const mostPopularGenre = artistsData.mostPopularGenre;

        // Send the data as a JSON response
        res.json({ artists: artistsData.artists, mostPopularGenre });
    } catch (error) {
        console.error('Error fetching session data:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;

//https://www.youtube.com/watch?v=gNvgI5imIiU
//https://developer.spotify.com/documentation/web-api/reference/get-list-users-playlists
//https://www.youtube.com/watch?v=D77ANP60DaU 
//https://stackoverflow.com/questions/4020796/finding-the-max-value-of-a-property-in-an-array-of-objects/4020842#4020842
//https://stackoverflow.com/questions/5667888/counting-the-occurrences-frequency-of-array-elements