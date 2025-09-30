const DATA_URL = 'assets/data/resume.yaml';
const SECTION_ORDER = [
  'personal_info',
  'summary',
  'highlights',
  'experience',
  'projects',
  'skills',
  'education',
  'publications',
  'photography',
  'interests',
  'contact'
];

const UTILITY_APPS = ['notepad', 'calculator', 'paint'];

const SECTION_ICONS = {
  personal_info: 'assets/icons/icon-personal.svg',
  contact: 'assets/icons/icon-contact.svg',
  summary: 'assets/icons/icon-summary.svg',
  highlights: 'assets/icons/icon-highlights.svg',
  experience: 'assets/icons/icon-experience.svg',
  projects: 'assets/icons/icon-projects.svg',
  skills: 'assets/icons/icon-skills.svg',
  education: 'assets/icons/icon-education.svg',
  publications: 'assets/icons/icon-publications.svg',
  photography: 'assets/icons/icon-photography.svg',
  interests: 'assets/icons/icon-interests.svg',
  notepad: 'assets/icons/icon-notepad.svg',
  paint: 'assets/icons/icon-paint.svg',
  calculator: 'assets/icons/icon-calculator.svg'
};

const SECTION_TITLES = {
  personal_info: 'About Me',
  contact: 'Contact',
  summary: 'Summary',
  highlights: 'Highlights',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  education: 'Education',
  publications: 'Publications',
  photography: 'Photography',
  interests: 'Interests',
  notepad: 'Notepad',
  paint: 'Paint',
  calculator: 'Calculator'
};

const WINDOW_DEFAULTS = {
  default: { width: 620, height: 460 },
  personal_info: { width: 520, height: 420 },
  summary: { width: 560, height: 420 },
  highlights: { width: 480, height: 380 },
  experience: { width: 700, height: 480 },
  projects: { width: 700, height: 480 },
  skills: { width: 680, height: 480 },
  education: { width: 600, height: 440 },
  publications: { width: 680, height: 480 },
  photography: { width: 680, height: 500 },
  interests: { width: 460, height: 380 },
  contact: { width: 460, height: 360 },
  notepad: { width: 640, height: 500 },
  paint: { width: 640, height: 480 },
  calculator: { width: 360, height: 420 }
};

const state = {
  data: null,
  windows: new Map(),
  zIndex: 10,
  offsets: 0,
  activeWindow: null
};

const utilityState = {
  notepad: '',
  calculator: {
    display: '0',
    stored: null,
    operator: null,
    overwrite: true
  },
  paint: {
    color: '#0a64d6',
    stroke: 4,
    snapshot: null
  }
};

function parseYAML(text) {
  const tokens = [];
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const normalized = rawLine.replace(/\t/g, '  ');
    const trimmed = normalized.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = normalized.match(/^ */)[0].length;
    tokens.push({ indent, content: trimmed });
  }
  if (!tokens.length) return {};
  const { value } = parseBlock(tokens, 0, tokens[0].indent);
  return value;
}

function parseBlock(tokens, index, indent) {
  if (index >= tokens.length) {
    return { value: null, nextIndex: index };
  }
  const token = tokens[index];
  if (token.indent < indent) {
    return { value: null, nextIndex: index };
  }
  if (token.content.startsWith('- ')) {
    return parseSequence(tokens, index, indent);
  }
  return parseMapping(tokens, index, indent);
}

function parseSequence(tokens, index, indent) {
  const items = [];
  let idx = index;
  while (idx < tokens.length) {
    const token = tokens[idx];
    if (token.indent !== indent || !token.content.startsWith('- ')) {
      break;
    }
    const content = token.content.slice(2).trim();
    if (!content) {
      const child = parseBlock(tokens, idx + 1, indent + 2);
      items.push(child.value);
      idx = child.nextIndex;
      continue;
    }
    if (content.includes(':')) {
      const colonIndex = findColon(content);
      const key = content.slice(0, colonIndex).trim();
      const valuePart = content.slice(colonIndex + 1).trim();
      const entry = {};
      if (valuePart) {
        entry[key] = parseScalar(valuePart);
        idx += 1;
      } else {
        const child = parseBlock(tokens, idx + 1, indent + 2);
        entry[key] = child.value;
        idx = child.nextIndex;
      }
      if (idx < tokens.length && tokens[idx].indent > indent) {
        const nested = parseMapping(tokens, idx, indent + 2);
        if (nested.value && typeof nested.value === 'object') {
          Object.assign(entry, nested.value);
        }
        idx = nested.nextIndex;
      }
      items.push(entry);
    } else {
      items.push(parseScalar(content));
      idx += 1;
    }
  }
  return { value: items, nextIndex: idx };
}

function parseMapping(tokens, index, indent) {
  const map = {};
  let idx = index;
  while (idx < tokens.length) {
    const token = tokens[idx];
    if (token.indent < indent) break;
    if (token.content.startsWith('- ')) break;
    const colonIndex = findColon(token.content);
    const key = token.content.slice(0, colonIndex).trim();
    const valuePart = token.content.slice(colonIndex + 1).trim();
    idx += 1;
    if (!valuePart) {
      const child = parseBlock(tokens, idx, indent + 2);
      map[key] = child.value;
      idx = child.nextIndex;
    } else {
      map[key] = parseScalar(valuePart);
    }
  }
  return { value: map, nextIndex: idx };
}

