"""Build dependency-free static pages. Run: python tools/build.py"""
import html
import json
import re
import importlib.util
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
VERIFIED = '2026-10-22'
CONFIG = json.loads((ROOT / 'site.config.json').read_text(encoding='utf-8'))
_copy_spec = importlib.util.spec_from_file_location('moneypass_copy', ROOT/'tools/ui_copy.py')
_copy_module = importlib.util.module_from_spec(_copy_spec)
_copy_spec.loader.exec_module(_copy_module)
natural_copy = _copy_module.natural_copy
def load_content(name):
    spec = importlib.util.spec_from_file_location('moneypass_'+name, ROOT/'tools'/f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
CALC_CONTENT = load_content('calculator_content').CALCULATOR_HELP
GUIDE_CONTENT = load_content('guide_content')
BASE = CONFIG['siteUrl'].rstrip('/')
if BASE and (urlparse(BASE).scheme != 'https' or not urlparse(BASE).netloc or urlparse(BASE).query or urlparse(BASE).fragment):
    raise ValueError('siteUrl must be an absolute HTTPS directory URL without query/fragment')
SOURCES = {
    'unemployment': ('고용노동부 1350 · 2026 구직급여 산정 안내', 'https://1350.moel.go.kr/rtmview.do?id=1000320790'),
    'severance': ('고용노동부 · 퇴직금 계산', 'https://moel.go.kr/retirementpayCal.do'),
    'retirementtax': ('국세청 · 퇴직소득세 계산방법', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7880&mi=6448'),
    'tax': ('국세청 · 종합소득세 세율', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7667&mi=2315'),
    'youth': ('서민금융진흥원 · 청년도약계좌', 'https://fill4young.kinfa.or.kr/yla/main'),
    'health': ('국민건강보험공단 · 본인부담액상한제', 'https://www.nhis.or.kr/static/html/wbma/c/wbmac0209.html'),
    'pension': ('국민연금공단 · 노령연금/조기·연기연금', 'https://m.nps.or.kr/pnsinfo/ntpsklg/getOHAF0056M0.do'),
    'card': ('국세청 · 신용카드 등 사용금액 공제', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7794&mi=2466'),
    'pensiontax': ('국세청 · 연금계좌 세액공제', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=2238'),
    'rent': ('복지로 · 2026 청년월세 신청 공고', 'https://m.bokjiro.go.kr/ssis-tem/cms/mob/customer/notice/1309500_1155.html'),
    'employment': ('고용24 · 국민취업지원제도', 'https://www.work24.go.kr/ua/z/z/1300/selectEmssRqutIntro.do?intro=1'),
    'earned': ('국세청 홈택스', 'https://www.hometax.go.kr/'),
    'telecom': ('스마트초이스 · 통신요금 정보포털', 'https://www.smartchoice.or.kr/'),
    'earnedguide': ('국세청 · 근로장려금 안내', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7784&mi=2450'),
    'earnednotice': ('국세청 · 2025년 귀속 근로·자녀장려금 정기 신청 안내', 'https://www.nts.go.kr/nts/na/ntt/selectNttInfo.do?mi=&nttSn=1350768'),
    'taxfiling': ('국세청 · 종합소득세 신고·납부', 'https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7664&mi=2224'),
    'future': ('서민금융진흥원 · 청년미래적금', 'https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do'),
}
SOURCES['telecom'] = ('스마트초이스 · 통신 미환급액 안내', 'https://www.smartchoice.or.kr/smc/service/refund02.do?type=m')

def e(s): return html.escape(str(s), quote=True)
def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8', newline='\n')

def info_table(title, rows):
    if not rows: return ''
    return f'<div class="table-scroll" tabindex="0" role="region" aria-label="{e(title)}"><table><caption>{e(title)}</caption><thead><tr><th scope="col">항목</th><th scope="col">설명</th></tr></thead><tbody>'+''.join(f'<tr><th scope="row">{e(label)}</th><td>{e(text)}</td></tr>' for label,text in rows)+'</tbody></table></div>'

def faq_html(items):
    return '<div class="faq-list">'+''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q,a in items)+'</div>'

def homepage_explanation():
    return '''<section class="section"><div class="section-heading"><div><span class="eyebrow">혜택을 읽는 방법</span><h2>지원금·환급금·세액공제는 어떻게 다를까요?</h2></div></div><div class="grid three"><article class="card"><h3>지원금은 신청 조건을 먼저 봐요</h3><p>청년월세나 구직촉진수당은 나이·가구소득·재산·활동 요건 등을 심사해요. 최대액은 모든 사람이 받는 정액이 아니고, 신청기간과 지급 회차도 확인해야 해요.</p></article><article class="card"><h3>환급금은 실제 내역이 있어야 해요</h3><p>미리 낸 세금이나 요금이 정산한 금액보다 많을 때 차액을 돌려받는 경우예요. 통신 미환급액이나 세금 환급은 본인의 실제 내역이 없으면 받을 돈도 없을 수 있어요.</p></article><article class="card"><h3>공제 가능액은 환급액과 달라요</h3><p>소득공제는 세금을 매길 소득을 줄이고 세액공제는 계산된 세금에서 빼요. 실제로 돌려받는 돈은 이미 낸 세금과 최종 결정세액까지 함께 봐야 알 수 있어요.</p></article></div></section>'''

def privacy_content():
    return f'''<h1>개인정보처리방침</h1><p class="fine">최종 수정 {VERIFIED}</p>
<h2>1. 계산기와 혜택 찾기 입력값</h2><p>나이·직업·급여·지출 등 화면에 입력한 값은 이용자의 브라우저 메모리에서 계산합니다. 머니패스는 이 입력값을 자체 서버로 전송하거나 쿠키·로컬스토리지에 저장하지 않습니다. 화면을 새로고침하면 입력·결과가 초기화될 수 있습니다.</p>
<h2>2. 이메일 문의에서 처리하는 정보</h2><p>문의 이메일 주소와 이용자가 직접 작성한 제목·본문·첨부파일을 문의 답변 및 오류 확인 목적으로 처리합니다. 문의 양식은 메일 앱에서 초안을 여는 기능이며, 이용자가 메일 앱에서 발송을 완료하기 전에는 문의가 접수되지 않습니다. 주민등록번호·계좌 비밀번호·신분증·세금 신고서 등 불필요한 민감정보를 보내지 마세요.</p><p>문의 정보는 답변·후속 확인에 필요한 동안 보관하고, 처리 목적이 달성되면 지체 없이 삭제합니다. 법령에 따른 보존 의무가 있는 정보는 해당 법령의 기간과 목적에 한해 보관합니다. 삭제·정정 등 요청은 아래 운영 문의처로 접수할 수 있습니다.</p>
<h2>3. 호스팅과 외부 서비스</h2><p>호스팅 사업자는 사이트 제공·보안 운영을 위해 IP 주소·접속 시각·요청 주소 등 접속 기록을 처리할 수 있습니다. 공식 기관이나 계산왕 링크를 열면 해당 사이트의 개인정보처리방침이 적용됩니다. 머니패스는 링크 URL에 계산기 입력값을 추가해 전달하지 않습니다.</p>
<h2>4. Google AdSense 자동광고</h2><p>머니패스는 사이트 운영을 위해 Google AdSense 자동광고를 사용합니다. Google을 포함한 제3자 광고 공급업체는 쿠키 등을 사용하여 이전 방문 이력을 바탕으로 광고를 제공할 수 있습니다. 실제 광고 게재와 개인정보 처리는 광고 차단·동의 여부·지역과 Google의 서비스 설정에 따라 달라질 수 있습니다.</p><p><a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">Google 내 광고 센터</a>에서 맞춤 광고 설정을 관리할 수 있고, <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noopener noreferrer">Google이 파트너 사이트의 정보를 사용하는 방식</a>에서 관련 처리를 확인할 수 있습니다. 계산기 자체가 광고업체에 급여 등 입력값을 전송하도록 구현되어 있지는 않습니다.</p>
<h2>5. 이용자의 요청과 문의</h2><p>개인정보 처리 담당은 머니패스 운영자입니다. 문의로 제공한 개인정보의 열람·정정·삭제·처리정지를 요청하려면 운영 이메일로 연락해 주세요. 본인 확인과 관련 법령의 제한에 따라 처리 범위가 달라질 수 있습니다. 이 사이트에 저장하지 않는 계산기 입력값은 운영자가 조회하거나 복원할 수 없습니다.</p>'''

def calculator_explanation(key):
    data = CALC_CONTENT[key]
    return f'<section id="explanation-{key}" class="calculator-explanation"><h3>{e(data["title"])}</h3><p>{e(data["intro"])}</p>'+info_table('입력 항목을 확인해 보세요',data['inputs'])+info_table(data['example_title'],data['example'])+f'<p class="example-note">{e(data["interpret"])}</p><h4>자주 묻는 질문</h4>'+faq_html(data['faq'])+f'<div class="next-step"><h4>계산 다음에는 이렇게 확인하세요</h4><p>{e(data["next"])}</p></div></section>'

def render_guide_body(guide):
    details = GUIDE_CONTENT.GUIDE_DETAILS[guide['id']]
    sections = guide['sections'] + details['extra']
    body = f'<div class="breadcrumbs"><a href="../guides.html">가이드</a><span aria-hidden="true">/</span><span>{e(guide["category"])}</span></div><article class="article card"><header><span class="eyebrow">{e(guide["category"])}</span><h1>{e(guide["title"])}</h1><p class="lede">{e(guide["summary"])}</p><p class="fine">머니패스 편집 · 공식 자료 확인 {VERIFIED}</p></header><p class="reader-note">{e(details["reader"])}</p><nav class="toc" aria-label="목차"><strong>이 글에서 확인할 내용</strong><ol>'
    body += ''.join(f'<li><a href="#part-{i}">{e(title)}</a></li>' for i,(title,_) in enumerate(sections,1))
    body += '<li><a href="#prepare">신청 전 체크리스트</a></li><li><a href="#questions">자주 묻는 질문</a></li></ol></nav>'
    body += ''.join(f'<section id="part-{i}"><h2>{e(title)}</h2><p>{e(text)}</p></section>' for i,(title,text) in enumerate(sections,1))
    if details['example']:
        body += '<section class="worked-example"><h2>예시로 이해하기</h2>'+info_table(details['example_title'],details['example'])+f'<p class="example-note">{e(details["example_note"])}</p></section>'
    body += '<section id="prepare" class="next-step"><h2>신청 전 체크리스트</h2><ul>'+''.join(f'<li>{e(item)}</li>' for item in details['checklist'])+'</ul></section><section id="questions"><h2>자주 묻는 질문</h2>'+faq_html(details['faq'])+'</section>'
    body += '<section class="sources"><h2>참고한 공식 자료</h2><ul>'+''.join('<li>'+source(key)+'</li>' for key in guide['sources'])+'</ul><p class="fine">제도는 변경될 수 있어요. 신청 직전 담당 기관의 최신 공고를 확인해 주세요.</p></section><div class="article-actions"><a class="button" href="../calculator.html">계산기로 확인하기 →</a><button type="button" class="button secondary" data-share>링크 복사</button></div></article>'
    return body
def source(key):
    label, url = SOURCES[key]
    return f'<a href="{e(url)}" target="_blank" rel="noopener noreferrer">{e(label)} ↗</a>'
def note(text): return f'<div class="notice">{text}</div>'
def ad(slot): return ''  # AdSense Auto ads chooses placements; no manual units.

CALC_HUB = 'https://calc.ssoxxl.com/'
HUB_TOOLS = [
    ('salary/','연봉 실수령액','세금과 보험료를 뺀 월급이 궁금할 때'),
    ('average-wage/','평균임금','실업급여·퇴직금에 넣을 하루 임금을 알아볼 때'),
    ('rent-tax-credit/','월세 세액공제','내가 낸 월세로 얼마나 공제받는지 알아볼 때'),
    ('eitc/','근로·자녀장려금','가구 형태와 소득에 따른 예상액이 궁금할 때'),
    ('irp-tax-credit/','연금저축·IRP','연말 전에 세액공제 한도를 확인할 때'),
    ('resignation-settlement/','퇴사 정산','퇴직금과 연차수당을 함께 살펴볼 때'),
]

def calculator_hub():
    cards = ''.join(f'<a class="hub-card" href="{CALC_HUB}{path}" target="_blank" rel="noopener noreferrer"><h3>{title} <span aria-hidden="true">↗</span></h3><p>{desc}</p><span class="fine">계산왕 · 새 탭에서 열려요</span></a>' for path,title,desc in HUB_TOOLS)
    return '<section class="section hub-section"><div class="section-heading"><div><span class="eyebrow">계산왕과 함께</span><h2>생활 속 다른 계산도 필요하다면</h2><p>월급부터 월세, 퇴사 정산까지. 필요한 계산기를 계산왕에서 찾아보세요.</p></div><a class="button secondary" href="'+CALC_HUB+'" target="_blank" rel="noopener noreferrer">계산왕 전체 보기 ↗</a></div><div class="grid three">'+cards+'</div></section>'

CALC_SHORT_NOTES = {
    'unemployment': '2026년에 퇴사한 일반 근로자 기준이에요. 받을 수 있는지와 실제 지급일수는 고용센터에서 확인해 주세요.',
    'freelancer': '3.3%를 뗀 사업소득을 정산해 봐요. 입력한 경비와 공제에 따라 돌려받거나 세금을 더 낼 수 있어요.',
    'youth': '신규 가입은 끝났어요. 기존 가입자가 같은 금액을 꾸준히 납입하는 경우를 비교해 볼 수 있어요. 기여금에 붙는 은행이자는 제외돼요.',
    'health': '공단에서 확인한 본인부담금과 개인별 상한액을 넣어 주세요. 비급여 등 상한제에서 빠지는 비용은 제외해야 해요.',
    'severance': '주 15시간 이상, 1년 이상 근무한 일반 근로자 기준이에요. 중간정산이 없는 경우를 계산하며, IRP로 이체할 때의 금액과는 다를 수 있어요.',
    'pension': '국민연금공단에서 확인한 예상 월액을 넣어 주세요. 받기 시작하는 시점에 따라 월액과 누적액이 얼마나 달라지는지 비교해 드려요.',
    'yearend': '일반 카드 사용액과 연금저축·IRP의 기본 공제 혜택을 계산해요. 실제 환급액은 다른 공제와 이미 낸 세금에 따라 달라져요.',
}

def related_tool(key):
    mapping = {'unemployment':('average-wage/','하루 평균임금을 모르겠다면 계산왕에서 계산해 보세요.'),'severance':('resignation-settlement/','연차수당까지 함께 보고 싶다면 계산왕에서 퇴사 정산을 확인해 보세요.'),'yearend':('irp-tax-credit/','연금저축·IRP의 남은 한도는 계산왕에서 따로 확인할 수 있어요.')}
    if key not in mapping: return ''
    path,label = mapping[key]
    return f'<p class="related-tool"><a href="{CALC_HUB}{path}" target="_blank" rel="noopener noreferrer">{label} ↗</a><span class="fine">새 탭에서 열려요. 입력값은 전달하지 않아요.</span></p>'
def page(path, title, description, content, active='', scripts=(), article=False):
    content = natural_copy(content)
    prefix = '../' if path.startswith('guides/') else ''
    nav = [('index.html','혜택 찾기','home'),('calculator.html','계산기','calculator'),('guides.html','가이드','guides')]
    links = ''.join(f'<a href="{prefix}{url}"'+(' aria-current="page"' if key==active else '')+f'>{label}</a>' for url,label,key in nav)
    links += '<a href="https://calc.ssoxxl.com/" target="_blank" rel="noopener noreferrer" aria-label="계산왕 (새 탭)">계산왕 ↗</a>'
    canonical = f'<link rel="canonical" href="{e(BASE+"/"+path)}"><meta property="og:url" content="{e(BASE+"/"+path)}">' if BASE else ''
    publisher = CONFIG.get('adsense',{}).get('client','')
    if re.fullmatch(r'ca-pub-\d{16}',publisher):
        canonical += f'<meta name="google-adsense-account" content="{e(publisher)}">'
    assets = ['config.js','data.js','main.js',*scripts]
    js = ''.join(f'<script defer src="{prefix}assets/js/{name}"></script>' for name in assets)
    schema = ''
    if BASE:
        structured = {'@context':'https://schema.org','@type':'Article' if article else 'WebPage','name':title,'description':description,'url':BASE+'/'+path,'inLanguage':'ko-KR'}
        if article: structured.update({'headline':title,'dateModified':VERIFIED,'author':{'@type':'Organization','name':'머니패스'}})
        schema = '<script type="application/ld+json">'+json.dumps(structured,ensure_ascii=False).replace('<','\\u003c')+'</script>'
    write(path,f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)} | 머니패스</title><meta name="description" content="{e(description)}">
<meta name="theme-color" content="#163d32"><meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}">{canonical}
<link rel="icon" href="{prefix}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="{prefix}assets/css/style.css">{schema}{js}</head>
<body><a class="skip-link" href="#main">본문 바로가기</a><header class="site-header"><div class="wrap header-inner"><a class="logo" href="{prefix}index.html" aria-label="머니패스 홈"><span class="logo-icon" aria-hidden="true">₩</span>머니패스<span class="logo-en">MONEYPASS</span></a><nav aria-label="주 메뉴">{links}</nav></div></header>
<main id="main" class="wrap">{content}</main>
<footer class="site-footer"><div class="wrap"><div class="footer-top"><a class="logo" href="{prefix}index.html">머니패스</a><p>정보를 확인하고, 다음 선택은 가볍게.</p></div><nav aria-label="사이트 안내">{''.join(f'<a href="{prefix}{p}.html">{l}</a>' for p,l in [('about','소개·편집 원칙'),('contact','문의'),('privacy','개인정보처리방침'),('terms','이용약관'),('disclaimer','계산 범위·면책'),('sitemap','전체 페이지')])}</nav><p class="fine">머니패스는 정부기관이 운영하는 사이트가 아닙니다. 추천은 참고용이며 신청 자격·금액은 담당 기관이 결정합니다.</p><p class="fine">© 2026 MoneyPass · 자료 확인일 {VERIFIED} · 입력값은 이 브라우저에서 계산하며 서버로 전송하지 않습니다.</p></div></footer>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div><noscript><div class="notice wrap">계산기와 조건 검색에는 JavaScript가 필요합니다. 가이드와 공식 출처는 JavaScript 없이도 읽을 수 있습니다.</div></noscript></body></html>''')

POLICIES = [
    dict(id='youth-rent-2026',title='청년월세 지원',category='housing',label='주거',age=[19,34],jobs=[],houses=['rent'],amount='월 최대 20만원 · 최대 24회',status='closed',end='2026-05-29',summary='2026년 정기 모집은 마감됐습니다. 기존 선정자와 다음 모집을 준비하는 청년을 위한 안내입니다.',source='rent',requirements=['부모와 별도 거주하는 무주택 청년','청년가구 중위소득 60%·재산 1억 2,200만원 이하, 원가구 중위소득 100%·재산 4억 7,000만원 이하 등 공고 확인','원가구 심사 예외 및 기존 지원 회차 확인'],steps=['복지로 공고에서 다음 모집 여부 확인','임대차계약서·월세이체 내역 등 공고의 제출서류 준비','복지로 또는 주소지 행정복지센터에 신청'],reason='접수기간과 청년가구·원가구 심사가 필요합니다.'),
    dict(id='youth-leap-account',title='청년도약계좌 · 기존 가입자',category='finance',label='저축',age=[0,120],jobs=[],houses=[],amount='가입 당시 조건·유지심사에 따라 기여금 차등',status='closed',end='2025-12-31',summary='신규 가입은 종료됐습니다. 기존 가입자의 납입·유지심사·만기 안내만 제공합니다.',source='youth',requirements=['이미 가입한 계좌의 만기·우대금리 확인','납입액·개인소득 구간에 따라 기여금 변동','중도해지·부분인출·전환 조건은 취급 은행과 확인'],steps=['가입 은행에서 실제 적용금리와 납입 내역 확인','서민금융진흥원에서 유지심사 결과 확인','만기·해지 전에 해당 은행의 지급액 확인'],reason='신규 신청 대상이 아닌 기존 가입자용 안내입니다.'),
    dict(id='national-employment-support',title='국민취업지원제도',category='job',label='취업',age=[15,69],jobs=['jobseeker'],houses=[],amount='Ⅰ유형 구직촉진수당 월 60만원 × 6개월',status='check',summary='취업지원서비스와 구직촉진수당을 제공하는 제도입니다. 유형별 소득·재산·취업경험 심사가 필요합니다.',source='employment',requirements=['만 15~69세 구직자 등 유형별 대상 확인','가구소득·재산·취업경험 및 청년 선발형 요건 확인','실업급여·직접일자리 등 중복·참여 제한 확인'],steps=['고용24에서 유형별 자격 확인','취업지원 신청서·가구원 정보 제출','담당자 상담과 취업활동계획 수립 후 이행'],reason='가구단위 소득·재산과 다른 수당 참여 여부를 확인해야 합니다.'),
    dict(id='earned-income-tax-credit',title='근로·자녀장려금',category='tax',label='세금',age=[0,120],jobs=['employee','freelancer','business'],houses=[],amount='가구유형·소득·재산 심사에 따라 차등',status='check',summary='일하는 저소득 가구를 지원합니다. 개인 연봉만으로 대상 여부나 지급액을 판정할 수 없습니다.',source='earned',requirements=['근로·사업·종교인 소득 등 인정 소득 확인','가구유형별 합산소득·가구원 재산 기준 확인','정기·반기·기한 후 신청 및 감액 여부 확인'],steps=['홈택스 장려금 메뉴의 신청 안내 확인','가구원·소득·재산 확인 후 신청','심사 결과 및 지급일 확인'],reason='가구원 소득·재산과 귀속연도별 신청기간이 필요합니다.'),
    dict(id='health-insurance-refund',title='본인부담상한액 초과금',category='refund',label='의료',age=[0,120],jobs=[],houses=[],amount='상한제 적용 본인부담금 − 개인별 상한액',status='check',summary='건강보험이 적용되는 본인부담금 중 상한액 초과분을 확인합니다. 비급여 등 제외 항목이 있습니다.',source='health',requirements=['진료연도별 공단의 개인별 상한액 확인','비급여·선별급여·전액본인부담·임플란트 등 제외','요양병원 입원일수 구분·기지급액·지원금 조정 확인'],steps=['국민건강보험공단에서 환급금 조회','안내문과 지급 대상 진료연도 확인','공단의 안내에 따라 계좌 등록·신청'],reason='실제 적용 진료비와 공단이 정한 개인별 상한액을 확인해야 합니다.'),
    dict(id='unemployment-benefit-calc',title='실업급여 · 구직급여',category='job',label='퇴사',age=[0,120],jobs=['jobseeker'],houses=[],amount='2026년 1일 상한 68,100원 · 120~270일',status='check',summary='이직 사유·피보험단위기간·재취업활동 등 요건을 충족한 근로자 대상입니다. 계산 결과가 수급자격을 의미하지는 않습니다.',source='unemployment',requirements=['일반 근로자: 원칙적으로 이직 전 18개월 중 피보험단위기간 180일 이상','이직 사유·근로의사 및 능력·적극적 구직활동 확인','65세 이후 신규 고용·일용직·노무제공자 등 별도 규정 확인'],steps=['회사 이직확인서·상실신고 처리 확인','고용24 구직신청·수급자격 교육','관할 고용센터에서 수급자격 인정 신청'],reason='고용보험 가입 이력·이직 사유와 재취업활동 요건을 확인해야 합니다.'),
    dict(id='freelancer-tax-refund',title='3.3% 사업소득 세금 정산',category='tax',label='프리랜서',age=[0,120],jobs=['freelancer','business','employee'],houses=[],amount='기납부세액과 결정세액 차이 · 추가 납부 가능',status='check',summary='3.3%는 미리 납부한 세금입니다. 종합소득세 정산 결과에 따라 환급되거나 추가 납부할 수 있습니다.',source='earned',requirements=['사업소득 원천징수 내역 확인','업종·수입·직전년도 매출에 따른 경비율 적용 가능 여부 확인','근로소득 등 다른 종합소득과 공제·감면 합산'],steps=['홈택스에서 신고 대상·모두채움 안내 확인','다른 소득·필요경비·공제와 기납부세액 검토','종합소득세 및 지방소득세 신고·정산 확인'],reason='다른 소득과 업종별 필요경비를 확인해야 실제 정산액을 알 수 있습니다.'),
    dict(id='telecom-utility-refund',title='통신 미환급액 조회',category='refund',label='생활',age=[0,120],jobs=[],houses=[],amount='실제 미환급 내역이 있는 경우에만 지급',status='check',summary='통신서비스 해지·번호이동 정산 후 남은 미환급액이 있는지 공식 포털에서 확인할 수 있습니다.',source='telecom',requirements=['과거 통신서비스 이용·해지 내역 확인','참여 통신사와 조회 가능 시간 확인','조회 결과가 없는 경우 지급금 없음'],steps=['스마트초이스 통신 미환급액 조회 메뉴 접속','본인정보를 공식 사이트에 직접 입력','미환급액이 있을 경우 공식 절차로 신청'],reason='본인인증 후 실제 미환급 내역을 확인해야 합니다.'),
]
POLICIES.append(dict(id='youth-future-savings',title='청년미래적금',category='finance',label='저축',age=[19,40],jobs=[],houses=[],amount='3년 만기 · 월 최대 50만원 · 유형별 기여금',status='check',summary='신규 정책저축상품을 찾는 청년을 위한 안내예요. 모집 일정과 개인·가구소득, 일반형·우대형 요건을 공식 사이트에서 확인해 보세요.',source='future',requirements=['일반 연령 19~34세, 35세 이상은 병역이행기간 차감 등 인정 여부 확인','개인·가구소득 및 금융소득종합과세 등 가입 제한 확인','일반형 6%·우대형 12% 기여금의 유형별 가입·유지 요건 확인'],steps=['서민금융진흥원 최신 상품·모집 안내 확인','취급기관 앱에서 해당 모집기간에 가입 신청','소득·가구 등 가입요건 심사 후 계좌개설 안내 확인'],reason='연령만으로 자격이 정해지지 않아요. 35세 이상은 병역기간 인정과 실제 모집일정을 먼저 확인해 주세요.'))
POLICY_GUIDES = {
    'youth-rent-2026':'guide-youth-rent','youth-leap-account':'guide-youth-leap-vs-savings',
    'national-employment-support':'guide-employment-support','earned-income-tax-credit':'guide-earned-income-credit',
    'health-insurance-refund':'guide-health-refund','unemployment-benefit-calc':'guide-unemployment-benefit',
    'freelancer-tax-refund':'guide-freelancer-tax-return','telecom-utility-refund':'guide-telecom-refund',
    'youth-future-savings':'guide-youth-future-savings',
}
for p in POLICIES:
    if p['id'] in ['earned-income-tax-credit','freelancer-tax-refund']:
        p['jobs'] = []
        p['reason'] = '지금은 학생이거나 일을 쉬고 있어도 해당 귀속연도의 소득이 있다면 확인해 보세요. 다른 소득과 가구·공제 요건에 따라 결과가 달라져요.'
    if p['id'] == 'national-employment-support':
        p['jobs'] = []
        p['reason'] = '재학·근로 상태만으로 확정하지 않아요. 유형별 소득·재산·취업상태 요건과 다른 지원 참여 여부를 확인해 주세요.'
    p['guideId'] = POLICY_GUIDES[p['id']]
    p['officialUrl'] = SOURCES[p['source']][1]
    p['verified'] = VERIFIED

GUIDES = [
 dict(id='guide-youth-leap-vs-savings',title='청년도약계좌: 기존 가입자의 기여금·만기 확인법',category='저축',summary='신규 가입 종료 여부부터 소득구간별 기여금, 만기 시뮬레이션의 가정까지 확인합니다.',sources=['youth'],sections=[
 ('먼저 신규 가입 종료 여부를 확인하세요','청년도약계좌 신규 가입은 2025년 12월 31일까지 운영됐습니다. 2026년에 새로 신청할 수 있는 적금으로 안내해서는 안 됩니다. 기존 가입자는 가입 은행에서 유지 조건과 계좌 상태를 확인하세요.'),
 ('기여금은 납입액과 소득구간에 따라 달라져요','2025년 1월 이후 납입분의 월 최대 기여금은 총급여 구간별로 33,000원·29,000원·25,200원·21,000원이며, 6,000만원 초과 구간은 기여금이 없습니다. 예를 들어 총급여 2,400만원 이하 구간에서 40만원을 납입하면 6%인 24,000원입니다. 70만원 납입 시 추가 30만원에 3%가 더해져 33,000원이 됩니다.'),
 ('만기액과 순수 지원액을 구분하세요','본인이 납입한 원금은 정부지원금이 아닙니다. 원금·정부기여금·은행이자를 분리해서 비교해야 합니다. 소득 유지심사, 금리 변경, 우대금리 충족 여부와 부분인출은 결과에 영향을 줍니다.'),
 ('계산기 사용 순서','소득구간과 월 납입액, 비교할 연 금리를 입력하세요. 2025년 이후 기여금 구조를 적용해 같은 월 납입액·금리로 60개월을 처음부터 납입한다고 놓은 비교예요. 과거 납입분이나 기존 계좌 잔액을 복원하지 않고 기여금에 붙는 별도 은행이자도 제외해요. 실제 계좌 지급액은 은행에서 확인하세요.')]),
 dict(id='guide-freelancer-tax-return',title='3.3% 세금 정산: 환급과 추가 납부가 갈리는 이유',category='세금',summary='원천징수는 확정 세금이 아닙니다. 필요경비·인적공제·다른 소득을 함께 확인해야 합니다.',sources=['tax','earned'],sections=[
 ('3.3%는 선납 세금입니다','인적용역 사업소득 지급 시 소득세 3%와 지방소득세 0.3%를 미리 공제하는 경우가 있습니다. 납부한 세금 전부가 자동으로 환급되는 것은 아닙니다. 종합소득세 신고에서 계산한 결정세액보다 많이 냈다면 차액을 돌려받고, 적게 냈다면 더 납부합니다.'),
 ('경비율을 임의로 고르면 안 됩니다','업종코드·해당연도 수입·직전년도 매출 등에 따라 단순경비율 또는 기준경비율 적용 여부가 달라집니다. 실제 장부를 작성하는 경우에도 정당한 증빙이 필요합니다. 계산기에는 본인이 공식 자료로 확인한 경비율만 입력하세요.'),
 ('소득공제와 세액공제는 다릅니다','소득공제는 과세표준을 줄이고 세액공제는 계산된 세금에서 차감합니다. 기본공제는 본인을 포함한 적격 인원만 입력하며 가족의 나이·소득요건을 확인해야 합니다. 표준세액공제 7만원은 모든 공제와 무조건 중복되는 혜택이 아닙니다.'),
 ('실제 신고 전에 확인할 것','근로·사업·연금 등 합산 대상 소득과 원천징수 내역을 빠짐없이 확인하세요. 이 계산기는 사업소득 하나와 입력한 공제만 가정합니다. 건강보험료 변동이나 각종 세액감면·가산세·분리과세 등은 계산하지 않습니다. 신고는 홈택스에서 국세와 지방소득세를 각각 확인하세요.')]),
 dict(id='guide-unemployment-benefit',title='2026 실업급여: 일 지급액과 수급기간 계산',category='퇴사',summary='2026년 상·하한액, 50세 기준과 가입기간별 지급일수, 평균임금의 의미를 정리합니다.',sources=['unemployment','severance'],sections=[
 ('수급자격과 예상금액은 별개입니다','일반 근로자의 구직급여는 피보험단위기간, 이직 사유, 취업 의사·능력과 구직활동 등 요건을 심사합니다. 고용보험 가입기간과 피보험단위기간은 같은 개념이 아닙니다. 일용근로자·자영업자·노무제공자는 별도 산정 기준을 확인해야 합니다.'),
 ('2026년 일 지급액','2026년 이직한 일반 근로자는 기초일액의 60%를 기준으로 산정하며 1일 상한액은 68,100원입니다. 하한액은 시간급 최저임금 10,320원 × 80% × 1일 소정근로시간이며, 8시간 기준 66,048원입니다. 이직연도가 다르면 같은 상·하한액을 적용해서는 안 됩니다.'),
 ('월급을 단순히 30으로 나누지 마세요','평균임금은 원칙적으로 산정 사유 발생 전 3개월의 임금 총액을 해당 기간 총일수로 나눕니다. 통상임금보다 낮은 경우 적용 기준, 상여금·연차수당 및 제외기간도 확인해야 합니다. 계산기에는 확인된 1일 평균임금과 통상임금을 입력하도록 했습니다.'),
 ('지급기간과 실제 입금액','가입기간 구간별 소정급여일수는 50세 미만에서 120·150·180·210·240일, 50세 이상 또는 장애인에서 120·180·210·240·270일입니다. 실제 회차 입금액은 실업인정일수에 따라 달라집니다. 28일 환산액을 고정 월급으로 해석하지 마세요.')]),
 dict(id='guide-youth-rent',title='2026 청년월세: 모집기간과 가구심사 확인',category='주거',summary='월 최대 20만원·최대 24회 지원과 2026년 정기 모집 마감, 추가 확인 요건을 안내합니다.',sources=['rent'],sections=[
 ('2026년 정기 모집은 마감됐습니다','공식 공고의 신청기간은 2026년 3월 30일 09시부터 5월 29일 16시까지입니다. 현재 이 안내만 보고 신규 신청이 가능하다고 판단하지 마세요. 추가 모집이나 다음 정기 모집 여부는 복지로 공고를 확인해야 합니다.'),
 ('대상과 지급 규모','부모와 별도 거주하는 19~34세 무주택 청년을 대상으로 실제 납부 월세 중 월 최대 20만원, 최대 24회 지원합니다. 2026년 신청 가능 출생연도는 공고상 1991~2007년생입니다. 임차보증금·관리비는 월세 지원액에 포함되지 않습니다.'),
 ('개인 연봉만으로 판정할 수 없습니다','청년가구는 중위소득 60% 이하 및 자산 1억 2,200만원 이하, 원가구는 중위소득 100% 이하 및 자산 4억 7,000만원 이하 등의 심사가 있습니다. 원가구 확인 예외는 연령·혼인 등 세부조건을 공고에서 확인하세요.'),
 ('이미 지원받았다면','공고는 1·2차 구분 없이 인당 최대 24회 지급을 안내하며 과거 지급 회차를 반영합니다. 2차 지원 수혜자는 해당 사업 종료 후 신청할 수 있다는 제한이 있으므로 중복 신청을 먼저 확인해야 합니다. 준비 서류도 공고의 목록을 기준으로 하세요.')]),
 dict(id='guide-health-refund',title='병원비 환급: 본인부담상한제에서 제외되는 비용',category='의료',summary='병원비 영수증 총액과 상한제 적용 금액은 다릅니다. 개인별 상한액과 기지급액을 확인하세요.',sources=['health'],sections=[
 ('모든 병원비가 환급 대상은 아닙니다','본인부담상한제는 건강보험 적용 본인부담금이 개인별 상한액을 넘는 경우 초과분을 공단이 부담하는 제도입니다. 영수증의 총 납부액을 그대로 입력하면 과대 계산될 수 있습니다.'),
 ('제외 항목을 먼저 확인하세요','비급여, 선별급여, 전액본인부담, 임플란트, 상급병실 2~3인실 입원료, 추나요법 등의 본인일부부담금은 제외될 수 있습니다. 공단에서 상한제 산정 대상으로 인정한 연간 금액을 확인하세요.'),
 ('상한액은 개인과 진료연도에 따라 다릅니다','보험료 구간, 진료연도, 요양병원 입원일수 등에 따라 상한액이 달라집니다. 사이트에서 오래된 분위별 숫자를 자동 적용하지 않고 공단에서 확인한 상한액을 직접 입력하게 했습니다. 연소득만으로 분위나 상한액을 확정하지 마세요.'),
 ('환급액 계산과 실제 지급','상한제 적용 본인부담금에서 상한액을 뺀 후 이미 지급·공제된 금액을 반영합니다. 다른 의료비 지원과 중복되거나 심사로 조정되는 금액이 있을 수 있습니다. 계산 결과는 참고치이고 지급 여부와 최종 금액은 공단 조회 결과가 기준입니다.')]),
 dict(id='guide-retirement-planning',title='퇴직금·국민연금·연말정산 계산을 읽는 법',category='계산 안내',summary='금액이 비슷해 보여도 공제·세액·실제 환급은 다릅니다. 세 가지 계산기의 입력 기준을 확인하세요.',sources=['severance','retirementtax','pension','card','pensiontax'],sections=[
 ('퇴직금은 실제 날짜와 평균임금으로','일반적인 퇴직금은 1일 평균임금 × 30 × 계속근로일수 ÷ 365로 계산합니다. 통상임금보다 낮으면 통상임금을 기준으로 합니다. 1년 이상 계속근로 및 주 평균 소정근로시간 등 적용 요건을 확인해야 합니다. 퇴사일은 마지막 근무일 다음 날을 입력하세요.'),
 ('퇴직소득세는 고정 세율이 아닙니다','근속연수공제, 환산급여 및 환산급여공제, 기본세율을 순서대로 적용한 뒤 근속연수로 환산합니다. 중간정산·임원 한도·비과세 퇴직급여·이연퇴직소득세가 있는 경우 단순 계산 범위를 벗어납니다. IRP 이체 시 당장 원천징수되는 금액도 달라질 수 있습니다.'),
 ('국민연금은 공단 예상액을 기준으로 비교','개인의 가입 이력·재평가소득·크레딧 등을 알지 못한 채 월 소득에 일정 비율을 곱해 연금액을 만들면 부정확합니다. 공단의 정상 개시 예상 월액을 입력하고 조기는 월 0.5% 감액, 연기는 월 0.6% 가산해 비교합니다. 같은 비교 종료 연령까지 계산하며 소득활동 제한·부양가족연금·물가·세금은 별도로 확인하세요.'),
 ('연말정산 절세효과는 환급액이 아닙니다','카드 소득공제는 총급여 25% 초과 사용분에 적용하고 일반 신용카드 15%, 체크카드·현금영수증 30%를 사용합니다. 연금저축은 600만원, IRP 등과 합산해 900만원까지 세액공제 대상입니다. 이 도구는 일반사용분과 기본 한도만 다루며 자녀·전통시장·대중교통 등 추가 한도는 제외합니다. 실제 환급액은 결정세액과 기납부세액, 다른 공제와 함께 정산해야 합니다.')]),
]

GUIDES.extend(GUIDE_CONTENT.ADDITIONAL_GUIDES)
next(g for g in GUIDES if g['id']=='guide-freelancer-tax-return')['sources'].append('taxfiling')

def guide_cards(prefix='',limit=None):
    return ''.join(f'<article class="card guide-card"><span class="eyebrow">{g["category"]}</span><h3><a href="{prefix}guides/{g["id"]}.html">{g["title"]}</a></h3><p>{g["summary"]}</p><a class="text-link" href="{prefix}guides/{g["id"]}.html">가이드 읽기 <span aria-hidden="true">↗</span></a></article>' for g in GUIDES[:limit])

def field(id,label,value='',type='number',hint='',min='0',max='1000000000000',step='1',required=True):
    if id in {'ue-ordinary','sev-bonus','sev-leave','sev-ordinary','hi-paid','fl-deduction'}:
        required = False
    if id == 'yl-months':
        min = max = '60'
        label = '표준 만기기간 (개월)'
        hint = '60개월 비교만 제공해요. 기존 계좌의 남은 기간·중도해지는 계산하지 않아요.'
    attrs = f' min="{min}" max="{max}" step="{step}"' if type=='number' else ''
    if id == 'yl-months': attrs += ' readonly'
    described = f' aria-describedby="{id}-hint"' if hint else ''
    return f'<div class="field"><label for="{id}">{label}</label><input id="{id}" name="{id}" type="{type}" value="{value}"{attrs}{" required" if required else ""}{described}>'+ (f'<small id="{id}-hint">{hint}</small>' if hint else '')+'</div>'

def select(id,label,options,hint=''):
    described = f' aria-describedby="{id}-hint"' if hint else ''
    return f'<div class="field"><label for="{id}">{label}</label><select id="{id}" name="{id}"{described}>'+''.join(f'<option value="{e(v)}">{e(l)}</option>' for v,l in options)+f'</select>'+ (f'<small id="{id}-hint">{hint}</small>' if hint else '')+'</div>'

def calc_section(key,title,intro,fields,scope,sources,button='계산하기'):
    return f'<section class="calc-panel card" id="{key}" aria-labelledby="heading-{key}"><div class="section-top"><div><span class="eyebrow">예상 금액 알아보기</span><h2 id="heading-{key}">{title}</h2><p>{intro}</p></div></div>{note(CALC_SHORT_NOTES[key])}{related_tool(key)}<form data-calculator="{key}" novalidate><div class="fields">{fields}</div><p class="form-error" role="alert" hidden></p><button class="button" type="submit">{button} <span aria-hidden="true">→</span></button><div class="calc-result" tabindex="-1" hidden></div></form>{calculator_explanation(key)}<details class="method"><summary>공식 출처와 계산 범위</summary><p>{scope}</p><ul>{"".join("<li>"+source(k)+"</li>" for k in sources)}</ul><p class="fine">자료 확인일 {VERIFIED}. 원 단위 미만 버림 등으로 실제 정산액과 차이가 날 수 있습니다.</p></details></section>'

def build():
    publisher = CONFIG.get('adsense',{}).get('client','')
    if re.fullmatch(r'ca-pub-\d{16}',publisher):
        write('ads.txt', f'google.com, {publisher[3:]}, DIRECT, f08c47fec0942fa0\n')
    else:
        (ROOT/'ads.txt').unlink(missing_ok=True)
    write('assets/js/config.js','window.MONEYPASS_CONFIG = '+json.dumps(CONFIG,ensure_ascii=False).replace('<','\\u003c')+';\n')
    data={'verified':VERIFIED,'policies':POLICIES,'guides':[dict(id=g['id'],title=g['title']) for g in GUIDES]}
    write('assets/js/data.js','/* Generated by tools/build.py. */\nconst MONEYPASS_DATA = '+json.dumps(data,ensure_ascii=False,indent=2).replace('<','\\u003c')+';\nif(typeof module !== "undefined") module.exports = MONEYPASS_DATA;\n')
    home=f'''<section class="hero"><div><span class="pill">복잡한 돈 정보, 한 번에 정리</span><h1>나에게 필요한 혜택,<br><em>조건부터 확인하세요.</em></h1><p class="hero-description">지원금과 환급 정보를 찾고, 계산기로 금액의 기준을 확인하세요. 신청은 각 기관의 공식 사이트에서 진행합니다.</p><div class="hero-actions"><a class="button" href="#diagnostic-section">내 조건으로 혜택 찾기 →</a><a class="button secondary" href="calculator.html">계산기 둘러보기</a></div><div class="trust-row"><span>✓ 회원가입 없이</span><span>✓ 입력값 서버 전송 없이</span><span>✓ 공식 출처와 함께</span></div></div><aside class="hero-aside"><span class="eyebrow">MONEY CHECKLIST</span><h2>금액보다 먼저,<br>확인할 세 가지.</h2><ol><li><span>01</span><div><strong>신청할 수 있나요?</strong><p>대상 조건과 접수기간 확인</p></div></li><li><span>02</span><div><strong>어떻게 계산하나요?</strong><p>산식과 입력 기준 확인</p></div></li><li><span>03</span><div><strong>어디서 신청하나요?</strong><p>공식 기관으로 바로 이동</p></div></li></ol><p class="fine">실제 환급금 조회·본인인증을 대행하지 않습니다.</p></aside></section>
    <div class="section-heading"><div><span class="eyebrow">FIND YOUR NEXT STEP</span><h2>내 상황에서 확인할 혜택</h2></div><span class="updated">자료 확인 {VERIFIED}</span></div>
    <section id="diagnostic-section" class="card diagnostic"><p>선택한 조건으로 관련 제도를 좁혀드립니다. 가구소득·재산·가입이력 등은 각 기관에서 추가 확인해야 합니다.</p><form id="diagnostic-form"><div class="fields">{field('diag-age','만 나이','29',min='0',max='120')}{select('diag-job','현재 상황',[('employee','근로자'),('freelancer','프리랜서·N잡러'),('business','개인사업자'),('jobseeker','구직 중·퇴직 후'),('student','학생'),('other','기타')])}{select('diag-house','주거 형태',[('rent','부모와 별도 거주 · 무주택 월세'),('parents','부모님과 동거'),('other','전세·자가·기타')])}{select('diag-interest','관심 분야',[('all','전체'),('housing','주거'),('finance','저축'),('job','취업·실업'),('tax','세금'),('refund','의료·생활 환급')])}</div><label class="checkbox"><input id="diag-closed" type="checkbox">모집이 끝난 제도·기존 가입자 안내도 보기</label><p class="form-error" role="alert" hidden></p><button class="button" type="submit">관련 제도 확인하기 →</button></form><div id="diagnostic-results" class="diagnostic-results" tabindex="-1" hidden></div></section>
    {ad('home')}<section class="section"><div class="section-heading"><div><span class="eyebrow">CALCULATE WITH CONTEXT</span><h2>계산의 기준까지, 함께.</h2></div><a class="text-link" href="calculator.html">계산기 7종 보기 →</a></div><div class="grid three">{''.join(f'<a class="card tool-card" href="calculator.html?tab={k}"><span class="tool-symbol" aria-hidden="true">{symbol}</span><h3>{title}</h3><p>{desc}</p><span class="text-link">계산하기 ↗</span></a>' for k,symbol,title,desc in [('unemployment','01','실업급여','2026년 상·하한액과 소정급여일수'),('severance','02','퇴직금·퇴직소득세','실제 근무일수와 누진공제 산식'),('yearend','03','카드·연금계좌 공제','소득공제와 세액공제를 구분해서')])}</div></section><section class="section"><div class="section-heading"><div><span class="eyebrow">READ BEFORE YOU APPLY</span><h2>신청 전 읽어볼 가이드</h2></div><a class="text-link" href="guides.html">전체 가이드 →</a></div><div class="grid three">{guide_cards(limit=6)}</div></section>'''
    home = home.replace('<section class="section"><div class="section-heading"><div><span class="eyebrow">READ BEFORE YOU APPLY', calculator_hub()+'<section class="section"><div class="section-heading"><div><span class="eyebrow">READ BEFORE YOU APPLY')
    home += homepage_explanation()
    page('index.html','정부지원금·환급 정보와 금융 계산기','지원금 자격과 접수기간을 확인하고 실업급여·퇴직금·세금 계산의 기준을 알아보세요. 공식 출처를 제공하는 무료 정보 서비스.',home,'home',scripts=['diagnostic.js'])
    calculators=[]
    calculators.append(calc_section('unemployment','실업급여 모의계산','2026년 이직한 일반 근로자 기준',field('ue-average','1일 평균임금 (원)','100000',hint='퇴직 전 3개월 임금총액 ÷ 해당 기간 총일수. 상여·제외기간 등 반영한 값.',min='.01',step='.01')+field('ue-ordinary','1일 통상임금 (원)','0',hint='평균임금보다 높다면 반영합니다. 미입력 시 0.')+select('ue-hours','1일 소정근로시간',[(str(x),f'{x}시간') for x in [8,7,6,5,4,3,2,1]])+select('ue-period','고용보험 가입기간',[(1,'1년 미만'),(2,'1년 이상 ~ 3년 미만'),(3,'3년 이상 ~ 5년 미만'),(4,'5년 이상 ~ 10년 미만'),(5,'10년 이상')])+select('ue-age','이직일 당시 구분',[('under50','50세 미만'),('over50','50세 이상 또는 장애인')]),'기초일액의 60%, 상한 68,100원, 하한 최저시급 10,320원 × 80% × 소정근로시간을 적용합니다. 수급자격은 별도 심사하며 일용직·예술인·노무제공자·자영업자는 이 계산의 대상이 아닙니다. 소정근로시간은 기관이 인정한 정수 시간을 입력하세요.',['unemployment']))
    calculators.append(calc_section('freelancer','3.3% 사업소득 정산 시뮬레이션','2025년 귀속 사업소득 한 종류만 있는 경우의 단순 시나리오',field('fl-income','연간 사업수입 (원)','30000000')+field('fl-rate','확인한 필요경비율 (%)','60',max='100',step='.01',hint='홈택스에서 업종·매출별 적용 가능 여부를 먼저 확인하세요.')+field('fl-family','기본공제 적격 인원 (본인 포함)','1',min='1',max='30')+field('fl-deduction','기타 소득공제 (원)','0')+field('fl-credit','적용할 세액공제 (원)','70000',hint='기본값은 표준세액공제 7만원 가정. 다른 공제와 중복 가능 여부 확인.'),'기본공제 1인당 150만원, 입력 경비율·공제, 전체 기본세율 누진구간 및 지방소득세 10%를 반영합니다. 수입 전액에 3.3%가 원천징수됐다고 가정합니다. 타 소득·업종별 기장요건·감면·가산세 등은 제외하므로 실제 신고액이 아닙니다.',['tax','earned']))
    calculators.append(calc_section('youth','청년도약계좌 납입 시나리오','신규 가입 종료 · 기존 가입자 참고용',field('yl-deposit','매월 납입액 (원)','700000',max='700000')+select('yl-income','총급여 기준 소득구간',[(1,'2,400만원 이하'),(2,'3,600만원 이하'),(3,'4,800만원 이하'),(4,'6,000만원 이하'),(5,'7,500만원 이하 · 기여금 없음')])+field('yl-rate','청년도약계좌 가정 연 금리 (%)','4.5',max='30',step='.01')+field('yl-normal','비교 일반적금 연 금리 (%)','3.8',max='30',step='.01')+field('yl-months','동일 조건 납입 개월 수','60',min='1',max='60',hint='2025년 이후 동일 납입조건 가정. 실제 계좌의 남은 만기액 계산이 아닙니다.'),'2025년 이후 기여금 구조를 사용합니다. 매월 초 납입·고정금리 단리·적격 만기 및 비과세 유지를 가정합니다. 기여금에 붙는 은행이자는 제외하며, 과거 납입분·일시납입·부분인출·소득변동·중도해지는 계산하지 않습니다. 일반적금 이자는 15.4% 과세를 가정합니다.',['youth']))
    calculators.append(calc_section('health','본인부담상한액 초과분 계산','공단에서 확인한 진료연도별 개인 상한액을 입력하세요',field('hi-expense','상한제 적용 연간 본인부담금 (원)','3500000',hint='총 병원비가 아닌 공단 인정 대상액. 비급여·선별급여 등 제외.')+field('hi-ceiling','공단에서 확인한 개인별 상한액 (원)','',min='1',hint='진료연도·보험료 구간·요양병원 입원일수에 따라 다릅니다.')+field('hi-paid','이미 지급·공제된 금액 (원)','0'),'예상 잔여 초과분 = max(0, 적용 본인부담금 − 개인별 상한액 − 기지급·공제액). 다른 지원금과의 중복 및 심사 조정은 반영하지 않습니다. 상한액을 모르면 공단에서 먼저 확인하세요.',['health']))
    calculators.append(calc_section('severance','퇴직금·퇴직소득세 모의계산','일반 근로자 · 중간정산 없는 단일 근속기간',field('sev-start','입사일','2020-01-01','date')+field('sev-end','퇴사일 (마지막 근무일 다음 날)','2026-01-01','date')+field('sev-wages','퇴직 전 3개월 임금 총액 (원)','11400000',hint='상여금·연차수당을 제외한 실제 산입 대상 3개월 합계.')+field('sev-bonus','산입 대상 연간 상여금 (원)','2000000')+field('sev-leave','산입 대상 연간 연차수당 (원)','0',hint='퇴직으로 새로 발생한 연차수당은 제외. 산입 기준을 확인하세요.')+field('sev-ordinary','1일 통상임금 (원)','0')+field('sev-taxyears','세법상 근속연수 (선택)','',min='1',max='80',required=False,hint='비워두면 단일 근속기간의 1년 미만 단수를 올림합니다.'),'주 평균 소정근로시간 15시간 이상·계속근로 1년 이상을 가정합니다. 퇴직 전 3개월의 실제 달력 일수와 계속근로일수/365를 사용하며, 평균임금과 입력 통상임금 중 큰 값을 적용합니다. 제외기간·중간정산·임원·비과세·세액이연은 미반영. 세후 금액은 일시금으로 세금을 정산하는 경우이며 IRP 이체액과 다릅니다.',['severance','retirementtax']))
    calculators.append(calc_section('pension','국민연금 조기·연기 수령 비교','공단에서 조회한 정상 개시 예상 월액을 기준으로 비교합니다',field('np-base','공단 예상 정상 월 연금액 (원)','1000000',min='1',hint='부양가족연금액을 제외한 노령연금액.')+select('np-age','출생연도별 정상 개시 연령',[(65,'1969년 이후 출생 · 65세'),(64,'1965~1968년 · 64세'),(63,'1961~1964년 · 63세'),(62,'1957~1960년 · 62세'),(61,'1953~1956년 · 61세'),(60,'1952년 이전 · 60세')])+select('np-shift','수령 시점',[(0,'정상 수령'),(-60,'5년 조기 · 30% 감액'),(-36,'3년 조기 · 18% 감액'),(36,'3년 연기 · 21.6% 가산'),(60,'5년 연기 · 36% 가산')])+field('np-until','누적액 비교 종료 연령 (세)','90',min='71',max='110'),'조기는 월 0.5% 감액, 전액 연기는 월 0.6% 가산을 적용합니다. 모든 시나리오를 같은 종료 연령 도달 직전까지 비교합니다. 추가 가입에 따른 증가·부양가족연금·물가·세금·현재가치·소득활동 제한은 미반영. 조기 수령은 가입기간과 소득요건 등 별도 자격을 확인해야 합니다.',['pension']))
    calculators.append(calc_section('yearend','카드·연금계좌 공제 계산','일반 사용분·기본 한도 기준 · 실제 환급액이 아닌 공제와 절세효과',field('ye-salary','연간 총급여 (원)','45000000',min='1')+field('ye-credit','공제 대상 일반 신용카드 사용액 (원)','15000000',hint='전통시장·대중교통·문화체육 등 별도 항목 제외.')+field('ye-debit','공제 대상 일반 체크카드·현금영수증 (원)','8000000')+field('ye-pension','연금저축 본인 납입액 (원)','6000000')+field('ye-irp','IRP·퇴직연금 본인부담금 (원)','0')+select('ye-rate','국세 한계세율 (과세표준 기준)',[(.15,'15% · 1,400만원 초과~5,000만원'),(.06,'6% · 1,400만원 이하'),(.24,'24% · 5,000만원 초과~8,800만원'),(.35,'35% · 8,800만원 초과~1억5천만원'),(.38,'38% · 1억5천만원 초과~3억원'),(.40,'40% · 3억원 초과~5억원'),(.42,'42% · 5억원 초과~10억원'),(.45,'45% · 10억원 초과')]),'총급여 25% 문턱을 신용카드부터 차감하고 15%/30% 공제율을 적용합니다. 기본 한도는 총급여 7천만원 이하 300만원, 초과 250만원. 연금저축 600만원·IRP 등 합산 900만원 한도입니다. 카드 절세효과는 입력 한계세율이 일정하다는 가정입니다. 자녀 등 추가한도·특별사용분·다른 공제·결정세액 한도는 제외하며 실제 환급액은 산출하지 않습니다.',['card','pensiontax']))
    tabs=[('unemployment','실업급여'),('freelancer','3.3% 정산'),('youth','청년도약계좌'),('health','병원비'),('severance','퇴직금'),('pension','국민연금'),('yearend','연말정산')]
    calcbody='<section class="page-intro"><span class="eyebrow">MONEY TOOLS</span><h1>숫자에, 근거를 더하다.</h1><p>입력 기준과 계산 범위를 확인하고 예상 금액을 비교하세요.</p></section><nav class="calc-tabs" aria-label="계산기 선택">'+''.join(f'<a href="?tab={key}#{key}" data-tab="{key}">{name}</a>' for key,name in tabs)+'</nav>'+''.join(calculators)+ad('calculator')
    page('calculator.html','금융·세금 계산기 7종','실업급여, 사업소득 정산, 청년도약계좌, 병원비 초과금, 퇴직금·퇴직소득세, 연금 수령 비교와 연말정산 공제 계산.',calcbody+calculator_hub(),'calculator',scripts=['finance.js','calculators.js'])
    page('guides.html','신청 전 읽는 지원금·환급 가이드','공식 출처로 확인하는 지원금과 환급 정보. 조건·신청기간·계산 기준을 확인하세요.','<section class="page-intro"><span class="eyebrow">MONEY GUIDE</span><h1>신청하기 전,<br>차근차근 확인하세요.</h1><p>혜택의 조건과 계산 기준을 이해하는 여섯 가지 가이드.</p></section><div class="grid three section">'+guide_cards()+'</div>','guides')
    for g in GUIDES:
        body = render_guide_body(g)
        page('guides/'+g['id']+'.html',g['title'],g['summary'],body,'guides',article=True)
    page('guide-detail.html','가이드 찾기','머니패스 공식 자료 기반 가이드를 확인하세요.','<section class="page-intro"><h1>가이드 찾기</h1><p>이전 주소로 접속하셨다면 해당 가이드로 이동합니다.</p></section><div class="grid three section">'+guide_cards()+'</div>','guides',scripts=['legacy.js'])
    about='<h1>머니패스 소개와 편집 원칙</h1><p class="lede">공식 정보를 읽기 쉽게 정리하고, 계산의 기준을 설명합니다.</p><h2>제공하는 것</h2><p>조건별 제도 탐색, 산식이 공개된 계산기, 신청 전 확인할 가이드를 제공합니다. 본인인증을 통한 환급금 조회나 지원금 신청 대행은 제공하지 않습니다.</p><h2>자료를 다루는 원칙</h2><ul><li>공식 기관의 자료를 출처로 연결하고 확인일을 표시합니다.</li><li>모집 종료·기존 가입자 안내를 신규 신청과 구분합니다.</li><li>서로 다른 성격의 최대금액을 합산해 개인 수혜액처럼 표시하지 않습니다.</li><li>실제 집계가 없는 진단건수·조회수·평균 환급액을 표시하지 않습니다.</li></ul><h2>업데이트와 정정</h2><p>정책은 수동으로 검토하며 실시간 갱신을 보장하지 않습니다. 오류나 변경 사항은 문의 페이지로 제보할 수 있습니다. 신청 전에 공식 사이트의 최신 공고를 확인하세요.</p><h2>운영 방식</h2><p>회원가입 없이 브라우저에서 계산합니다. 광고가 설정된 경우 광고 수익으로 운영할 수 있으며 광고와 공식 신청 링크는 구분해서 표시합니다.</p><a class="button" href="contact.html">오류·변경 사항 제보 →</a>'
    page('about.html','소개·편집 원칙','머니패스의 공식 출처 확인, 계산 범위, 정정 원칙과 운영 방식을 안내합니다.','<article class="article card legal">'+about+'</article>')
    contact='<h1>문의·오류 제보</h1><p class="lede">잘못된 정책 정보나 계산 결과를 발견했다면 알려주세요.</p><div class="notice">이 사이트는 문의 내용을 서버에 저장하지 않습니다. 이메일이 설정되어 있으면 메일 앱에서 초안을 열 수 있습니다. 실제 발송은 메일 앱에서 완료해 주세요.</div><div id="contact-status"></div><form id="contact-form"><div class="fields">'+field('contact-subject','제목','','text')+'</div><div class="field"><label for="contact-message">문의 내용</label><textarea id="contact-message" rows="7" required placeholder="문제가 발생한 페이지, 입력값 예시, 기대 결과와 실제 결과를 알려주세요. 주민등록번호·계좌번호·신고서 등 민감정보는 보내지 마세요."></textarea></div><p class="form-error" role="alert" hidden></p><div class="article-actions"><button type="submit" class="button" id="contact-send">메일 앱에서 초안 열기</button><button type="button" class="button secondary" id="contact-copy">문의 내용 복사</button></div><p id="contact-feedback" role="status"></p></form><h2>공개 오류 제보</h2><p>이메일이 아직 준비되지 않았다면 <a href="https://github.com/ssoxxl/moneypass/issues" target="_blank" rel="noopener noreferrer">GitHub Issues ↗</a>에 개인정보를 제외한 오류를 제보할 수 있습니다. GitHub 로그인이 필요합니다.</p>'
    if CONFIG.get('contactEmail'):
        email = e(CONFIG['contactEmail'])
        contact = contact.replace('<div id="contact-status"></div>', f'<p class="contact-email">문의 이메일: <a href="mailto:{email}">{email}</a></p><div id="contact-status"></div>')
    page('contact.html','문의·오류 제보','궁금한 점이나 잘못된 정보가 있다면 이메일로 알려주세요.','<article class="article card legal">'+contact+'</article>')
    privacy = privacy_content()
    terms='<h1>이용약관</h1><h2>서비스</h2><p>머니패스는 지원금·세금·연금 관련 정보와 모의계산 도구를 무료로 제공합니다. 정부기관의 공식 신청·심사 서비스가 아닙니다.</p><h2>이용자의 확인</h2><p>입력값과 대상 연도·자격·신청기간을 확인한 뒤 이용해 주세요. 결과는 공식 지급 결정이나 세무 신고서를 대신하지 않습니다. 계산 범위를 벗어나는 상황은 담당 기관 또는 자격 있는 전문가에게 확인해야 합니다.</p><h2>변경·정정</h2><p>제도 변경이나 오류 수정에 따라 내용과 도구를 변경할 수 있습니다. 오류 제보는 문의 페이지를 이용해 주세요.</p><h2>책임과 권리</h2><p>운영자는 정확한 정보를 제공하기 위해 노력합니다. 본 약관은 관련 법령에 따른 이용자의 권리나 운영자의 법적 책임을 배제하지 않습니다.</p>'
    disclaimer='<h1>계산 범위와 면책 안내</h1><p class="lede">계산 결과의 의미와 제외한 조건을 확인하세요.</p><h2>지원금 추천</h2><p>나이·현재 상황·주거·관심 분야로 관련 제도를 찾습니다. 가구소득·재산·혼인·가입이력 등 전체 조건을 심사하지 않으므로 수급자격을 확정하지 않습니다. 개인별 총 수혜액이나 실제 환급금 조회 결과를 제공하지 않습니다.</p><h2>모의계산</h2><p>각 계산기 상단과 출처 영역에 대상 연도·가정·제외 항목을 공개합니다. 실제 지급·신고·원천징수는 기관의 판단, 개인 이력, 산정 기간과 반올림·절사 규칙에 따라 달라질 수 있습니다.</p><h2>의사결정 전 확인</h2><p>급여 청구, 세금 신고, 연금 수령 신청 등은 공식 자료를 확인한 뒤 진행하세요. 부정확한 결과를 발견하면 입력 예시와 함께 문의해 주세요.</p>'
    if CONFIG.get('contactEmail'):
        email = e(CONFIG['contactEmail'])
        privacy += f'<p>개인정보 관련 문의: <a href="mailto:{email}">{email}</a></p>'
    for name,title,text in [('privacy','개인정보처리방침',privacy),('terms','이용약관',terms),('disclaimer','계산 범위·면책',disclaimer)]:
        page(name+'.html',title,title+' 및 서비스 이용 안내.','<article class="article card legal">'+text+'</article>')
    pages=['index.html','calculator.html','guides.html','about.html','contact.html','privacy.html','terms.html','disclaimer.html']+['guides/'+g['id']+'.html' for g in GUIDES]
    page('sitemap.html','전체 페이지','머니패스 전체 계산기·가이드·안내 페이지 목록.','<article class="article card legal"><h1>전체 페이지</h1><ul>'+''.join(f'<li><a href="{p}">{e(next((g["title"] for g in GUIDES if p=="guides/"+g["id"]+".html"),p))}</a></li>' for p in pages)+'</ul></article>')
    if BASE:
        write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{e(BASE+"/"+p)}</loc></url>' for p in pages+['sitemap.html'])+'</urlset>')
        write('robots.txt','User-agent: *\nAllow: /\nSitemap: '+BASE+'/sitemap.xml\n')
    else:
        (ROOT/'sitemap.xml').unlink(missing_ok=True)
        write('robots.txt','User-agent: *\nAllow: /\n')
    print(f'Built {len(pages)+2} pages. Canonical/sitemap: {"configured" if BASE else "pending siteUrl"}.')

if __name__ == '__main__': build()
