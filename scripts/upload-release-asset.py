#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一键上传桌面版安装包到 GitHub Release。

适用场景：本地网络对超大文件（>100MB）上传受限时，换网络后运行本脚本即可上传。

用法：
  1. 设置 GitHub token：set GITHUB_TOKEN=你的token
  2. python scripts/upload-release-asset.py

说明：会读取 desktop/release/PaceOn Setup 1.0.0.exe 并上传到仓库的最新 Release。
"""
import json
import os
import sys
import time
import urllib.request
import urllib.parse

TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
REPO = "JustPlayinger/PaceOn"
TAG = os.environ.get("PACEON_RELEASE_TAG", "v1.0.0")
ASSET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "desktop", "release", "PaceOn Setup 1.0.0.exe")
NAME = "PaceOn-Setup-1.0.0.exe"


def api(method, url, data=None, headers=None, timeout=60):
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "User-Agent": "paceon",
            "Accept": "application/vnd.github+json",
            **(headers or {}),
        },
    )
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8"))


def main():
    if not TOKEN:
        print("请先设置环境变量 GITHUB_TOKEN（你的 GitHub Personal Access Token）")
        print("  Windows: set GITHUB_TOKEN=ghp_xxx")
        print("  macOS/Linux: export GITHUB_TOKEN=ghp_xxx")
        sys.exit(1)
    if not os.path.exists(ASSET):
        print(f"未找到安装包：{ASSET}")
        print("请先运行 scripts/build-desktop.ps1 构建桌面版")
        sys.exit(1)

    # 查询 Release
    rel = api("GET", f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}")
    print(f"Release: {rel['tag_name']}  id={rel['id']}")

    # 上传
    size = os.path.getsize(ASSET)
    print(f"上传 {NAME}（{size/1024/1024:.1f} MB）...")
    with open(ASSET, "rb") as f:
        data = f.read()
    url = f"https://uploads.github.com/repos/{REPO}/releases/{rel['id']}/assets?name={urllib.parse.quote(NAME)}"

    for attempt in range(5):
        try:
            r = api(
                "POST",
                url,
                data=data,
                headers={"Content-Type": "application/octet-stream"},
                timeout=3600,
            )
            print(f"✅ 上传成功：{r['name']}  state={r['state']}")
            print(f"下载地址：{r['browser_download_url']}")
            return
        except Exception as e:
            print(f"  第 {attempt + 1} 次尝试失败：{e}")
            time.sleep(15)
    print("上传失败。请检查网络后重试，或确认 token 有 repo 权限。")
    sys.exit(1)


if __name__ == "__main__":
    main()
