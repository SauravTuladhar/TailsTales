const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS = require('../oauth2.keys.json.json');

function authorize(callback) {
  const { client_secret, client_id, redirect_uris } = CREDENTIALS.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Enter the code from that page here: ', code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      callback(oAuth2Client);
    });
  });
}

// Exported function to be used in GeneratePage
function uploadVideo(videoPath, title, description) {
  authorize(auth => {
    const service = google.youtube({ version: 'v3', auth });

    service.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: ['pet', 'dog', 'cat', 'puppy', 'kitten', 'animals', 'cutepets', 'petvideos', 'dogvideos', 'catvideos', 'funnyanimals', 'petlovers', 'petshorts', 'petlife', 'adorable', 'cute', 'puppylove', 'cuteness', 'petsofyoutube', 'quotes', 'quoteoftheday', 'inspirational', 'motivation', 'dailyquote', 'mindset', 'positivity', 'shorts', 'youtubeshorts', 'viralvideo', 'automated', 'ai', 'reels', 'shortsvideo', 'trending', 'quote',, 'loyal', 'success', 'animalshorts', 'lovepets', 'inspiration', 'viral', 'dog inspired quotes', 'petquotes']
        },
        status: {
          privacyStatus: 'public'
        }
      },
      media: {
        body: fs.createReadStream(videoPath)
      }
    }, (err, response) => {
      if (err) {
        console.error('❌ Error uploading video:', err);
        return;
      }
      const videoId = response.data.id;
      console.log(`🎉 Video uploaded successfully! Watch here: https://www.youtube.com/watch?v=${videoId}`);
    });
  });
}

module.exports = { uploadVideo };