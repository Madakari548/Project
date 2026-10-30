#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${WEB_DROID_BUILD_DIR:-$ROOT/.build/qemu-wasm}"
SRC="$WORK/source"
IMAGE="webdroid-qemu-wasm-build"
CONTAINER="webdroid-qemu-wasm-build-$$"
OUT="$ROOT/webdroid/runtime"

command -v docker >/dev/null || { echo "Docker is required." >&2; exit 2; }
mkdir -p "$WORK" "$OUT"

if [[ ! -d "$SRC/.git" ]]; then
  git clone --depth 1 https://github.com/justinmeza/qemu-wasm.git "$SRC"
else
  git -C "$SRC" fetch --depth 1 origin
  git -C "$SRC" reset --hard FETCH_HEAD
fi
UPSTREAM_SHA="$(git -C "$SRC" rev-parse HEAD)"
echo "Building upstream qemu-wasm revision: $UPSTREAM_SHA"

docker build --pull -t "$IMAGE" "$SRC"
docker run -d --name "$CONTAINER" -v "$SRC:/qemu:ro" "$IMAGE" >/dev/null
cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

COMMON_FLAGS="-O3 -g -Wno-error=unused-command-line-argument -matomics -mbulk-memory -DNDEBUG -DG_DISABLE_ASSERT -D_GNU_SOURCE -sASYNCIFY=1 -pthread -sPROXY_TO_PTHREAD=1 -sFORCE_FILESYSTEM -sALLOW_TABLE_GROWTH -sTOTAL_MEMORY=2300MB -sWASM_BIGINT -sMALLOC=mimalloc --js-library=/build/node_modules/xterm-pty/emscripten-pty.js -sEXPORT_ES6=1 -sASYNCIFY_IMPORTS=ffi_call_js"
EXTRA_LDFLAGS="-sEXPORTED_RUNTIME_METHODS=getTempRet0,setTempRet0,addFunction,removeFunction,TTY,FS"

build_target() {
  local target="$1"
  local qemu_name="$2"
  local build_dir="/build/$target"
  echo "=== Configuring $target ==="
  docker exec "$CONTAINER" bash -lc "mkdir -p '$build_dir' && cd '$build_dir' && EXTRA_CFLAGS='$COMMON_FLAGS' emconfigure /qemu/configure --static --target-list='$target-softmmu' --cpu=wasm32 --cross-prefix= --without-default-features --enable-system --with-coroutine=fiber --enable-virtfs --extra-cflags='$COMMON_FLAGS' --extra-cxxflags='$COMMON_FLAGS' --extra-ldflags='$EXTRA_LDFLAGS'"
  echo "=== Building $qemu_name ==="
  docker exec "$CONTAINER" bash -lc "cd '$build_dir' && emmake make -j2 '$qemu_name'"
  mkdir -p "$OUT/$target"
  docker cp "$CONTAINER:$build_dir/$qemu_name" "$OUT/$target/out.js"
  for suffix in wasm worker.js data; do
    file="$build_dir/$qemu_name.$suffix"
    if docker exec "$CONTAINER" test -f "$file"; then
      docker cp "$CONTAINER:$file" "$OUT/$target/$qemu_name.$suffix"
    fi
  done
}

build_target aarch64 qemu-system-aarch64
build_target x86_64 qemu-system-x86_64

printf '%s\n' "$UPSTREAM_SHA" > "$OUT/UPSTREAM_COMMIT.txt"
cat > "$OUT/BUILD_INFO.txt" <<EOF
Upstream: https://github.com/justinmeza/qemu-wasm
Commit: $UPSTREAM_SHA
Built: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Targets: aarch64-softmmu, x86_64-softmmu
Note: These are QEMU engines, not Android system images. No Android guest has been validated by this build.
EOF
echo "QEMU WebAssembly build outputs are in webdroid/runtime/."
