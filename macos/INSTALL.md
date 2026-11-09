# Times Square for Mac 1.0.3 — preview

1. Download and unzip `Times-Square-Mac-screensaver.zip`.
2. If updating, exit Screen Saver Preview and System Settings first. Double-click **Times Square.saver** and install for your user.
3. On **macOS Tahoe 26**, open System Settings → Wallpaper → Screen Saver → Custom. Scroll to **Other**, select **Times Square**, and use **Preview** above the list. On older macOS versions, open System Settings → Screen Saver.

This preview is ad-hoc signed, not Apple Developer ID signed or notarized. macOS may block installation. Only approve it through the normal Privacy & Security settings if you trust this download. Do not disable Gatekeeper. A public notarized release will need the project's Apple Developer signing credentials.

If macOS says it cannot verify the download, dismiss the alert and open System Settings → Privacy & Security. Review the entry for Times Square and choose Open Anyway if you trust this preview, authenticate, then finish installation. Repeatedly clicking Install does not grant this exception.

Version 1.0.3 displays the canvas directly, preserving clothing colors without the dark horizontal gaps. It fades in after the artwork is ready and retains the loaded artwork between starts. This version was tested and approved in full-screen Preview on the maintainer’s Mac running macOS Tahoe.

Apple Silicon and Intel are included in one bundle. Minimum deployment target: macOS 12. The native build and WebKit smoke test run on GitHub's macOS runner; testing inside the Screen Saver host on each macOS version and with multiple displays remains necessary. A successful build is not certification of compatibility with every Mac.

It runs entirely offline, with no controls, heart, analytics, account or network service. The first activation starts at the current date/time, then continuously advances at the website's 1× speed (one simulated minute per real second). A full day takes about 24 minutes. Natural seasonal weather, moon phase, pedestrians and traffic follow that advancing calendar. It does not loop a recording or freeze the weather. Stopping pauses the native animation timer; the loaded artwork is retained for the next activation.

To remove it, use the Screen Saver settings or remove `~/Library/Screen Savers/Times Square.saver`. The web artwork and your browser likes are unaffected.

The bundled artwork retains the original third-party rights. See the included notices. This preview does not grant rights to reuse campaign artwork or photography separately.
