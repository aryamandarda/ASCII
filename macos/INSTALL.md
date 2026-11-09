# Times Square for Mac — preview

1. Download and unzip `Times-Square-Mac-screensaver.zip`.
2. Double-click **Times Square.saver** and install for your user.
3. Open System Settings → Screen Saver, select **Times Square**, and Preview.

This preview is ad-hoc signed, not Apple Developer ID signed or notarized. macOS may block installation. Only approve it through the normal Privacy & Security settings if you trust this download. Do not disable Gatekeeper. A public notarized release will need the project's Apple Developer signing credentials.

Apple Silicon and Intel are included in one bundle. Minimum deployment target: macOS 12. The native build and WebKit smoke test run on GitHub's macOS runner; testing inside the Screen Saver host on each macOS version and with multiple displays remains necessary. A successful build is not certification of compatibility with every Mac.

It runs entirely offline, with no controls, heart, analytics, account or network service. Each activation starts at the current date/time, then continuously advances at the website's 1× speed (one simulated minute per real second). A full day takes about 24 minutes. Natural seasonal weather, moon phase, pedestrians and traffic follow that advancing calendar. It does not loop a recording or freeze the weather. Stopping the screensaver releases its web view and animation worker.

To remove it, use the Screen Saver settings or remove `~/Library/Screen Savers/Times Square.saver`. The web artwork and your browser likes are unaffected.

The bundled artwork retains the original third-party rights. See the included notices. This preview does not grant rights to reuse campaign artwork or photography separately.
