from flask import Flask, request, Response
import requests
from urllib.parse import urlparse

app = Flask(__name__)

STRIP_HEADERS = [
    'content-security-policy',
    'x-frame-options',
    'strict-transport-security',
    'content-encoding',
    'transfer-encoding',
    'set-cookie',
]

@app.route('/')
def home():
    return open('index.html').read()

@app.route('/proxy')
def proxy():
    url = request.args.get('url', '')
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        resp = requests.get(
            url,
            headers={
                'User-Agent': request.headers.get('User-Agent', ''),
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout=15,
            allow_redirects=True,
        )
    except Exception as e:
        return f"<h3>Connection error: {e}</h3>", 502

    headers = {k: v for k, v in resp.headers.items()
               if k.lower() not in STRIP_HEADERS}
    headers['Content-Type'] = resp.headers.get('Content-Type', 'text/html')

    ct = headers.get('Content-Type', '')

    if 'text/html' in ct:
        html = resp.text
        base = urlparse(url)
        origin = f"{base.scheme}://{base.netloc}"
        p = f"/proxy?url={origin}/"

        for attr in ('href', 'src', 'action'):
            html = html.replace(f'{attr}="/', f'{attr}="{p}')
            html = html.replace(f"{attr}='/", f"{attr}='{p}")

        return Response(html, status=resp.status_code, headers=headers)

    return Response(resp.content, status=resp.status_code, headers=headers)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