function parseScalar(value) {
  if (value === 'null' || value === 'Null' || value === 'NULL') return null;
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    const quote = value[0];
    const inner = value.slice(1, -1);
    return inner.replace(new RegExp('\\' + quote, 'g'), quote);
  }
  return value;
}

function findColon(text) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (char === '\'' && !inDouble) {
      inSingle = !inSingle;
    } else if (char === ':' && !inSingle && !inDouble) {
      return i;
    }
  }
  return text.indexOf(':');
}

const desktopEl = document.getElementById('desktop');
const desktopIconsEl = document.getElementById('desktop-icons');
const windowsLayerEl = document.getElementById('windows-layer');
const startButton = document.getElementById('start-button');
const startMenu = document.getElementById('start-menu');
const startMenuPrograms = document.getElementById('start-menu-programs');
const startMenuContact = document.getElementById('start-menu-contact');
const taskbarItems = document.getElementById('taskbar-items');
const trayClock = document.getElementById('tray-clock');
const trayTime = document.querySelector('.tray-time');
const trayDate = document.querySelector('.tray-date');
const calendarPopup = document.getElementById('calendar-popup');
const calendarDate = document.querySelector('.calendar-date');
const calendarTime = document.querySelector('.calendar-time');
const calendarGrid = document.getElementById('calendar-grid');
const contextMenu = document.getElementById('context-menu');
const loginScreen = document.getElementById('login-screen');
const welcomeScreen = document.getElementById('welcome-screen');
const loginButton = document.getElementById('login-button');
const loginAvatar = document.getElementById('login-avatar');
const loginName = document.getElementById('login-name');
const logOffButton = document.getElementById('log-off-button');
const welcomeMessage = welcomeScreen.querySelector('p');

async function init() {
  const response = await fetch(DATA_URL);
  const yamlText = await response.text();
  state.data = parseYAML(yamlText);
  if (state.data?.personal_info?.avatar) {
    loginAvatar.src = state.data.personal_info.avatar;
  }
  if (state.data?.personal_info?.name) {
    loginName.textContent = state.data.personal_info.name;
  }
  prepareDesktop();
  bindGlobalEvents();
}

function prepareDesktop() {
  createDesktopIcons();
  populateStartMenu();
  updateClock();
  buildCalendar();
  setInterval(() => {
    updateClock();
    refreshCalendarTime();
  }, 1000);
}

function createDesktopIcons() {
  desktopIconsEl.innerHTML = '';
  const sections = SECTION_ORDER.filter((key) => state.data && Object.prototype.hasOwnProperty.call(state.data, key));
  sections.forEach((key, index) => {
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'desktop-icon';
    icon.dataset.section = key;
    icon.innerHTML = `
      <img src="${SECTION_ICONS[key] || 'assets/icons/icon-folder.svg'}" alt="${SECTION_TITLES[key] || formatTitle(key)} icon" />
      <span>${SECTION_TITLES[key] || formatTitle(key)}</span>
    `;
    icon.addEventListener('click', (event) => {
      document.querySelectorAll('.desktop-icon').forEach((item) => item.classList.remove('active'));
      icon.classList.add('active');
      if (event.detail === 2) {
        openWindow(key);
      }
    });
    icon.addEventListener('dblclick', () => openWindow(key));
    icon.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        openWindow(key);
      }
    });
    icon.style.setProperty('--icon-index', index);
    desktopIconsEl.appendChild(icon);
  });
}

function populateStartMenu() {
  startMenuPrograms.innerHTML = '';
  const sections = SECTION_ORDER.filter((key) => state.data && Object.prototype.hasOwnProperty.call(state.data, key));
  sections.forEach((key) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.innerHTML = `
      <img src="${SECTION_ICONS[key] || 'assets/icons/icon-folder.svg'}" alt="${SECTION_TITLES[key] || formatTitle(key)}" />
      <span>${SECTION_TITLES[key] || formatTitle(key)}</span>
    `;
    button.addEventListener('click', () => {
      openWindow(key);
      toggleStartMenu(false);
    });
    li.appendChild(button);
    startMenuPrograms.appendChild(li);
  });

  startMenuContact.innerHTML = '';
  const contact = state.data.contact || {};
  Object.entries(contact).forEach(([label, value]) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = formatContactLink(label, value);
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = formatTitle(label);
    li.appendChild(link);
    startMenuContact.appendChild(li);
  });
}

function getTaskbarHeight() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height');
  const numeric = parseInt(value, 10);
  return Number.isNaN(numeric) ? 56 : numeric;
}

function applyDefaultSize(windowEl, section) {
  const defaults = WINDOW_DEFAULTS[section] || WINDOW_DEFAULTS.default;
  const taskbarHeight = getTaskbarHeight();
  const margin = 48;
  const maxWidth = Math.max(360, window.innerWidth - margin);
  const maxHeight = Math.max(300, window.innerHeight - (taskbarHeight + margin));
  const width = Math.min(defaults.width, maxWidth);
  const height = Math.min(defaults.height, maxHeight);
  windowEl.style.width = `${Math.max(360, width)}px`;
  windowEl.style.height = `${Math.max(280, height)}px`;
}

