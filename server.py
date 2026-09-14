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
]

# cookie jar so login sessions persist
cookie_store = {}

@app.route('/')
def home():
    return open('index.html').read()

@app.route('/proxy', methods=['GET', 'POST', 'OPTIONS'])
def proxy():
    url = request.args.get('url', '')
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    base_url = urlparse(url)
    origin = f"{base_url.scheme}://{base_url.netloc}"
    domain = base_url.netloc

    # forward cookies for this domain
    cookies = cookie_store.get(domain, {})

    try:
        if request.method == 'POST':
            resp = requests.post(
                url,
                headers={
                    'User-Agent': request.headers.get('User-Agent', ''),
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': origin,
                    'Origin': origin,
                    'Content-Type': request.headers.get('Content-Type', 'application/x-www-form-urlencoded'),
                },
                data=request.get_data(),
                cookies=cookies,
                timeout=15,
                allow_redirects=True,
            )
        else:
            resp = requests.get(
                url,
                headers={
                    'User-Agent': request.headers.get('User-Agent', ''),
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                cookies=cookies,
                timeout=15,
                allow_redirects=True,
            )
    except Exception as e:
        return f"<h3>Connection error: {e}</h3>", 502

    # store cookies from response
    if resp.cookies:
        cookie_store.setdefault(domain, {}).update(resp.cookies.get_dict())

    headers = {k: v for k, v in resp.headers.items()
               if k.lower() not in STRIP_HEADERS}
    headers['Content-Type'] = resp.headers.get('Content-Type', 'text/html')

    ct = headers.get('Content-Type', '')

    if 'text/html' in ct:
        html = resp.text
        p = f"/proxy?url={origin}/"

        for attr in ('href', 'src', 'action', 'poster'):
            html = html.replace(f'{attr}="/', f'{attr}="{p}')
            html = html.replace(f"{attr}='/", f"{attr}='{p}")

        # rewrite srcset URLs
        import re
        html = re.sub(r'srcset="(/[^"]*)"', f'srcset="{p}\\1"', html)

        # rewrite fetch/XHR calls in inline JS to go through proxy
        html = html.replace("fetch('/", f"fetch('{p}")
        html = html.replace("fetch(\"/", f"fetch(\"{p}")

        return Response(html, status=resp.status_code, headers=headers)

    return Response(resp.content, status=resp.status_code, headers=headers)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
