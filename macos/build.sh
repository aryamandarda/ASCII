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
xcrun clang -fobjc-arc -fmodules -Wall -Wextra -Werror -arch arm64 -arch x86_64 \
  -mmacosx-version-min=12.0 -bundle macos/TimesSquareView.m \
  -framework Cocoa -framework ScreenSaver -framework WebKit \
  -o "$bundle/Contents/MacOS/TimesSquare"
codesign --force --sign - "$bundle"
codesign --verify --strict "$bundle"
lipo -verify_arch arm64 x86_64 "$bundle/Contents/MacOS/TimesSquare"
cp macos/INSTALL.md "$output/INSTALL.md"
cp THIRD_PARTY_NOTICES.md "$output/THIRD_PARTY_NOTICES.md"
(cd "$output" && ditto -c -k --sequesterRsrc --keepParent 'Times Square.saver' Times-Square-Mac-screensaver.zip)
echo "Built $output/Times-Square-Mac-screensaver.zip"
