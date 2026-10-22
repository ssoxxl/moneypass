/**
 * MoneyPass - 초고효율 금융/환급 인터랙티브 계산기 모듈 풀 패키지 (7종)
 */

// 1. 실업급여 모의계산기
function calculateUnemployment() {
  const ageOver50 = document.getElementById("ue-age").value === "over50";
  const period = parseInt(document.getElementById("ue-period").value, 10);
  const monthlySalary = parseFloat(document.getElementById("ue-salary").value) || 0;
  const dailyHours = parseInt(document.getElementById("ue-hours").value, 10) || 8;

  if (monthlySalary <= 0) {
    alert("퇴사 전 3개월 평균 월급을 입력해줘 형!");
    return;
  }

  const dailyAvg = monthlySalary / 30;
  let dailyBenefit = dailyAvg * 0.6;
  const MAX_DAILY = 66000;
  const MIN_DAILY = Math.floor(9860 * 0.8 * dailyHours);

  if (dailyBenefit > MAX_DAILY) dailyBenefit = MAX_DAILY;
  if (dailyBenefit < MIN_DAILY) dailyBenefit = MIN_DAILY;

  let days = 120;
  if (!ageOver50) {
    if (period === 1) days = 120;
    else if (period === 2) days = 150;
    else if (period === 3) days = 180;
    else if (period === 4) days = 210;
    else if (period === 5) days = 240;
  } else {
    if (period === 1) days = 120;
    else if (period === 2) days = 180;
    else if (period === 3) days = 210;
    else if (period === 4) days = 240;
    else if (period === 5) days = 270;
  }

  const totalBenefit = Math.round(dailyBenefit * days);
  const monthlyBenefit = Math.round(dailyBenefit * 30);

  document.getElementById("ue-result-box").classList.remove("hidden");
  document.getElementById("ue-total-amount").textContent = totalBenefit.toLocaleString() + " 원";
  document.getElementById("ue-daily-amount").textContent = Math.round(dailyBenefit).toLocaleString() + " 원";
  document.getElementById("ue-days-count").textContent = days + " 일 (약 " + (days / 30).toFixed(1) + "개월)";
  document.getElementById("ue-monthly-amount").textContent = monthlyBenefit.toLocaleString() + " 원";
}

// 2. 프리랜서 3.3% 환급액 계산기
function calculateFreelancerTax() {
  const annualIncome = parseFloat(document.getElementById("fl-income").value) || 0;
  const expenseRate = parseFloat(document.getElementById("fl-rate").value) || 0.65;
  const familyCount = parseInt(document.getElementById("fl-family").value, 10) || 1;

  if (annualIncome <= 0) {
    alert("연간 3.3% 총 수입을 입력해줘 형!");
    return;
  }

  const prePaidTax = annualIncome * 0.033;
  const prePaidIncomeTax = annualIncome * 0.03;
  const expenseAmount = annualIncome * expenseRate;
  const incomeAmount = Math.max(0, annualIncome - expenseAmount);
  const personalDeduction = familyCount * 1500000 + 70000;
  const taxableIncome = Math.max(0, incomeAmount - personalDeduction);

  let calculatedTax = 0;
  if (taxableIncome <= 14000000) {
    calculatedTax = taxableIncome * 0.06;
  } else if (taxableIncome <= 50000000) {
    calculatedTax = 840000 + (taxableIncome - 14000000) * 0.15;
  } else {
    calculatedTax = 6240000 + (taxableIncome - 50000000) * 0.24;
  }

  calculatedTax = Math.max(0, calculatedTax - 70000);
  let refundIncomeTax = prePaidIncomeTax - calculatedTax;
  let finalRefund = refundIncomeTax > 0 ? refundIncomeTax * 1.1 : 0;

  document.getElementById("fl-result-box").classList.remove("hidden");
  document.getElementById("fl-refund-amount").textContent = Math.round(finalRefund).toLocaleString() + " 원";
  document.getElementById("fl-prepaid-tax").textContent = Math.round(prePaidTax).toLocaleString() + " 원";
  document.getElementById("fl-expense-deduct").textContent = Math.round(expenseAmount).toLocaleString() + " 원 (" + (expenseRate * 100) + "%)";
  document.getElementById("fl-final-tax").textContent = Math.round(calculatedTax * 1.1).toLocaleString() + " 원";
}

