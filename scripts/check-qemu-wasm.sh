#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for target in aarch64 x86_64; do
  dir="$ROOT/webdroid/runtime/$target"
  test -s "$dir/out.js" || { echo "Missing $dir/out.js" >&2; exit 1; }
  test -s "$dir/qemu-system-$target.wasm" || { echo "Missing wasm for $target" >&2; exit 1; }
done
echo "Both QEMU WebAssembly JS/WASM outputs exist."
