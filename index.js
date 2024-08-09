const express = require("express");
const app = express();
const { generateToken } = require("./addons/generateToken.js");
const rateLimit = require("express-rate-limit");
//b
const { firebaseApp, firebaseDB } = require("./firebase.config.js")

const { doc, setDoc, query, where, getDoc, updateDoc, deleteDoc, onSnapshot, collection, getDocs } = require('firebase/firestore');

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
})
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const lyrjsConfig = require("./lyrjs.config.js");

async function uRateLimit(req, res) {
    let returnValue = 1;
    //res.setHeader("Content-Type", "application/json");
    return returnValue;
    /* if (!req.headers.authorization || !req.headers.authorization.includes("Bearer ")) {
        return res.status(401).send(JSON.stringify({
                error: true,
                details: "No or Invalid Access Token Specified",
                status: 401
        }, null, 2))
    }
    try {
        const firebaseQuery = query(collection(firebaseDB, "user-data"), where("access_token", "==", btoa(req.headers.authorization.replace("Bearer ", ""))));
        
        const querySnapshot = await getDocs(firebaseQuery);

        querySnapshot.forEach(doc => {
            if (doc.data().access_token) {
                returnValue = 10;
            }
        })
    } catch (error) {
        returnValue = 0;
        
        res.status(500).send(JSON.stringify({
            error: true,
            status: 500,
            details: "An error happened trying to verify SPlay ownership of your Access Token"
        }, null, 2))
        return
    }
    return returnValue */
}

async function rateLimitReached(req, res) {
    res.setHeader("Content-Type", "application/json")
    if (!req.headers.authorization || !req.headers.authorization.includes("Bearer ")) {
        return res.status(401).send(JSON.stringify({
                error: true,
                details: "No or Invalid Access Token Specified",
                status: 401
        }, null, 2))
    }
    res.status(429).send(JSON.stringify({
        error: true,
        status: 429,
        details: "Too Many Requests",
    }, null, 2))
}

const searchRateLimiter = rateLimit({
    windowMs: 30000,
    limit: uRateLimit,
    message: rateLimitReached
})

const idRateLimiter = rateLimit({
    windowMs: 10000,
    limit: uRateLimit,
    message: rateLimitReached
})

