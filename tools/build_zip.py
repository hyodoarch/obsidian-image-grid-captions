"""Build an installable Obsidian release ZIP after npm run check."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
package = json.loads((root / "package.json").read_text(encoding="utf-8"))
assert manifest["version"] == package["version"], "Version mismatch"
files = ["main.js", "manifest.json", "styles.css", "LICENSE", "README.md"]
for name in files:
    assert (root / name).is_file(), f"Missing {name}; run npm run check first"
out = root / "release" / f"{manifest['id']}-{manifest['version']}.zip"
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, f"{manifest['id']}/{name}")
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    for name in files:
        assert archive.read(f"{manifest['id']}/{name}") == (root / name).read_bytes()
digest = hashlib.sha256(out.read_bytes()).hexdigest()
out.with_suffix(out.suffix + ".sha256").write_text(f"{digest}  {out.name}\n", encoding="utf-8")
print(f"Verified {out.name}: {digest}")