// 3. 청년도약계좌 만기 비교기
function calculateYouthLeap() {
  const monthlyDeposit = parseFloat(document.getElementById("yl-deposit").value) || 700000;
  const incomeTier = document.getElementById("yl-income").value;

  let matchPerMonth = 24000;
  if (incomeTier === "tier1") matchPerMonth = 33000;
  else if (incomeTier === "tier2") matchPerMonth = 29000;
  else if (incomeTier === "tier3") matchPerMonth = 25000;
  else if (incomeTier === "tier4") matchPerMonth = 22000;
  else matchPerMonth = 0;

  const months = 60;
  const totalPrincipal = monthlyDeposit * months;
  const totalGovMatch = matchPerMonth * months;
  const baseRate = 0.06;
  const interest = monthlyDeposit * (months * (months + 1) / 2) * (baseRate / 12);
  const leapTotal = totalPrincipal + totalGovMatch + interest;

  const normalRate = 0.038;
  const normalGrossInterest = monthlyDeposit * (months * (months + 1) / 2) * (normalRate / 12);
  const normalNetInterest = normalGrossInterest * (1 - 0.154);
  const normalTotal = totalPrincipal + normalNetInterest;
  const extraProfit = leapTotal - normalTotal;

  document.getElementById("yl-result-box").classList.remove("hidden");
  document.getElementById("yl-total-amount").textContent = Math.round(leapTotal).toLocaleString() + " 원";
  document.getElementById("yl-principal").textContent = totalPrincipal.toLocaleString() + " 원";
  document.getElementById("yl-gov-match").textContent = totalGovMatch.toLocaleString() + " 원 (정부 전액 지원)";
  document.getElementById("yl-interest").textContent = Math.round(interest).toLocaleString() + " 원 (비과세 100%)";
  document.getElementById("yl-extra-gain").textContent = "+" + Math.round(extraProfit).toLocaleString() + " 원";
}

// 4. 건보료 본인부담상한제 환급기
function calculateHealthRefund() {
  const medicalExpense = parseFloat(document.getElementById("hi-expense").value) || 0;
  const tier = parseInt(document.getElementById("hi-tier").value, 10) || 1;

  if (medicalExpense <= 0) {
    alert("지출한 병원비를 입력해줘 형!");
    return;
  }

  const ceilingTiers = {
    1: 870000, 2: 1080000, 3: 1080000, 4: 1620000, 5: 1620000,
    6: 3030000, 7: 3030000, 8: 4140000, 9: 5380000, 10: 8000000
  };

  const ceiling = ceilingTiers[tier] || 1620000;
  const refund = Math.max(0, medicalExpense - ceiling);

  document.getElementById("hi-result-box").classList.remove("hidden");
  document.getElementById("hi-refund-amount").textContent = Math.round(refund).toLocaleString() + " 원";
  document.getElementById("hi-my-ceiling").textContent = ceiling.toLocaleString() + " 원";
  document.getElementById("hi-my-expense").textContent = medicalExpense.toLocaleString() + " 원";
}

// 5. [신규 추가] 퇴직금 & 퇴직소득세 모의계산기 (초고단가 금융 키워드)
function calculateSeverance() {
  const startYear = parseInt(document.getElementById("sev-start-year").value, 10) || 2020;
  const endYear = parseInt(document.getElementById("sev-end-year").value, 10) || 2026;
  const monthlySalary = parseFloat(document.getElementById("sev-salary").value) || 0;
  const annualBonus = parseFloat(document.getElementById("sev-bonus").value) || 0;

  if (monthlySalary <= 0) {
    alert("퇴직 전 3개월 평균 월급을 입력해줘 형!");
    return;
  }

  const workYears = Math.max(1, endYear - startYear);
  // 퇴직금 산정식: (1일 평균임금 * 30일) * 근속연수
  // 1일 평균임금 = (3개월 급여 + 연간 상여금의 3/12) / 약 90일
  const threeMonthSalary = monthlySalary * 3 + (annualBonus * 0.25);
  const dailySalary = threeMonthSalary / 91.25;
  const severancePay = Math.round(dailySalary * 30 * workYears);

  // 2026 개편 퇴직소득공제 (근속연수공제 대폭 확대 반영)
  let serviceDeduction = 0;
  if (workYears <= 5) serviceDeduction = workYears * 1000000;
  else if (workYears <= 10) serviceDeduction = 5000000 + (workYears - 5) * 2000000;
  else if (workYears <= 20) serviceDeduction = 15000000 + (workYears - 10) * 2500000;
  else serviceDeduction = 40000000 + (workYears - 20) * 3000000;

  const afterDeduction = Math.max(0, severancePay - serviceDeduction);
  // 환산급여
  const convertedSalary = (afterDeduction / workYears) * 12;
  // 환산급여공제 및 소득세율 적용 추정세액 (실효세율 보통 2~5% 수준)
  let estTax = 0;
  if (convertedSalary > 0) {
    estTax = Math.round(convertedSalary * 0.035 * (workYears / 12) * 1.1);
  }
  const netSeverance = severancePay - estTax;

  document.getElementById("sev-result-box").classList.remove("hidden");
  document.getElementById("sev-total-amount").textContent = severancePay.toLocaleString() + " 원";
  document.getElementById("sev-net-amount").textContent = netSeverance.toLocaleString() + " 원";
  document.getElementById("sev-tax-amount").textContent = estTax.toLocaleString() + " 원 (지방세 포함)";
  document.getElementById("sev-years-count").textContent = workYears + " 년";
}

