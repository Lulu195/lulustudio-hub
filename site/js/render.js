/* render.js - turns the HUB data (data.js) into cards, download buttons, and a
   details dialog (with a commit sparkline and language bar) on the page.
   No framework. Any element with a data-cards / data-downloads attribute is filled.
   Reads top-to-bottom: entry point first, helpers below it. */

document.addEventListener('DOMContentLoaded', renderHub);
document.addEventListener('click', handleDetailsClick);

function renderHub() {
  fillEveryCardContainer();
  fillEveryDownloadContainer();
  stampCurrentYear();
}

function fillEveryCardContainer() {
  document.querySelectorAll('[data-cards]').forEach(fillCardContainer);
}

function fillCardContainer(container) {
  const collectionName = container.dataset.cards;
  const limit = readLimit(container.dataset.limit);
  const items = sortedByOrder(HUB[collectionName]).slice(0, limit);
  container.innerHTML = items.length
    ? items.map((item) => renderCard(toCardModel(collectionName, item))).join('')
    : renderEmptyState();
}

function fillEveryDownloadContainer() {
  document.querySelectorAll('[data-downloads]').forEach(fillDownloadContainer);
}

function fillDownloadContainer(container) {
  const project = findByName('projects', null, container.dataset.downloads, 'page');
  const downloads = project ? project.downloads || [] : [];
  container.innerHTML = downloads.length ? downloads.map(renderDownload).join('') : renderEmptyState();
}

function stampCurrentYear() {
  const slot = document.querySelector('[data-current-year]');
  if (slot) slot.textContent = String(new Date().getFullYear());
}

/* ── domain -> card model ─────────────────────────────────────── */

function toCardModel(collectionName, item) {
  const isBot = collectionName === 'bots';
  return {
    collection: collectionName,
    name: item.name,
    description: item.blurb,
    titleHref: isBot ? item.invite || item.repo : item.page ? `/${item.page}/` : item.repo,
    badges: cardBadges(item),
    statline: statline(item.stats),
    tags: techStack(item),
    actions: cardActions(item, isBot),
  };
}

function cardBadges(item) {
  const badges = [];
  if (item.status) badges.push(statusBadge(item.status));
  if (item.fork) badges.push({ label: 'fork', variant: 'fork', icon: forkIcon() });
  if (item.private) badges.push({ label: 'private', variant: 'private' });
  return badges;
}

function statusBadge(status) {
  const variantByStatus = { live: 'live', beta: 'accent', wip: 'accent', archived: 'warn' };
  return { label: status, variant: variantByStatus[status] || 'accent', dot: status === 'live' };
}

function cardActions(item, isBot) {
  const actions = [{ label: 'details', detailsFor: { collection: isBot ? 'bots' : 'projects', name: item.name } }];
  if (isBot && item.invite) actions.push({ label: 'invite', url: item.invite });
  if (item.repo) actions.push({ label: 'source', url: item.repo });
  return actions;
}

/* ── card model -> HTML ───────────────────────────────────────── */

function renderCard({ name, description, titleHref, badges, statline, tags, actions }) {
  return `
    <article class="card">
      ${badges.length ? `<div class="card__meta">${badges.map(renderBadge).join('')}</div>` : ''}
      <h3 class="card__title">${renderTitle(name, titleHref)}</h3>
      <p class="card__description">${escapeHtml(description)}</p>
      ${renderTechStack(tags)}
      ${renderStatline(statline)}
      ${renderActions(actions)}
    </article>`;
}

function renderTitle(name, href) {
  if (!href) return escapeHtml(name);
  return `<a href="${escapeAttribute(href)}"${externalAttributes(href)}>${escapeHtml(name)} <span class="card__title-arrow" aria-hidden="true">${arrowFor(href)}</span></a>`;
}

