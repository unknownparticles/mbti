const setup = document.querySelector('#setup');
const workspace = document.querySelector('#workspace');
const status = document.querySelector('#status');
const errorBox = document.querySelector('#error');
const generateButton = document.querySelector('#generate');
let questions = [];
let activePreset = null;
let requestInProgress = false;

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function settings() {
  const base = document.querySelector('#base').value.trim().replace(/\/+$/, '');
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('API 地址必须以 http:// 或 https:// 开头。');
  return { endpoint: base.endsWith('/chat/completions') ? base : `${base}/chat/completions`, model: document.querySelector('#model').value.trim(), key: document.querySelector('#key').value.trim() };
}

// Requests go directly to the configured provider; credentials are never persisted.
async function chat(messages) {
  const config = settings();
  if (!config.model || !config.key) throw new Error('请填写模型名称和 API Key。');
  const response = await fetch(config.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` }, body: JSON.stringify({ model: config.model, messages }) });
  if (!response.ok) throw new Error(`接口请求失败（HTTP ${response.status}），请检查地址、模型和 Key。`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('接口未返回有效内容，请检查模型是否支持 Chat Completions。');
  return content;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function primaryButton(label) {
  const button = element('button', 'primary');
  button.type = 'button';
  button.append(element('span', 'btn-label', label));
  const mark = element('span', 'btn-mark', '→');
  mark.setAttribute('aria-hidden', 'true');
  button.append(mark);
  return button;
}

const themeTones = ['red', 'yellow', 'blue', 'paper'];

function setBusy(busy, label) {
  requestInProgress = busy;
  generateButton.disabled = busy;
  status.textContent = label;
}

// Share only question data, never credentials or answers. Presets use short links.
function questionnaireLink() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  if (activePreset) {
    url.searchParams.set('preset', activePreset.id);
  } else {
    const data = questions.map(question => ({
      dimension: question.dimension,
      text: question.text,
      options: question.options.map(option => ({ text: option.text, letter: option.letter }))
    }));
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    url.hash = `quiz=${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  }
  return url.toString();
}

function shareButton() {
  const button = element('button', 'secondary share-button', '分享题目');
  button.type = 'button';
  button.addEventListener('click', async () => {
    const link = questionnaireLink();
    if (window.location.protocol === 'file:') {
      showError('当前页面是本地文件，链接只能在本机使用。请将页面部署到可访问的网站后再分享。');
      return;
    }
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(link);
      button.textContent = '链接已复制';
      setTimeout(() => { button.textContent = '分享题目'; }, 2500);
    } catch (error) {
      window.prompt('复制题目链接', link);
    }
  });
  return button;
}

// Built-in questionnaires run locally and do not require an API key.
const presetList = document.querySelector('#presets');
MBTIPresets.forEach(preset => {
  const button = element('button', 'preset-button');
  button.type = 'button';
  button.setAttribute('aria-pressed', 'false');
  button.append(element('span', '', preset.title), element('span', 'preset-count', `${preset.count} 题`));
  button.addEventListener('click', () => {
    if (requestInProgress) return;
    showError('');
    activePreset = preset;
    questions = MBTILogic.validateQuestions(preset.questions, preset.count);
    presetList.querySelectorAll('button').forEach(item => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');
    renderQuestions();
    status.textContent = `${preset.title} · ${preset.count} 题`;
    if (window.matchMedia('(max-width: 800px)').matches) document.querySelector('.content').scrollIntoView({ behavior: 'smooth' });
  });
  presetList.append(button);
});

// A shared custom link is untrusted input and must pass the same checks as generated questions.
function openSharedQuestionnaire() {
  const presetId = new URL(window.location.href).searchParams.get('preset');
  if (presetId) {
    const index = MBTIPresets.findIndex(preset => preset.id === presetId);
    if (index < 0) return showError('分享的题库不存在，请重新选择。');
    presetList.children[index].click();
    return;
  }
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get('quiz');
  if (!encoded) return;
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const shared = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!Array.isArray(shared) || shared.length < 8) throw new Error('invalid quiz');
    questions = MBTILogic.validateQuestions(shared, shared.length);
    activePreset = null;
    renderQuestions();
    status.textContent = `分享的问卷 · ${questions.length} 题`;
  } catch (error) {
    showError('分享链接无效或题目不完整，请重新获取链接。');
  }
}