app.get("/lyrics/search", searchRateLimiter, async (req, res) => {
    if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json")
    }
    const trackName = req.query.track;
    const artistName = req.query.artist;
    let userAccessToken = req.headers.authorization;
    let socalitoken = "1";
    let ourToken = false

    if (lyrjsConfig.devMode == true) {
        await generateToken.then(data => {
            userAccessToken = `Bearer ${data.access_token}`
            socalitoken = data.access_token
        })
    }

    if (!userAccessToken) {
        return res.status(401).send(JSON.stringify({
                error: true,
                details: "No Access Token Specified",
                status: 401
        }, null, 2))
    }

    try {
        await generateToken.then(data => {
            socalitoken = data.access_token
        })
    } catch (err) {
        res.status(500).send(JSON.stringify({
            error: true,
            details: "unknown",
            status: 500
        }, null, 2))
    }
        /* ourToken = true
        try {
            await generateToken.then(data => {
                userAccessToken = "Bearer " + data.access_token
                socalitoken = data.access_token
            })
        } catch (err) {
            res.status(500).send(JSON.stringify({
                error: true,
                details: "unknown",
                status: 500,
                desc: err
            }, null, 2))
        }
    } else {
        try {
            await generateToken.then(data => {
                socalitoken = data.access_token
            })
        } catch (err) {
            res.status(500).send(JSON.stringify({
                error: true,
                details: "unknown",
                status: 500,
                desc: err
            }, null, 2))
        }
    } */

    /* if (!userAccessToken) return res.status(401).send(JSON.stringify({
        error: true,
        details: "Unauthorized",
        status: 401
    }, null, 2)) */
    
    if (!trackName || !artistName) return res.status(403).send(JSON.stringify({
        error: true,
        details: "Track Query or Artist Query missing. Atleast one is required.",
        status: 403
    }, null, 2))

    const fetchingUrl = `https://api.spotify.com/v1/search?q=track:${trackName || ""} artist:${artistName || ""}&type=track${!req.query.bulk || req.query.bulk == "false" ? "&limit=1" : ""}`
    //console.log(fetchingUrl)
    fetch(fetchingUrl, {
        method: "GET",
        headers: {
            'Content-Type': "application/json",
            Authorization: userAccessToken || "none"
        }
    })
    .then(resp => {
        console.log(resp.status)
        if (resp.status == 401) {
            res.status(401).send(JSON.stringify({
                error: true,
                details: "Invalid Access Token",
                status: 401
            }, null, 2))
            return "none"
        } else if (resp.status == 403) {
            res.status(403).send(JSON.stringify({
                error: true,
                details: "Forbidden",
                status: 403
            }, null, 2))
            return "none"
        } else if (resp.status == 429) {
            res.status(429).send(JSON.stringify({
                error: true,
                details: "Too Many Requests",
                status: 429
            }, null, 2))
            return "none"
        } else if (resp.status == 200) {
            return resp.json()
        } else if (resp.status == 400) {
            res.status(400).send(JSON.stringify({
                error: true,
                details: "unknown",
                status: 400
            }, null, 2))
            return "none"
        }
    })
    .then(data => {
        try {
            //console.log(data)
            if (data.tracks?.total == 0) return res.status(404).send(JSON.stringify({
                error: true,
                details: "No Tracks Found",
                status: 404
            }, null, 2))
        if (!req.query.bulk || req.query.bulk == "false") {
            const trackId = data.tracks.items[0].id;
            fetch(`https://beautiful-lyrics.socalifornian.live/lyrics/${trackId}`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'insomnia/9.2.0',
                    Origin: 'https://xpui.app.spotify.com',
                    Referer: 'https://xpui.app.spotify.com/',
                    Authorization: `Bearer ${socalitoken ? socalitoken : '1'}`
                }
            })
                .then(resp => resp.json())
                .then(lyrics => {
                    const originalLyricsLength = {
                        number: undefined
                    }

                    originalLyricsLength.number = lyrics.Type == "Static" ? lyrics.Lines.length : lyrics.Content.length
                    if (ourToken == true) {
                        lyrics.Type == "Static" ? lyrics.Lines.length = Math.round(lyrics.Lines.length / 3) : lyrics.Content.length = Math.round(lyrics.Content.length / 3)
                    }
                    res.status(200).send(JSON.stringify({
                        error: false,
                        name: data.tracks.items[0].name,
                        artists: data.tracks.items[0].artists,
                        id: trackId,
                        original_length: originalLyricsLength.number,
                        total_fetched: 1,
                        total: data.tracks.total,
                        ...lyrics
                    }, null, 2))
                })
                .catch(err => {
                    res.status(404).send(JSON.stringify({
                        error: true,
                        details: "Lyrics Not Found",
                        status: 404
                    }, null, 2))
                });
        } else if (req.query.bulk && req.query.bulk == "true") {
            const tracksList = data.tracks.items;
            const tracksListLength = data.tracks.limit
            const fullLyricsList = {
                error: false,
                bulk: true,
                content: []
            }

            const originalLyricsLength = {
                number: undefined
            }
            let failedFetches = 0

            tracksList.forEach((item, index) => {
                setTimeout(() => {
                    fetch(`https://beautiful-lyrics.socalifornian.live/lyrics/${item.id}`, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'insomnia/9.2.0',
                            Origin: 'https://xpui.app.spotify.com',
                            Referer: 'https://xpui.app.spotify.com/',
                            Authorization: `Bearer ${socalitoken ? socalitoken : '1'}`
                        }
                    })
                        .then(resp => resp.text())
                        .then(prelyrics => {
                            const tracksListLengthBulk = data.tracks.total
                            /* console.log(prelyrics) */
/*                             console.log("Index", index + 1)
                            console.log("Length", tracksListLengthBulk) */
                            /* console.log(prelyrics) */
                            /* console.log('fetched lyrics') */
                            
                            if (prelyrics != null && prelyrics != "" && !prelyrics.includes("401 - Unauthorized")) {
                                const lyrics = JSON.parse(prelyrics)
                                originalLyricsLength.number = lyrics.Type == "Static" ? lyrics.Lines.length : lyrics.Content.length
                                if (ourToken == true) {
                                    lyrics.Type == "Static" ? lyrics.Lines.length = Math.round(lyrics.Lines.length / 3) : lyrics.Content.length = Math.round(lyrics.Content.length / 3)
                                }
                                fullLyricsList.content.push({
                                    name: item.name,
                                    artists: item.artists,
                                    id: item.id,
                                    original_length: originalLyricsLength.number,
                                    ...lyrics
                                })
                                fullLyricsList.error = false
                            } else {
                                failedFetches++
                            }
                            if (index + 1 == tracksListLengthBulk) {
                                if (fullLyricsList.content.length <= 0) {
                                    fullLyricsList.error = true
                                }
                                res.status(200).send(JSON.stringify({
                                    failed_tracks: data.tracks.total - fullLyricsList.content.length,
                                    total_fetched: fullLyricsList.content.length,
                                    total: data.tracks.total,
                                    ...fullLyricsList
                                }, null, 2))
                                failedFetches = 0
                                return
                            }
                        })
                        .catch(err => {
                            try {
                                return res.status(500).send(JSON.stringify({
                                    error: true,
                                    status: 500
                                }, null, 2))
                                console.log(err)
                            } catch (error) {
                                console.log(error)
                            }
                            console.log(err)
                        });
                }, 250);
            });
            //res.status(200).send(JSON.stringify(fullLyricsList, null, 2))
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(JSON.stringify({
                error: true,
                status: 500
            }, null, 2))
        }
       console.log(error)     
    }
    }).catch(err => {
         if (!res.headersSent) {
            res.status(500).send(JSON.stringify({
                error: true,
                status: 500
            }, null, 2))
        }
    })
})

