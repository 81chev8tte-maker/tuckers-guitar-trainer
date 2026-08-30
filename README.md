# Tucker's Guitar Trainer

A free, installable Chromebook-friendly Progressive Web App for learning electric guitar.

## Current features
- Beginner lesson path with local progress tracking
- Personal tab library stored in IndexedDB on the device
- Guitar Pro 3–8 / GPX and MusicXML rendering + playback through alphaTab 1.8.4
- Plain text / ASCII tab import
- Chromatic microphone tuner
- Metronome
- Starter chord library
- 10-minute practice timer and achievements
- Curated external links for finding tabs
- PWA manifest and service worker for install/offline use

## Privacy / content model
The repository contains no commercial song tabs. Imported files are stored in the user's browser and are not uploaded to GitHub.

## GitHub Pages
Once this repository exists, publish from the root of the `main` branch using GitHub Pages. No build step is required.

## Notes
- Microphone tuner requires HTTPS (GitHub Pages provides this).
- alphaTab is loaded from jsDelivr and pinned to version 1.8.4.
- The service worker caches the app shell and runtime resources after first use.
