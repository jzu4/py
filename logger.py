import json
import uuid
import os
import sys
from flask import Flask, request, redirect
from datetime import datetime

LINKS_FILE = "links.json"
VISITS_FILE = "visits.json"

app = Flask(__name__)

def load_links():
    if os.path.exists(LINKS_FILE):
        with open(LINKS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_links(links):
    with open(LINKS_FILE, "w") as f:
        json.dump(links, f, indent=2, ensure_ascii=False)

def load_visits():
    if os.path.exists(VISITS_FILE):
        with open(VISITS_FILE, "r") as f:
            return json.load(f)
    return []

def save_visits(visits):
    with open(VISITS_FILE, "w") as f:
        json.dump(visits, f, indent=2, ensure_ascii=False)

@app.route("/<code>")
def redirect_and_log(code):
    links = load_links()
    url = links.get(code)
    if not url:
        return "الرابط غير موجود", 404

    ip = request.remote_addr
    user_agent = request.headers.get("User-Agent")
    now = datetime.now().isoformat()

    visit = {
        "code": code,
        "url": url,
        "ip": ip,
        "user_agent": user_agent,
        "time": now
    }
    visits = load_visits()
    visits.append(visit)
    save_visits(visits)

    return redirect(url)

def cli():
    if len(sys.argv) < 2:
        print("استخدام: python logger.py [create|logs|serve] ...")
        return

    cmd = sys.argv[1]
    if cmd == "create":
        if len(sys.argv) < 3:
            print("يرجى تزويد الرابط: python logger.py create https://google.com")
            return
        url = sys.argv[2]
        code = str(uuid.uuid4())[:8]
        links = load_links()
        links[code] = url
        save_links(links)
        print(f"تم إنشاء الرابط:\n  http://YOUR_DOMAIN/{code}")
    elif cmd == "logs":
        visits = load_visits()
        if not visits:
            print("لا توجد زيارات بعد")
            return
        for v in visits[::-1]:
            print(f"{v['time']} | {v['ip']} | {v['url']} | {v['user_agent']}")
    elif cmd == "serve":
        app.run(host="0.0.0.0", port=5000)
    else:
        print("أمر غير معروف! الأوامر: create, logs, serve")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ["create", "logs", "serve"]:
        cli()
    else:
        app.run(host="0.0.0.0", port=5000)