app.get("/lyrics/id", idRateLimiter, async (req, res) => {
    if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json")
    }

    const trackId = req.query.id;
    let userAccessToken = req.headers.authorization;
    let ourToken = false
    let socalitoken = "1";

    if (lyrjsConfig.devMode == true) {
        await generateToken.then(data => {
            userAccessToken = `Bearer ${data.access_token}`
            socalitoken = data.access_token
        })
    }

    if (!userAccessToken) {
        return res.status(401).send(JSON.stringify({
                error: true,
                details: "No Access Token Specified",
                status: 401
        }, null, 2))
    }

    try {
        await generateToken.then(data => {
            socalitoken = data.access_token
        })
    } catch (err) {
        res.status(500).send(JSON.stringify({
            error: true,
            details: "unknown",
            status: 500
        }, null, 2))
    }

    /* if (!userAccessToken) {
        ourToken = true
        await generateToken.then(data => {
            userAccessToken = "Bearer " + data.access_token
            socalitoken = data.access_token
        })
    } else {
        await generateToken.then(data => {
            socalitoken = data.access_token
        })
    } *//* return res.status(401).send(JSON.stringify({
        error: true,
        details: "Unauthorized",
        status: 401
    }, null, 2)) */
    
    if (!trackId && !req.query.ids) return res.status(403).send(JSON.stringify({
        error: true,
        details: "Track ID is missing.",
        status: 403
    }, null, 2))

    const fetchingUrl = `https://api.spotify.com/v1/tracks/${!trackId ? req.query.ids.split(",")[0] : trackId}`

    fetch(fetchingUrl, {
        method: "GET",
        headers: {
            'Content-Type': "application/json",
            Authorization: userAccessToken || "none"
        }
    })
    .then(resp => {
        //console.log(resp.status)
        if (resp.status == 401) {
            res.status(401).send(JSON.stringify({
                error: true,
                details: "Invalid Access Token",
                status: 401
            }, null, 2))
            return "none"
        } else if (resp.status == 403) {
            res.status(403).send(JSON.stringify({
                error: true,
                details: "Forbidden",
                status: 403
            }, null, 2))
            return "none"
        } else if (resp.status == 429) {
            res.status(429).send(JSON.stringify({
                error: true,
                details: "Too Many Requests",
                status: 429
            }, null, 2))
            return "none"
        } else if (resp.status == 200) {
            return resp
        } else if (resp.status == 400) {
            res.status(400).send(JSON.stringify({
                error: true,
                details: "unknown",
                status: 400
            }, null, 2))
            return "none"
        }
    })
    .then(async predata => {
        try {
            const data = await predata.json()
        if (!req.query.ids) {
            fetch(`https://beautiful-lyrics.socalifornian.live/lyrics/${trackId}`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'insomnia/9.2.0',
                    Origin: 'https://xpui.app.spotify.com',
                    Referer: 'https://xpui.app.spotify.com/',
                    Authorization: `Bearer ${socalitoken ? socalitoken : '1'}`
                }
            })
                .then(resp => resp.text())
                .then(prelyrics => {
                    if (prelyrics != null && !prelyrics.includes("401 - Unauthorized")) {
                        const lyrics = JSON.parse(prelyrics)
                        const originalLyricsLength = {
                            number: undefined
                        }

                        originalLyricsLength.number = lyrics.Type == "Static" ? lyrics.Lines.length : lyrics.Content.length
                        if (ourToken == true) {
                            lyrics.Type == "Static" ? lyrics.Lines.length = Math.round(lyrics.Lines.length / 3) : lyrics.Content.length = Math.round(lyrics.Content.length / 3)
                        }
                        res.status(200).send(JSON.stringify({
                            error: false,
                            name: data.name,
                            artists: data.artists,
                            id: data.id,
                            original_length: originalLyricsLength.number,
                            ...lyrics
                        }, null, 2))
                    } else {
                        res.status(404).send(JSON.stringify({
                            error: true,
                            details: "No Tracks Found",
                            status: 404
                        }, null, 2))
                    }
                })
                .catch(err => {
                    res.status(404).send(JSON.stringify({
                        error: true,
                        details: "Lyrics Not Found",
                        status: 404
                    }, null, 2))
                });
        } else if (req.query.ids) {
            const tracksIds = req.query.ids.split(",");
            const tracksListLength = tracksIds.length
            const fullLyricsList = {
                error: false,
                bulk: true,
                content: []
            }
            const originalLyricsLength = {
                number: undefined
            }
            let failedFetches = 0
            
            tracksIds.forEach((itemId, index) => {
                setTimeout(() => {
                    fetch(`https://api.spotify.com/v1/tracks/${itemId}`, {
                            method: 'GET',
                            headers: {
                                Authorization: userAccessToken
                            }
                    })
                        .then(resp => resp.json())
                        .then(item => {
                            fetch(`https://beautiful-lyrics.socalifornian.live/lyrics/${item.id}`, {
                                    method: 'GET',
                                    headers: {
                                        'User-Agent': 'insomnia/9.2.0',
                                        Origin: 'https://xpui.app.spotify.com',
                                        Referer: 'https://xpui.app.spotify.com/',
                                        Authorization: `Bearer ${socalitoken ? socalitoken : '1'}`
                                    }
                            })
                                .then(resp => resp.text())
                                .then(prelyrics => {
                                    /* console.log(prelyrics) */
                                   /*  console.log("Index", index + 1)
                                    console.log("Length", tracksListLength) */
                                    /* console.log(prelyrics) */
                                    /* console.log('fetched lyrics') */
                                    
                                    if (prelyrics != null && !prelyrics.includes("401 - Unauthorized")) {
                                        const lyrics = JSON.parse(prelyrics)
                                        originalLyricsLength.number = lyrics.Type == "Static" ? lyrics.Lines.length : lyrics.Content.length
                                        if (ourToken == true) {
                                            lyrics.Type == "Static" ? lyrics.Lines.length = Math.round(lyrics.Lines.length / 3) : lyrics.Content.length = Math.round(lyrics.Content.length / 3)
                                        }
                                        fullLyricsList.content.push({
                                            name: item.name,
                                            artists: item.artists,
                                            id: item.id,
                                            original_length: originalLyricsLength.number,
                                            ...lyrics
                                        })
                                        fullLyricsList.error = false
                                    } else {
                                        failedFetches += 1
                                    }
                                    if (index + 1 == tracksListLength) {
                                        if (fullLyricsList.content.length <= 0) {
                                            fullLyricsList.error = true
                                        }

                                        res.status(200).send(JSON.stringify({
                                            failed_tracks: tracksIds.length - fullLyricsList.content.length,
                                            total: tracksIds.length,
                                            total_fetched: fullLyricsList.content.length,
                                            ...fullLyricsList
                                        }, null, 2))
                                        failedFetches = 0
                                        return
                                    }
                                })
                                .catch(err => {
                                    try {
                                        console.log(err)
                                        return res.status(500).send(JSON.stringify({
                                            error: true,
                                            status: 500
                                        }, null, 2))
                                    } catch (error) {
                                        //console.log(error)
                                    }
                                    console.log(err)
                                });
                        })
                        .catch(err => {
                            try {
                                return res.status(500).send(JSON.stringify({
                                    error: true,
                                    status: 500
                                }, null, 2))
                            } catch (error) {
                                //console.log(error)
                            }
                            console.log(err)
                        });


                    
                }, 250);
            });
            //res.status(200).send(JSON.stringify(fullLyricsList, null, 2))
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(JSON.stringify({
                error: true,
                status: 500
            }, null, 2))
        }
       console.log(error)     
    }
    }).catch(err => {
        console.log(err)
        if (!res.headersSent) {
            res.status(500).send(JSON.stringify({
                error: true,
                status: 500
            }, null, 2))
        }
    })
})

app.get("/bin", (req, res) => {
    res.setHeader("Content-Type", "text/plainn")
    res.status(200).send("bin => bon")
})

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`)
})
