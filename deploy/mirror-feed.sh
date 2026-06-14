#!/bin/sh
# Mirror the latest GitHub release's assets (a Velopack feed) into a destination dir.
# Used by the GitHub Pages workflow. Also runnable locally for testing.
#
#   FEED_REPO=owner/repo [FEED_TOKEN=ghp_xxx] ./mirror-feed.sh ./out/apx/feed
#
# FEED_TOKEN is optional for public repositories.
set -eu

: "${FEED_REPO:?set FEED_REPO=owner/repo}"
DEST="${1:?usage: mirror-feed.sh <dest-dir>}"

api="https://api.github.com/repos/${FEED_REPO}"
auth_header=""
if [ -n "${FEED_TOKEN:-}" ]; then
    auth_header="Authorization: Bearer ${FEED_TOKEN}"
fi
mkdir -p "$DEST"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Latest non-prerelease release and its assets.
if [ -n "$auth_header" ]; then
    curl -fsSL -H "$auth_header" -H "Accept: application/vnd.github+json" "$api/releases/latest" > "$tmp/rel.json"
else
    curl -fsSL -H "Accept: application/vnd.github+json" "$api/releases/latest" > "$tmp/rel.json"
fi

jq -r '.assets[] | "\(.id)\t\(.name)"' "$tmp/rel.json" | while IFS="$(printf '\t')" read -r id name; do
    if [ -n "$auth_header" ]; then
        curl -fsSL -H "$auth_header" -H "Accept: application/octet-stream" \
            "$api/releases/assets/${id}" -o "$DEST/${name}.part"
    else
        curl -fsSL -H "Accept: application/octet-stream" \
            "$api/releases/assets/${id}" -o "$DEST/${name}.part"
    fi
    mv -f "$DEST/${name}.part" "$DEST/${name}"
    echo "  + ${name}"
done

echo "mirrored $(jq -r '.tag_name // "?"' "$tmp/rel.json") (${FEED_REPO}) -> $DEST"
