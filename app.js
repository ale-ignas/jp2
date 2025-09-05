// app.js — dinaminis konstruotojas iš /data/content.json
(async function(){
  const container = document.getElementById('links');
  const sortSelect = document.getElementById('sortSelect');
  const categorySelect = document.getElementById('categorySelect');
  const resourceSelect = document.getElementById('resourceSelect');

  let data = [];
  let sortDesc = (sortSelect && sortSelect.value === 'desc');

  try {
    const resp = await fetch('data/content.json', {cache: "no-store"});
    if(!resp.ok) throw new Error('Nepavyko užkrauti content.json');
    data = await resp.json();
  } catch (e) {
    console.warn('Klaida kraunant content.json — naudojami pavyzdiniai įrašai.', e);
    data = [
      {
        "id":"0",
        "date":"2025-09-01",
        "title":"Įvyko klaida",
        "category":"klaida",
        "description":"Atsiprašome už nepatogumus.",
        "url":"https://github.com/ale-ignas",
        "status":"notstarted",
        "resource":"pranešimas"
      }
    ];
  }

  // safety: ensure controls exist (in case index.html slightly different)
  const ensureSelect = (id, defaultVal) => {
    const el = document.getElementById(id);
    if(!el){
      const s = document.createElement('select');
      s.id = id;
      s.innerHTML = `<option value="${defaultVal}">visi</option>`;
      return s;
    }
    return el;
  };

  const sortEl = ensureSelect('sortSelect','desc');
  const catEl = ensureSelect('categorySelect','all');
  const resEl = ensureSelect('resourceSelect','all');

  // populate filters
  function populateFilters(dataset){
    const cats = Array.from(new Set(dataset.map(d => d.category).filter(Boolean))).sort();
    const ress = Array.from(new Set(dataset.map(d => d.resource).filter(Boolean))).sort();

    // categories
    if(catEl){
      catEl.innerHTML = '<option value="all">Visos</option>';
      cats.forEach(c => {
        const opt = document.createElement('option'); opt.value = c; opt.textContent = c; catEl.appendChild(opt);
      });
    }

    // resources
    if(resEl){
      resEl.innerHTML = '<option value="all">Visi</option>';
      ress.forEach(r => {
        const opt = document.createElement('option'); opt.value = r; opt.textContent = r; resEl.appendChild(opt);
      });
    }
  }

  populateFilters(data);

  // listeners
  if(sortEl) sortEl.addEventListener('change', () => {
    sortDesc = (sortEl.value === 'desc');
    renderCurrent();
  });
  if(catEl) catEl.addEventListener('change', renderCurrent);
  if(resEl) resEl.addEventListener('change', renderCurrent);

  function render(list){
    container.innerHTML = '';
    if(list.length === 0){
      container.innerHTML = '<p>Nerasta įrašų pagal pasirinktus filtrus.</p>';
      return;
    }

    for(const item of list){
      const article = document.createElement('article');
      article.className = 'card';

      const row = document.createElement('div');
      row.className = 'card-row';

      // LEFT: main content (title + desc)
      const contentCol = document.createElement('div');
      contentCol.className = 'content-col';

      const titleRow = document.createElement('div');
      titleRow.className = 'title-row';

      // status icon
      const statusIcon = document.createElement('i');
      statusIcon.classList.add('status');
      const st = (item.status||'notstarted').toString().toLowerCase();
      if(st === 'done' || st === 'ready' || st === 'paruosta'){
        statusIcon.classList.add('fa-solid','fa-circle-check','done');
      } else if(st === 'inprogress' || st === 'started' || st === 'pradeta'){
        statusIcon.classList.add('fa-solid','fa-circle-exclamation','inprogress');
      } else {
        statusIcon.classList.add('fa-solid','fa-circle-xmark','notstarted');
      }
      statusIcon.setAttribute('aria-hidden','true');

      const a = document.createElement('a');
      a.className = 'title-link';
      a.href = item.url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = escapeHtml(item.title || '—') + ' <i class="fa-solid fa-arrow-up-right-from-square arrow" aria-hidden="true"></i>';

      titleRow.appendChild(statusIcon);
      titleRow.appendChild(a);
      contentCol.appendChild(titleRow);

      if(item.description){
        const p = document.createElement('p');
        p.className = 'desc';
        p.textContent = item.description;
        contentCol.appendChild(p);
      }

      // RIGHT: meta (resource pill + date), aligned right via CSS
      const metaCol = document.createElement('div');
      metaCol.className = 'meta-col';

      if(item.resource){
        const pill = document.createElement('div');
        pill.className = 'resource-pill';
        pill.textContent = item.resource;
        metaCol.appendChild(pill);
      }

      const dateDiv = document.createElement('div');
      dateDiv.className = 'date-small';
      dateDiv.textContent = item.date || '';
      metaCol.appendChild(dateDiv);

      // append in correct order: left content first, then right meta
      row.appendChild(contentCol);
      row.appendChild(metaCol);

      article.appendChild(row);
      container.appendChild(article);
    }
  }

  function renderCurrent(){
    const cat = (catEl && catEl.value) ? catEl.value : 'all';
    const res = (resEl && resEl.value) ? resEl.value : 'all';
    let list = data.slice();

    // filter
    if(cat && cat !== 'all') list = list.filter(d => d.category === cat);
    if(res && res !== 'all') list = list.filter(d => d.resource === res);

    // sort
    list.sort((a,b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return sortDesc ? db - da : da - db;
    });

    render(list);
  }

  renderCurrent();

  function escapeHtml(str){
    if(!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