setup.addEventListener('submit', async event => {
  event.preventDefault();
  if (requestInProgress) return;
  showError('');
  const count = Number(document.querySelector('#count').value);
  if (!Number.isSafeInteger(count) || count < 8) return showError('题目数量须为不小于 8 的整数。');
  const scenario = document.querySelector('#scenario').value.trim();
  const goal = document.querySelector('#goal').value.trim();
  setBusy(true, '正在生成');
  try {
    const content = await chat([
      { role: 'system', content: '你是问卷设计助手。只返回 JSON，不要 Markdown。生成 MBTI 风格自我探索题，不宣称经过验证。每题两个无褒贬的选项，仅测试一个维度。四个维度 EI、SN、TF、JP 各至少 2 题，尽可能均匀。严格遵循 JSON 结构：{"questions":[{"dimension":"EI","text":"题目","options":[{"text":"选项内容","letter":"E"},{"text":"选项内容","letter":"I"}]}]}。每个选项的 letter 必须分别是对应 dimension 的两个字母。' },
      { role: 'user', content: `生成恰好 ${count} 题。场景或产品：${scenario || '通用生活场景'}。探索目标：${goal || '了解个人偏好'}。` }
    ]);
    const json = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    questions = MBTILogic.validateQuestions(JSON.parse(json).questions, count);
    activePreset = null;
    presetList.querySelectorAll('button').forEach(item => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
    renderQuestions();
    status.textContent = `${count} 题 · 待作答`;
  } catch (error) {
    showError(error instanceof SyntaxError ? '模型返回的内容不是有效 JSON，请重新生成。' : error.message || '生成失败，请检查网络连接。');
    status.textContent = '生成失败';
  } finally {
    requestInProgress = false;
    generateButton.disabled = false;
  }
});

function renderQuestions() {
  workspace.replaceChildren();
  document.querySelector('.content').scrollTop = 0;
  const heading = element('div', 'question-heading');
  heading.append(element('h2', 'section-title', activePreset ? `${activePreset.title} · ${activePreset.count} 题` : '选择更接近你的回答'), shareButton());
  workspace.append(heading);
  const form = element('form');
  questions.forEach((question, index) => {
    const group = element('fieldset', 'question');
    const legend = element('legend', 'q-legend');
    legend.append(element('span', `q-index tone-${themeTones[index % 4]}`, String(index + 1).padStart(2, '0')), element('span', 'q-text', question.text));
    group.append(legend);
    const options = element('div', 'options');
    // Alternating display order avoids presenting the same pole first every time.
    const choices = index % 2 === 0 ? [0, 1] : [1, 0];
    choices.forEach(choice => {
      const option = question.options[choice];
      const label = element('label', 'option');
      const input = element('input');
      input.type = 'radio'; input.name = `question-${index}`; input.value = String(choice); input.required = true;
      label.append(input, element('span', '', option.text));
      options.append(label);
    });
    group.append(options);
    form.append(group);
  });
  const submit = primaryButton('查看结果');
  submit.type = 'submit';
  form.append(submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const answers = questions.map((_, index) => {
        const selected = form.querySelector(`input[name="question-${index}"]:checked`);
        return selected ? Number(selected.value) : undefined;
      });
      renderResult(MBTILogic.scoreQuestions(questions, answers));
    } catch (error) { showError(error.message); }
  });
  workspace.append(form);
}

