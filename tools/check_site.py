"""Offline generated-page validation: links, IDs, assets and metadata."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import xml.etree.ElementTree as ET

root=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.links=[];self.h1=0;self.title=0;self.description=0;self.labels=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.append(d['id'])
        if tag=='h1':self.h1+=1
        if tag=='title':self.title+=1
        if tag=='meta' and d.get('name')=='description':self.description+=1
        if tag=='label' and 'for' in d:self.labels.append(d['for'])
        for key in ['href','src']:
            if key in d:self.links.append(d[key])
pages={}
for p in list(root.glob('*.html'))+list((root/'guides').glob('*.html')):
    doc=Page();doc.feed(p.read_text(encoding='utf-8'));pages[p.resolve()]=doc
errors=[]
for path,doc in pages.items():
    name=path.relative_to(root)
    if doc.h1!=1 or doc.title!=1 or doc.description!=1:errors.append(f'{name}: missing/duplicate H1/title/description')
    if len(doc.ids)!=len(set(doc.ids)):errors.append(f'{name}: duplicate IDs')
    if not set(doc.labels)<=set(doc.ids):errors.append(f'{name}: label without input')
    for link in doc.links:
        url=urlsplit(link)
        if url.scheme or url.netloc:continue
        target=(path.parent/unquote(url.path)).resolve() if url.path else path
        if not target.is_file():errors.append(f'{name}: missing {link}')
        if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:errors.append(f'{name}: missing anchor {link}')
config=json.loads((root/'site.config.json').read_text(encoding='utf-8'))
if config['siteUrl']:
    ET.parse(root/'sitemap.xml')
else:
    if (root/'sitemap.xml').exists():errors.append('unconfigured domain must not generate sitemap')
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} pages, local links, fragments, asset paths, metadata, labels and unique IDs.')
