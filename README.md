# Lyrjs
Lyrjs is a Open-Source free to use API for word synced Song Lyrics\
***Some lyrics may not support word or line synced lyrics or not even have lyrics***

When using this API you Agree to our Terms Of Service and Privacy Policy.

# Endpoinds
https://lyrjs.spikerko.org/
- GET /lyrics/search?track={Track Name}&artist={Track Artist}&bulk={true | false}
  - track = The Name of the Track
  - artist = The Name of the Artist
  - bulk = To display the whole list of searched lyrics (from spotify api)
- GET /lyrics/id?{id={The Spotify Song ID} | ids={List of Song Spotify IDS divided by ','}}
  - id = The Spotify Song ID
  - ids = List of Song Spotify IDS divided by ','

Headers:
- Content-Type: {application/json | null}
- Authorization: {Bearer {Your Spotify App Access Token} | null} if null => Without a token you just get a third of the lyrics that you were supposed to get\

Thanks to:\
- Beautiful Lyrics API (by surfbryce and HRTK92)
  - This is used to as the lyrics DB (normally you (the user) would have to enter tokens and specify fetch options but we (Lyrjs) do it for you)

# Privacy Policy
- We do NOT collect any data about you.
- The services we use to get the requested information are anonymized from you.
  - Example: You (the user) fetch our API for lyrics, We (Lyrjs) get the lyrics by the reqested lyrics from another API for you. That means that the other API doesn't know anything about you but only about us (Lyrjs)

# Terms Of Service
- You can not use this API outside of "lyrjs.spikerko.org"*
  - Example: You can not use this API to be fetched on the backend and then be shown to the user, *Except if it contains a header: "Lyrics-Origin" or "X-Lyrics-Origin" that equals to "Lyrjs".
- Commercial use is not allowed. 
- We are not responsible for any damages this API causes you.

***This may be against Spotify's TOS. Be aware that any damages this API causes you, we are not responsible for them.***