function clampWindow(windowEl) {
  if (windowEl.classList.contains('maximized')) return;
  const margin = 12;
  const taskbarHeight = getTaskbarHeight();
  const width = windowEl.offsetWidth;
  const height = windowEl.offsetHeight;
  const maxLeft = Math.max(margin, window.innerWidth - width - margin);
  const maxTop = Math.max(margin, window.innerHeight - taskbarHeight - height - margin);
  const left = Math.min(Math.max(parseFloat(windowEl.style.left) || margin, margin), maxLeft);
  const top = Math.min(Math.max(parseFloat(windowEl.style.top) || margin, margin), maxTop);
  windowEl.style.left = `${left}px`;
  windowEl.style.top = `${top}px`;
}

function openWindow(section) {
  const existing = state.windows.get(section);
  if (existing) {
    existing.classList.remove('minimized');
    focusWindow(existing, section);
    toggleStartMenu(false);
    return;
  }

  const windowEl = buildWindow(section);
  if (!windowEl) return;
  windowsLayerEl.appendChild(windowEl);
  clampWindow(windowEl);
  state.windows.set(section, windowEl);
  addTaskbarItem(section);
  focusWindow(windowEl, section);
  toggleStartMenu(false);
}

function buildWindow(section) {
  const title = SECTION_TITLES[section] || formatTitle(section);
  const wrapper = document.createElement('section');
  wrapper.className = 'window';
  if (UTILITY_APPS.includes(section)) {
    wrapper.classList.add('window--utility');
  }
  wrapper.dataset.section = section;
  wrapper.style.zIndex = ++state.zIndex;

  const header = document.createElement('header');
  header.className = 'window-header';
  const titleEl = document.createElement('div');
  titleEl.className = 'window-title';
  const icon = document.createElement('img');
  icon.src = SECTION_ICONS[section] || 'assets/icons/icon-folder.svg';
  icon.alt = `${title} icon`;
  titleEl.append(icon, document.createTextNode(title));
  const controls = document.createElement('div');
  controls.className = 'window-controls';
  ['minimize', 'maximize', 'close'].forEach((action) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.action = action;
    btn.title = formatTitle(action);
    btn.setAttribute('aria-label', formatTitle(action));
    controls.appendChild(btn);
  });
  header.append(titleEl, controls);
  wrapper.appendChild(header);

  const body = document.createElement('div');
  body.className = 'window-body';
  const content = renderSection(section);
  if (!content) {
    body.innerHTML = '<p>Content unavailable.</p>';
  } else {
    body.appendChild(content);
  }
  wrapper.appendChild(body);

  const resizer = document.createElement('div');
  resizer.className = 'window-resizer';
  wrapper.appendChild(resizer);

  applyDefaultSize(wrapper, section);
  positionWindow(wrapper);
  enableDrag(wrapper, header);
  enableResize(wrapper, resizer);

  header.addEventListener('dblclick', () => toggleMaximize(wrapper));
  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'close') {
      closeWindow(section);
    } else if (action === 'minimize') {
      minimizeWindow(section);
    } else if (action === 'maximize') {
      toggleMaximize(wrapper);
    }
  });

  wrapper.addEventListener('mousedown', () => focusWindow(wrapper, section));

  return wrapper;
}

function renderSection(section) {
  switch (section) {
    case 'personal_info':
      return renderPersonalInfo();
    case 'contact':
      return renderContact();
    case 'summary':
      return renderSummary();
    case 'highlights':
      return renderHighlights();
    case 'experience':
      return renderExperience();
    case 'projects':
      return renderProjects();
    case 'skills':
      return renderSkills();
    case 'education':
      return renderEducation();
    case 'publications':
      return renderPublications();
    case 'photography':
      return renderPhotography();
    case 'interests':
      return renderInterests();
    case 'notepad':
      return renderNotepad();
    case 'calculator':
      return renderCalculator();
    case 'paint':
      return renderPaint();
    default:
      return document.createTextNode('This section is not yet implemented.');
  }
}

function renderPersonalInfo() {
  const container = document.createElement('div');
  const info = state.data.personal_info || {};
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '16px';
  const img = document.createElement('img');
  img.src = info.avatar || 'images/me.jpg';
  img.alt = `${info.name || 'User'} avatar`;
  img.style.width = '96px';
  img.style.height = '96px';
  img.style.borderRadius = '12px';
  img.style.objectFit = 'cover';
  const nameBlock = document.createElement('div');
  nameBlock.innerHTML = `<h3>${info.name || ''}</h3><p>${info.title || ''}</p><p>${info.location || ''}</p>`;
  header.append(img, nameBlock);
  container.appendChild(header);

  if (Array.isArray(state.data.highlights)) {
    const highlightTitle = document.createElement('h4');
    highlightTitle.textContent = 'Highlights';
    const highlightList = document.createElement('ul');
    state.data.highlights.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      highlightList.appendChild(li);
    });
    container.append(highlightTitle, highlightList);
  }

  if (state.data.contact) {
    const contactTitle = document.createElement('h4');
    contactTitle.textContent = 'Contact';
    const contactList = document.createElement('ul');
    Object.entries(state.data.contact).forEach(([key, value]) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = formatContactLink(key, value);
      link.textContent = `${formatTitle(key)}: ${value}`;
      link.target = '_blank';
      link.rel = 'noopener';
      li.appendChild(link);
      contactList.appendChild(li);
    });
    container.append(contactTitle, contactList);
  }

  return container;
}

function renderContact() {
  const container = document.createElement('div');
  const contactList = document.createElement('ul');
  (Object.entries(state.data.contact || {})).forEach(([key, value]) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = formatContactLink(key, value);
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = `${formatTitle(key)}: ${value}`;
    li.appendChild(link);
    contactList.appendChild(li);
  });
  container.appendChild(contactList);
  return container;
}

