// scripts/generate-report.js
// GitHub Actions에서 실행되는 보고서 자동 생성 스크립트
// 필요 패키지: npm install @anthropic-ai/sdk (또는 node-fetch)

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────
// 설정
// ─────────────────────────────────────────────────────────
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 이번 주 Vol 번호 계산 (연도 기준 주차)
function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

// 한국 날짜 포맷
function getKoreanDate() {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}.${m}.${d} (${days[now.getDay()]})`;
}

const VOL = getWeekNumber();
const DATE = getKoreanDate();
const TOPIC = `2026년 ${new Date().getMonth() + 1}월 ${VOL}주차 채용 트렌드`;

// ─────────────────────────────────────────────────────────
// 프롬프트
// ─────────────────────────────────────────────────────────
const PART_A_SYSTEM = `당신은 HR·채용 트렌드 전문 애널리스트입니다.
주어진 주제를 바탕으로 JSON을 생성하세요.
마크다운 코드블록 없이 순수 JSON만 출력하세요. 설명 문장 금지.

출력 스키마:
{
  "meta": {
    "vol": "숫자",
    "date": "YYYY.MM.DD (요일)",
    "headline": "핵심 헤드라인 한 줄",
    "subheadline": "핵심 요약 2문장"
  },
  "stats": [
    { "num": "수치", "desc": "설명", "change": "변화", "color": "red" },
    { "num": "수치", "desc": "설명", "change": "변화", "color": "blue" },
    { "num": "수치", "desc": "설명", "change": "변화", "color": "green" },
    { "num": "수치", "desc": "설명", "change": "변화", "color": "gold" },
    { "num": "수치", "desc": "설명", "change": "변화", "color": "red" }
  ],
  "sections": [
    {
      "id": "s01", "num": "01", "title": "국내 채용 트렌드", "icon": "🇰🇷",
      "sourceCount": "출처 N개",
      "overview": "3문장 개요",
      "cards": [
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "red" },
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "blue" }
      ],
      "chartTitle": null, "chartData": [],
      "expandItems": [],
      "callout": { "text": "주요 시사점 한 문장", "color": "blue" },
      "keywords": [
        { "text": "키워드1", "style": "filled", "color": "red" },
        { "text": "키워드2", "style": "outline", "color": "blue" }
      ],
      "sources": [
        { "text": "기관명 「보고서명」", "url": "https://example.com", "meta": "날짜" }
      ]
    },
    {
      "id": "s02", "num": "02", "title": "직군별 채용 동향", "icon": "📊",
      "sourceCount": "출처 N개",
      "overview": "3문장 개요",
      "cards": [
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "green" },
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "gold" }
      ],
      "chartTitle": "직군별 채용 비중", "chartData": [
        { "label": "IT·개발", "value": 35, "color": "blue" },
        { "label": "영업·마케팅", "value": 25, "color": "red" },
        { "label": "제조·생산", "value": 20, "color": "green" }
      ],
      "expandItems": [],
      "callout": { "text": "주요 시사점 한 문장", "color": "gold" },
      "keywords": [
        { "text": "키워드1", "style": "filled", "color": "blue" }
      ],
      "sources": [
        { "text": "기관명 「보고서명」", "url": "https://example.com", "meta": "날짜" }
      ]
    }
  ]
}

