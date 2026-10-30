# Third-party notices for the QEMU browser smoke tests

## QEMU Wasm

- Source: https://github.com/ktock/qemu-wasm
- License: QEMU is primarily GNU GPL version 2 or later, with per-file licensing exceptions and separate firmware licenses. See the upstream `LICENSE`, `COPYING`, and source-file headers.
- The compiled QEMU binaries are produced by the build workflow from the upstream source; this repository does not vendor those binaries in Git.

## QEMU Wasm demo integration

- Source: https://github.com/ktock/qemu-wasm-demo
- License: Apache License 2.0.
- The guest launch arguments and browser integration approach in these smoke-test pages are adapted from the upstream demo.

## COOP/COEP service worker

- Source: https://github.com/gzuidhof/coi-serviceworker
- Version: v0.1.6
- License: MIT.
- The local copy is adapted for the WebDroid static-site path.

## Terminal libraries loaded by the test pages

- xterm.js: https://github.com/xtermjs/xterm.js — MIT License.
- xterm-pty: https://github.com/mame/xterm-pty — MIT License.

## Linux smoke-test guest

- Raspberry Pi kernel source used by the upstream image recipe: https://github.com/raspberrypi/linux
- The upstream recipe builds a BusyBox-based ARM64 guest and an Alpine Linux x86_64 guest. These are test operating systems only, not Android images.
- Guest image contents retain their respective upstream licenses and package notices.

## Android guest candidate (not bundled)

- Project: https://github.com/jqssun/android-lineage-qemu
- Builder repository license: GPL-3.0.
- Android guest candidate: LineageOS 24.0 virtual-machine builds for ARM64 and x86_64.
- The guest archives are downloaded only as temporary CI artifacts for compatibility research; they are not committed to this repository or redistributed by WebDroid.
- LineageOS and Android components have their own licenses and trademark terms. Review the exact notices shipped in each downloaded image before any redistribution.
- Google Apps / Google Play services are not included in the open-source VM build and must not be bundled without appropriate authorization and licensing.
