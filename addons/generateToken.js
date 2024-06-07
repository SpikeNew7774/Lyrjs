const generateToken = new Promise((resolve, reject) => {
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ 
            grant_type: 'client_credentials',
            client_id: process.env.SPT_CLIENT_ID,
            client_secret: process.env.SPT_CLIENT_SECRET
        })
    }).then(resp => resp.json())
    .then(resp => {
        resolve(resp)
    })
})

module.exports = { generateToken }