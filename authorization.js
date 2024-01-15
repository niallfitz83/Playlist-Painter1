//this code is from the Spotify for devolpers website with the guidance from Youtube video
const express = require('express');
const session = require('express-session');
const querystring = require('querystring');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const path = require('path');
const getPlaylistRouter = require('./getPlaylist.js'); 

const client_id = '1f41a373cee9493c94146c1db7553300';
const client_secret = 'a97199ef1dfc4759b23586207fef729a'; 
const redirect_uri = 'http://localhost:8081/callback';

const generateRandomString = function (length) { 
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890'; // generates random string for the cookie

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

let stateKey = 'spotify_auth_state';

let app = express();
//handless the session
app.use(session({  
    secret: '1234', //signs the cookie, needs to generate a random string and stored securely at some stage
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());
    
app.use('/', getPlaylistRouter);

app.get('/login', function (req, res) {
    let state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'user-read-private user-read-email';  //*this needs to be corrected to what actual data that I will pull from the user 
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {  //redirect back to app when user grants permission
    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' + //*direct to an error page
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);

        const authOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            }, 
            body: `code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code`,
            json: true
        };

        fetch('https://accounts.spotify.com/api/token', authOptions)
            .then((response) => {
                if (response.status === 200) {
                    response.json().then((data) => {
                        let access_token = data.access_token;
                        req.session.access_token = access_token;
                        res.redirect('/#' +
                            querystring.stringify({
                                access_token: access_token
                            }));
                    });
                } else {
                    res.redirect('/#' +
                        querystring.stringify({
                            error: 'invalid_token'
                        }));
                };
            })
            .catch(error => {
                console.error(error);
            });
    }
});

console.log('Listening on 8081');
app.listen(8081);


// node authorization.js

//https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
//https://www.youtube.com/watch?v=NPW4K3aMjI8