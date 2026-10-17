(() => {
  'use strict';
  const {diseases, questions, sources, habits} = window.LEARNING;
  const $ = s => document.querySelector(s);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = 'health-explorers-v1';
  const today = () => {const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
  const blank = () => ({completed:[], habits:[], date:today(), pledge:'', best:0, large:false});
  let state=blank(), storageOK=true, filter='all', quiz=null, currentDisease=null, lastOpener=null;
  try {
    const saved=JSON.parse(localStorage.getItem(KEY) || 'null');
    if(saved && typeof saved==='object') {
      state.completed=Array.isArray(saved.completed)?saved.completed.filter(id=>diseases.some(d=>d.id===id)):[];
      state.habits=saved.date===today()&&Array.isArray(saved.habits)?saved.habits.filter(id=>habits.some(h=>h[0]===id)):[];
      state.pledge=typeof saved.pledge==='string'?saved.pledge.slice(0,80):'';
      state.best=Number.isFinite(saved.best)?Math.max(0,Math.min(100,saved.best)):0;
      state.large=saved.large===true;
    }
  } catch {storageOK=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;} storageNote();}
  function storageNote(){ $('#storage-note').textContent=storageOK?'학습 기록은 지금 쓰는 기기에만 남아요. 이름이나 어디가 아픈지는 쓰지 않아요. 함께 쓰는 기기에서는 선생님이 기록을 지울 수 있어요.':'이 브라우저에서는 기록을 저장할 수 없어요. 현재 화면의 활동은 할 수 있지만, 창을 닫으면 기록이 사라져요.'; }
  function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
  const icons={
    bandage:'<path d="m9 4 19 19a5 5 0 0 1-7 7L2 11a5 5 0 0 1 7-7Z"/><path d="m9 15 7-7m0 22 7-7"/><path d="m14 15 .1.1m4 4 .1.1m-4 0 .1.1m4-4 .1.1"/>',
    wind:'<path d="M3 11h18c8 0 8-9 2-9-3 0-4 2-4 4M3 17h23c8 0 8 11 1 11-3 0-4-2-4-4M3 23h10c6 0 6 8 1 8"/>',
    mosquito:'<ellipse cx="16" cy="18" rx="3" ry="8"/><path d="M16 10V4m-2 2-4-4m8 4 4-4M13 13C3 0-3 11 13 17m6-4C29 0 35 11 19 17M13 20l-9 5-1 6m16-11 9 5 1 6M13 17l-9 1-3-3m18 2 9 1 3-3"/>',
    eye:'<path d="M1 16S7 5 16 5s15 11 15 11-6 11-15 11S1 16 1 16Z"/><circle cx="16" cy="16" r="6"/><circle cx="17" cy="15" r="2"/>',
    bowl:'<path d="M2 15h28c-1 10-6 14-14 14S3 25 2 15ZM9 30h14M9 10c-4-4 4-5 0-9m8 9c-4-4 4-5 0-9m8 9c-4-4 4-5 0-9"/>',
    leaf:'<path d="M27 3C4 2 1 14 7 23c8 11 26 1 20-20ZM5 30 22 10M11 23l-1-8m7 2h7"/>'
  };
  const symbol=d=>`<span class="symbol ${d.color}" aria-hidden="true"><svg viewBox="0 0 34 34">${icons[d.icon]}</svg></span>`;
  const sourceLinks=ids=>`<div class="source-links">${ids.map(id=>{const s=sources.find(x=>x.id===id);return `<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a>`;}).join('')}</div>`;
  const heading=(title,description,extra='')=>`<div class="section-head"><div><h2>${title}</h2><p>${description}</p></div>${extra}</div>`;
  const routes={explore:'감염병 탐구',compare:'한눈에 비교',quiz:'도전! 퀴즈',practice:'예방 실천'};
  function view(){const v=location.hash.slice(1);return Object.hasOwn(routes,v)?v:'explore';}
  function render(focus=false){
    const v=view();
    document.querySelectorAll('[data-view]').forEach(a=>{if(a.dataset.view===v)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(v==='explore') renderExplore();
    if(v==='compare') renderCompare();
    if(v==='quiz') renderQuiz();
    if(v==='practice') renderPractice();
    if(focus){$('#content').focus({preventScroll:true});$('#content').scrollIntoView({behavior:'instant',block:'start'});}
  }
  function renderExplore(){
    const completed=state.completed.length;
    const shown=diseases.filter(d=>filter==='all'||(filter==='done'?state.completed.includes(d.id):!state.completed.includes(d.id)));
    $('#content').innerHTML=heading('어떤 감염병이 있을까요?','카드를 눌러 왜 걸리는지, 우리 몸과 이웃에게 어떤 일이 생기는지 알아봐요.',`<div class="counter">탐구 완료 <b>${completed} / 6</b><div class="progress-track" role="progressbar" aria-label="감염병 탐구 완료" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${completed}"><span style="width:${completed/6*100}%"></span></div></div>`)+
      `<div class="filters" aria-label="탐구 카드 보기">${[['all','전체 보기'],['todo','아직 탐구 중'],['done','탐구 완료']].map(([id,t])=>`<button class="chip" data-filter="${id}" aria-pressed="${filter===id}">${t}</button>`).join('')}</div><div class="disease-grid">${shown.map(d=>`<button class="disease-card ${d.color}" data-disease="${d.id}" aria-label="${d.name} 탐구하기${state.completed.includes(d.id)?', 탐구 완료':''}"><div class="card-top">${symbol(d)}${state.completed.includes(d.id)?'<span class="done-badge">✓ 탐구 완료</span>':`<span class="number">탐구 ${String(diseases.indexOf(d)+1).padStart(2,'0')}</span>`}</div><h3>${d.name}</h3><p>${d.teaser}</p><div class="card-bottom"><span class="tag">${d.type}</span><span class="card-link">알아보기 →</span></div></button>`).join('')}</div>${!shown.length?'<p class="empty">이곳에 표시할 카드가 없어요. 전체 보기를 눌러 보세요.</p>':''}<div class="tip-box"><span aria-hidden="true">✦</span><div><strong>탐험대의 오늘 목표</strong>병에 어떻게 걸리는지 알아봐요. 나와 이웃의 건강을 지키는 방법을 친구에게 알려 줘요.</div></div>`;
  }
  function openDisease(id,opener){
    const d=diseases.find(x=>x.id===id);if(!d)return;
    currentDisease=d; if(opener)lastOpener=opener;
    $('#detail-content').innerHTML=`<div class="dialog-top"><div class="dialog-heading">${symbol(d)}<div><span class="eyebrow">감염병 탐구 ${diseases.indexOf(d)+1} / 6 · ${d.type}</span><h2 id="detail-title">${d.name}</h2></div></div><button class="icon-button" data-close="detail-dialog" aria-label="탐구 닫기">×</button></div><div class="detail-body"><div class="scene ${d.color}"><b>생각해 봐요 · 함께 상상하는 이야기</b>${d.scene}</div><details class="word-help"><summary>낱말이 어려우면 여기를 눌러요</summary><dl>${[...window.LEARNING.basicWords,...d.words].map(([word,meaning])=>`<dt>${escape(word)}</dt><dd>${escape(meaning)}</dd>`).join('')}</dl></details><section class="learning-block"><h3>01. 왜 걸릴까요?</h3><p>${d.cause}</p><div class="path" aria-label="감염 과정">${d.path.map((p,i)=>`${i?'<b aria-hidden="true">→</b>':''}<span>${p}</span>`).join('')}</div></section><section class="learning-block"><h3>02. 몸이 어떻게 아플까요?</h3><p>${d.features}</p></section><div class="impact-grid"><section class="learning-block"><h3>03. 우리 건강에는?</h3><p>${d.health}</p></section><section class="learning-block"><h3>04. 우리 반과 이웃에게는?</h3><p>${d.society}</p></section></div><section class="learning-block case"><span class="eyebrow">${d.caseLabel}</span><h3>05. ${d.caseTitle}</h3><p>${d.caseText}</p>${sourceLinks(d.sources)}</section><section class="learning-block"><h3>06. 이렇게 병을 막아요</h3><ul>${d.prevent.map(p=>`<li>${p}</li>`).join('')}</ul></section><div class="tip-box"><div><strong>꼭 기억해요!</strong>${d.remember}</div></div><div class="tip-box"><div><strong>친구와 이야기해요</strong>${d.question}</div></div></div><div class="dialog-bottom"><button class="quiet" data-previous ${diseases.indexOf(d)===0?'disabled':''}>← 이전 감염병</button><button class="primary" data-complete="${d.id}">${state.completed.includes(d.id)?'✓ 탐구 완료했어요':'탐구 완료 도장 찍기'} </button><button class="quiet" data-next-disease ${diseases.indexOf(d)===5?'disabled':''}>다음 감염병 →</button></div>`;
    if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
    $('#detail-dialog').scrollTop=0;
  }
  function renderCompare(){
    $('#content').innerHTML=heading('같은 점과 다른 점을 찾아요','병에 걸리는 길이 다르면, 병을 막는 방법도 달라져요.')+`<div class="table-wrap"><table><caption>감염병 비교표 · 작은 화면에서는 표를 좌우로 밀어 보세요.</caption><thead><tr><th scope="col">감염병</th><th scope="col">원인</th><th scope="col">병에 걸리는 길</th><th scope="col">몸이 아픈 모습</th><th scope="col">함께 건강을 지키는 일</th></tr></thead><tbody>${diseases.map(d=>`<tr><th scope="row"><button data-disease="${d.id}">${d.name} ↗</button></th><td>${d.type==='여러 원인'?'세균·바이러스·해로운 물질 등':d.type}</td><td>${d.path.join(' → ')}</td><td>${d.features}</td><td>${d.society}</td></tr>`).join('')}</tbody></table></div><div class="comparison-notes"><article class="note-card"><h3>모든 감염병이 친구에게 옮을까요?</h3><p>파상풍은 감염병이지만 사람끼리 옮지는 않아요. 일본뇌염은 모기가 바이러스를 옮겨요.</p></article><article class="note-card"><h3>비슷해도 원인은 달라요</h3><p>감염성 결막염은 바이러스나 세균이 원인이에요. 꽃가루 등에 몸이 예민하게 반응해서 생긴 결막염은 옮지 않아요.</p></article><article class="note-card"><h3>함께 지키는 안전</h3><p>손을 씻고 창문을 열어 공기를 바꾸면 우리 반을 지킬 수 있어요. 깨끗한 물과 음식은 우리 동네의 건강도 지켜 줘요.</p></article></div><div class="result-actions no-print"><button class="secondary" data-print>비교표 인쇄하기</button><a class="primary" href="#quiz">퀴즈로 확인하기 →</a></div>`;
  }
  const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  function renderQuiz(){
    if(quiz){quiz.done?renderResult():renderQuestion();return;}
    $('#content').innerHTML=heading('도전! 건강 탐험 퀴즈','틀려도 괜찮아요. 해설을 읽고 다시 배워요.')+`<div class="quiz-setup"><div class="quiz-intro"><div class="big-symbol" aria-hidden="true">✧</div><h3>나는 건강 탐험대!</h3><p>왜 걸릴까요? 몸은 어떻게 아플까요?<br>친구와 이웃을 함께 지키는 방법을 퀴즈로 알아봐요.</p><p>✓ 시간제한 없이 천천히<br>✓ 한 문제마다 정답과 해설<br>✓ 틀린 문제만 다시 도전</p><small>이 브라우저의 모두 섞어 풀기 최고 기록: ${state.best}%</small></div><div class="quiz-form"><div class="field"><label for="quiz-topic">어떤 감염병을 복습할까요?</label><select id="quiz-topic"><option value="all">여섯 가지 모두</option>${diseases.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select></div><div class="field" id="quiz-length-field"><label for="quiz-length">몇 문제에 도전할까요?</label><select id="quiz-length"><option value="12">가볍게 12문제 · 감염병마다 2문제</option><option value="24">꼼꼼하게 24문제 · 감염병마다 4문제</option></select></div><p class="subtext" id="quiz-scope">여섯 가지 감염병의 문제가 골고루 나와요.</p><button class="primary" data-start>퀴즈 시작하기 →</button></div></div>`;
  }
  function startQuiz(list,isMixed=false,isRetry=false){
    quiz={items:shuffle(list).map(q=>({...q,order:shuffle(q.options.map((_,i)=>i))})),index:0,answers:[],done:false,isMixed,isRetry};
    renderQuestion();$('#content').focus({preventScroll:true});
  }
  function renderQuestion(){
    const q=quiz.items[quiz.index],d=diseases.find(d=>d.id===q.disease),answered=quiz.answers[quiz.index];
    $('#content').innerHTML=`<div class="quiz-shell"><div class="quiz-top"><span>${quiz.isRetry?'다시 도전':'건강 탐험 퀴즈'} · ${quiz.index+1} / ${quiz.items.length}</span><span>${d.name} · ${q.category}</span></div><div class="progress-track" role="progressbar" aria-label="퀴즈 진행" aria-valuemin="0" aria-valuemax="${quiz.items.length}" aria-valuenow="${quiz.answers.length}"><span style="width:${quiz.answers.length/quiz.items.length*100}%"></span></div><h3 id="question-title" tabindex="-1">${q.text}</h3><div class="options" role="group" aria-labelledby="question-title">${q.order.map((idx,i)=>`<button class="option ${answered?(idx===q.answer?'correct':idx===answered.choice?'wrong':''):''}" data-answer="${idx}" ${answered?'disabled':''}><span>${i+1}</span>${q.options[idx]}${answered&&idx===q.answer?' ✓ 정답':''}${answered&&!answered.correct&&idx===answered.choice?' · 내가 고른 답':''}</button>`).join('')}</div><div id="answer-feedback" aria-live="polite">${answered?`<div class="feedback"><strong>${answered.correct?'정답이에요! 잘 생각했어요.':'다시 알아보면 괜찮아요!'}</strong><p>${q.explanation}</p></div>`:''}</div><div class="quiz-controls"><button class="quiet" data-quiz-end>퀴즈 그만하기</button><button class="primary" data-quiz-next ${answered?'':'disabled'}>${quiz.index===quiz.items.length-1?'결과 보기':'다음 문제 →'}</button></div></div>`;
  }
  function renderResult(){
    const correct=quiz.answers.filter(a=>a.correct).length,wrong=quiz.items.filter((_,i)=>!quiz.answers[i].correct),pct=Math.round(correct/quiz.items.length*100);
    $('#content').innerHTML=`<div class="quiz-shell"><div class="result-head"><span class="eyebrow">${quiz.isRetry?'다시 도전 완료':'건강 탐험 완료'}</span><div class="score"><strong>${correct}<small> / ${quiz.items.length}</small></strong><span>정답 ${pct}%</span></div><h2>${wrong.length?'생각하는 힘이 자랐어요!':'모든 문제를 해결했어요!'}</h2><p>${wrong.length?'아래 해설을 살펴보고, 헷갈린 문제에 다시 도전해 봐요.':'배운 내용을 친구와 가족에게도 알려 주세요.'}</p></div><div class="result-actions">${wrong.length?'<button class="primary" data-retry>틀린 '+wrong.length+'문제 다시 풀기</button>':''}<button class="secondary" data-again>새 퀴즈 고르기</button><button class="secondary" data-print>결과 인쇄하기</button></div><div class="review"><h3>나의 복습 노트</h3>${quiz.items.map((q,i)=>`<details ${quiz.answers[i].correct?'':'open'}><summary>${quiz.answers[i].correct?'✓ 정답':'↻ 다시 보기'} · ${q.text}</summary><p class="${quiz.answers[i].correct?'':'incorrect-answer'}">내가 고른 답: ${q.options[quiz.answers[i].choice]}</p><p><strong>정답: ${q.options[q.answer]}</strong></p><p>${q.explanation}</p><button class="quiet" data-disease="${q.disease}">이 감염병 다시 알아보기 ↗</button></details>`).join('')}</div><div class="result-actions"><a class="primary" href="#practice">예방 실천하러 가기 →</a></div></div>`;
  }
  function renderPractice(){
    if(state.date!==today()){state.habits=[];state.date=today();save();}
    $('#content').innerHTML=heading('배운 것을 생활 속에서 실천해요','오늘 실천한 약속에 표시하고, 나만의 건강 약속도 정해 봐요.')+`<p class="print-only">우리 반 건강 탐험대 · 예방 실천 기록 · ${new Date().toLocaleDateString('ko-KR')}</p><div class="habit-layout"><div class="habits">${habits.map(([id,title,sub])=>`<label class="habit"><input type="checkbox" data-habit="${id}" ${state.habits.includes(id)?'checked':''}><span>${title}<small>${sub}</small></span></label>`).join('')}</div><aside class="pledge"><div class="daily-progress" id="habit-count" aria-live="polite">오늘의 실천 ${state.habits.length} / 6</div><h3>나의 건강 약속</h3><p>나도 지키고, 친구도 지키는<br>작은 약속 하나를 써 보세요.</p><label for="pledge-input">내가 실천할 일 (80자 이내)</label><input id="pledge-input" maxlength="80" value="${escape(state.pledge)}" placeholder="예: 밥 먹기 전에 손 씻기" autocomplete="off"><small>이름이나 어디가 아픈지는 쓰지 않아요.</small><button class="primary" data-pledge>약속 저장하기 ✓</button><button class="secondary" data-print>실천 기록 인쇄하기</button><p class="subtext">실천 표시는 날짜가 바뀌면 새로 시작해요. 작성한 약속은 계속 남아요.</p></aside></div><div class="tip-box"><div><strong>우리 반이 함께 생각해요</strong>몸이 아프면 부모님이나 선생님께 알려요. 학교에 가도 되는지, 어떻게 쉬어야 하는지는 선생님과 의사 선생님의 안내를 따라요. 약은 어른의 도움을 받아 먹거나 발라요.</div></div>`;
  }
  function info(title,html){$('#info-title').textContent=title;$('#info-content').innerHTML=html;$('#info-dialog').showModal();$('#info-dialog').scrollTop=0;}
  function showTeacher(){info('선생님을 위한 수업 안내',`<p>2022 개정 과학과 교육과정의 3~4학년군 <strong>‘감염병과 건강한 생활’</strong> 영역과 연계한 보조 자료입니다. 화면의 ‘3학년 2학기 4단원 · 감염병과 우리 생활’ 구성은 요청하신 수업에 맞췄으며, 교과서별 단원명·순서·차시는 다를 수 있습니다.</p><h3>성취기준과 활동 연결</h3><ul><li><strong>[4과08-01]</strong> 사례와 위험성 살펴보기 → 여섯 감염병의 특징·건강 영향·발생 사례 탐구</li><li><strong>[4과08-02]</strong> 감염 과정과 생활 습관, 유행의 관계 설명하기 → 감염 경로 비교, 사회 안전 토의</li><li><strong>[4과08-03]</strong> 예방 수칙 나누고 실천하기 → 퀴즈 복습, 예방 실천과 나의 약속</li></ul><h3>40분 수업 예시</h3><ol><li>도입 5분: 생활 속 감염병 경험을 개인정보 없이 이야기하기</li><li>탐구 15분: 모둠별로 감염병을 맡아 카드 탐구 후 핵심 내용 공유하기</li><li>비교·토의 8분: 전파 경로의 차이와 사회가 함께 할 일 찾기</li><li>복습 8분: 12문제 또는 감염병별 4문제 퀴즈</li><li>정리 4분: 오늘의 실천과 건강 약속 정하기</li></ol><h3>지도할 때 살펴 주세요</h3><ul><li>퀴즈는 총 24문항입니다. 종합 12문항은 감염병별 2문항을 무작위로 뽑습니다. 전체 영역을 고르게 복습하려면 24문항을 선택하세요.</li><li>카드의 ‘생각 열기’는 가상 상황입니다. 유행·집단 발생은 확인된 실제 자료로 구분했습니다. 파상풍은 사람 사이 전파가 없고, 회충증은 장기간의 발생 추세를 제시했습니다.</li><li>사회 영향과 토의 질문은 자료를 바탕으로 구성한 학습용 설명입니다. 실제 사건의 피해 규모나 학교 운영 조치로 단정하지 마세요.</li><li>학생의 증상으로 병을 맞히거나 특정 환자·지역을 탓하는 활동은 피하세요. 사진이나 병원체를 직접 다루는 실험은 포함하지 않았습니다.</li><li>식중독에는 비감염성 원인도 있음을 함께 지도해 주세요. ‘아프면 등교’ 등의 판단은 학교·의료진 지침에 따릅니다.</li></ul><h3>기록과 공용 기기</h3><p>로그인·분석 도구·서버 전송 기능이 없습니다. 탐구 도장, 오늘의 실천, 건강 약속, 종합 퀴즈 최고 정답률과 글씨 크기만 이 브라우저에 저장합니다. 실천 날짜는 기기 날짜를 기준으로 합니다. 학급 전체의 결과를 모으는 기능은 없습니다.</p><button class="secondary" data-reset-request>이 브라우저의 학습 기록 모두 지우기</button><h3>자료 근거</h3><p>성취기준은 아래 교육청 자료를 확인해 활동 목표로 풀어 썼습니다. 질병 자료의 상세 링크는 ‘교육과정·자료 출처’에서 확인할 수 있습니다. 자료 확인일: 2026. 10. 17.</p>${sourceLinks(['curriculum'])}`);}
  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');if(!el)return;
    if(el.dataset.close){$('#'+el.dataset.close).close();return;}
    if(el.dataset.disease){openDisease(el.dataset.disease,el);return;}
    if(el.dataset.filter){filter=el.dataset.filter;renderExplore();return;}
    if(el.hasAttribute('data-previous')){openDisease(diseases[diseases.indexOf(currentDisease)-1]?.id);return;}
    if(el.hasAttribute('data-next-disease')){openDisease(diseases[diseases.indexOf(currentDisease)+1]?.id);return;}
    if(el.dataset.complete){if(!state.completed.includes(el.dataset.complete)){state.completed.push(el.dataset.complete);save();}el.textContent='✓ 탐구 완료했어요';toast('탐구 완료! 배운 내용을 친구에게 설명해 보세요.');return;}
    if(el.hasAttribute('data-start')){
      const topic=$('#quiz-topic').value,length=Number($('#quiz-length').value);
      const list=topic==='all'?diseases.flatMap(d=>shuffle(questions.filter(q=>q.disease===d.id)).slice(0,length/6)):questions.filter(q=>q.disease===topic);
      startQuiz(list,topic==='all');return;
    }
    if(el.dataset.answer!==undefined){
      if(!quiz||quiz.done||quiz.answers[quiz.index])return;
      const choice=Number(el.dataset.answer),q=quiz.items[quiz.index];
      quiz.answers[quiz.index]={choice,correct:choice===q.answer};renderQuestion();$('#answer-feedback').setAttribute('tabindex','-1');$('#answer-feedback').focus({preventScroll:true});return;
    }
    if(el.hasAttribute('data-quiz-next')){
      if(!quiz.answers[quiz.index])return;
      if(quiz.index===quiz.items.length-1){quiz.done=true;if(quiz.isMixed&&!quiz.isRetry){state.best=Math.max(state.best,Math.round(quiz.answers.filter(a=>a.correct).length/quiz.items.length*100));save();}renderResult();}
      else{quiz.index++;renderQuestion();$('#question-title').focus({preventScroll:true});}
      return;
    }
    if(el.hasAttribute('data-retry')){startQuiz(quiz.items.filter((_,i)=>!quiz.answers[i].correct),false,true);return;}
    if(el.hasAttribute('data-again')){quiz=null;renderQuiz();return;}
    if(el.hasAttribute('data-quiz-end')){info('이번 퀴즈를 마칠까요?','<p>지금까지 푼 이번 퀴즈의 답은 사라져요. 탐구 도장과 이전 최고 기록은 남아요.</p><div class="result-actions"><button class="secondary" data-close="info-dialog">계속 풀기</button><button class="primary" data-end-confirm>퀴즈 마치기</button></div>');return;}
    if(el.hasAttribute('data-end-confirm')){quiz=null;$('#info-dialog').close();renderQuiz();return;}
    if(el.hasAttribute('data-pledge')){state.pledge=$('#pledge-input').value.trim().slice(0,80);save();toast(state.pledge?'건강 약속을 저장했어요. 오늘부터 실천해 봐요!':'약속을 지웠어요. 새로운 약속을 적어 보세요.');return;}
    if(el.hasAttribute('data-print')){if(view()==='practice'){state.pledge=$('#pledge-input').value.trim().slice(0,80);save();}window.print();return;}
    if(el.hasAttribute('data-reset-request')){info('학습 기록을 모두 지울까요?','<p>이 브라우저에 저장된 탐구 도장, 오늘의 실천, 건강 약속, 모두 섞어 풀기 최고 기록을 지웁니다. 지운 기록은 되돌릴 수 없습니다.</p><div class="result-actions"><button class="secondary" data-close="info-dialog">취소</button><button class="primary" data-reset-confirm>기록 모두 지우기</button></div>');return;}
    if(el.hasAttribute('data-reset-confirm')){state=blank();quiz=null;filter='all';save();applyFont();$('#info-dialog').close();render();toast('학습 기록을 모두 지웠어요. 새롭게 시작해요.');return;}
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='quiz-topic'){const single=e.target.value!=='all';$('#quiz-length-field').hidden=single;$('#quiz-scope').textContent=single?'선택한 감염병의 4문제를 모두 풀어요.':'여섯 가지 감염병의 문제가 골고루 나와요.';}
    if(e.target.dataset.habit){if(state.date!==today()){state.date=today();state.habits=[];document.querySelectorAll('[data-habit]').forEach(x=>{if(x!==e.target)x.checked=false;});}const id=e.target.dataset.habit;state.habits=state.habits.filter(h=>h!==id);if(e.target.checked)state.habits.push(id);save();$('#habit-count').textContent=`오늘의 실천 ${state.habits.length} / 6`;}
  });
  $('#detail-dialog').addEventListener('close',()=>{render();if(lastOpener?.isConnected)lastOpener.focus({preventScroll:true});else $('#content').focus({preventScroll:true});});
  $('#teacher-open').addEventListener('click',showTeacher);
  $('#sources-open').addEventListener('click',()=>info('교육과정·자료 출처',`<p>자료 확인일: 2026. 10. 17. 원문을 바탕으로 초등학교 3학년의 눈높이에 맞춰 새로 작성했습니다. 원문 사진·삽화·교과서 지문은 사용하지 않았습니다. 링크는 새 창에서 열리며 인터넷이 필요합니다.</p>${sources.map(s=>`<div class="source-item"><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a></div>`).join('')}<p class="subtext">이 앱은 수업을 돕는 자료이며 증상만으로 진단하지 않습니다. 실제 건강 문제는 보호자·보건교사·의료진과 상의합니다.</p>`));
  function applyFont(){document.documentElement.classList.toggle('large-text',state.large);$('#font-toggle').setAttribute('aria-pressed',String(state.large));}
  $('#font-toggle').addEventListener('click',()=>{state.large=!state.large;applyFont();save();});
  let printOpen=[];
  window.addEventListener('beforeprint',()=>{printOpen=[...document.querySelectorAll('.review details')].map(d=>d.open);document.querySelectorAll('.review details').forEach(d=>d.open=true);});
  window.addEventListener('afterprint',()=>document.querySelectorAll('.review details').forEach((d,i)=>d.open=printOpen[i]||false));
  window.addEventListener('hashchange',()=>render(true));
  applyFont();storageNote();render();
})();
