#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${WEB_DROID_BUILD_DIR:-$ROOT/.build/qemu-wasm}"
QEMU_SRC="$WORK/qemu-wasm"
DEMO_SRC="$WORK/qemu-wasm-demo"
OUT="$ROOT/webdroid/runtime"
BUILD_CONTAINER_NAME="build-qemu-wasm-demo"

command -v docker >/dev/null || { echo "Docker is required." >&2; exit 2; }
command -v git >/dev/null || { echo "Git is required." >&2; exit 2; }
mkdir -p "$WORK"

clone_or_update() {
  local url="$1"
  local dir="$2"
  if [[ ! -d "$dir/.git" ]]; then
    git clone --depth 1 "$url" "$dir"
  else
    git -C "$dir" fetch --depth 1 origin
    git -C "$dir" reset --hard FETCH_HEAD
  fi
}
clone_or_update https://github.com/ktock/qemu-wasm.git "$QEMU_SRC"
clone_or_update https://github.com/ktock/qemu-wasm-demo.git "$DEMO_SRC"

QEMU_SHA="$(git -C "$QEMU_SRC" rev-parse HEAD)"
DEMO_SHA="$(git -C "$DEMO_SRC" rev-parse HEAD)"
echo "QEMU Wasm revision: $QEMU_SHA"
echo "QEMU Wasm demo revision: $DEMO_SHA"

# The upstream demo build is used as the integration smoke test. It compiles
# both guest architectures and creates bootable Linux test images for each.
rm -rf "$DEMO_SRC/out" "$OUT"
mkdir -p "$OUT"
cleanup() {
  docker rm -f "$BUILD_CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

CI_SCRIPT="$WORK/create-images-ci.sh"
sed 's/docker exec -it/docker exec/g' "$DEMO_SRC/create-images.sh" > "$CI_SCRIPT"
chmod +x "$CI_SCRIPT"
(
  cd "$DEMO_SRC"
  QEMU_WASM_REPO="$QEMU_SRC" bash "$CI_SCRIPT"
)
cp -a "$DEMO_SRC/out/." "$OUT/"

cat > "$OUT/BUILD_INFO.txt" <<EOF2
QEMU Wasm source: https://github.com/ktock/qemu-wasm
QEMU Wasm commit: $QEMU_SHA
QEMU demo source: https://github.com/ktock/qemu-wasm-demo
QEMU demo commit: $DEMO_SHA
Built: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Guest smoke images:
- ARM64 Raspberry Pi 3A+ / BusyBox Linux
- x86_64 PC / Alpine Linux
These are Linux smoke-test guests, not Android system images.
EOF2

echo "QEMU Wasm engines and Linux smoke-test guests are in webdroid/runtime/."
