#!/usr/bin/env sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
extension_dir="$repo_root/extension"
manifest_path="$extension_dir/manifest.json"
dist_dir="$repo_root/dist"

if [ ! -f "$manifest_path" ]; then
  echo "Missing extension manifest: $manifest_path" >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "The zip command is required to package the extension." >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  version=$(jq -r '.version // empty' "$manifest_path")
elif command -v ruby >/dev/null 2>&1; then
  version=$(ruby -r json -e 'print JSON.parse(File.read(ARGV[0]))["version"]' "$manifest_path")
else
  version=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$manifest_path" | head -n 1)
fi

if [ -z "${version:-}" ]; then
  echo "Could not read extension version from $manifest_path" >&2
  exit 1
fi

package_name="daily-video-limit-v$version.zip"
package_path="$dist_dir/$package_name"
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/daily-video-limit-package.XXXXXX")

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT INT HUP TERM

mkdir -p "$dist_dir"

(
  cd "$extension_dir"
  zip -qr "$tmp_dir/$package_name" .
)

mv "$tmp_dir/$package_name" "$package_path"
echo "Created $package_path"
