const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../assets/js/finance.js');
const match=require('../assets/js/diagnostic.js');
const data=require('../assets/js/data.js');

test('all progressive tax bracket boundaries and continuity',()=>{
  for(const [base,tax] of [[0,0],[14000000,840000],[50000000,6240000],[88000000,15360000],[150000000,37060000],[300000000,94060000],[500000000,174060000],[1000000000,384060000],[2000000000,834060000]]) assert.equal(F.incomeTax(base),tax);
  for(const n of [14000000,50000000,88000000,150000000,300000000,500000000,1000000000]) assert.ok(F.incomeTax(n+1)>F.incomeTax(n));
});
test('2026 unemployment floor, ceiling, ordinary wage and every duration',()=>{
  const params={dailyAverage:100000,hours:8,period:1,older:false};
  assert.equal(F.unemployment(params).daily,66048);
  assert.equal(F.unemployment({...params,dailyAverage:200000}).daily,68100);
  assert.equal(F.unemployment({...params,dailyAverage:1000,hours:4}).daily,33024);
  assert.equal(F.unemployment({...params,dailyAverage:1000,hours:1}).daily,8256);
  assert.equal(F.unemployment({...params,ordinaryDaily:120000}).daily,68100);
  for(let i=1;i<=5;i++){
    assert.equal(F.unemployment({...params,period:i}).days,[120,150,180,210,240][i-1]);
    assert.equal(F.unemployment({...params,period:i,older:true}).days,[120,180,210,240,270][i-1]);
  }
});
test('freelancer: zero income, zero expense rate, refund, additional payment and high income',()=>{
  assert.equal(F.freelancer({income:0,expenseRate:0,people:1}).balance,0);
  const refund=F.freelancer({income:10000000,expenseRate:.8,people:1});
  assert.equal(refund.base,500000);assert.equal(refund.tax,0);assert.equal(refund.balance,330000);
  const owe=F.freelancer({income:30000000,expenseRate:0,people:1});
  assert.equal(owe.base,28500000);assert.equal(owe.national,2945000);assert.equal(owe.balance,-2249500);
  assert.ok(F.freelancer({income:2000000000,expenseRate:0,people:1}).tax>800000000);
});
test('youth contribution scales with payment and income tier; no fixed maximum for small deposits',()=>{
  for(const [tier,result] of [[1,33000],[2,29000],[3,25200],[4,21000],[5,0]]) assert.equal(F.youthContribution(700000,tier),result);
  assert.equal(F.youthContribution(400000,1),24000);
  assert.equal(F.youthContribution(100000,1),6000);
  assert.equal(F.youthContribution(0,1),0);
  const r=F.youth({deposit:700000,tier:1,rate:.045,normalRate:.038,months:60});
  assert.equal(r.principal,42000000);assert.equal(r.contribution,1980000);assert.equal(r.interest,4803750);
  assert.equal(F.youth({deposit:0,tier:1,rate:0,normalRate:0,months:60}).total,0);
  assert.throws(()=>F.youth({deposit:700000,tier:1,rate:.045,normalRate:.038,months:12}));
});
test('health: exclusions already reflected, prior payments and no negative refunds',()=>{
  assert.equal(F.health({expense:3500000,ceiling:1500000,paid:500000}).refund,1500000);
  assert.equal(F.health({expense:100000,ceiling:1500000}).refund,0);
  assert.equal(F.health({expense:3500000,ceiling:1500000,paid:3000000}).refund,0);
  assert.throws(()=>F.health({expense:3500000,ceiling:''}));
});
test('retirement tax: full conversion and progressive deductions, not fixed rate',()=>{
  const r=F.retirementTax(30000000,5);
  assert.equal(r.serviceDeduction,5000000);assert.equal(r.converted,60000000);
  assert.equal(r.deduction,39200000);assert.equal(r.base,20800000);
  assert.equal(r.national,775000);assert.equal(r.local,77500);assert.equal(r.total,852500);
  assert.equal(F.retirementTax(5000000,5).total,0);
  for(const [y,d] of [[5,5000000],[10,15000000],[20,40000000],[21,43000000]])assert.equal(F.retirementTax(100000000,y).serviceDeduction,d);
});
test('severance: real calendar days, exact anniversary, ordinary wage and invalid periods',()=>{
  const r=F.severance({start:'2025-01-01',end:'2026-01-01',wages:9200000,bonus:0});
  assert.equal(r.periodDays,92);assert.equal(r.days,365);assert.equal(r.daily,100000);assert.equal(r.gross,3000000);assert.equal(r.years,1);
  const higher=F.severance({start:'2025-01-01',end:'2026-01-02',wages:9200000,ordinaryDaily:120000});
  assert.equal(higher.daily,120000);assert.equal(higher.years,2);
  assert.throws(()=>F.severance({start:'2025-01-01',end:'2025-12-31',wages:9000000}));
  assert.throws(()=>F.severance({start:'2026-01-01',end:'2025-01-01',wages:9000000}));
  assert.throws(()=>F.date('2025-02-29'));
  assert.equal(F.monthsBefore(F.date('2026-05-31'),3).toISOString().slice(0,10),'2026-02-28');
  assert.equal(F.severance({start:'2024-02-29',end:'2025-02-28',wages:9000000}).years,1);
});
test('pension: same end age, loss of deferral months, birth-year normal age',()=>{
  const input={base:1000000,normalAge:65,untilAge:90};
  assert.equal(F.pension({...input,shift:0}).total,300000000);
  const early=F.pension({...input,shift:-60});assert.equal(early.monthly,700000);assert.equal(early.total,252000000);
  const delay=F.pension({...input,shift:60});assert.equal(delay.monthly,1360000);assert.equal(delay.total,326400000);
  assert.equal(F.pension({...input,normalAge:63,shift:0}).months,324);
});
test('yearend: credit first threshold, debit-only, caps, pension-only cap and zero amounts',()=>{
  const input={salary:40000000,credit:15000000,debit:5000000,pensionSavings:9000000,irp:0,marginalRate:.15};
  const r=F.yearend(input);assert.equal(r.cardDeduction,2250000);assert.equal(r.eligiblePension,6000000);assert.equal(r.pensionCredit,990000);
  assert.equal(F.yearend({...input,pensionSavings:6000000,irp:3000000}).eligiblePension,9000000);
  assert.equal(F.yearend({...input,credit:0,debit:20000000}).cardDeduction,3000000);
  assert.equal(F.yearend({...input,salary:80000000,credit:60000000,debit:0}).cardDeduction,2500000);
  assert.equal(F.yearend({...input,credit:0,debit:0,pensionSavings:0}).effect,0);
  assert.equal(F.yearend({...input,credit:5000000,debit:5000000}).cardDeduction,0);
});
test('validation rejects negative, NaN, missing, fractional integer and out of range input',()=>{
  for(const input of ['',null,undefined,NaN,Infinity,-1]) assert.throws(()=>F.number(input,'test'));
  assert.equal(F.number(0,'test'),0);
  assert.throws(()=>F.integer(1.5,'test',1,8));
  assert.throws(()=>F.youthContribution(700001,1));
});
test('diagnostic regression: seniors never receive youth rent; interest/house/job are hard filters',()=>{
  const senior={age:70,job:'employee',house:'other',interest:'all',includeClosed:true};
  assert.ok(!match(data.policies,senior).some(p=>p.id==='youth-rent-2026'));
  assert.ok(!match(data.policies,senior).some(p=>p.id==='national-employment-support'));
  assert.ok(!match(data.policies,senior).some(p=>p.id==='unemployment-benefit-calc'));
  const young={age:29,job:'jobseeker',house:'rent',interest:'all'};
  assert.ok(match(data.policies,young).every(p=>p.status!=='closed'));
  assert.ok(match(data.policies,{...young,interest:'tax'}).every(p=>p.category==='tax'));
  assert.ok(!match(data.policies,{...young,house:'parents',includeClosed:true}).some(p=>p.id==='youth-rent-2026'));
  assert.throws(()=>match(data.policies,{...young,age:''}));
});
test('historical income discovery includes current students and jobseekers',()=>{
  for(const job of ['student','jobseeker','other']){
    const policies=match(data.policies,{age:29,job,house:'parents',interest:'tax'});
    assert.ok(policies.some(p=>p.id==='earned-income-tax-credit'));
    assert.ok(policies.some(p=>p.id==='freelancer-tax-refund'));
  }
});
test('every discovery policy links to an existing in-depth guide',()=>{
  const fs=require('node:fs'),path=require('node:path');
  for(const policy of data.policies){assert.ok(policy.guideId);assert.ok(fs.existsSync(path.join(__dirname,'../guides',policy.guideId+'.html')));}
});

test('situation discovery preserves age limits and avoids inferring child age from parent',()=>{
  const base={age:35,job:'jobseeker',house:'rent',interest:'all'};
  const find=criteria=>match(data.policies,{...base,...criteria},data.situations);
  const retired=find({situation:'retirement'});
  for(const id of ['unemployment-benefit-calc','unemployment-credit','health-continued','training-card']) assert.ok(retired.some(p=>p.id===id),id);
  assert.ok(!find({age:60,situation:'retirement'}).some(p=>p.id==='unemployment-credit'));
  assert.ok(!find({}).some(p=>p.category==='family'));
  assert.ok(find({situation:'parenting'}).some(p=>p.id==='parent-benefit'));
  assert.ok(find({interest:'family'}).some(p=>p.id==='first-meeting-voucher'));
  assert.ok(find({age:65,situation:'senior'}).some(p=>p.id==='basic-pension'));
  assert.ok(!find({age:64,situation:'senior'}).some(p=>p.id==='basic-pension'));
  for(const route of Object.values(data.situations)) for(const id of route.ids) assert.ok(data.policies.some(p=>p.id===id),id);
});