function renderSummary() {
  const container = document.createElement('div');
  (state.data.summary || []).forEach((paragraph) => {
    const p = document.createElement('p');
    p.innerHTML = formatMarkdown(paragraph);
    container.appendChild(p);
  });
  return container;
}

function renderHighlights() {
  const container = document.createElement('div');
  const list = document.createElement('ul');
  (state.data.highlights || []).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
  container.appendChild(list);
  return container;
}

function renderExperience() {
  const container = document.createElement('div');
  (state.data.experience || []).forEach((role) => {
    const section = document.createElement('section');
    const title = document.createElement('h3');
    const dates = `${role.start || ''} – ${role.end || ''}`.trim();
    title.innerHTML = `<a href="${role.url || '#'}" target="_blank" rel="noopener">${role.company}</a> · ${role.role}`;
    const meta = document.createElement('p');
    meta.textContent = `${role.location || ''}${dates ? ' · ' + dates : ''}`;
    const summary = document.createElement('p');
    summary.textContent = role.summary || '';
    section.append(title, meta, summary);
    if (Array.isArray(role.achievements) && role.achievements.length) {
      const list = document.createElement('ul');
      role.achievements.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      section.appendChild(list);
    }
    if (Array.isArray(role.stack) && role.stack.length) {
      const stack = document.createElement('p');
      stack.innerHTML = `<strong>Stack:</strong> ${role.stack.join(', ')}`;
      section.appendChild(stack);
    }
    container.appendChild(section);
  });
  return container;
}

function renderProjects() {
  const container = document.createElement('div');
  (state.data.projects || []).forEach((project) => {
    const section = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = project.name;
    const description = document.createElement('p');
    description.textContent = project.description;
    const tags = document.createElement('p');
    tags.innerHTML = `<strong>Tags:</strong> ${(project.tags || []).join(', ')}`;
    section.append(title, description, tags);
    if (Array.isArray(project.links)) {
      const linkRow = document.createElement('p');
      project.links.forEach((link) => {
        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        anchor.textContent = link.label;
        linkRow.appendChild(anchor);
        linkRow.append(' ');
      });
      section.appendChild(linkRow);
    }
    container.appendChild(section);
  });
  return container;
}

