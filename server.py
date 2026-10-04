from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, quote
import urllib.request
import json

HOST = "0.0.0.0"
PORT = 8000

AUDIUS_API = "https://api.audius.co/v1"


class AndomiServer(SimpleHTTPRequestHandler):

    def send_json(self, data, status=200):

        body = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status)
        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )
        self.send_header(
            "Content-Length",
            str(len(body))
        )
        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )
        self.end_headers()

        self.wfile.write(body)


    def get_audius(self, endpoint):

        url = AUDIUS_API + endpoint

        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ANDOMI-MUSIC/1.0"
            }
        )

        with urllib.request.urlopen(
            request,
            timeout=20
        ) as response:

            return json.loads(
                response.read().decode("utf-8")
            )


    def make_song(self, track):

        artwork = track.get("artwork") or {}

        image = (
            artwork.get("480x480")
            or artwork.get("1000x1000")
            or artwork.get("150x150")
            or ""
        )

        user = track.get("user") or {}

        track_id = track.get("id")

        if not track_id:
            return None

        return {
            "id": track_id,
            "title": track.get(
                "title",
                "Unknown Song"
            ),
            "artist": user.get(
                "name",
                "Unknown Artist"
            ),
            "album": track.get(
                "album",
                ""
            ),
            "image": image,
            "audio": (
                "/api/stream/"
                + str(track_id)
            )
        }


    def do_GET(self):

        parsed = urlparse(self.path)

        # =========================
        # SEARCH / MUSIC
        # =========================

        if parsed.path == "/api/music":

            params = parse_qs(
                parsed.query
            )

            query = params.get(
                "q",
                [""]
            )[0].strip()


            try:

                if query:

                    endpoint = (
                        "/tracks/search?query="
                        + quote(query)
                        + "&limit=20"
                    )

                else:

                    endpoint = (
                        "/tracks/trending?limit=20"
                    )


                result = self.get_audius(
                    endpoint
                )

                tracks = result.get(
                    "data",
                    []
                )

                songs = []

                for track in tracks:

                    song = self.make_song(track)

                    if song:
                        songs.append(song)

                self.send_json(songs)

            except Exception as error:

                print(
                    "Music API error:",
                    error
                )

                self.send_json(
                    {
                        "error": str(error)
                    },
                    500
                )

            return


        # =========================
        # AUDIO STREAM
        # =========================

        if parsed.path.startswith(
            "/api/stream/"
        ):

            track_id = parsed.path.replace(
                "/api/stream/",
                "",
                1
            )

            if not track_id:

                self.send_json(
                    {
                        "error":
                        "Missing track ID"
                    },
                    400
                )

                return


            stream_url = (
                AUDIUS_API
                + "/tracks/"
                + quote(track_id)
                + "/stream"
            )

            # Redirect the browser directly
            # to the Audius audio stream.
            self.send_response(302)

            self.send_header(
                "Location",
                stream_url
            )

            self.send_header(
                "Cache-Control",
                "no-cache"
            )

            self.end_headers()

            return


        # =========================
        # NORMAL FILES
        # =========================

        super().do_GET()


print()
print("=" * 50)
print("              ANDOMI MUSIC")
print("=" * 50)
print()
print(
    "Server:",
    f"http://{HOST}:{PORT}"
)
print(
    "Music API: READY"
)
print(
    "Search: READY"
)
print(
    "Full stream: READY"
)
print()
print("=" * 50)


server = HTTPServer(
    (HOST, PORT),
    AndomiServer
)


try:

    server.serve_forever()

except KeyboardInterrupt:

    print("\nServer stopped.")
    server.server_close()