function renderBadge({ label, variant, dot, icon }) {
  const lead = dot ? '<span class="badge__dot" aria-hidden="true">●</span>' : icon || '';
  return `<span class="badge badge--${variant}">${lead}${escapeHtml(label)}</span>`;
}

function renderStatline(statline) {
  if (!statline) return '';
  const parts = statline.map((part) => `<span>${escapeHtml(part)}</span>`).join('<span class="statline__sep" aria-hidden="true">·</span>');
  return `<p class="statline">${parts}</p>`;
}

function renderTechStack(stack) {
  if (!stack || stack.length === 0) return '';
  const chips = stack
    .map((tech, index) => `<li class="tech"><span class="tech__dot lang-bar__seg--${index}" aria-hidden="true"></span>${escapeHtml(tech)}</li>`)
    .join('');
  return `<div class="card__stack"><span class="card__stack-label">stack</span><ul class="tech-list">${chips}</ul></div>`;
}

function renderActions(actions) {
  if (!actions || actions.length === 0) return '';
  return `<div class="card__actions">${actions.map(renderAction).join('')}</div>`;
}

function renderAction(action) {
  if (action.detailsFor) {
    return `<button type="button" class="card__action" data-details-collection="${escapeAttribute(action.detailsFor.collection)}" data-details-name="${escapeAttribute(action.detailsFor.name)}">${escapeHtml(action.label)}</button>`;
  }
  return `<a class="card__action" href="${escapeAttribute(action.url)}"${externalAttributes(action.url)}>${escapeHtml(action.label)}<span aria-hidden="true"> ${arrowFor(action.url)}</span></a>`;
}

function renderDownload({ label, platform, url }) {
  return `
    <a class="download" href="${escapeAttribute(url)}">
      <span class="download__label">${escapeHtml(label)}</span>
      <span class="download__platform">${escapeHtml(platform)}</span>
      <span class="download__arrow" aria-hidden="true">↓</span>
    </a>`;
}

function renderEmptyState() {
  return '<p class="empty-state">Nothing here yet.</p>';
}

/* ── details dialog ───────────────────────────────────────────── */

function handleDetailsClick(event) {
  const trigger = event.target.closest('[data-details-name]');
  if (!trigger) return;
  const item = findByName(trigger.dataset.detailsCollection, trigger.dataset.detailsName);
  if (item) openDetails(item);
}

function openDetails(item) {
  const dialog = ensureDialog();
  dialog.innerHTML = renderDetails(item);
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.showModal();
}

function ensureDialog() {
  let dialog = document.getElementById('details-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'details-dialog';
    dialog.className = 'details';
    dialog.addEventListener('click', closeDialogOnBackdrop);
    document.body.appendChild(dialog);
  }
  return dialog;
}

function closeDialogOnBackdrop(event) {
  if (event.target.id === 'details-dialog') event.target.close();
}

function renderDetails(item) {
  return `
    <div class="details__panel">
      <button type="button" class="details__close" data-close aria-label="Close">✕</button>
      <div class="card__meta">${cardBadges(item).map(renderBadge).join('')}</div>
      <h2 class="details__title">${escapeHtml(item.name)}</h2>
      <p class="details__description">${escapeHtml(item.summary || item.blurb)}</p>
      ${renderStatGrid(item.stats)}
      ${renderLanguageBar(item.languages)}
      ${renderActivityChart(item.activity)}
      <div class="details__links">
        ${item.repo ? `<a class="button button--ghost" href="${escapeAttribute(item.repo)}" target="_blank" rel="noopener">source ↗</a>` : ''}
        ${item.page ? `<a class="button" href="/${escapeAttribute(item.page)}/">open page →</a>` : ''}
        ${item.invite ? `<a class="button" href="${escapeAttribute(item.invite)}" target="_blank" rel="noopener">invite ↗</a>` : ''}
      </div>
    </div>`;
}