function renderSkills() {
  const container = document.createElement('div');
  const skills = state.data.skills || {};
  Object.entries(skills).forEach(([group, entries]) => {
    const groupTitle = document.createElement('h3');
    groupTitle.textContent = formatTitle(group.replace(/_/g, ' '));
    container.appendChild(groupTitle);
    const list = document.createElement('ul');
    (entries || []).forEach((skill) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${skill.name}</strong> – ${skill.proficiency || ''} (${renderProficiency(skill.level)})`;
      list.appendChild(li);
    });
    container.appendChild(list);
  });
  return container;
}

function renderEducation() {
  const container = document.createElement('div');
  (state.data.education || []).forEach((entry) => {
    const section = document.createElement('section');
    const title = document.createElement('h3');
    title.innerHTML = `${entry.degree} · <a href="${entry.url || '#'}" target="_blank" rel="noopener">${entry.institution}</a>`;
    const meta = document.createElement('p');
    meta.textContent = `${entry.location || ''} · ${entry.start || ''} – ${entry.end || ''}`;
    section.append(title, meta);
    if (Array.isArray(entry.details) && entry.details.length) {
      const list = document.createElement('ul');
      entry.details.forEach((detail) => {
        const li = document.createElement('li');
        li.textContent = detail;
        list.appendChild(li);
      });
      section.appendChild(list);
    }
    if (Array.isArray(entry.honors) && entry.honors.length) {
      const honors = document.createElement('p');
      honors.innerHTML = `<strong>Honors:</strong> ${entry.honors.join(', ')}`;
      section.appendChild(honors);
    }
    container.appendChild(section);
  });
  return container;
}

function renderPublications() {
  const container = document.createElement('div');
  (state.data.publications || []).forEach((pub) => {
    const section = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = `${pub.title} (${pub.year})`;
    const venue = document.createElement('p');
    venue.innerHTML = `<strong>${pub.venue}</strong> – ${pub.status || ''}`;
    const authors = document.createElement('p');
    authors.textContent = `Authors: ${(pub.authors || []).join(', ')}`;
    section.append(title, venue, authors);
    if (pub.link) {
      const link = document.createElement('a');
      link.href = pub.link;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'View publication';
      section.appendChild(link);
    }
    if (pub.note) {
      const note = document.createElement('p');
      note.innerHTML = `<em>${pub.note}</em>`;
      section.appendChild(note);
    }
    container.appendChild(section);
  });
  return container;
}

function renderPhotography() {
  const galleryData = state.data.photography;
  if (!galleryData?.enabled) {
    return document.createTextNode('Photography gallery disabled.');
  }
  const container = document.createElement('div');
  const description = document.createElement('p');
  description.textContent = galleryData.description || '';
  container.appendChild(description);
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
  grid.style.gap = '12px';
  (galleryData.gallery || []).forEach((item) => {
    const figure = document.createElement('figure');
    figure.style.margin = '0';
    figure.style.background = 'rgba(255,255,255,0.7)';
    figure.style.borderRadius = '10px';
    figure.style.overflow = 'hidden';
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || '';
    img.style.width = '100%';
    img.style.display = 'block';
    const figcaption = document.createElement('figcaption');
    figcaption.style.padding = '8px 10px 12px';
    figcaption.innerHTML = `<strong>${item.caption || ''}</strong><br/><span style="color:#365b8a">${item.location || ''}</span>`;
    figure.append(img, figcaption);
    grid.appendChild(figure);
  });
  container.appendChild(grid);
  return container;
}

function renderInterests() {
  const container = document.createElement('div');
  const list = document.createElement('ul');
  (state.data.interests || []).forEach((interest) => {
    const li = document.createElement('li');
    li.textContent = interest;
    list.appendChild(li);
  });
  container.appendChild(list);
  return container;
}

function renderNotepad() {
  const container = document.createElement('div');
  container.className = 'app-notepad';
  const textarea = document.createElement('textarea');
  textarea.className = 'notepad-textarea';
  textarea.value = utilityState.notepad;
  textarea.placeholder = 'Start typing your notes...';
  textarea.spellcheck = false;
  const status = document.createElement('div');
  status.className = 'notepad-status';

  const updateStatus = () => {
    const lines = textarea.value ? textarea.value.split(/\r?\n/).length : 1;
    status.textContent = `Lines: ${lines} · Characters: ${textarea.value.length}`;
  };

  textarea.addEventListener('input', () => {
    utilityState.notepad = textarea.value;
    updateStatus();
  });

  container.append(textarea, status);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  });
  updateStatus();
  return container;
}

function renderCalculator() {
  const calcState = utilityState.calculator;
  const container = document.createElement('div');
  container.className = 'app-calculator';

  const display = document.createElement('input');
  display.type = 'text';
  display.className = 'calculator-display';
  display.value = calcState.display;
  display.readOnly = true;
  display.setAttribute('aria-label', 'Calculator display');

  const grid = document.createElement('div');
  grid.className = 'calculator-grid';
  const layout = [
    ['C', 'CE', '←', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', '']
  ];

  const refreshDisplay = () => {
    display.value = calcState.display;
  };

  const setError = () => {
    calcState.display = 'Error';
    calcState.stored = null;
    calcState.operator = null;
    calcState.overwrite = true;
    refreshDisplay();
  };

  const applyOperator = (operator) => {
    if (calcState.display === 'Error') {
      calcState.display = '0';
    }
    const current = parseFloat(calcState.display);
    if (!calcState.overwrite) {
      if (calcState.operator && calcState.stored != null) {
        const result = compute(calcState.operator, calcState.stored, current);
        if (result == null) {
          setError();
          return;
        }
        calcState.stored = result;
        calcState.display = formatNumber(result);
      } else {
        calcState.stored = current;
      }
    }
    calcState.operator = operator;
    calcState.overwrite = true;
    refreshDisplay();
  };

  const compute = (operator, left, right) => {
    switch (operator) {
      case '+':
        return left + right;
      case '−':
        return left - right;
      case '×':
        return left * right;
      case '÷':
        return right === 0 ? null : left / right;
      default:
        return right;
    }
  };

  const evaluate = () => {
    if (!calcState.operator || calcState.display === 'Error') return;
    const current = parseFloat(calcState.display);
    if (Number.isNaN(current)) return;
    const left = calcState.stored != null ? calcState.stored : current;
    const result = compute(calcState.operator, left, current);
    if (result == null) {
      setError();
      return;
    }
    calcState.display = formatNumber(result);
    calcState.stored = result;
    calcState.operator = null;
    calcState.overwrite = true;
    refreshDisplay();
  };

  const handleNumber = (digit) => {
    if (calcState.display === 'Error') {
      calcState.display = '0';
    }
    if (calcState.overwrite || calcState.display === '0') {
      calcState.display = digit;
    } else {
      calcState.display += digit;
    }
    calcState.overwrite = false;
    refreshDisplay();
  };

  const handleDecimal = () => {
    if (calcState.display === 'Error') {
      calcState.display = '0';
    }
    if (calcState.overwrite) {
      calcState.display = '0.';
      calcState.overwrite = false;
    } else if (!calcState.display.includes('.')) {
      calcState.display += '.';
    }
    refreshDisplay();
  };

  const clearEntry = () => {
    calcState.display = '0';
    calcState.overwrite = true;
    refreshDisplay();
  };

  const clearAll = () => {
    calcState.display = '0';
    calcState.stored = null;
    calcState.operator = null;
    calcState.overwrite = true;
    refreshDisplay();
  };

  const backspace = () => {
    if (calcState.display === 'Error') {
      clearEntry();
      return;
    }
    if (calcState.overwrite) {
      clearEntry();
      return;
    }
    if (calcState.display.length <= 1) {
      clearEntry();
    } else {
      calcState.display = calcState.display.slice(0, -1);
      refreshDisplay();
    }
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
      return 'Error';
    }
    const rounded = Math.round(value * 1e10) / 1e10;
    return rounded.toString();
  };

  layout.forEach((row) => {
    row.forEach((label) => {
      if (!label) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calculator-button';
      button.textContent = label;
      if (label === '0') {
        button.classList.add('span-2');
      }
      if (['÷', '×', '−', '+', '='].includes(label)) {
        button.classList.add('operator');
      }
      if (['C', 'CE', '←'].includes(label)) {
        button.classList.add('command');
      }
      button.addEventListener('click', () => {
        if (/^[0-9]$/.test(label)) {
          handleNumber(label);
        } else if (label === '.') {
          handleDecimal();
        } else if (label === 'CE') {
          clearEntry();
        } else if (label === 'C') {
          clearAll();
        } else if (label === '←') {
          backspace();
        } else if (label === '=') {
          evaluate();
        } else {
          applyOperator(label);
        }
      });
      grid.appendChild(button);
    });
  });

  container.append(display, grid);
  return container;
}

function renderPaint() {
  const container = document.createElement('div');
  container.className = 'app-paint';

  const toolbar = document.createElement('div');
  toolbar.className = 'paint-toolbar';

  const colors = ['#0a64d6', '#db3a34', '#f2c94c', '#2f9b57', '#6f4fd6', '#202428'];
  const updateActiveSwatch = (activeButton) => {
    toolbar.querySelectorAll('.paint-swatch').forEach((button) => {
      button.classList.toggle('active', button === activeButton);
    });
  };

  colors.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'paint-swatch';
    swatch.style.setProperty('--swatch-color', color);
    if (color === utilityState.paint.color) {
      swatch.classList.add('active');
    }
    swatch.addEventListener('click', () => {
      utilityState.paint.color = color;
      updateActiveSwatch(swatch);
      updateStatus();
    });
    toolbar.appendChild(swatch);
  });

  const strokeWrapper = document.createElement('label');
  strokeWrapper.className = 'paint-stroke';
  strokeWrapper.textContent = 'Brush';
  const strokeInput = document.createElement('input');
  strokeInput.type = 'range';
  strokeInput.min = '1';
  strokeInput.max = '16';
  strokeInput.value = utilityState.paint.stroke.toString();
  strokeInput.addEventListener('input', () => {
    utilityState.paint.stroke = Number(strokeInput.value);
    updateStatus();
  });
  strokeWrapper.appendChild(strokeInput);
  toolbar.appendChild(strokeWrapper);

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'paint-clear';
  clearButton.textContent = 'Clear Canvas';
  toolbar.appendChild(clearButton);

  const status = document.createElement('div');
  status.className = 'paint-status';

  const canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'paint-canvas-wrapper';
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 320;
  canvas.className = 'paint-canvas';
  canvas.style.touchAction = 'none';
  const ctx = canvas.getContext('2d');

  const restoreSnapshot = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (utilityState.paint.snapshot) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = utilityState.paint.snapshot;
    }
  };

  const saveSnapshot = () => {
    try {
      utilityState.paint.snapshot = canvas.toDataURL();
    } catch (error) {
      console.error('Failed to store paint snapshot', error);
    }
  };

  const getPosition = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  let drawing = false;
  let lastPoint = null;

  const startDrawing = (event) => {
    drawing = true;
    lastPoint = getPosition(event);
    drawLine(lastPoint, lastPoint);
  };

  const drawLine = (from, to) => {
    ctx.strokeStyle = utilityState.paint.color;
    ctx.lineWidth = utilityState.paint.stroke;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const continueDrawing = (event) => {
    if (!drawing) return;
    const nextPoint = getPosition(event);
    drawLine(lastPoint, nextPoint);
    lastPoint = nextPoint;
  };

  const stopDrawing = () => {
    if (!drawing) return;
    drawing = false;
    saveSnapshot();
  };

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    startDrawing(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    event.preventDefault();
    continueDrawing(event);
  });
  canvas.addEventListener('pointerup', (event) => {
    event.preventDefault();
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    stopDrawing();
  });
  canvas.addEventListener('pointercancel', stopDrawing);
  canvas.addEventListener('pointerleave', stopDrawing);

  clearButton.addEventListener('click', () => {
    utilityState.paint.snapshot = null;
    restoreSnapshot();
    updateStatus();
  });

  function updateStatus() {
    status.textContent = `Brush ${utilityState.paint.stroke}px · ${utilityState.paint.color.toUpperCase()}`;
  }

  restoreSnapshot();
  updateStatus();

  canvasWrapper.appendChild(canvas);
  container.append(toolbar, status, canvasWrapper);
  return container;
}

function addTaskbarItem(section) {
  const existing = taskbarItems.querySelector(`[data-section="${section}"]`);
  if (existing) {
    existing.classList.add('active');
    return;
  }
  const title = SECTION_TITLES[section] || formatTitle(section);
  const button = document.createElement('button');
  button.className = 'taskbar-item active';
  button.dataset.section = section;
  button.innerHTML = `
    <img src="${SECTION_ICONS[section] || 'assets/icons/icon-folder.svg'}" alt="${title}" />
    <span>${title}</span>
  `;
  button.addEventListener('click', () => {
    const windowEl = state.windows.get(section);
    if (!windowEl) return;
    if (windowEl.classList.contains('minimized')) {
      windowEl.classList.remove('minimized');
      focusWindow(windowEl, section);
    } else if (state.activeWindow === section) {
      minimizeWindow(section);
    } else {
      focusWindow(windowEl, section);
    }
  });
  taskbarItems.appendChild(button);
}

function focusWindow(windowEl, section) {
  state.activeWindow = section;
  windowEl.style.zIndex = ++state.zIndex;
  document.querySelectorAll('.taskbar-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section);
  });
}

function closeWindow(section) {
  const windowEl = state.windows.get(section);
  if (!windowEl) return;
  windowEl.remove();
  state.windows.delete(section);
  const taskbarItem = taskbarItems.querySelector(`[data-section="${section}"]`);
  if (taskbarItem) taskbarItem.remove();
  if (state.activeWindow === section) {
    state.activeWindow = null;
  }
}

function minimizeWindow(section) {
  const windowEl = state.windows.get(section);
  if (!windowEl) return;
  windowEl.classList.add('minimized');
  const taskbarItem = taskbarItems.querySelector(`[data-section="${section}"]`);
  if (taskbarItem) {
    taskbarItem.classList.remove('active');
  }
  if (state.activeWindow === section) {
    state.activeWindow = null;
  }
}

function toggleMaximize(windowEl) {
  const isMaximized = windowEl.classList.toggle('maximized');
  const taskbarHeight = getTaskbarHeight();
  if (isMaximized) {
    windowEl.dataset.prev = JSON.stringify({
      left: windowEl.style.left,
      top: windowEl.style.top,
      width: windowEl.style.width,
      height: windowEl.style.height
    });
    windowEl.style.left = '0px';
    windowEl.style.top = '0px';
    windowEl.style.width = '100%';
    windowEl.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else {
    const prev = windowEl.dataset.prev ? JSON.parse(windowEl.dataset.prev) : null;
    if (prev) {
      windowEl.style.left = prev.left;
      windowEl.style.top = prev.top;
      windowEl.style.width = prev.width;
      windowEl.style.height = prev.height;
    }
    clampWindow(windowEl);
  }
}

function positionWindow(windowEl) {
  const offset = (state.offsets++ % 6) * 36;
  const taskbarHeight = getTaskbarHeight();
  const width = parseInt(windowEl.style.width, 10) || windowEl.offsetWidth || 600;
  const height = parseInt(windowEl.style.height, 10) || windowEl.offsetHeight || 400;
  const baseLeft = (window.innerWidth - width) / 2;
  const baseTop = (window.innerHeight - taskbarHeight - height) / 2;
  const left = Math.max(12, Math.min(baseLeft + offset, window.innerWidth - width - 24));
  const top = Math.max(24, Math.min(baseTop + offset, window.innerHeight - taskbarHeight - height - 24));
  windowEl.style.left = `${left}px`;
  windowEl.style.top = `${top}px`;
}

function enableDrag(windowEl, handle) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  handle.addEventListener('pointerdown', (event) => {
    if (windowEl.classList.contains('maximized')) return;
    if (event.button !== 0) return;
    if (event.target.closest('.window-controls')) return;
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    initialLeft = parseInt(windowEl.style.left || 0, 10);
    initialTop = parseInt(windowEl.style.top || 0, 10);
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    windowEl.style.left = `${initialLeft + dx}px`;
    windowEl.style.top = `${initialTop + dy}px`;
  });

  const endDrag = (event) => {
    isDragging = false;
    if (event.pointerId != null && handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
    clampWindow(windowEl);
  };

  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
}

function enableResize(windowEl, resizer) {
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  resizer.addEventListener('pointerdown', (event) => {
    if (windowEl.classList.contains('maximized')) return;
    isResizing = true;
    startX = event.clientX;
    startY = event.clientY;
    startWidth = parseInt(window.getComputedStyle(windowEl).width, 10);
    startHeight = parseInt(window.getComputedStyle(windowEl).height, 10);
    resizer.setPointerCapture(event.pointerId);
  });

  resizer.addEventListener('pointermove', (event) => {
    if (!isResizing) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const margin = 32;
    const taskbarHeight = getTaskbarHeight();
    const maxWidth = Math.max(360, window.innerWidth - margin);
    const maxHeight = Math.max(300, window.innerHeight - (taskbarHeight + margin));
    const width = Math.min(Math.max(320, startWidth + dx), maxWidth);
    const height = Math.min(Math.max(240, startHeight + dy), maxHeight);
    windowEl.style.width = `${width}px`;
    windowEl.style.height = `${height}px`;
  });

  const endResize = (event) => {
    isResizing = false;
    if (event.pointerId != null && resizer.hasPointerCapture(event.pointerId)) {
      resizer.releasePointerCapture(event.pointerId);
    }
    clampWindow(windowEl);
  };

  resizer.addEventListener('pointerup', endResize);
  resizer.addEventListener('pointercancel', endResize);
}

function toggleStartMenu(forceState) {
  const isVisible = forceState ?? startMenu.classList.contains('hidden');
  if (isVisible) {
    startMenu.classList.remove('hidden');
    startButton.setAttribute('aria-expanded', 'true');
  } else {
    startMenu.classList.add('hidden');
    startButton.setAttribute('aria-expanded', 'false');
  }
}

function bindGlobalEvents() {
  loginButton.addEventListener('click', handleLogin);
  document.querySelectorAll('.start-extra').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const app = button.dataset.app;
      if (app) {
        openWindow(app);
      }
      toggleStartMenu(false);
    });
  });
  startButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleStartMenu();
  });
  document.addEventListener('click', (event) => {
    if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
      toggleStartMenu(false);
    }
  });

  document.addEventListener('contextmenu', (event) => {
    if (!desktopEl.contains(event.target) || event.target.closest('.window') || event.target.closest('.taskbar')) {
      return;
    }
    event.preventDefault();
    const { clientX, clientY } = event;
    contextMenu.style.left = `${clientX}px`;
    contextMenu.style.top = `${clientY}px`;
    contextMenu.classList.remove('hidden');
  });

  document.addEventListener('click', (event) => {
    if (!contextMenu.contains(event.target)) {
      contextMenu.classList.add('hidden');
    }
  });

  contextMenu.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'refresh') {
      window.location.reload();
    } else if (action === 'properties') {
      openWindow('personal_info');
    } else if (action === 'personalize') {
      openWindow('photography');
    }
    contextMenu.classList.add('hidden');
  });

  trayClock.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = calendarPopup.classList.contains('hidden');
    calendarPopup.classList.toggle('hidden');
    trayClock.setAttribute('aria-expanded', open ? 'true' : 'false');
    refreshCalendarTime();
  });

  document.addEventListener('click', (event) => {
    if (!calendarPopup.contains(event.target) && !trayClock.contains(event.target)) {
      calendarPopup.classList.add('hidden');
      trayClock.setAttribute('aria-expanded', 'false');
    }
  });

  logOffButton.addEventListener('click', handleLogOff);
  window.addEventListener('resize', handleWindowResize);
}

function handleWindowResize() {
  const margin = 48;
  const taskbarHeight = getTaskbarHeight();
  state.windows.forEach((windowEl) => {
    if (windowEl.classList.contains('maximized')) {
      windowEl.style.left = '0px';
      windowEl.style.top = '0px';
      windowEl.style.width = '100%';
      windowEl.style.height = `calc(100% - ${taskbarHeight}px)`;
      return;
    }
    const maxWidth = Math.max(360, window.innerWidth - margin);
    const maxHeight = Math.max(300, window.innerHeight - (taskbarHeight + margin));
    const currentWidth = parseInt(window.getComputedStyle(windowEl).width, 10);
    const currentHeight = parseInt(window.getComputedStyle(windowEl).height, 10);
    if (currentWidth > maxWidth) {
      windowEl.style.width = `${maxWidth}px`;
    }
    if (currentHeight > maxHeight) {
      windowEl.style.height = `${maxHeight}px`;
    }
    clampWindow(windowEl);
  });
}

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  trayTime.textContent = time;
  trayDate.textContent = date;
}

function buildCalendar() {
  calendarGrid.innerHTML = '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach((day) => {
    const span = document.createElement('span');
    span.textContent = day;
    span.className = 'calendar-day-name';
    calendarGrid.appendChild(span);
  });
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('span');
    calendarGrid.appendChild(empty);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const span = document.createElement('span');
    span.className = 'calendar-day';
    span.textContent = day;
    if (day === now.getDate()) {
      span.classList.add('today');
    }
    calendarGrid.appendChild(span);
  }
  refreshCalendarTime();
}

function refreshCalendarTime() {
  const now = new Date();
  calendarDate.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  calendarTime.textContent = now.toLocaleTimeString();
}

function formatTitle(value) {
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatContactLink(key, value) {
  if (key === 'email') {
    return `mailto:${value}`;
  }
  if (key === 'phone') {
    return `tel:${value.replace(/\s+/g, '')}`;
  }
  return value;
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
}

function renderProficiency(level) {
  const max = 5;
  return '★'.repeat(level || 0) + '☆'.repeat(Math.max(0, max - (level || 0)));
}

function handleLogin() {
  welcomeMessage.textContent = 'Welcome';
  loginScreen.classList.remove('screen--active');
  welcomeScreen.classList.add('screen--active');
  playStartupSound();
  setTimeout(() => {
    welcomeScreen.classList.remove('screen--active');
    desktopEl.classList.remove('hidden');
  }, 1600);
}

function playStartupSound() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const now = context.currentTime;
    const notes = [
      { time: 0, freq: 440 },
      { time: 0.25, freq: 554.37 },
      { time: 0.5, freq: 659.25 },
      { time: 0.75, freq: 880 }
    ];
    notes.forEach(({ time, freq }) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.4, now + time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.45);
      osc.connect(gain).connect(context.destination);
      osc.start(now + time);
      osc.stop(now + time + 0.5);
    });
    setTimeout(() => context.close(), 1200);
  } catch (error) {
    console.error('Audio playback failed:', error);
  }
}

function playShutdownSound() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const now = context.currentTime;
    const notes = [
      { time: 0, freq: 523.25 },
      { time: 0.25, freq: 392 },
      { time: 0.5, freq: 261.63 }
    ];
    notes.forEach(({ time, freq }) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.35, now + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.45);
      osc.connect(gain).connect(context.destination);
      osc.start(now + time);
      osc.stop(now + time + 0.6);
    });
    setTimeout(() => context.close(), 1200);
  } catch (error) {
    console.error('Audio playback failed:', error);
  }
}

function handleLogOff() {
  toggleStartMenu(false);
  contextMenu.classList.add('hidden');
  calendarPopup.classList.add('hidden');
  trayClock.setAttribute('aria-expanded', 'false');
  const openSections = Array.from(state.windows.keys());
  openSections.forEach((key) => closeWindow(key));
  state.offsets = 0;
  playShutdownSound();
  desktopEl.classList.add('hidden');
  welcomeMessage.textContent = 'Logging off…';
  welcomeScreen.classList.add('screen--active');
  setTimeout(() => {
    welcomeScreen.classList.remove('screen--active');
    loginScreen.classList.add('screen--active');
    welcomeMessage.textContent = 'Welcome';
  }, 900);
}

init();
