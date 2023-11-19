//this code is from the Spotify for devolpers website with the guidance from Youtbube video
const express = require('express');
const session = require('express-session');
const querystring = require('querystring');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const path = require('path');

const client_id = '1f41a373cee9493c94146c1db7553300';
const client_secret = 'a97199ef1dfc4759b23586207fef729a'; 
const redirect_uri = 'http://localhost:8081/callback';

const generateRandomString = function (length) { 
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

let stateKey = 'spotify_auth_state'; // name of the cookie

let app = express();

app.use(session({
    secret: '1234', // You should use a unique secret key
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());


app.get('/login', function (req, res) { // handle login request on html page
    let state = generateRandomString(16);
    res.cookie(stateKey, state); // set cookie to travel with request

    // request authorization - automatically redirects to callback
    const scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {

    // request refresh and access tokens after comparing states

    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +  // error page
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey); // (clear) cookie

        const authOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            }, 
            body: `code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code`,
            json: true
        };

        fetch('https://accounts.spotify.com/api/token', authOptions) // make request to token endpoint for tokens
            .then((response) => {
                if (response.status === 200) {
                    response.json().then((data) => {
                        let access_token = data.access_token
                        let refresh_token = data.refresh_token
                        req.session.access_token = access_token;
                        req.session.refresh_token = refresh_token;
                        res.redirect('/#' +
                            querystring.stringify({
                                access_token: access_token,
                                refresh_token: refresh_token
                            }));
                    });
                } else {
                    res.redirect('/#' +   //redirect to failed login screen
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

app.get('/refresh_token', function (req, res) {


    const refresh_token = req.query.refresh_token;
    const authOptions = {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
    };

    fetch('https://accounts.spotify.com/api/token', authOptions)
        .then(response => {
            if (response.status === 200) {
                response.json().then((data) => {
                    const access_token = data.access_token;
                    res.send({ access_token });
                });
            };
        })
        .catch(error => {
            console.error(error);
            res.send(error);
        });
});


console.log('Listening on 8081');
app.listen(8081);

// node authorization.js

//https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
//https://www.youtube.com/watch?v=NPW4K3aMjI8