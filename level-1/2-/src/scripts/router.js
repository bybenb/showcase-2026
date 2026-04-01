/* Router SPA (hash-based) - implementa rotas simples e estados de loading */
(function () {
  const appEl = () => document.getElementById('app');

  function showLoading() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.background = 'rgba(0,0,0,0.25)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '2000';
      overlay.innerHTML = '<div style="background:var(--cor-fundo);padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">Carregando...</div>';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // Funções de render para cada rota
  async function renderHome() {
    const el = appEl();
    el.innerHTML = `
      <h2>Destaques</h2>
      <div class="grade-musicas" id="grade-destaques">Carregando destaques...</div>
    `;

    // carrega algumas músicas do assets/musicas.json
    try {
      const res = await fetch('./assets/musicas.json');
      const data = await res.json();
      const mus = data.musicas || [];
      const grid = document.getElementById('grade-destaques');
      grid.innerHTML = mus.map(m => `
        <div class="carta-musica" data-id="${m.id}">
          <img src="./assets/${m.thumb}" alt="${m.titulo}">
          <h3>${m.titulo}</h3>
          <p>${m.artista}</p>
        </div>
      `).join('');

      // cliques nas cartas carregam a música via gerenciadorPlayer se existir
      grid.querySelectorAll('.carta-musica').forEach(node => {
        node.addEventListener('click', () => {
          const id = parseInt(node.getAttribute('data-id'), 10);
          if (window.gerenciadorPlayer) {
            const idx = (window.gerenciadorPlayer.musicas||[]).findIndex(x => x.id === id);
            if (idx >= 0) window.gerenciadorPlayer.carregarMusica(idx);
          }
        });
      });
    } catch (e) {
      console.error('Erro ao carregar destaques', e);
    }
  }

  async function renderSearch() {
    const el = appEl();
    el.innerHTML = `
      <h2>Buscar</h2>
      <div class="busca-global">
        <input id="search-input" class="input-busca" placeholder="Buscar músicas, artistas..." />
        <div id="search-results" style="margin-top:1rem;"></div>
      </div>
    `;

    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    let mus = [];
    try {
      const res = await fetch('./assets/musicas.json');
      const data = await res.json();
      mus = data.musicas || [];
    } catch (e) { mus = []; }

    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const found = mus.filter(m => m.titulo.toLowerCase().includes(q) || m.artista.toLowerCase().includes(q));
      results.innerHTML = found.map(f => `<div class="carta-musica" data-id="${f.id}"><img src="./assets/${f.thumb}" alt="${f.titulo}" /><h3>${f.titulo}</h3><p>${f.artista}</p></div>`).join('') || '<p>Nenhum resultado</p>';

      results.querySelectorAll('.carta-musica').forEach(node => {
        node.addEventListener('click', () => {
          const id = parseInt(node.getAttribute('data-id'), 10);
          if (window.gerenciadorPlayer) {
            const idx = (window.gerenciadorPlayer.musicas||[]).findIndex(x => x.id === id);
            if (idx >= 0) window.gerenciadorPlayer.carregarMusica(idx);
          }
        });
      });
    });
  }

  async function renderLibrary() {
    const el = appEl();
    el.innerHTML = `
      <div class="biblioteca-container">
        <div class="biblioteca-header">
          <h2>Biblioteca de Músicas</h2>
          <div class="biblioteca-controles">
            <input type="text" id="search-biblioteca" class="input-busca" placeholder="Buscar músicas...">
            <div class="btn-group" role="group">
              <button type="button" class="btn-ordenacao" data-ordem="alfabetico" title="Alfabético">A-Z</button>
              <button type="button" class="btn-ordenacao" data-ordem="tocadas" title="Mais tocadas">🔥</button>
              <button type="button" class="btn-ordenacao" data-ordem="recentes" title="Mais recentes">⏱️</button>
            </div>
          </div>
        </div>
        <div class="biblioteca-conteudo">
          <div id="grid-biblioteca" class="grade-musicas">Carregando biblioteca...</div>
        </div>
      </div>
    `;

    // Carrega a biblioteca
    const qtd = await window.musicLibrary.carregar();
    if (qtd === 0) {
      const grid = document.getElementById('grid-biblioteca');
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Erro ao carregar biblioteca</p>';
      return;
    }

    // Renderiza grid inicial
    const grid = document.getElementById('grid-biblioteca');
    window.musicLibrary.renderGrid(grid, null, (musica) => {
      if (window.audioPlayer) {
        window.audioPlayer.carregarMusica(musica);
        window.audioPlayer.play();
      }
    });

    // Event listeners
    const searchInput = document.getElementById('search-biblioteca');
    searchInput.addEventListener('input', (e) => {
      window.musicLibrary.buscar(e.target.value);
      window.musicLibrary.renderGrid(grid, null, (musica) => {
        if (window.audioPlayer) {
          window.audioPlayer.carregarMusica(musica);
          window.audioPlayer.play();
        }
      });
    });

    // Botões de ordenação
    document.querySelectorAll('.btn-ordenacao').forEach(btn => {
      btn.classList.remove('ativo');
      if (btn.getAttribute('data-ordem') === 'alfabetico') btn.classList.add('ativo');

      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-ordenacao').forEach(b => b.classList.remove('ativo'));
        e.target.classList.add('ativo');
        window.musicLibrary.ordenar(e.target.getAttribute('data-ordem'));
        window.musicLibrary.renderGrid(grid, null, (musica) => {
          if (window.audioPlayer) {
            window.audioPlayer.carregarMusica(musica);
            window.audioPlayer.play();
          }
        });
      });
    });

    // Listener para mudanças globais na biblioteca
    window.addEventListener('bibliotecaMudou', () => {
      window.musicLibrary.renderGrid(grid, null, (musica) => {
        if (window.audioPlayer) {
          window.audioPlayer.carregarMusica(musica);
          window.audioPlayer.play();
        }
      });
    });
  }

  async function renderPlaylist(params) {
    const id = params.id;
    const el = appEl();
    el.innerHTML = `<h2>Playlist &ndash; ${id}</h2><div id="playlist-list">Carregando...</div>`;
    try {
      const res = await fetch('./assets/musicas.json');
      const data = await res.json();
      const mus = data.musicas || [];
      const list = document.getElementById('playlist-list');
      list.innerHTML = mus.map(m => `<div class="carta-musica"><img src="./assets/${m.thumb}" alt="${m.titulo}"><h3>${m.titulo}</h3><p>${m.artista}</p></div>`).join('');
    } catch (e) { console.error(e); }
  }

  async function renderArtist(params) {
    const id = params.id;
    const el = appEl();
    el.innerHTML = `<h2>Artista &ndash; ${id}</h2><p>Página do artista.</p>`;
  }

  async function renderStatistics() {
    const el = appEl();
    el.innerHTML = `<h2>Estatísticas</h2><div id="stats">Carregando...</div>`;
    try {
      const res = await fetch('./assets/musicas.json');
      const data = await res.json();
      const statsEl = document.getElementById('stats');
      statsEl.innerHTML = `<pre>${JSON.stringify(data.userStatistics || {}, null, 2)}</pre>`;
    } catch (e) { console.error(e); }
  }

  // Roteamento simples por hash
  const routes = [
    { pattern: /^\/#?\/?$/, render: renderHome },
    { pattern: /^#\/?search(?:\/)?$/, render: renderSearch },
    { pattern: /^#\/?library(?:\/)?$/, render: renderLibrary },
    { pattern: /^#\/?playlist\/(\d+)$/, render: (m) => renderPlaylist({ id: m[1] }) },
    { pattern: /^#\/?artist\/(\d+)$/, render: (m) => renderArtist({ id: m[1] }) },
    { pattern: /^#\/?statistics(?:\/)?$/, render: renderStatistics }
  ];

  async function router() {
    showLoading();
    const hash = location.hash || '#/';
    // tenta casar com as rotas
    for (const r of routes) {
      const m = hash.match(r.pattern);
      if (m) {
        try {
          await r.render(m);
        } catch (e) {
          console.error('Erro ao renderizar rota', e);
          const el = appEl(); if (el) el.innerHTML = '<p>Erro ao carregar a página.</p>';
        }
        hideLoading();
        return;
      }
    }

    // rota não encontrada
    const el = appEl(); if (el) el.innerHTML = `<h2>404</h2><p>Página não encontrada: ${hash}</p>`;
    hideLoading();
  }

  // função global de navegação
  function navigate(path) {
    if (!path.startsWith('#')) path = '#/' + path.replace(/^\/+/, '');
    location.hash = path;
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', () => {
    // primeira navegação
    setTimeout(router, 10);
  });

  window.navigate = navigate;
  window.showRoutingLoading = showLoading;
  window.hideRoutingLoading = hideLoading;
})();
