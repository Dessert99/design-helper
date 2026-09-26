#!/bin/sh
# Set the plugin version in every manifest, then commit and tag it.
#   scripts/bump-version.sh 0.3.0
# Push afterwards with: git push && git push origin v<version>
set -eu

cd "$(dirname "$0")/.."

new=${1:-}
case $new in
  [0-9]*.[0-9]*.[0-9]*) ;;
  *) echo "usage: $0 <major.minor.patch>" >&2; exit 1 ;;
esac

if git rev-parse -q --verify "refs/tags/v$new" >/dev/null; then
  echo "tag v$new already exists" >&2; exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "commit or stash your changes first" >&2; exit 1
fi

files=".claude-plugin/plugin.json .claude-plugin/marketplace.json .codex-plugin/plugin.json"
for f in $files; do
  sed -i.bak -E "s/(\"version\": *\")[^\"]*\"/\1$new\"/" "$f" && rm "$f.bak"
done

if [ "$(grep -h '"version"' $files | grep -vc "\"$new\"")" != 0 ]; then
  echo "a manifest was not updated:" >&2; grep -n '"version"' $files >&2; exit 1
fi

git add $files
git commit -q -m "Release v$new"
git tag -a "v$new" -m "v$new"
echo "v$new committed and tagged. Push with: git push && git push origin v$new"
