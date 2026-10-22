/* Matching is a discovery filter, never an eligibility decision. */
(function (root) {
  'use strict';
  const situationIds = (id) => (typeof MONEYPASS_DATA !== 'undefined' ? MONEYPASS_DATA.situations?.[id]?.ids : null);
  function matchPolicies(policies, {age,job,house,interest,situation='all',includeClosed=false}, situations) {
    const n = Number(age);
    if (age === '' || !Number.isInteger(n) || n < 0 || n > 120) throw new Error('만 나이는 0~120의 정수로 입력해 주세요.');
    const selected = situations?.[situation]?.ids || situationIds(situation);
    return policies.filter(p =>
      (includeClosed || p.status !== 'closed') &&
      n >= p.age[0] && n <= p.age[1] &&
      (!p.jobs.length || p.jobs.includes(job)) &&
      (!p.houses.length || p.houses.includes(house)) &&
      (interest === 'all' || p.category === interest) &&
      (!selected || selected.includes(p.id)) &&
      (p.category !== 'family' || situation === 'parenting' || interest === 'family')
    );
  }
  root.moneyMatchPolicies = matchPolicies;
  if (typeof module !== 'undefined' && module.exports) module.exports = matchPolicies;
  if (typeof document === 'undefined') return;
  const form = document.getElementById('diagnostic-form');
  if (!form) return;
  const text = (tag, value, className='') => { const el = document.createElement(tag); el.textContent = value; el.className = className; return el; };
  function list(items, tag='ul') { const el = document.createElement(tag); items.forEach(item => el.appendChild(text('li',item))); return el; }
  function card(policy) {
    const el = document.createElement('article'); el.className = 'card policy-card';
    el.dataset.policyId = policy.id;
    el.id = 'policy-'+policy.id;
    const closed = policy.status === 'closed';
    el.append(text('span',closed ? '모집 마감 · 기존 가입자 안내' : '신청 조건을 확인해 보세요',`badge${closed?' closed':''}`),text('h3',policy.title),text('p',policy.amount,'amount'),text('p',policy.summary));
    const details = document.createElement('details');
    details.append(text('summary','추가 조건 확인 → 신청 준비'),text('h4','자격 판단에 추가로 필요한 조건'),list(policy.requirements),text('h4','이 순서로 진행하세요'),list(policy.steps,'ol'));
    el.append(text('p',policy.reason),details,text('p',`자료 확인 ${policy.verified}${policy.end ? ' · 공고상 접수 종료 '+policy.end : ''}`,'fine'));
    const a = document.createElement('a'); a.href = policy.officialUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'button secondary'; a.textContent = '공식 안내 확인하기 ↗';
    el.append(a);
    if (policy.guideId) {
      const guide=document.createElement('a');guide.href='guides/'+encodeURIComponent(policy.guideId)+'.html';guide.className='text-link policy-guide';guide.textContent='대상 조건·신청 준비 자세히 보기 →';el.append(guide);
    }
    const related = {'earned-income-tax-credit':['eitc/','장려금 예상액 계산하기'],'youth-rent-2026':['rent-tax-credit/','월세 세액공제 알아보기'],'unemployment-benefit-calc':['average-wage/','평균임금 먼저 계산하기']}[policy.id];
    if (related) {
      const link=document.createElement('a');link.href='https://calc.ssoxxl.com/'+related[0];link.target='_blank';link.rel='noopener noreferrer';link.className='text-link policy-calculator';link.textContent=related[1]+' · 계산왕 ↗';el.append(link);
    }
    return el;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error'), output = document.getElementById('diagnostic-results');
    error.hidden = true;
    try {
      const criteria = {
        age:document.getElementById('diag-age').value,job:document.getElementById('diag-job').value,house:document.getElementById('diag-house').value,interest:document.getElementById('diag-interest').value,situation:document.getElementById('diag-situation').value,includeClosed:document.getElementById('diag-closed').checked
      };
      const matches = matchPolicies(MONEYPASS_DATA.policies, criteria);
      output.replaceChildren(text('h3',`살펴볼 만한 혜택 ${matches.length}개를 찾았어요`),text('p','신청 대상인지는 소득·재산 등 세부 조건에 따라 달라져요. 각 안내에서 신청 조건과 접수기간을 확인해 주세요.'));
      const route=MONEYPASS_DATA.situations[criteria.situation];
      if(route){
        const flow=text('section','','next-step');
        flow.append(text('h3',route.title+' · 확인 순서'),list(route.steps,'ol'),text('p',route.caution,'notice'));
        output.append(flow);
      }
      if(matches.length){
        const compare=text('div','','table-scroll');compare.tabIndex=0;compare.setAttribute('role','region');compare.setAttribute('aria-label','관련 제도 비교');
        const table=document.createElement('table');table.append(text('caption','1. 지원 성격을 비교하세요 · 금액을 합산하지 마세요'));
        const head=document.createElement('thead'),hr=document.createElement('tr');
        for(const label of ['제도','지원 성격','먼저 확인할 조건']){const th=text('th',label);th.scope='col';hr.append(th);}head.append(hr);table.append(head);
        const body=document.createElement('tbody');
        matches.forEach(p=>{const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';const a=document.createElement('a');a.href='#policy-'+p.id;a.textContent=p.title;th.append(a);tr.append(th,text('td',p.kind||p.label),text('td',p.requirements[0]));body.append(tr);});
        table.append(body);compare.append(table);output.append(compare,text('h3','2. 추가 조건을 확인하고 신청을 준비하세요'));
      }
      const grid = document.createElement('div'); grid.className = 'grid two';
      matches.forEach(p => grid.appendChild(card(p)));
      if (!matches.length) {
        const closed=criteria.includeClosed ? [] : matchPolicies(MONEYPASS_DATA.policies,{...criteria,includeClosed:true}).filter(p=>p.status==='closed');
        const empty=text('div',closed.length ? `현재 추천에 포함하지 않은 마감·기존 가입자 안내가 ${closed.length}개 있어요. 접수 중인 다른 사업은 공식 사이트에서 확인해 주세요.` : '이 조건으로 소개해 드릴 혜택이 아직 없어요. 관심 분야를 ‘전체’로 바꿔보거나 정부24·복지로에서 다른 혜택도 찾아보세요.','empty-state');
        if (closed.length) { const button=text('button','마감된 안내도 함께 보기','button secondary');button.type='button';button.addEventListener('click',()=>{document.getElementById('diag-closed').checked=true;form.requestSubmit();});empty.append(button); }
        output.append(empty);
      }
      output.appendChild(grid); output.hidden = false; output.focus();
    } catch (err) { output.hidden = true; error.textContent = err.message; error.hidden = false; document.getElementById('diag-age').focus(); }
  });
  const resetResults = () => { document.getElementById('diagnostic-results').hidden = true; form.querySelector('.form-error').hidden = true; };
  form.addEventListener('input', resetResults);
  form.addEventListener('change', resetResults);
  document.getElementById('diag-situation').addEventListener('change',()=>{
    document.getElementById('diag-interest').value='all';
    if(document.getElementById('diag-situation').value==='retirement') document.getElementById('diag-job').value='jobseeker';
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
