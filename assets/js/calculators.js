'use strict';
(function () {
  const F = MoneyFinance;
  const won = n => Math.round(n).toLocaleString('ko-KR')+' 원';
  const optionalZeros = new Set(['ue-ordinary','sev-bonus','sev-leave','sev-ordinary','hi-paid','fl-deduction']);
  const value = id => { const text=document.getElementById(id).value; return text==='' && optionalZeros.has(id) ? 0 : text; };
  function render(form,label,amount,rows,note) {
    const output = form.querySelector('.calc-result'); output.replaceChildren();
    const el = (tag,text,cls) => { const node = document.createElement(tag); node.textContent = text; if(cls)node.className=cls; return node; };
    output.append(el('p',label,'result-label'),el('div',amount,'result-value'));
    const dl = document.createElement('dl'); dl.className='result-grid';
    rows.forEach(([title,text]) => { const row=document.createElement('div'); row.append(el('dt',title),el('dd',text)); dl.append(row); });
    output.append(dl,el('p',note,'result-note')); output.hidden=false; output.focus();
  }
  const actions = {
    unemployment(form) {
      const r=F.unemployment({dailyAverage:value('ue-average'),ordinaryDaily:value('ue-ordinary'),hours:value('ue-hours'),period:value('ue-period'),older:value('ue-age')==='over50'});
      render(form,'수급자격이 인정될 때의 예상 총 구직급여',won(r.total),[['하루 지급액',won(r.daily)],['받을 수 있는 일수',r.days+' 일'],['28일 기준으로 계산하면',won(r.per28)],['입력한 근로시간의 하루 최소액',won(r.floor)]],'수급자격이 인정되고 해당 기간 동안 실업인정을 받는 경우예요. 실제 입금액은 회차별 인정일수에 따라 달라져요.');
    },
    freelancer(form) {
      const r=F.freelancer({income:value('fl-income'),expenseRate:Number(value('fl-rate'))/100,people:value('fl-family'),otherDeduction:value('fl-deduction'),credit:value('fl-credit')});
      render(form,r.balance>=0?'다른 소득이 없을 때 예상 환급 차액':'다른 소득이 없을 때 예상 추가 납부 차액',won(Math.abs(r.balance)),[['미리 낸 세금 (3.3%)',won(r.prepaid)],['반영한 필요경비',won(r.expense)],['과세표준',won(r.base)],['계산된 세금 (지방세 포함)',won(r.tax)]],'사업수입 전액에서 3.3%를 뗐고 다른 소득은 없다고 보고 계산했어요. 실제 신고할 때는 다른 소득과 공제도 함께 확인해 주세요.');
    },
    youth(form) {
      const r=F.youth({deposit:value('yl-deposit'),tier:value('yl-income'),rate:Number(value('yl-rate'))/100,normalRate:Number(value('yl-normal'))/100,months:value('yl-months')});
      render(form,'60개월을 같은 조건으로 납입하는 비교용 합계',won(r.total),[['내가 납입한 원금',won(r.principal)],['정부기여금',won(r.contribution)],['납입원금에 붙는 이자',won(r.interest)],['일반적금과 비교한 차이',(r.extra>=0?'+':'−')+won(Math.abs(r.extra))]],'매달 납입액과 금리·기여금이 같다고 보고 계산했어요. 기여금에 붙는 은행이자는 제외했으며, 기존 계좌의 납입 이력이나 실제 만기액을 계산한 결과는 아니에요.');
    },
    health(form) {
      const r=F.health({expense:value('hi-expense'),ceiling:value('hi-ceiling'),paid:value('hi-paid')});
      render(form,'아직 돌려받지 않은 예상 초과금',won(r.refund),[['상한제에 반영되는 본인부담금',won(r.expense)],['공단에서 확인한 상한액',won(r.ceiling)],['이미 받은 금액을 빼기 전 초과금',won(r.excess)]],'비급여 등 제외 항목을 빼고 입력했는지 확인해 주세요. 실제 환급액은 공단 심사와 다른 의료비 지원 여부에 따라 달라질 수 있어요.');
    },
    severance(form) {
      const r=F.severance({start:value('sev-start'),end:value('sev-end'),wages:value('sev-wages'),bonus:value('sev-bonus'),leave:value('sev-leave'),ordinaryDaily:value('sev-ordinary'),taxYears:value('sev-taxyears')});
      render(form,'세금을 뺀 예상 퇴직금',won(r.net),[['세전 퇴직금',won(r.gross)],['퇴직소득세',won(r.tax.national)],['지방소득세',won(r.tax.local)],['총 근무일수',r.days+' 일'],['평균임금을 계산한 기간',r.periodDays+' 일'],['계산에 적용한 하루 임금',won(r.daily)],['세금 계산에 적용한 근속연수',r.years+' 년'],['퇴직소득 과세표준',won(r.tax.base)]],'일시금으로 받고 세금을 정산하는 경우예요. IRP로 이체하거나 중간정산·근무 제외기간이 있다면 실제 금액이 달라질 수 있어요.');
    },
    pension(form) {
      const r=F.pension({base:value('np-base'),normalAge:value('np-age'),shift:value('np-shift'),untilAge:value('np-until')});
      render(form,'선택한 시점에 받기 시작하면, 매달',won(r.monthly),[['받기 시작하는 나이',r.startAge+' 세'],['정상 수령액과 비교하면',(r.factor*100).toFixed(1)+'%'],['선택한 시점으로 받으면 누적',won(r.total)],['정상 시점으로 받으면 누적',won(r.normalTotal)],['두 누적액의 차이',(r.difference>=0?'+':'−')+won(Math.abs(r.difference))]],'같은 종료 나이까지 받는 금액을 비교했어요. 물가·세금·추가 가입 등은 반영하지 않았으며, 조기 수령이 가능한지는 공단에서 확인해 주세요.');
    },
    yearend(form) {
      const r=F.yearend({salary:value('ye-salary'),credit:value('ye-credit'),debit:value('ye-debit'),pensionSavings:value('ye-pension'),irp:value('ye-irp'),marginalRate:value('ye-rate')});
      render(form,'세액한도 적용 전 최대 절세효과',won(r.effect),[['카드 공제가 시작되는 금액',won(r.threshold)],['카드 사용으로 받는 소득공제',won(r.cardDeduction)],['카드 공제로 줄어드는 세금의 가정 상한',won(r.cardEffect)],['연금계좌 공제 대상 납입액',won(r.eligiblePension)],['연금계좌 공제 가능액 (세액한도 적용 전)',won(r.pensionCredit)]],'실제 환급액도, 반드시 줄어드는 세금도 아니에요. 차감할 세금이 부족하면 이 금액을 모두 공제받지 못해요. 다른 공제와 결정세액을 함께 확인해 주세요.');
      const capacityNote=document.createElement('p');capacityNote.className='notice';capacityNote.textContent='아직 낼 세금의 한도를 적용하지 않은 최대치예요. 예를 들어 연금계좌 공제 가능액이 99만원이어도 차감할 세금이 20만원만 남았다면 99만원을 환급받는다고 볼 수 없어요.';form.querySelector('.calc-result .result-value').after(capacityNote);
    }
  };
  document.querySelectorAll('form[data-calculator]').forEach(form => {
    const error=form.querySelector('.form-error'), output=form.querySelector('.calc-result');
    form.addEventListener('submit',event => {
      event.preventDefault(); error.hidden=true; output.hidden=true;
      form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));
      const invalid=[...form.querySelectorAll('input,select')].find(input=>!input.checkValidity());
      if (invalid) { invalid.setAttribute('aria-invalid','true'); error.textContent=`${form.querySelector(`label[for="${invalid.id}"]`).textContent}: ${invalid.validationMessage}`; error.hidden=false; invalid.focus(); return; }
      try { actions[form.dataset.calculator](form); } catch(err) { error.textContent=err.message; error.hidden=false; error.tabIndex=-1; error.focus(); }
    });
    const resetResults=()=>{output.hidden=true;error.hidden=true;form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));};
    form.addEventListener('input',resetResults);
    form.addEventListener('change',resetResults);
  });
  const panels=[...document.querySelectorAll('.calc-panel')], tabs=[...document.querySelectorAll('[data-tab]')];
  function activate(key,update=false) {
    if (key === 'youthleap') key='youth';
    if (!panels.some(p=>p.id===key)) key='unemployment';
    panels.forEach(panel=>{panel.hidden=panel.id!==key;});
    tabs.forEach(tab=>{if(tab.dataset.tab===key)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');});
    if (update) { const url=new URL(location.href); url.searchParams.set('tab',key);url.hash=key;history.pushState({},'',url); }
  }
  const current=()=>new URLSearchParams(location.search).get('tab') || location.hash.slice(1) || 'unemployment';
  activate(current());
  tabs.forEach(tab=>tab.addEventListener('click',event=>{event.preventDefault();activate(tab.dataset.tab,true);}));
  window.addEventListener('popstate',()=>activate(current()));
})();
