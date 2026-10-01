#!/usr/bin/env python3
"""검색엔진용 파일 생성기.

data/skills.json 을 읽어서 다음을 만든다 (다시 실행해도 같은 결과):
  - skills/<id>.html : 기술별 안내 페이지 (자바스크립트 없이 내용이 보이는 정적 HTML)
  - sitemap.xml      : 구글 서치 콘솔에 제출할 사이트맵
  - index.html       : <!-- SEO:HEAD --> / <!-- SEO:LINKS --> 표시 사이에 검색용 태그와 기술 링크를 채움

사용법:  python3 skill-locker/tools/build_seo.py
구글 서치 콘솔 'HTML 태그' 인증 값이 있으면 GOOGLE_VERIFICATION 에 넣고 다시 실행한다.
"""
import datetime
import html
import json
import pathlib
import re

SITE = "https://bagseojun716-cpu.github.io/brawlranked-ai/skill-locker/"
APP_FULL = "https://claude.ai/artifact/VoSPHXCaaVwAfh5MBJycf3"
SITE_NAME = "개인기 락커룸"
SITE_TITLE = "개인기 락커룸 · 축구 개인기 배우는 법과 실제 사용 장면"
SITE_DESC = ("헛다리, 크루이프 턴, 마르세유 턴, 엘라스티코, 라보나 등 축구 개인기를 "
             "발 동작 그림과 단계별 설명, 실제 선수 사용 사례, 따라하기 영상으로 정리한 개인기 모음.")
GOOGLE_VERIFICATION = ""  # 서치 콘솔 HTML 태그의 content 값

ROOT = pathlib.Path(__file__).resolve().parent.parent
CAT_COLOR = {"페인트": "#2a78d6", "턴": "#eb6834", "볼 컨트롤": "#1baf7a",
             "플릭·리프트": "#c98500", "킥": "#d55181", "프리스타일": "#4a3aa7"}
STATS = [("trick", "속임수", "속임형"), ("speed", "스피드", "돌파형"),
         ("flair", "화려함", "쇼맨형"), ("practical", "실전성", "실전형")]
PATTERN = {"cut": "방향 꺾기", "spin": "360° 회전", "shift": "좌우 이동",
           "lift": "머리 위로", "strike": "슈팅·크로스", "juggle": "공중 유지"}

e = lambda t: html.escape(str(t or ""), quote=True)


def persona(s):
    st = s.get("stats") or {}
    best = max(STATS, key=lambda x: st.get(x[0]) or 0)
    return best[2] if st.get(best[0]) else ""


def foot(s):
    return "양발" if s.get("foot") in (None, "", "양발") else "한발"


def similar(s, skills):
    scored = []
    for o in skills:
        if o["id"] == s["id"]:
            continue
        sc = (3 if o.get("pattern") == s.get("pattern") else 0) + (2 if o.get("category") == s.get("category") else 0)
        sc += 2 if persona(o) and persona(o) == persona(s) else 0
        if sc:
            scored.append((sc, o))
    picked = [o for o in skills if o["id"] in (s.get("similarIds") or [])]
    rest = [o for _, o in sorted(scored, key=lambda x: -x[0]) if o not in picked]
    return (picked + rest)[:3]


PAGE_CSS = """
:root{--bg:#F2F4EE;--surface:#fff;--ink:#16201A;--ink-2:#4C5A50;--line:#D3D9CE;--pitch:#1E6B45;--card:#E3A900}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0E1511;--surface:#16201A;--ink:#E4EBE5;--ink-2:#9AAA9F;--line:#2A382F;--pitch:#3FA46E;--card:#F2C230}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 "IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;padding:0 16px 48px}
a{color:var(--pitch)}
.top{max-width:760px;margin:0 auto;height:60px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.brand{font-weight:700;text-decoration:none;color:var(--ink)}
main{max-width:760px;margin:0 auto}
.crumb{font-size:13px;color:var(--ink-2);margin:20px 0 4px}
h1{font-size:clamp(28px,5vw,36px);line-height:1.2;margin:0}
.en{color:var(--ink-2);font-weight:600;margin:2px 0 10px}
.meta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 18px;padding:0;list-style:none}
.meta li{font-size:13px;padding:2px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--line)}
.meta li.cat{color:#fff;border-color:transparent}
figure{margin:0 0 6px;border-radius:14px;overflow:hidden;background:var(--surface)}
figure img{display:block;width:100%;height:auto;aspect-ratio:17/11;object-fit:cover}
figcaption{font-size:13px;color:var(--ink-2);padding:8px 2px 0}
.credit{font-size:12px;color:var(--ink-2);margin:0 0 20px}
h2{font-size:19px;margin:28px 0 10px}
ol.steps{padding-left:22px;margin:0}
ol.steps li{margin:6px 0}
.tip{border-left:3px solid var(--pitch);padding:2px 0 2px 12px;color:var(--ink-2);margin:0}
ul.cases{list-style:none;padding:0;margin:0;display:grid;gap:8px}
ul.cases li{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.when{font-size:13px;color:var(--ink-2)}
table{border-collapse:collapse;width:100%;max-width:420px}
td,th{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);font-size:15px}
.cta{display:inline-block;margin-top:26px;padding:10px 18px;border-radius:999px;background:var(--ink);color:var(--bg);text-decoration:none;font-weight:600}
.related{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}
.related a{display:inline-block;padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);text-decoration:none;color:var(--ink)}
footer{max-width:760px;margin:40px auto 0;padding-top:16px;border-top:1px solid var(--line);font-size:13px;color:var(--ink-2)}
"""


