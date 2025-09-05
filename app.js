// app.js — dinaminis konstruotojas iš /data/content.json
// Funkcijos: filtravimas pagal category, rūšiavimas pagal date, rodymas status icon prieš pavadinimą

(async function(){
  const container = document.getElementById('links');
  const tagList = document.getElementById('tagList');
  const sortBtn = document.getElementById('sortBtn');

  let data = [];
  let sortDesc = true; // default: naujausia pirmiau

  try {
    const resp = await fetch('data/content.json', {cache: "no-store"});
    if(!resp.ok) throw new Error('Nepavyko užkrauti content.json');
    data = await resp.json();
  } catch (e) {
    console.warn('Klaida kraunant content.json — naudojami pavyzdiniai įrašai.', e);
    data = [
      {
        "id":"1",
        "date":"2025-09-01",
        "title":"Įvyko klaida",
        "category":"sistema",
        "description":"Patikrinti sistemą.",
        "url":"https://github.com/ale-ignas",
        "status":"notstarted"
      }
    ];
  }

  // padėsim visus įrašus į objektą data; pasiruošim žymas
  const categories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));
  categories.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'tag';
    b.dataset.filter = cat;
    b.textContent = cat;
    b.addEventListener('click', onFilter);
    tagList.appendChild(b);
  });

  // event: sort toggle
  sortBtn.addEventListener('click', () => {
    sortDesc = !sortDesc;
    sortBtn.textContent = sortDesc ? 'Rūšiuoti: Naujiausia ▾' : 'Rūšiuoti: Seniausia ▴';
    renderCurrent();
  });

  // pagrindinis render
  function render(list){
    container.innerHTML = '';
    if(list.length === 0){
      container.innerHTML = '<p>Nėra įrašų.</p>';
      return;
    }
    for(const item of list){
      const article = document.createElement('article');
      article.className = 'card';
      if(!item.title) article.classList.add('empty');

      // header line: title (left) / date (right)
      const headerLine = document.createElement('div');
      headerLine.className = 'header-line';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'title-wrap';

      // status icon element
      const statusIcon = document.createElement('i');
      statusIcon.classList.add('status'); // common class
      // map status to FontAwesome class + status class
      const st = (item.status||'notstarted').toString().toLowerCase();
      if(st === 'done' || st === 'ready' || st === 'paruosta'){
        statusIcon.classList.add('fa-solid','fa-circle-check','done');
        statusIcon.classList.add('done');
      } else if(st === 'inprogress' || st === 'started' || st === 'pradeta'){
        statusIcon.classList.add('fa-solid','fa-circle-exclamation','inprogress');
      } else {
        // default not started
        statusIcon.classList.add('fa-solid','fa-circle-xmark','notstarted');
      }
      statusIcon.setAttribute('aria-hidden','true');

      // title link (clickable) with arrow icon
      const a = document.createElement('a');
      a.className = 'title-link';
      a.href = item.url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = escapeHtml(item.title || '—') + ' <i class="fa-solid fa-arrow-up-right-from-square arrow" aria-hidden="true"></i>';

      titleWrap.appendChild(statusIcon);
      titleWrap.appendChild(a);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = item.date || '';

      headerLine.appendChild(titleWrap);
      headerLine.appendChild(meta);

      article.appendChild(headerLine);

      // description
      if(item.description){
        const p = document.createElement('p');
        p.className = 'desc';
        p.textContent = item.description;
        article.appendChild(p);
      }

      container.appendChild(article);
    }
  }

  // filter handler
  function onFilter(e){
    const f = e.currentTarget ? e.currentTarget.dataset.filter : e.target.dataset.filter;
    tagList.querySelectorAll('.tag').forEach(t=>t.classList.remove('active'));
    e.currentTarget.classList.add('active');
    renderCurrent();
  }

  function renderCurrent(){
    // current active tag
    const active = tagList.querySelector('.tag.active');
    const filter = active ? active.dataset.filter : 'all';
    let list = data.slice();

    // sort by date
    list.sort((a,b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return sortDesc ? db - da : da - db;
    });

    if(filter && filter !== 'all') list = list.filter(d => d.category === filter);
    render(list);
  }

  // attach click for statically added 'visi' button
  tagList.querySelectorAll('.tag').forEach(b => b.addEventListener('click', onFilter));

  // initial render
  renderCurrent();

  // util: saugus HTML escaping
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