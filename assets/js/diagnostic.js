/**
 * MoneyPass - 맞춤형 지원금/환급금 30초 진단 엔진 (모던 UI)
 */

function runDiagnostic() {
  const age = document.getElementById("diag-age").value;
  const job = document.getElementById("diag-job").value;
  const income = document.getElementById("diag-income").value;
  const house = document.getElementById("diag-house").value;
  const interest = document.getElementById("diag-interest").value;

  const resultContainer = document.getElementById("diagnostic-results");
  const listContainer = document.getElementById("policy-list-output");
  const totalAmountEl = document.getElementById("result-total-amount");
  const matchCountEl = document.getElementById("result-match-count");
  const loadingIndicator = document.getElementById("diag-loading");

  if (loadingIndicator) loadingIndicator.classList.remove("hidden");
  if (resultContainer) resultContainer.classList.add("hidden");

  setTimeout(() => {
    if (loadingIndicator) loadingIndicator.classList.add("hidden");

    // Filtering logic
    const matchedPolicies = MONEYPASS_DATA.policies.filter(item => {
      const ageMatch = item.targetAge.includes("all") || item.targetAge.includes(age);
      const jobMatch = item.targetJob.includes("all") || item.targetJob.includes(job);
      const incomeMatch = item.targetIncome.includes("all") || item.targetIncome.includes(income);
      const houseMatch = item.targetHouse.includes("all") || item.targetHouse.includes(house);
      const interestMatch = (interest === "all") || (item.category === interest);

      let score = 0;
      if (ageMatch) score++;
      if (jobMatch) score++;
      if (incomeMatch) score++;
      if (houseMatch) score++;
      if (interestMatch) score += 2;

      return score >= 3;
    });

    let totalEst = 0;
    listContainer.innerHTML = "";

    matchedPolicies.forEach(policy => {
      totalEst += (policy.amountNum || 0);

      const card = document.createElement("div");
      card.className = "bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between";
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">${policy.categoryName}</span>
            <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">${policy.badge}</span>
          </div>
          <h4 class="text-lg font-extrabold text-slate-900 mb-2 leading-snug">${policy.title}</h4>
          <div class="text-base font-black text-emerald-600 mb-3 flex items-center gap-1">
            <span>💸</span> ${policy.maxAmount}
          </div>
          <p class="text-sm text-slate-600 leading-relaxed mb-5">${policy.summary}</p>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-slate-100">
          <button onclick="openPolicyModal('${policy.id}')" class="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition text-center">
            상세 요건 보기
          </button>
          <a href="${policy.officialUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition text-center shadow-sm">
            공식 신청 &rarr;
          </a>
        </div>
      `;
      listContainer.appendChild(card);
    });

    const formattedTotal = (totalEst / 10000).toLocaleString();
    totalAmountEl.textContent = `최대 약 ${formattedTotal}만 원 수혜 가능`;
    matchCountEl.textContent = `회원님의 조건에 부합하는 정책 및 환급 혜택이 총 ${matchedPolicies.length}건 발견되었습니다.`;

    resultContainer.classList.remove("hidden");
    resultContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 400);
}

// Modal handling
function openPolicyModal(policyId) {
  const policy = MONEYPASS_DATA.policies.find(p => p.id === policyId);
  if (!policy) return;

  const modal = document.getElementById("policy-modal");
  const modalBody = document.getElementById("modal-body-content");

  const reqHtml = policy.requirements.map(r => `<li class="flex items-start gap-2"><span class="text-blue-500 font-bold">•</span><span>${r}</span></li>`).join("");
  const stepHtml = policy.steps.map((s, idx) => `<li class="flex items-start gap-2.5"><span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span><span>${s}</span></li>`).join("");

  modalBody.innerHTML = `
    <div class="mb-4">
      <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">${policy.categoryName}</span>
      <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 ml-1.5">${policy.badge}</span>
    </div>
    
    <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2 leading-tight">${policy.title}</h3>
    <div class="text-lg font-black text-emerald-600 mb-4">${policy.maxAmount}</div>
    <p class="text-sm text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
      ${policy.summary}
    </p>

    <div class="space-y-6">
      <div>
        <h4 class="text-sm font-black text-slate-900 mb-2.5 flex items-center gap-1.5">
          <span>📋</span> 필수 자격 요건
        </h4>
        <ul class="text-xs sm:text-sm text-slate-700 space-y-2">
          ${reqHtml}
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-black text-slate-900 mb-2.5 flex items-center gap-1.5">
          <span>🚀</span> 신청 절차 및 서류
        </h4>
        <ol class="text-xs sm:text-sm text-slate-700 space-y-2.5">
          ${stepHtml}
        </ol>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900 leading-relaxed">
        <strong>💡 머니패스 핵심 꿀팁:</strong><br>
        ${policy.tips}
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-slate-100">
      <a href="${policy.officialUrl}" target="_blank" rel="noopener noreferrer" class="block w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-center text-sm shadow-md transition">
        정부 공식 신청 포털로 이동하기 &rarr;
      </a>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closePolicyModal() {
  const modal = document.getElementById("policy-modal");
  if (modal) modal.classList.add("hidden");
}


// Viral Share Feature
function shareDiagnosticResult() {
  const totalText = document.getElementById("result-total-amount").textContent;
  const countText = document.getElementById("result-match-count").textContent;
  const shareMsg = `[머니패스] 2026 내 숨은 지원금·환급금 진단 결과!\n💸 ${totalText}\n📌 ${countText}\n\n너도 30초 만에 공짜로 조회해봐 👉 ${window.location.href}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareMsg).then(() => {
      alert("카카오톡이나 SNS에 바로 붙여넣기 할 수 있도록 결과 문구가 복사되었어 형!");
    });
  } else {
    alert(shareMsg);
  }
}

// 1-sec Document Checklist Copy
function copyDocChecklist() {
  const checklist = `[머니패스 2026 정부지원금/환급금 필수 구비서류 체크리스트]\n1. 주민등록등본 (정부24 발급 - 세대원 포함)\n2. 소득금액증명원 (홈택스 발급 - 직전년도 근로/사업소득)\n3. 건강보험료 납부확인서 (최근 3개월치)\n4. 주택임대차계약서 사본 및 월세 이체 내역서 (주거지원 신청 시)\n5. 신분증 및 본인 명의 계좌 통장 사본\n\n📌 상세 진단 및 계산기: ${window.location.origin}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(checklist).then(() => {
      alert("주민센터/신청 시 필요한 서류 체크리스트가 클립보드에 복사되었어 형! 메모장에 붙여넣고 확인해봐!");
    });
  } else {
    alert(checklist);
  }
}
