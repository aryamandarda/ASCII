#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Build on macOS with Xcode Command Line Tools.' >&2
  exit 1
fi
output="${1:-build/macos}"
bundle="$output/Times Square.saver"
mkdir -p "$bundle/Contents/MacOS" "$bundle/Contents/Resources"
python3 macos/prepare.py "$bundle/Contents/Resources/Artwork"
cp macos/Info.plist "$bundle/Contents/Info.plist"
cp macos/thumbnail.png "$bundle/Contents/Resources/thumbnail@2x.png"
sips -z 116 180 macos/thumbnail.png --out "$bundle/Contents/Resources/thumbnail.png" >/dev/null
sips -s format tiff macos/thumbnail.png --out "$bundle/Contents/Resources/thumbnail.tiff" >/dev/null
xcrun clang -fobjc-arc -fmodules -Wall -Wextra -Werror -arch arm64 -arch x86_64 \
  -mmacosx-version-min=12.0 -bundle macos/TimesSquareView.m \
  -framework Cocoa -framework ScreenSaver -framework WebKit \
  -o "$bundle/Contents/MacOS/TimesSquare"
codesign --force --sign - "$bundle"
codesign --verify --strict "$bundle"
lipo "$bundle/Contents/MacOS/TimesSquare" -verify_arch arm64 x86_64
cp macos/INSTALL.md "$output/INSTALL.md"
cp THIRD_PARTY_NOTICES.md "$output/THIRD_PARTY_NOTICES.md"
(cd "$output" && mkdir -p 'Times Square for Mac' && cp INSTALL.md THIRD_PARTY_NOTICES.md 'Times Square for Mac/' && ditto 'Times Square.saver' 'Times Square for Mac/Times Square.saver' && ditto -c -k --sequesterRsrc --keepParent 'Times Square for Mac' Times-Square-Mac-screensaver.zip)
echo "Built $output/Times-Square-Mac-screensaver.zip"
