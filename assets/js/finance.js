/* Pure calculations. Monetary inputs: KRW; annual rates: decimal fractions. */
(function (root) {
  'use strict';
  function number(value, name, min = 0, max = 1e12) {
    if (value === '' || (typeof value === 'string' && !value.trim()) || value === null || value === undefined || !Number.isFinite(Number(value))) throw new Error(`${name}을(를) 입력해 주세요.`);
    const n = Number(value);
    if (n < min || n > max) throw new Error(`${name}: ${min.toLocaleString()}~${max.toLocaleString()} 범위로 입력해 주세요.`);
    return n;
  }
  function integer(value, name, min, max) {
    const n = number(value, name, min, max);
    if (!Number.isInteger(n)) throw new Error(`${name}은(는) 정수로 입력해 주세요.`);
    return n;
  }
  function incomeTax(base) {
    const n = number(base, '과세표준');
    const brackets = [[14000000,.06,0],[50000000,.15,1260000],[88000000,.24,5760000],[150000000,.35,15440000],[300000000,.38,19940000],[500000000,.40,25940000],[1000000000,.42,35940000],[Infinity,.45,65940000]];
    const [,rate,deduction] = brackets.find(([limit]) => n <= limit);
    return Math.max(0, n * rate - deduction);
  }
  function unemployment({dailyAverage, ordinaryDaily = 0, hours, period, older}) {
    const avg = number(dailyAverage, '1일 평균임금', 0.01);
    const ordinary = number(ordinaryDaily, '1일 통상임금');
    const h = integer(hours, '1일 소정근로시간', 1, 8);
    const index = integer(period, '가입기간 구간', 1, 5) - 1;
    const floor = 10320 * .8 * h;
    const daily = Math.floor(Math.min(68100, Math.max(floor, Math.max(avg, ordinary) * .6)));
    const days = (older ? [120,180,210,240,270] : [120,150,180,210,240])[index];
    return {daily, days, total: daily * days, per28: daily * 28, floor};
  }
  function freelancer({income, expenseRate, people, otherDeduction = 0, credit = 70000}) {
    const gross = number(income, '연간 사업수입');
    const rate = number(expenseRate, '필요경비율', 0, 1);
    const count = integer(people, '기본공제 인원', 1, 30);
    const deduction = number(otherDeduction, '기타 소득공제');
    const taxCredit = number(credit, '세액공제');
    const expense = gross * rate;
    const base = Math.max(0, gross - expense - count * 1500000 - deduction);
    const national = Math.floor(Math.max(0, incomeTax(base) - taxCredit));
    const local = Math.floor(national * .1);
    const prepaid = Math.floor(gross * .03) + Math.floor(gross * .003);
    return {expense, base, national, local, tax: national + local, prepaid, balance: prepaid - national - local};
  }
  function youthContribution(deposit, tier) {
    const d = number(deposit, '월 납입액', 0, 700000);
    integer(tier, '소득구간', 1, 5);
    const [cap,rate] = [[400000,.06],[500000,.046],[600000,.037],[700000,.03],[700000,0]][tier-1];
    return Math.round(Math.min(d,cap) * rate + (tier === 5 ? 0 : Math.max(0,d-cap) * .03));
  }
  function youth({deposit, tier, rate, normalRate, months}) {
    const d = number(deposit, '월 납입액', 0, 700000);
    const m = integer(months, '표준 만기기간(개월)', 60, 60);
    const r = number(rate, '연 금리', 0, .3);
    const nr = number(normalRate, '비교 적금 금리', 0, .3);
    const principal = d * m;
    const contribution = youthContribution(d, integer(tier,'소득구간',1,5)) * m;
    const interest = Math.floor(d * m * (m+1) / 2 * r / 12);
    const normalInterest = Math.floor(d * m * (m+1) / 2 * nr / 12 * .846);
    return {principal, contribution, interest, total: principal+contribution+interest, extra: contribution+interest-normalInterest};
  }
  function health({expense, ceiling, paid = 0}) {
    const e = number(expense, '상한제 적용 본인부담금');
    const c = number(ceiling, '공단 확인 상한액', .01);
    const p = number(paid, '이미 지급·공제된 금액');
    return {expense:e, ceiling:c, excess:Math.max(0,e-c), refund:Math.max(0,e-c-p)};
  }
  function date(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('날짜를 정확히 입력해 주세요.');
    const d = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== value) throw new Error('유효하지 않은 날짜입니다.');
    return d;
  }
  function monthsBefore(d, months) {
    const first = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-months,1));
    const last = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
    first.setUTCDate(Math.min(d.getUTCDate(),last)); return first;
  }
  function retirementTax(pay, years) {
    const p = number(pay, '퇴직소득금액');
    const y = integer(years,'세법상 근속연수',1,80);
    const serviceDeduction = y <= 5 ? y*1000000 : y <= 10 ? 5000000+(y-5)*2000000 : y <= 20 ? 15000000+(y-10)*2500000 : 40000000+(y-20)*3000000;
    const converted = Math.max(0,p-serviceDeduction)*12/y;
    const deduction = converted <= 8000000 ? converted : converted <= 70000000 ? 8000000+(converted-8000000)*.6 : converted <= 100000000 ? 45200000+(converted-70000000)*.55 : converted <= 300000000 ? 61700000+(converted-100000000)*.45 : 151700000+(converted-300000000)*.35;
    const base = Math.max(0,converted-deduction);
    const national = Math.floor(incomeTax(base)*y/12);
    const local = Math.floor(national*.1);
    return {serviceDeduction, converted, deduction, base, national, local, total:national+local};
  }
  function severance({start, end, wages, bonus = 0, leave = 0, ordinaryDaily = 0, taxYears}) {
    const s = date(start), e = date(end);
    if (e <= s) throw new Error('퇴사일은 입사일보다 뒤여야 합니다.');
    const days = Math.round((e-s)/86400000);
    if (e < monthsBefore(s,-12)) throw new Error('계속근로기간 1년 미만입니다. 이 계산기는 일반적인 퇴직금 지급 대상만 지원합니다.');
    const periodDays = Math.round((e-monthsBefore(e,3))/86400000);
    const w = number(wages,'퇴직 전 3개월 임금 총액',.01);
    const b = number(bonus,'산입 대상 연간 상여금');
    const l = number(leave,'산입 대상 연차수당');
    const ordinary = number(ordinaryDaily,'1일 통상임금');
    const average = (w+(b+l)*3/12)/periodDays;
    const daily = Math.max(average,ordinary);
    const gross = Math.floor(daily*30*days/365);
    // Basic uninterrupted service: count an incomplete tax service year as a full year.
    let completed = e.getUTCFullYear()-s.getUTCFullYear();
    const anniversary = new Date(Date.UTC(e.getUTCFullYear(),s.getUTCMonth(),s.getUTCDate()));
    if (e < anniversary) completed--;
    const exactAnniversary = e.getTime() === new Date(Date.UTC(s.getUTCFullYear()+completed,s.getUTCMonth(),s.getUTCDate())).getTime();
    const years = taxYears === '' || taxYears === undefined ? completed+(exactAnniversary?0:1) : integer(taxYears,'세법상 근속연수',1,80);
    const tax = retirementTax(gross,years);
    return {days, periodDays, average, daily, gross, years, tax, net:gross-tax.total};
  }
  function pension({base, normalAge, shift, untilAge}) {
    const b = number(base,'공단 예상 월 연금액',.01);
    const age = integer(normalAge,'정상 수급 개시 연령',60,65);
    const months = integer(shift,'수령 시점 차이(개월)',-60,60);
    const until = integer(untilAge,'비교 종료 연령',age+6,110);
    // Integer permille prevents 1.36 becoming 1.359999... before flooring.
    const permille = 1000 + months * (months < 0 ? 5 : 6);
    const factor = permille / 1000;
    const monthly = Math.floor(b * permille / 1000);
    const count = Math.max(0,(until-age)*12-months);
    const total = monthly*count;
    const normalTotal = b*(until-age)*12;
    return {monthly, total, normalTotal, difference:total-normalTotal, factor, startAge:age+months/12, months:count};
  }
  function yearend({salary, credit, debit, pensionSavings, irp, marginalRate}) {
    const s = number(salary,'총급여',.01);
    const c = number(credit,'일반 신용카드 사용액');
    const d = number(debit,'일반 체크카드·현금영수증 사용액');
    const p = number(pensionSavings,'연금저축 납입액');
    const i = number(irp,'IRP 등 본인부담금');
    const rate = number(marginalRate,'국세 한계세율',.06,.45);
    const threshold = s*.25;
    const raw = Math.max(0,c-threshold)*.15 + Math.max(0,d-Math.max(0,threshold-c))*.30;
    const limit = s <= 70000000 ? 3000000 : 2500000;
    const cardDeduction = Math.min(raw,limit);
    const eligiblePension = Math.min(9000000,Math.min(p,6000000)+i);
    const pensionCredit = eligiblePension*(s<=55000000?.165:.132);
    const cardEffect = cardDeduction*rate*1.1;
    return {threshold, cardDeduction, eligiblePension, pensionCredit, cardEffect, effect:cardEffect+pensionCredit};
  }
  const api = {number,integer,incomeTax,unemployment,freelancer,youthContribution,youth,health,date,monthsBefore,retirementTax,severance,pension,yearend};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MoneyFinance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