규칙: stats 정확히 5개, sections 정확히 2개(s01·s02), cards 각 2개, 짧고 간결하게, 실제 기업명·수치 포함
문자열 값 안에 줄바꿈(엔터) 절대 금지 — 한 문장은 한 줄로만 작성
작은따옴표(') 사용 금지 — 큰따옴표(") 또는 한국어 조사로 대체
역슬래시(\) 사용 금지`;

const PART_B_SYSTEM = `당신은 HR·채용 트렌드 전문 애널리스트입니다.
주어진 주제를 바탕으로 JSON을 생성하세요.
마크다운 코드블록 없이 순수 JSON만 출력하세요. 설명 문장 금지.

출력 스키마:
{
  "sections": [
    {
      "id": "s03", "num": "03", "title": "이번 주 주요 공채", "icon": "📅",
      "sourceCount": "출처 N개",
      "overview": "3문장 개요",
      "cards": [
        { "tag": "기업명", "title": "채용 직군", "body": "2문장 내용", "color": "red" },
        { "tag": "기업명", "title": "채용 직군", "body": "2문장 내용", "color": "blue" }
      ],
      "chartTitle": null, "chartData": [], "expandItems": [],
      "callout": { "text": "시사점 한 문장", "color": "red" },
      "keywords": [{ "text": "키워드", "style": "filled", "color": "red" }],
      "sources": [{ "text": "기관명", "url": "https://example.com", "meta": "날짜" }]
    },
    {
      "id": "s04", "num": "04", "title": "글로벌 채용 트렌드", "icon": "🌐",
      "sourceCount": "출처 N개",
      "overview": "3문장 개요",
      "cards": [
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "blue" },
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "gold" }
      ],
      "chartTitle": null, "chartData": [], "expandItems": [],
      "callout": { "text": "시사점 한 문장", "color": "gold" },
      "keywords": [{ "text": "키워드", "style": "outline", "color": "blue" }],
      "sources": [{ "text": "기관명", "url": "https://example.com", "meta": "날짜" }]
    },
    {
      "id": "s05", "num": "05", "title": "AI·기술 트렌드", "icon": "🤖",
      "sourceCount": "출처 N개",
      "overview": "3문장 개요",
      "cards": [
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "green" },
        { "tag": "태그", "title": "소제목", "body": "2문장 내용", "color": "blue" }
      ],
      "chartTitle": null, "chartData": [], "expandItems": [],
      "callout": { "text": "시사점 한 문장", "color": "green" },
      "keywords": [{ "text": "키워드", "style": "filled", "color": "green" }],
      "sources": [{ "text": "기관명", "url": "https://example.com", "meta": "날짜" }]
    }
  ],
  "editorNote": "편집장 총평 2~3문장",
  "nextIssue": "다음 호 예고 한 문장"
}

