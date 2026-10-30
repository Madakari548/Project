#!/usr/bin/env python3
"""Fetch and safely inspect the upstream LineageOS QEMU VM release archives."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
import urllib.request
import zipfile

API = "https://api.github.com/repos/jqssun/android-lineage-qemu/releases/latest"
OUT = Path(os.environ.get("ANDROID_GUEST_OUT", "android-guest-assets")).resolve()
OUT.mkdir(parents=True, exist_ok=True)

def fetch_json(url: str):
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "WebDroid-Android-guest-research"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)

def download(url: str, destination: Path) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "WebDroid-Android-guest-research"})
    digest = hashlib.sha256()
    with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            output.write(chunk)
            digest.update(chunk)
    return digest.hexdigest()

def safe_extract(archive: Path, destination: Path):
    destination.mkdir(parents=True, exist_ok=True)
    root = destination.resolve()
    extracted = []
    with zipfile.ZipFile(archive) as bundle:
        for info in bundle.infolist():
            name = PurePosixPath(info.filename)
            if name.is_absolute() or ".." in name.parts:
                raise RuntimeError(f"Unsafe path in upstream archive: {info.filename}")
            mode = info.external_attr >> 16
            if mode and (mode & 0o170000) == 0o120000:
                raise RuntimeError(f"Symlink in upstream archive is not accepted: {info.filename}")
            target = (destination / Path(*name.parts)).resolve()
            if target != root and root not in target.parents:
                raise RuntimeError(f"Archive path escapes extraction root: {info.filename}")
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(info) as source, target.open("wb") as output:
                while True:
                    chunk = source.read(1024 * 1024)
                    if not chunk:
                        break
                    output.write(chunk)
            extracted.append({"path": str(target.relative_to(root)), "size": target.stat().st_size})
    return extracted

release = fetch_json(API)
assets = release.get("assets", [])
targets = {
    "arm64": lambda n: "UTM-VM" in n and "arm64only" in n,
    "x86_64": lambda n: "UTM-VM" in n and "x86_64" in n,
}
report = {"release": release.get("tag_name"), "release_url": release.get("html_url"), "guests": {}}
for arch, predicate in targets.items():
    matches = [asset for asset in assets if predicate(asset["name"]) and asset["name"].lower().endswith(".zip")]
    if not matches:
        available = [asset["name"] for asset in assets]
        raise RuntimeError(f"No UTM VM archive found for {arch}. Release assets: {available}")
    asset = max(matches, key=lambda item: item.get("size", 0))
    archive = OUT / asset["name"]
    print(f"Downloading {arch}: {asset['name']} ({asset.get('size', 0)} bytes)", flush=True)
    digest = download(asset["browser_download_url"], archive)
    expected = asset.get("digest")
    if expected and expected.startswith("sha256:") and digest.lower() != expected.split(":", 1)[1].lower():
        raise RuntimeError(f"SHA-256 mismatch for {asset['name']}")
    destination = OUT / arch
    extracted = safe_extract(archive, destination)
    archive.unlink()
    qcow = [item for item in extracted if item["path"].lower().endswith((".qcow2", ".qcow"))]
    firmware = [item for item in extracted if item["path"].lower().endswith((".fd", ".efi", ".rom"))]
    if len(qcow) < 2:
        raise RuntimeError(f"Expected at least two qcow2 disks for {arch}; found {len(qcow)}")
    report["guests"][arch] = {
        "asset": asset["name"],
        "asset_size": asset.get("size"),
        "sha256": digest,
        "qcow2_disks": qcow,
        "firmware_files": firmware,
        "file_count": len(extracted),
        "files": extracted,
    }
    print(f"Extracted {arch}: {len(qcow)} qcow2 disk(s), {len(firmware)} firmware file(s)", flush=True)

(OUT / "ANDROID_GUEST_ASSETS.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({k: {"asset": v["asset"], "qcow2_disks": v["qcow2_disks"], "firmware_files": v["firmware_files"]} for k, v in report["guests"].items()}, indent=2))
