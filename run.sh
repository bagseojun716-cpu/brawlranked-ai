#!/bin/sh
# macOS / Linux: 브롤 픽 AI 실행
cd "$(dirname "$0")/brawl-ai" && (open index.html 2>/dev/null || xdg-open index.html)
