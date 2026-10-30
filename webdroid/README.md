# WebDroid

WebDroid is an experimental project to build an Android virtualization environment that runs in a web browser.

## Current status: 0.1.0 preview

The first committed milestone is a browser-openable workspace UI:
- Device profile management (up to four in this preview)
- APK file storage in IndexedDB
- Explicit status indicators for features that are not implemented yet

**This is not yet an Android emulator.** APK files are stored locally but are not installed or executed. The Android virtualization engine has not been integrated.

## Open locally

Open `webdroid/index.html` in a modern desktop browser. The UI uses no build step and no external JavaScript packages. IndexedDB requires a browser context that permits local-file storage.

## Technical direction

A real implementation needs a browser-compatible CPU/VM engine, Android boot images and kernel, block storage, input/display/audio/network adapters, and a supported APK installation path. ARM64 and x86_64 guest support must be validated against the selected engine; it cannot be assumed from the UI. Google Play services are proprietary and require separate compatibility, licensing, and authentication considerations.

See [ENGINE_PLAN.md](./ENGINE_PLAN.md) before selecting or integrating an emulator core.