규칙: sections 정확히 3개(s03·s04·s05), editorNote·nextIssue 필수, cards 각 2개, 짧고 간결하게
문자열 값 안에 줄바꿈(엔터) 절대 금지 — 한 문장은 한 줄로만 작성
작은따옴표(') 사용 금지 — 큰따옴표(") 또는 한국어 조사로 대체
역슬래시(\) 사용 금지`;

// ─────────────────────────────────────────────────────────
// JSON 파서
// ─────────────────────────────────────────────────────────
function parseJSON(raw) {
  // 1. 코드블록 제거
  let s = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  // 2. 첫 { 부터 마지막 } 까지만 추출
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a === -1 || b === -1) throw new Error("JSON 블록 없음");
  s = s.slice(a, b + 1);

  // 3. 시도 1: 그대로 파싱
  try { return JSON.parse(s); } catch (_) {}

  // 4. 시도 2: 제어문자 제거 후 파싱
  try {
    return JSON.parse(s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""));
  } catch (_) {}

  // 5. 시도 3: 문자열 값 내부의 줄바꿈/탭 이스케이프 후 파싱
  try {
    const fixed = s.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) =>
      `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "").replace(/\t/g, "\\t")}"`);
    return JSON.parse(fixed);
  } catch (_) {}

  // 6. 시도 4: 한국어 특수문자(「」『』) 및 이모지 제거 후 파싱
  try {
    const cleaned = s
      .replace(/[\u2018\u2019\u201C\u201D]/g, "'") // 스마트 따옴표 → 일반
      .replace(/\\'/g, "'")                           // 불필요한 ' 이스케이프 제거
      .replace(/([^\\])\\([^"\\/bfnrtu])/g, "$1$2"); // 잘못된 이스케이프 제거
    return JSON.parse(cleaned);
  } catch (_) {}

  // 7. 시도 5: JSON 내 모든 문자열 값을 안전하게 재구성
  try {
    const rebulit = s.replace(
      /: *"((?:[^"\\]|\\[\s\S])*)"/g,
      (match, val) => {
        const safe = val
          .replace(/\\(?!["\\/bfnrtu])/g, "\\\\") // 잘못된 역슬래시 이스케이프
          .replace(/(?<!\\)\n/g, "\\n")
          .replace(/(?<!\\)\r/g, "")
          .replace(/(?<!\\)\t/g, "\\t");
        return `: "${safe}"`;
      }
    );
    return JSON.parse(rebulit);
  } catch (_) {}

  throw new Error("모든 파싱 시도 실패");
}

// ─────────────────────────────────────────────────────────
// API 호출 (재시도 포함)
// ─────────────────────────────────────────────────────────
async function callClaude(system, userContent, maxTokens = 4000) {
  const MAX_RETRY = 4;
  const RETRYABLE = new Set([429, 500, 529]);

  for (let i = 0; i <= MAX_RETRY; i++) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userContent }],
      });
      return response.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    } catch (err) {
      const status = err?.status || err?.statusCode;
      const isRetryable = RETRYABLE.has(status) || err.message?.includes("overloaded");
      if (!isRetryable || i === MAX_RETRY) throw err;
      const delay = 8000 * Math.pow(2, i);
      console.log(`  ⏳ 재시도 ${i + 1}/${MAX_RETRY} (${delay / 1000}초 후)...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ─────────────────────────────────────────────────────────
// HTML 생성기
// ─────────────────────────────────────────────────────────
function generateHTML(data) {
  const colorHex = { red: "#c8421a", blue: "#1d3461", green: "#1a3a2a", gold: "#a07828" };
  const hex = (c) => colorHex[c] || colorHex.blue;

  const statsHtml = (data.stats || []).map(s =>
    `<div class="stat-box">
      <div class="num ${s.color === "blue" ? "blue" : s.color === "green" ? "green" : s.color === "gold" ? "gold" : ""}">${s.num || ""}</div>
      <div class="desc">${s.desc || ""}</div>
      <div class="change">${s.change || ""}</div>
    </div>`).join("");

  const tocHtml = (data.sections || []).map(s =>
    `<a href="#${s.id}"><span class="tn">${s.num}</span>${s.title}</a>`).join("");

  const sectionsHtml = (data.sections || []).map(sec => {
    const cards = (sec.cards || []).map(c =>
      `<div class="card ${c.color !== "red" ? c.color || "" : ""}">
        <div class="ctag">${c.tag || ""}</div>
        <div class="ctitle">${c.title || ""}</div>
        <div class="cbody">${c.body || ""}</div>
      </div>`).join("");

    const chart = (sec.chartData || []).length ? `
      <div class="div-text"><span>${sec.chartTitle || ""}</span></div>
      <div class="bar-wrap">
        <div class="bar-label-top">${sec.chartTitle || ""}</div>
        ${(sec.chartData || []).map(d =>
          `<div class="bar-row">
            <div class="bar-lbl">${d.label}</div>
            <div class="bar-track"><div class="bar-fill ${d.color !== "red" ? d.color || "" : ""}" style="width:${Math.min(Number(d.value) || 0, 100)}%"></div></div>
            <div class="bar-pct">${d.value}%</div>
          </div>`).join("")}
      </div>` : "";

    const expand = (sec.expandItems || []).map(e =>
      `<div class="xpand">
        <button class="xbtn" onclick="toggle(this)">
          <div class="xl"><span class="xb" style="background:${hex(e.color || "blue")}">${e.badge || ""}</span>${e.title || ""}</div>
          <span class="xa">▼</span>
        </button>
        <div class="xcontent">${(e.paragraphs || []).map(p => `<p>${p}</p>`).join("")}</div>
      </div>`).join("");

    const callout = sec.callout
      ? `<div class="callout ${sec.callout.color !== "red" ? sec.callout.color || "" : ""}">${sec.callout.text || ""}</div>` : "";

    const kw = (sec.keywords || []).length
      ? `<div class="chip-row">${(sec.keywords || []).map(k =>
          `<span class="chip${k.style === "outline" ? " outline" : ""}${k.style !== "outline" && k.color !== "red" ? " " + (k.color || "") : ""}">${k.text}</span>`
        ).join("")}</div>` : "";

    const src = (sec.sources || []).length
      ? `<div class="srcbox">
          <div class="src-label">데이터 출처 ${sec.sourceCount ? "(" + sec.sourceCount + ")" : ""}</div>
          <ul class="slist">
            ${(sec.sources || []).map(s =>
              `<li>${s.url ? `<a href="${s.url}" target="_blank">${s.text || ""}</a>` : (s.text || "")}
              ${s.meta ? `<span class="src-meta">${s.meta}</span>` : ""}</li>`).join("")}
          </ul>
        </div>` : "";

    return `<div class="section" id="${sec.id}">
      <div class="sec-header">
        <span class="sec-num">${sec.num}</span>
        <span class="sec-title">${sec.title}</span>
        ${sec.sourceCount ? `<span class="src-count">${sec.sourceCount}</span>` : ""}
        <span class="sec-icon">${sec.icon || ""}</span>
      </div>
      ${sec.overview ? `<div class="ov-box"><div class="ov-label">Overview</div><div class="ov-text">${sec.overview}</div></div>` : ""}
      ${cards ? `<div class="card-grid">${cards}</div>` : ""}
      ${chart}${expand}${callout}${kw}${src}
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>채용 트렌드 주간 보고서 | 2026 Vol.${data.meta?.vol || VOL}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Noto+Serif+KR:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--ink:#0f0e0d;--cream:#f4f1eb;--ww:#faf8f4;--red:#c8421a;--red-lt:#f4d5c9;--blue:#1d3461;--blue-lt:#d0dbed;--muted:#7a7570;--div:#d9d4cc;--green:#1a3a2a;--green-lt:#d4e8dc;--gold:#a07828;--gold-lt:#f2e8cc;--fb:"Noto Sans KR",sans-serif;--fs:"Noto Serif KR",serif;--fm:"IBM Plex Mono",monospace;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--cream);color:var(--ink);font-family:var(--fb);font-size:14px;line-height:1.8;max-width:960px;margin:0 auto;padding:52px 40px 100px;}
.mh{border-top:5px solid var(--ink);border-bottom:1px solid var(--ink);padding:22px 0 18px;display:grid;grid-template-columns:1fr auto;align-items:end;gap:24px;}
.mh .vol{font-family:var(--fm);font-size:9px;letter-spacing:2.5px;color:var(--muted);text-transform:uppercase;margin-bottom:8px;}
.mh .mt{font-family:var(--fs);font-size:34px;font-weight:700;letter-spacing:-1px;line-height:1.1;}
.pill{display:inline-block;background:var(--red);color:#fff;font-family:var(--fm);font-size:9px;letter-spacing:2px;padding:3px 11px;text-transform:uppercase;margin-top:10px;}
.mhr{text-align:right;padding-bottom:4px;}
.mhr .date{font-family:var(--fm);font-size:10px;letter-spacing:1.5px;color:var(--muted);display:block;}
.hero{background:var(--ink);color:var(--cream);padding:26px 32px;position:relative;overflow:hidden;}
.hero::after{content:'채용';position:absolute;right:-8px;top:-18px;font-size:120px;font-weight:900;color:rgba(255,255,255,0.04);line-height:1;pointer-events:none;}
.hero .lbl{font-family:var(--fm);font-size:9px;letter-spacing:3px;color:var(--red);text-transform:uppercase;margin-bottom:10px;}
.hero .hl{font-size:19px;font-weight:700;line-height:1.5;margin-bottom:10px;}
.hero .sub{font-size:12.5px;color:rgba(244,241,235,.75);line-height:1.75;}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--div);border:1px solid var(--div);margin-bottom:36px;}
.stat-box{background:var(--ww);padding:18px 12px;text-align:center;}
.stat-box .num{font-family:var(--fs);font-size:26px;font-weight:700;color:var(--red);line-height:1;margin-bottom:5px;}
.stat-box .num.blue{color:var(--blue);}.stat-box .num.green{color:var(--green);}.stat-box .num.gold{color:var(--gold);}
.stat-box .desc{font-size:10.5px;color:var(--muted);line-height:1.5;}
.stat-box .change{font-family:var(--fm);font-size:9px;color:var(--green);margin-top:3px;}
.toc{border:1px solid var(--div);background:#edeae4;padding:18px 22px;margin-bottom:44px;display:grid;grid-template-columns:1fr 1fr;gap:3px 28px;}
.toc-h{font-family:var(--fm);font-size:9px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-bottom:12px;grid-column:1/-1;}
.toc a{font-size:12.5px;color:var(--ink);text-decoration:none;display:flex;align-items:baseline;gap:8px;padding:3px 0;border-bottom:1px dotted var(--div);}
.toc a:hover{color:var(--red);}.toc a .tn{font-family:var(--fm);font-size:9px;color:var(--red);min-width:20px;}
.section{margin-bottom:58px;scroll-margin-top:16px;}
.sec-header{display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:12px;border-bottom:2.5px solid var(--ink);}
.sec-num{font-family:var(--fm);font-size:9.5px;background:var(--ink);color:var(--cream);padding:2px 8px;letter-spacing:1px;}
.sec-title{font-family:var(--fs);font-size:20px;font-weight:700;}
.sec-icon{margin-left:auto;font-size:20px;}
.src-count{font-family:var(--fm);font-size:9px;color:var(--gold);border:1px solid var(--gold);padding:2px 8px;letter-spacing:1px;}
.ov-box{background:var(--green);color:#fff;padding:22px 28px;margin-bottom:18px;}
.ov-label{font-family:var(--fm);font-size:9px;letter-spacing:3px;color:var(--green-lt);text-transform:uppercase;margin-bottom:10px;}
.ov-text{font-size:13.5px;line-height:1.8;}
.card-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;}
.card{background:var(--ww);border:1px solid var(--div);border-left:3px solid var(--red);padding:16px 18px;}
.card.blue{border-left-color:var(--blue);}.card.green{border-left-color:var(--green);}.card.gold{border-left-color:var(--gold);}
.ctag{font-family:var(--fm);font-size:9.5px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px;}
.ctitle{font-size:14px;font-weight:700;margin-bottom:7px;line-height:1.4;}
.cbody{font-size:12.5px;color:#3d3a35;line-height:1.75;}
.xpand{margin-bottom:12px;}
.xbtn{width:100%;background:var(--ww);border:1px solid var(--div);border-left:3px solid var(--blue);padding:12px 18px;text-align:left;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:var(--fb);font-size:13px;font-weight:700;color:var(--ink);}
.xbtn .xl{display:flex;align-items:center;gap:10px;}
.xb{font-family:var(--fm);font-size:9px;letter-spacing:1.5px;color:#fff;padding:2px 8px;text-transform:uppercase;flex-shrink:0;}
.xa{font-size:11px;color:var(--muted);transition:transform .2s;}
.xbtn.open .xa{transform:rotate(180deg);}
.xcontent{display:none;background:#edeae4;border:1px solid var(--div);border-top:none;border-left:3px solid var(--blue);padding:18px 22px;}
.xcontent.open{display:block;}
.xcontent p{font-size:13px;line-height:1.8;margin-bottom:10px;color:#3a3730;}
.bar-wrap{background:var(--ww);border:1px solid var(--div);padding:18px 22px;margin:14px 0;}
.bar-label-top{font-family:var(--fm);font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:16px;}
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
.bar-lbl{font-size:11.5px;color:var(--muted);min-width:130px;text-align:right;flex-shrink:0;}
.bar-track{flex:1;background:var(--div);height:9px;overflow:hidden;}
.bar-fill{height:100%;background:var(--red);}
.bar-fill.blue{background:var(--blue);}.bar-fill.green{background:var(--green);}.bar-fill.gold{background:var(--gold);}
.bar-pct{font-family:var(--fm);font-size:11px;min-width:50px;}
.callout{border:1px solid var(--red);background:var(--red-lt);padding:13px 18px;margin:14px 0;font-size:13px;line-height:1.75;}
.callout.blue{border-color:var(--blue);background:var(--blue-lt);}.callout.gold{border-color:var(--gold);background:var(--gold-lt);}.callout.green{border-color:var(--green);background:var(--green-lt);}
.chip-row{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0;}
.chip{background:var(--ink);color:var(--cream);font-size:11.5px;padding:3px 12px;}
.chip.outline{background:transparent;border:1px solid var(--ink);color:var(--ink);}
.chip.blue{background:var(--blue);}.chip.green{background:var(--green);}.chip.gold{background:var(--gold);}
.div-text{display:flex;align-items:center;gap:12px;margin:20px 0;}
.div-text::before,.div-text::after{content:'';flex:1;height:1px;background:var(--div);}
.div-text span{font-family:var(--fm);font-size:9.5px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;}
.srcbox{margin-top:22px;padding:14px 20px;background:#e8e4de;border-top:2px solid var(--div);}
.src-label{font-family:var(--fm);font-size:8.5px;letter-spacing:2.5px;color:var(--muted);text-transform:uppercase;margin-bottom:10px;}
.slist{list-style:none;}
.slist li{font-size:11px;color:#555;line-height:1.65;padding:3px 0 3px 17px;position:relative;border-bottom:1px dotted #cec9c1;}
.slist li:last-child{border-bottom:none;}
.slist li::before{content:'↗';position:absolute;left:0;color:var(--red);font-size:10px;top:4px;}
.slist a{color:#555;text-decoration:none;border-bottom:1px dotted #aaa;}
.slist a:hover{color:var(--red);}
.src-meta{font-family:var(--fm);font-size:9px;color:var(--muted);background:#d9d4cc;padding:1px 6px;margin-left:7px;}
.ed-box{background:var(--green);color:#fff;padding:22px 28px;margin-bottom:18px;}
.ed-lbl{font-family:var(--fm);font-size:9px;letter-spacing:3px;color:var(--green-lt);text-transform:uppercase;margin-bottom:10px;}
.ed-txt{font-size:13.5px;line-height:1.8;}
.next{border:1px solid var(--gold);background:var(--gold-lt);padding:13px 18px;margin:14px 0;font-size:13px;}
.footer{margin-top:70px;padding-top:18px;border-top:2.5px solid var(--ink);display:flex;justify-content:space-between;align-items:center;}
.footer-brand{font-family:var(--fs);font-size:16px;font-weight:700;}
.footer-meta{font-family:var(--fm);font-size:9.5px;color:var(--muted);text-align:right;line-height:1.8;}
@media(max-width:680px){body{padding:24px 18px 60px;}.stats{grid-template-columns:repeat(3,1fr);}.card-grid,.mh{grid-template-columns:1fr;}.toc{grid-template-columns:1fr;}}
</style></head><body>
<div class="mh">
  <div>
    <div class="vol">채용 트렌드 리포트 · Vol.${data.meta?.vol || VOL} · 2026 — AI 자동 생성</div>
    <div class="mt">채용 트렌드<br>주간 보고서</div>
    <span class="pill">AI Auto Generated</span>
  </div>
  <div class="mhr"><span class="date">${data.meta?.date || DATE}</span></div>
</div>
<div class="hero">
  <div class="lbl">이번 주 핵심 메시지</div>
  <div class="hl">${data.meta?.headline || ""}</div>
  <div class="sub">${data.meta?.subheadline || ""}</div>
</div>
<div class="stats">${statsHtml}</div>
<div class="toc"><div class="toc-h">목차 · Table of Contents</div>${tocHtml}</div>
${sectionsHtml}
<div class="section" id="s-ed">
  <div class="sec-header"><span class="sec-num">ED</span><span class="sec-title">편집장 총평</span><span class="sec-icon">📝</span></div>
  <div class="ed-box"><div class="ed-lbl">Editor's Note</div><div class="ed-txt">${data.editorNote || ""}</div></div>
  ${data.nextIssue ? `<div class="next"><strong>다음 호 예고</strong> — ${data.nextIssue}</div>` : ""}
</div>
<div class="footer">
  <div class="footer-brand">채용 트렌드 주간 보고서</div>
  <div class="footer-meta">2026 Vol.${data.meta?.vol || VOL} · AI 자동 생성<br>${data.meta?.date || DATE}</div>
</div>
<script>function toggle(b){b.classList.toggle('open');b.nextElementSibling.classList.toggle('open');}</script>
</body></html>`;
}

// ─────────────────────────────────────────────────────────
// 메인 실행
// ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 HR 트렌드 보고서 생성 시작`);
  console.log(`   Vol.${VOL} / ${DATE} / ${TOPIC}\n`);

  // Part A: meta + stats + s01~s03
  console.log("📋 전반부 생성 중 (meta·stats·s01~02)...");
  const textA = await callClaude(
    PART_A_SYSTEM,
    `Vol: ${VOL} / 주제: ${TOPIC} / 날짜: ${DATE}\n\nmeta, stats, s01~s02 JSON을 생성하세요. 간결하게 작성하세요.`
  );
  console.log(`   ✅ 전반부 완료 (${textA.length}자)`);

  // Part B: s04~s06 + editorNote
  console.log("📋 후반부 생성 중 (s03~05·총평)...");
  const textB = await callClaude(
    PART_B_SYSTEM,
    `Vol: ${VOL} / 주제: ${TOPIC} / 날짜: ${DATE}\n\ns03~s05, editorNote JSON을 생성하세요. 간결하게 작성하세요.`
  );
  console.log(`   ✅ 후반부 완료 (${textB.length}자)`);

  // 파싱 & 병합
  console.log("🔧 JSON 병합 중...");
  let parsedA, parsedB;

  try { parsedA = parseJSON(textA); console.log("   ✅ 전반부 파싱 성공"); }
  catch (e) {
    console.error("   ⚠️ 전반부 파싱 실패:", e.message);
    console.error("   원문 앞부분:", textA.slice(0, 300));
    parsedA = { meta: {}, stats: [], sections: [] };
  }

  try { parsedB = parseJSON(textB); console.log("   ✅ 후반부 파싱 성공"); }
  catch (e) { console.error("   ⚠️ 후반부 파싱 실패:", e.message); parsedB = { sections: [], editorNote: "", nextIssue: "" }; }

  const merged = {
    meta: { ...parsedA.meta, vol: String(VOL), date: DATE },
    stats: parsedA.stats || [],
    sections: [...(parsedA.sections || []), ...(parsedB.sections || [])],
    editorNote: parsedB.editorNote || "",
    nextIssue: parsedB.nextIssue || "",
  };

  console.log(`   📊 섹션 ${merged.sections.length}개 · 통계 ${merged.stats.length}개`);

  // HTML 저장
  const html = generateHTML(merged);
  const outputPath = path.join(process.cwd(), "index.html");
  fs.writeFileSync(outputPath, html, "utf-8");

  console.log(`\n✅ 완료! index.html 저장됨 (${html.length}자)`);
  console.log(`   👉 https://sehoonkim75.github.io/hrtrend\n`);
}

main().catch(err => {
  console.error("\n❌ 오류:", err.message);
  process.exit(1);
});