// 6. [신규 추가] 국민연금 예상 수령액 및 조기 vs 연기연금 비교기
function calculateNationalPension() {
  const avgIncome = parseFloat(document.getElementById("np-income").value) || 3000000;
  const payYears = parseInt(document.getElementById("np-years").value, 10) || 20;
  const claimOption = document.getElementById("np-option").value;

  // 국민연금 기본 공식 추정 (소득대체율 40% 기준)
  // 20년 가입 기준 월 약 평균소득의 20~23% 수준
  let baseMonthly = (avgIncome * 0.01 * payYears) * 1.08;

  let multiplier = 1.0;
  let optionText = "정상 수령 (만 65세)";
  if (claimOption === "early5") {
    multiplier = 0.70; // 5년 일찍 받으면 30% 감액
    optionText = "5년 조기 수령 (만 60세, -30% 감액)";
  } else if (claimOption === "early3") {
    multiplier = 0.82; // 3년 일찍
    optionText = "3년 조기 수령 (만 62세, -18% 감액)";
  } else if (claimOption === "delay5") {
    multiplier = 1.36; // 5년 늦게 받으면 +36% 증액
    optionText = "5년 연기 수령 (만 70세, +36% 증액)";
  }

  const finalMonthly = Math.round(baseMonthly * multiplier);
  const annualTotal = finalMonthly * 12;
  const lifetimeEst = finalMonthly * 12 * 25; // 25년간 수령 기준

  document.getElementById("np-result-box").classList.remove("hidden");
  document.getElementById("np-monthly-amount").textContent = finalMonthly.toLocaleString() + " 원 / 월";
  document.getElementById("np-annual-amount").textContent = annualTotal.toLocaleString() + " 원";
  document.getElementById("np-lifetime-amount").textContent = "약 " + (lifetimeEst / 100000000).toFixed(1) + "억 원";
  document.getElementById("np-applied-option").textContent = optionText;
}

// 7. [신규 추가] 연말정산 신용카드 vs 체크카드 vs 연금저축 절세 계산기
function calculateYearEndTax() {
  const salary = parseFloat(document.getElementById("ye-salary").value) || 45000000;
  const creditSpend = parseFloat(document.getElementById("ye-credit").value) || 0;
  const debitSpend = parseFloat(document.getElementById("ye-debit").value) || 0;
  const pensionSavings = parseFloat(document.getElementById("ye-pension").value) || 0;

  // 카드 소득공제 문턱: 총급여의 25%
  const threshold = salary * 0.25;
  const totalSpend = creditSpend + debitSpend;

  let cardDeduction = 0;
  if (totalSpend > threshold) {
    const excess = totalSpend - threshold;
    // 신용카드(15%) 먼저 채우고 체크카드(30%) 공제
    const debitRatio = debitSpend / totalSpend;
    const effRate = (1 - debitRatio) * 0.15 + debitRatio * 0.30;
    cardDeduction = Math.min(3000000, excess * effRate);
  }

  // 연금저축/IRP 세액공제 (최대 900만원, 총급여 5500만원 이하는 16.5%, 초과는 13.2%)
  const taxCreditRate = salary <= 55000000 ? 0.165 : 0.132;
  const pensionTaxCredit = Math.min(9000000, pensionSavings) * taxCreditRate;

  // 카드 소득공제로 아끼는 세금 (한계세율 약 16.5% 적용)
  const cardTaxSaved = cardDeduction * 0.165;
  const totalSaved = cardTaxSaved + pensionTaxCredit;

  document.getElementById("ye-result-box").classList.remove("hidden");
  document.getElementById("ye-total-saved").textContent = Math.round(totalSaved).toLocaleString() + " 원 환급";
  document.getElementById("ye-pension-saved").textContent = Math.round(pensionTaxCredit).toLocaleString() + " 원";
  document.getElementById("ye-card-saved").textContent = Math.round(cardTaxSaved).toLocaleString() + " 원";
  document.getElementById("ye-card-deduct").textContent = Math.round(cardDeduction).toLocaleString() + " 원";
}