function renderStatGrid(stats) {
  if (!stats) return '';
  const cells = [
    stats.language ? statCell('language', stats.language) : null,
    statCell('created', formatYear(stats.created)),
    statCell('last commit', formatRelativeDate(stats.updated)),
    statCell('commits / yr', String(stats.commitsLastYear)),
  ].filter(Boolean);
  return `<dl class="stat-grid">${cells.join('')}</dl>`;
}

function statCell(label, value) {
  return `<div class="stat"><dt class="stat__label">${escapeHtml(label)}</dt><dd class="stat__value">${escapeHtml(value)}</dd></div>`;
}

function renderLanguageBar(languages) {
  if (!languages || languages.length === 0) return '';
  const segments = languages
    .map((language, index) => `<span class="lang-bar__seg lang-bar__seg--${index}" style="width:${language.percent}%" title="${escapeAttribute(`${language.name} ${language.percent}%`)}"></span>`)
    .join('');
  const legend = languages
    .map((language, index) => `<li><span class="lang-bar__chip lang-bar__seg--${index}" aria-hidden="true"></span>${escapeHtml(language.name)} <span class="lang-bar__pct">${language.percent}%</span></li>`)
    .join('');
  return `
    <div class="details__block">
      <p class="details__heading">Languages</p>
      <div class="lang-bar">${segments}</div>
      <ul class="lang-bar__legend">${legend}</ul>
    </div>`;
}

function renderActivityChart(activity) {
  if (!activity || activity.length === 0 || sum(activity) === 0) {
    return '<div class="details__block"><p class="details__heading">Commit activity (52 weeks)</p><p class="empty-state">No commits in the last year.</p></div>';
  }
  const peak = Math.max(...activity);
  const bars = activity
    .map((count) => `<span class="spark__bar" style="height:${Math.max(2, Math.round((count / peak) * 100))}%" title="${count} commits"></span>`)
    .join('');
  return `
    <div class="details__block">
      <p class="details__heading">Commit activity <span class="details__heading-note">52 weeks · ${sum(activity)} commits</span></p>
      <div class="spark" role="img" aria-label="Weekly commits over the last year">${bars}</div>
    </div>`;
}

/* ── small helpers ────────────────────────────────────────────── */

// The card's tech stack: the repo's significant languages (>=1%), newest first.
function techStack(item) {
  const significant = (item.languages || []).filter((language) => language.percent >= 1);
  if (significant.length > 0) return significant.map((language) => language.name);
  return item.tags || [];
}

function statline(stats) {
  if (!stats) return null;
  const parts = [`updated ${formatRelativeDate(stats.updated)}`];
  if (stats.commitsLastYear > 0) parts.push(`${stats.commitsLastYear} commits/yr`);
  return parts;
}

function sortedByOrder(items) {
  const fallbackOrder = 100;
  return [...items].sort((a, b) => (a.order ?? fallbackOrder) - (b.order ?? fallbackOrder));
}

function findByName(collectionName, name, value, key) {
  const items = HUB[collectionName] || [];
  if (name) return items.find((item) => item.name === name);
  return items.find((item) => item[key] === value);
}

function readLimit(rawLimit) {
  const limit = Number.parseInt(rawLimit, 10);
  return Number.isFinite(limit) ? limit : Infinity;
}

function sum(numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

function forkIcon() {
  return '<svg class="badge__icon" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" fill="currentColor"><path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878ZM11 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-3 8.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path></svg>';
}

function formatYear(isoDate) {
  return isoDate ? `since ${isoDate.slice(0, 4)}` : 'unknown';
}

function formatRelativeDate(isoDate) {
  if (!isoDate) return 'unknown';
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function isExternalLink(url) {
  return /^https?:\/\//.test(url) && !url.includes('projects.lulustudio.dk');
}

function externalAttributes(url) {
  return isExternalLink(url) ? ' target="_blank" rel="noopener"' : '';
}

function arrowFor(url) {
  return isExternalLink(url) ? '↗' : '→';
}

function escapeHtml(text) {
  return String(text).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
}

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
