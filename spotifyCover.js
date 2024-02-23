const fetch = require('node-fetch');
const sharp = require('sharp');

async function uploadImageToSpotifyPlaylist(playlistId, imageUrl, accessToken) {
    try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        // ChatGBT assisted with the rsizing dimensions
        let imageBuffer = await imageResponse.buffer();
        let resizedImageBuffer = await sharp(imageBuffer)
            .resize(300, 300)
            .jpeg({ quality: 80 })
            .toBuffer();

        let quality = 80;
        while (resizedImageBuffer.length > 256 * 1024 && quality > 20) {
            quality -= 5;
            resizedImageBuffer = await sharp(imageBuffer)
                .resize(300, 300)
                .jpeg({ quality })
                .toBuffer();
        }

        if (resizedImageBuffer.length > 256 * 1024) {
            throw new Error('Image size exceeds the maximum limit.');
        }

        ////https://developer.spotify.com/documentation/web-api/reference/upload-custom-playlist-cover
        const base64Image = resizedImageBuffer.toString('base64');
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'image/jpeg',
            },
            body: base64Image, // Correctly sending the Base64 string as body
        });

        if (!response.ok) {
            const responseBody = await response.text(); // Properly handle an unsuccessful response
            console.error(`Failed to upload image to Spotify: ${response.statusText}`);
            return { success: false, message: `Error uploading image to Spotify: ${responseBody}` };
        }

        // Return success message if the response is OK
        return { success: true, message: 'Image uploaded successfully to Spotify playlist.' };
    } catch (error) {
        console.error('Error uploading image to Spotify:', error);
        return { success: false, message: `Error uploading image to Spotify: ${error.message}` };
    }
}

module.exports = uploadImageToSpotifyPlaylist;
