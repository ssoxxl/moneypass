/**
 * MoneyPass - 메인 통합 스크립트 (모던 UI)
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Render Guide Cards
  const guideGrid = document.getElementById("guides-grid-target");
  if (guideGrid && typeof MONEYPASS_DATA !== "undefined") {
    renderGuideCards(MONEYPASS_DATA.guides, guideGrid);
  }

  // 2. Render Guide Detail Page
  const guideDetailContainer = document.getElementById("guide-detail-container");
  if (guideDetailContainer && typeof MONEYPASS_DATA !== "undefined") {
    renderGuideDetailPage();
  }

  // 3. Modal Backdrop Close
  const modal = document.getElementById("policy-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closePolicyModal();
      }
    });
  }
});

// Render guide cards
function renderGuideCards(guides, container) {
  container.innerHTML = "";
  guides.forEach(guide => {
    const card = document.createElement("article");
    card.className = "bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group";
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <span class="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">${getCategoryLabel(guide.category)}</span>
          <span>•</span>
          <span>${guide.date}</span>
          <span>•</span>
          <span>⏱️ ${guide.readTime}</span>
        </div>
        <h3 class="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition mb-2.5 leading-snug">
          <a href="guide-detail.html?id=${guide.id}">${guide.thumbnail} ${guide.title}</a>
        </h3>
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-5">${guide.summary}</p>
      </div>
      <div class="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100 font-medium">
        <span>조회수 ${guide.views}</span>
        <a href="guide-detail.html?id=${guide.id}" class="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
          전문 읽기 &rarr;
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

function getCategoryLabel(cat) {
  const map = {
    housing: "주거/월세",
    finance: "금융/적금",
    job: "취업/실업",
    tax: "세금/환급",
    refund: "의료/생활"
  };
  return map[cat] || "종합 가이드";
}

// Render detail page based on ?id=
function renderGuideDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const guideId = urlParams.get("id") || MONEYPASS_DATA.guides[0].id;
  const guide = MONEYPASS_DATA.guides.find(g => g.id === guideId) || MONEYPASS_DATA.guides[0];

  document.title = `${guide.title} | 머니패스 (MoneyPass)`;

  const container = document.getElementById("guide-detail-container");
  if (!container) return;

  container.innerHTML = `
    <header class="mb-8 pb-6 border-b border-slate-200">
      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
        <span class="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">${getCategoryLabel(guide.category)}</span>
        <span>•</span>
        <span>발행: ${guide.date}</span>
        <span>•</span>
        <span>읽는 시간: ${guide.readTime}</span>
        <span>•</span>
        <span>누적 조회수: ${guide.views}</span>
      </div>
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
        ${guide.title}
      </h1>
      <div class="bg-blue-50/70 border-l-4 border-blue-600 p-4 rounded-r-xl text-slate-700 text-sm sm:text-base leading-relaxed">
        ${guide.summary}
      </div>
    </header>

    <!-- Top In-Article Ad Slot -->
    <div class="ad-placeholder w-full h-28 rounded-xl flex flex-col items-center justify-center text-xs text-slate-400 font-medium my-6">
      <span class="text-[10px] tracking-wider uppercase bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded mb-1">스폰서 광고</span>
      [구글 애드센스 고단가 본문 상단 반응형 광고]
    </div>

    <!-- Article Content Body -->
    <div class="prose prose-slate max-w-none text-slate-800 leading-relaxed text-base space-y-6">
      ${guide.content}
    </div>

    <!-- Bottom In-Article Ad Slot -->
    <div class="ad-placeholder w-full h-28 rounded-xl flex flex-col items-center justify-center text-xs text-slate-400 font-medium my-8">
      <span class="text-[10px] tracking-wider uppercase bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded mb-1">스폰서 광고</span>
      [구글 애드센스 본문 하단 멀티플렉스 / 일치하는 콘텐츠]
    </div>

    <!-- Share Card -->
    <div class="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 class="font-black text-slate-900 text-base mb-1">가족, 지인들에게 이 정보를 공유하세요</h4>
        <p class="text-xs text-slate-500">몰라서 놓치는 정부지원금과 숨은 환급금을 함께 챙길 수 있습니다.</p>
      </div>
      <button onclick="shareCurrentPage()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition whitespace-nowrap">
        🔗 링크 복사하기
      </button>
    </div>
  `;
}

function shareCurrentPage() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("페이지 링크가 복사되었습니다! 카카오톡이나 SNS에 공유해보세요.");
    });
  } else {
    alert("현재 주소: " + window.location.href);
  }
}
