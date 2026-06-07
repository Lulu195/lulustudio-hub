#!/bin/sh
# Mirror the latest GitHub release's assets (a Velopack feed) into a destination dir.
# Used by the GitHub Pages workflow: the token lives in Actions secrets, stays server-side,
# and is never shipped to clients. Also runnable locally for testing.
#
#   FEED_REPO=owner/repo FEED_TOKEN=ghp_xxx ./mirror-feed.sh ./out/apx/feed
set -eu

: "${FEED_REPO:?set FEED_REPO=owner/repo}"
: "${FEED_TOKEN:?set FEED_TOKEN to a read-only Contents PAT}"
DEST="${1:?usage: mirror-feed.sh <dest-dir>}"

api="https://api.github.com/repos/${FEED_REPO}"
auth="Authorization: Bearer ${FEED_TOKEN}"
mkdir -p "$DEST"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Latest non-prerelease release and its assets.
curl -fsSL -H "$auth" -H "Accept: application/vnd.github+json" "$api/releases/latest" > "$tmp/rel.json"

count=0
# shellcheck disable=SC2030
jq -r '.assets[] | "\(.id)\t\(.name)"' "$tmp/rel.json" | while IFS="$(printf '\t')" read -r id name; do
    # Download to a .part then atomically rename so a half-written file is never served.
    curl -fsSL -H "$auth" -H "Accept: application/octet-stream" \
        "$api/releases/assets/${id}" -o "$DEST/${name}.part"
    mv -f "$DEST/${name}.part" "$DEST/${name}"
    count=$((count + 1))
    echo "  + ${name}"
done

echo "mirrored $(jq -r '.tag_name // "?"' "$tmp/rel.json") (${FEED_REPO}) -> $DEST"
