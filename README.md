# Lyrjs
Lyrjs is a free to use API for word and line synced Lyrics

# Endpoinds
- GET /lyrics/search?track={Track Name}&artist={Track Artist}&bulk={true | false}
  track = The Name of the Track
  artist = The Name of the Artist
  bulk = To display the whole list of searched lyrics (from spotify api)
- GET /lyrics/id?{id={The Spotify Song ID} | ids={List of Song Spotify IDS divided by ','}}
  id = The Spotify Song ID
  ids = List of Song Spotify IDS divided by ','

Headers:
- Content-Type: {application/json | null}
- Authorization: {Bearer {Your Spotify App Access Token} | null} if null => Without a token you just get a third of the lyrics that you were supposed to get