function renderResult(result) {
  showError('');
  status.textContent = '已完成';
  workspace.replaceChildren();
  document.querySelector('.content').scrollTop = 0;
  const section = element('section', 'result');
  const typeRow = element('div', 'result-type');
  typeRow.setAttribute('aria-label', `本次偏好 ${result.type}`);
  themeTones.forEach((tone, index) => {
    const cell = element('span', `type-cell tone-${tone}`, result.type[index] || '·');
    cell.setAttribute('aria-hidden', 'true');
    typeRow.append(cell);
  });
  section.append(element('p', 'kicker', 'YOUR PREFERENCE PROFILE'), element('h2', 'section-title', '你的偏好结果'), typeRow);
  section.append(element('p', 'intro-copy', result.type.includes('X') ? 'X 表示该维度得分相同，暂时无法判断。可以增加题目或结合自身体验进一步探索。' : '这是本次作答呈现的偏好，不代表固定的人格或能力。'));
  const scores = element('div', 'scores');
  MBTILogic.dimensions.forEach((pair, index) => scores.append(element('span', `score tone-${themeTones[index]}`, `${pair[0]} ${result.scores[pair[0]]}  /  ${pair[1]} ${result.scores[pair[1]]}`)));
  section.append(scores);
  const analysis = element('div', 'result-analysis');
  analysis.append(element('h3', '', '四维解析'));
  MBTILogic.dimensions.forEach(pair => {
    const letter = result.scores[pair[0]] === result.scores[pair[1]] ? 'X' : result.scores[pair[0]] > result.scores[pair[1]] ? pair[0] : pair[1];
    analysis.append(element('p', '', `${pair[0]} / ${pair[1]}：${letter === 'X' ? '本次两端得分相同，暂不判定；可以结合更多经历继续观察。' : MBTIResults.descriptions[letter]}`));
  });
  analysis.append(element('p', 'source-note', '四维解释参考 MBTI 偏好框架；本题库及主题建议为自编示例，未经过心理测量验证。'));
  addSource(analysis, '了解 MBTI 偏好框架', 'https://www.myersbriggs.org/research-and-library/validity-reliability/home.htm');
  if (activePreset?.id === 'history') {
    analysis.append(element('h3', '', '历史人物探索'));
    if (result.type.includes('X')) {
      analysis.append(element('p', '', '存在平分维度，暂不匹配人物。可重新作答或选择更多题目的方案继续探索。'));
    } else {
      const person = MBTIResults.people[result.type];
      analysis.append(element('h4', '', `${person[0]} · ${result.type}（探索性推测）`), element('p', '', person[1]), element('p', '', person[2]), element('p', 'source-note', '以上类型是根据公开生平进行的探索性匹配，非本人测评结果；传记只支持生平事实，不能证明其 MBTI。'));
      addSource(analysis, '阅读人物传记', person[3]);
    }
  } else if (activePreset?.id === 'music') {
    analysis.append(element('h3', '', '音乐探索建议'));
    const options = MBTILogic.dimensions.map(pair => {
      const a = result.scores[pair[0]], b = result.scores[pair[1]];
      if (a === b) return `${MBTIResults.music[pair[0]]}，或${MBTIResults.music[pair[1]]}`;
      return MBTIResults.music[a > b ? pair[0] : pair[1]];
    });
    analysis.append(element('p', '', `可以从以下方向试听：${options.join('；')}。这些建议分别对应本次作答呈现的社交方式、信息关注点、决策关注点和安排方式，供你比较自己实际喜欢什么。`));
    analysis.append(element('p', 'source-note', '音乐偏好因人而异。现有研究包含自选样本调查和大五人格研究，不能证明某个 MBTI 类型必然喜欢某种音乐；这些曲风是探索建议，不是研究直接给出的类型歌单。'));
    MBTIResults.musicSources.forEach(source => addSource(analysis, source[0], source[1]));
  } else if (activePreset) {
    analysis.append(element('h3', '', '下一步'), element('p', '', MBTIResults.suggestions[activePreset.id]));
  }
  section.append(analysis);
  const actions = element('div', 'actions');
  const recommend = primaryButton('生成个性化建议');
  const back = element('button', 'secondary', '重新作答');
  back.type = 'button';
  back.addEventListener('click', () => { renderQuestions(); status.textContent = `${questions.length} 题 · 待作答`; });
  actions.append(recommend, back, shareButton());
  const advice = element('div', 'recommendation');
  advice.setAttribute('aria-live', 'polite');
  recommend.addEventListener('click', async () => {
    if (requestInProgress) return;
    showError('');
    recommend.disabled = true; back.disabled = true;
    setBusy(true, '正在生成建议');
    try {
      const scenario = document.querySelector('#scenario').value.trim();
      const goal = document.querySelector('#goal').value.trim();
      advice.textContent = await chat([
        { role: 'system', content: '根据用户的自述偏好给出具体、可操作的建议，不作人格诊断，不使用刻板印象。X 表示平分未定，对两种偏好都提供选择。简洁地说明建议与偏好的联系。' },
        { role: 'user', content: `本次结果：${result.type}；各维度得分：${JSON.stringify(result.scores)}。场景或产品：${scenario || '日常生活'}；目标：${goal || '探索适合自己的选择'}。请提供建议。` }
      ]);
      status.textContent = '建议已生成';
    } catch (error) { showError(error.message || '生成建议失败，请检查网络连接。'); status.textContent = '建议生成失败'; }
    finally { requestInProgress = false; generateButton.disabled = false; recommend.disabled = false; back.disabled = false; }
  });
  section.append(actions, advice);
  workspace.append(section);
}

const themeLight = document.querySelector('#theme-light');
const themeDark = document.querySelector('#theme-dark');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeLight.setAttribute('aria-pressed', String(theme === 'light'));
  themeDark.setAttribute('aria-pressed', String(theme === 'dark'));
  try { localStorage.setItem('mbti-theme', theme); } catch (error) {}
}

themeLight.addEventListener('click', () => applyTheme('light'));
themeDark.addEventListener('click', () => applyTheme('dark'));
applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
openSharedQuestionnaire();

function addSource(parent, label, url) {
  const link = element('a', 'source-link', label + ' ↗');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  parent.append(link);
}
