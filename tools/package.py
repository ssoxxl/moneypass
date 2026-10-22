"""Create an upload-only ZIP without development files or secrets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import subprocess
import sys
import shutil

root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(root/'tools/build.py')], check=True)
out = root/'dist'
out.mkdir(exist_ok=True)
files = list(root.glob('*.html')) + list((root/'assets').rglob('*')) + list((root/'guides').glob('*.html'))
files += [root/'robots.txt']
if (root/'ads.txt').exists(): files.append(root/'ads.txt')
if (root/'sitemap.xml').exists(): files.append(root/'sitemap.xml')
target = out/'moneypass-site.zip'
site = out/'site'
if site.resolve() != root/'dist'/'site' or site.is_symlink():
    raise RuntimeError('Refusing to replace an unexpected publication directory')
if site.exists():
    shutil.rmtree(site)  # Only the verified generated publication directory.
site.mkdir(exist_ok=True)
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(files):
        if path.is_file():
            relative = path.relative_to(root)
            archive.write(path, relative)
            destination = site/relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path,destination)
print(target)
print('Cloudflare Pages build output: dist/site')
