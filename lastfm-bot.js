const fs = require("fs");
const random = require("random");
const request = require("request");
const login = require("facebook-chat-api");

const credentials = JSON.parse(fs.readFileSync('credentials.json'));

const fbEmail = credentials["fbEmail"];
const fbPassword = credentials.fbPassword;
const lastfmApiKey = credentials.lastfmApiKey;

// Reading cookies file if exists
try {
    appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
    credentialsData = {appState: appState}
} catch (err) {
    credentialsData = {
        email: fbEmail, 
        password: fbPassword
    }
}


function getLastWeekBest(username, callback) {
    apiUrl = `http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=${lastfmApiKey}&format=json&period=1month`;
    request(apiUrl, {json: true}, callback)
}


function formatTopTrack(username, topTrackData) {
    topTrack = `${topTrackData.name} by ${topTrackData.artist.name}`;
    return `${username}'s top track (last month):\n${topTrack}`;
}


function formatTopTrackCricri(username) {
    topTracks = [
        "Supermassive Black Hole by Muse", 
        "Uprising by Muse",
        "Wonderwall by Oasis",
        "Champagne Supernova by Oasis", 
        "Don't Look Back in Anger by Oasis", 
        "Mr. Brightside by The Killers",
        "Californication by Red Hot Chili Peppers",
        "Uptown Funk (feat. Bruno Mars) by Mark Ronson"
    ]
    trackID = random.int(0, topTracks.length - 1)
    topTrack = topTracks[trackID]
    return `${username}'s top track (last month):\n${topTrack}`;
}


// Create simple echo bot
login(credentialsData, (err, api) => {
    if(err) return console.error(err);

    currentUserID = api.getCurrentUserID();
    api.listenMqtt((err, evt) => {
        if(evt.type !== "message") {
            return;
        }

        if (
            evt.mentions !== undefined && 
            evt.mentions.hasOwnProperty(currentUserID)
        ) {
            const { [currentUserID]: userMention } = evt.mentions;
            lastfmUsername = evt.body.slice(userMention.length).trim();
            getLastWeekBest(
                lastfmUsername,
                (err, res, body) => {
                    if (err) { return console.log(err); }

                    if (body.toptracks["@attr"].user == "Chriissssss") {
                        topTrack = formatTopTrackCricri(lastfmUsername);
                    } else {
                        topTrackData = body.toptracks.track[0];
                        topTrack = formatTopTrack(lastfmUsername, topTrackData);
                    }
                    api.sendMessage(topTrack, evt.threadID);
                }
            );
        }
    });
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
});