def skill_page(s, skills, today):
    sid, url = s["id"], f"{SITE}skills/{s['id']}.html"
    title = f"{s['name']}" + (f" ({s['nameEn']})" if s.get("nameEn") else "") + " 하는 법 · 개인기 락커룸"
    desc = (s.get("summary") or "") + " 단계별 따라하는 순서, 실전 팁, 실제 선수 사용 사례와 영상."
    img = f"{SITE}images/{sid}.jpg"
    steps = s.get("steps") or []
    ld = {
        "@context": "https://schema.org", "@type": "HowTo", "name": f"{s['name']} 하는 법",
        "description": s.get("summary", ""), "image": img, "inLanguage": "ko",
        "step": [{"@type": "HowToStep", "position": i + 1, "text": t} for i, t in enumerate(steps)],
    }
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": SITE_NAME, "item": SITE},
        {"@type": "ListItem", "position": 2, "name": s["name"], "item": url}]}
    st = s.get("stats") or {}
    p = persona(s)
    cases = "".join(
        f'<li><div class="when">{e(c.get("when"))}</div><strong>{e(c.get("who"))}</strong> — {e(c.get("what"))}'
        + (f' <a href="{e(c["url"])}" rel="noopener">장면 영상</a>' if c.get("url") else "") + "</li>"
        for c in (s.get("cases") or []))
    rel = "".join(f'<li><a href="{e(o["id"])}.html">{e(o["name"])}</a></li>' for o in similar(s, skills))
    has_photo = (ROOT / "images" / f"{sid}.jpg").exists()
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
{f'<meta property="og:image" content="{img}">' if has_photo else ''}
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(crumbs, ensure_ascii=False)}</script>
<style>{PAGE_CSS}</style>
</head>
<body>
<header class="top"><a class="brand" href="../">⚽ {SITE_NAME}</a><a href="../#s-{e(sid)}">앱에서 보기</a></header>
<main>
<p class="crumb"><a href="../">{SITE_NAME}</a> › {e(s.get("category"))}</p>
<h1>{e(s["name"])}</h1>
{f'<p class="en">{e(s["nameEn"])}</p>' if s.get("nameEn") else ''}
<ul class="meta">
<li class="cat" style="background:{CAT_COLOR.get(s.get("category"), "#1E6B45")}">{e(s.get("category"))}</li>
{f'<li>{p}</li>' if p else ''}<li>난이도 {e(s.get("difficulty"))}/5</li><li>{foot(s)}</li>
<li>공의 움직임: {e(PATTERN.get(s.get("pattern"), ""))}</li>
{f'<li>대표 선수: {e(s["player"])}</li>' if s.get("player") else ''}
</ul>
{f'''<figure><img src="../images/{e(sid)}.jpg" width="544" height="352" alt="{e(s.get("photoCaption") or s["name"])}">
<figcaption>{e(s.get("photoCaption"))}</figcaption></figure>
<p class="credit">사진: {e(s.get("photoCredit"))}{f' · <a href="{e(s["photoSourceUrl"])}" rel="noopener">원본과 라이선스</a>' if s.get("photoSourceUrl") else ''}</p>''' if has_photo else ''}
<p>{e(s.get("summary"))}</p>
<h2>따라하는 순서</h2>
<ol class="steps">{''.join(f'<li>{e(t)}</li>' for t in steps)}</ol>
{f'<h2>실전 팁</h2><p class="tip">{e(s["tip"])}</p>' if s.get("tip") else ''}
{f'<h2>실제 사용 사례</h2><ul class="cases">{cases}</ul>' if cases else ''}
{f'<h2>따라하기 영상</h2><p><a href="{e(s["videoUrl"])}" rel="noopener">유튜브에서 {e(s["name"])} 강좌 보기</a></p>' if s.get("videoUrl") else ''}
<h2>능력치</h2>
<table><tbody>{''.join(f'<tr><th scope="row">{lab}</th><td>{st.get(k, "-")} / 5</td></tr>' for k, lab, _ in STATS)}</tbody></table>
{f'<h2>비슷한 개인기</h2><ul class="related">{rel}</ul>' if rel else ''}
<a class="cta" href="../#s-{e(sid)}">발 동작 그림과 함께 앱에서 보기</a>
</main>
<footer>
<p>{SITE_NAME} — 축구 개인기를 정리하고 공유하는 곳. 기술 올리기와 좋아요는 <a href="{APP_FULL}" rel="noopener">claude.ai 버전</a>에서 할 수 있어요.</p>
<p>사진 출처는 <a href="https://github.com/bagseojun716-cpu/brawlranked-ai/blob/main/skill-locker/CREDITS.md" rel="noopener">CREDITS.md</a>에 있어요. 마지막 업데이트 {today}.</p>
</footer>
</body>
</html>
"""


def replace_block(text, name, content):
    start, end = f"<!-- SEO:{name}:START -->", f"<!-- SEO:{name}:END -->"
    block = f"{start}\n{content}\n{end}"
    if start in text:
        return re.sub(re.escape(start) + r".*?" + re.escape(end), lambda _: block, text, flags=re.S)
    return None


def main():
    today = datetime.date.today().isoformat()
    skills = json.loads((ROOT / "data" / "skills.json").read_text(encoding="utf-8"))
    out = ROOT / "skills"
    out.mkdir(exist_ok=True)
    for s in skills:
        (out / f"{s['id']}.html").write_text(skill_page(s, skills, today), encoding="utf-8")

    urls = [SITE] + [f"{SITE}skills/{s['id']}.html" for s in skills]
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls)
        + "</urlset>\n", encoding="utf-8")

    first_img = next((f"{SITE}images/{s['id']}.jpg" for s in skills if (ROOT / "images" / f"{s['id']}.jpg").exists()), "")
    site_ld = {"@context": "https://schema.org", "@type": "WebSite", "name": SITE_NAME, "url": SITE,
               "inLanguage": "ko", "description": SITE_DESC}
    list_ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "축구 개인기 목록",
               "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": s["name"],
                                    "url": f"{SITE}skills/{s['id']}.html"} for i, s in enumerate(skills)]}
    head = "\n".join(filter(None, [
        f"<title>{e(SITE_TITLE)}</title>",
        f'<meta name="description" content="{e(SITE_DESC)}">',
        f'<link rel="canonical" href="{SITE}">',
        '<meta name="robots" content="index,follow">',
        f'<meta name="google-site-verification" content="{e(GOOGLE_VERIFICATION)}">' if GOOGLE_VERIFICATION else "",
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{SITE_NAME}">',
        '<meta property="og:locale" content="ko_KR">',
        f'<meta property="og:title" content="{e(SITE_TITLE)}">',
        f'<meta property="og:description" content="{e(SITE_DESC)}">',
        f'<meta property="og:url" content="{SITE}">',
        f'<meta property="og:image" content="{first_img}">' if first_img else "",
        '<meta name="twitter:card" content="summary_large_image">',
        f'<script type="application/ld+json">{json.dumps(site_ld, ensure_ascii=False)}</script>',
        f'<script type="application/ld+json">{json.dumps(list_ld, ensure_ascii=False)}</script>',
    ]))
    links = ('<nav class="seo-links" aria-label="기술별 안내 페이지"><span>기술별 안내</span> '
             + " · ".join(f'<a href="skills/{e(s["id"])}.html">{e(s["name"])}</a>' for s in skills) + "</nav>")

    idx = ROOT / "index.html"
    text = idx.read_text(encoding="utf-8")
    for name, content in (("HEAD", head), ("LINKS", links)):
        new = replace_block(text, name, content)
        if new is None:
            raise SystemExit(f"index.html 에 <!-- SEO:{name}:START --> 표시가 없어요")
        text = new
    idx.write_text(text, encoding="utf-8")
    print(f"{len(skills)}개 기술 페이지, sitemap.xml ({len(urls)}개 주소), index.html 갱신")


if __name__ == "__main__":
    main()
