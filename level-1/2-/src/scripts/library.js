/**
 * MusicLibrary - Sistema completo de gerenciamento de biblioteca de músicas
 * Fornece: filtros, busca, ordenação e renderização de cards responsivos
 */
class MusicLibrary {
  constructor() {
    this.musicas = [];
    this.musicasFiltradas = [];
    this.generos = [];
    this.artistas = [];
    this.albuns = [];
    this.filtrosAtivos = {
      genero: null,
      artista: null,
      album: null,
      busca: ''
    };
    this.ordenacaoAtiva = 'alfabetico'; // 'alfabetico' | 'tocadas' | 'recentes'
  }

  /**
   * Carrega as músicas do JSON
   */
  async carregar() {
    try {
      const res = await fetch('./assets/musicas.json');
      const data = await res.json();
      this.musicas = data.musicas || [];
      this.extrairMetadados();
      this.musicasFiltradas = [...this.musicas];
      return this.musicas.length;
    } catch (erro) {
      console.error('Erro ao carregar biblioteca:', erro);
      return 0;
    }
  }

  /**
   * Extrai lista única de gêneros, artistas e álbuns
   */
  extrairMetadados() {
    const generos = new Set();
    const artistas = new Set();
    const albuns = new Set();

    this.musicas.forEach(m => {
      if (m.genero) generos.add(m.genero);
      if (m.artista) artistas.add(m.artista);
      if (m.album) albuns.add(m.album);
    });

    this.generos = Array.from(generos).sort();
    this.artistas = Array.from(artistas).sort();
    this.albuns = Array.from(albuns).sort();
  }

  /**
   * Busca por título ou artista
   */
  buscar(texto) {
    this.filtrosAtivos.busca = texto.toLowerCase();
    this.aplicarFiltros();
    return this.musicasFiltradas;
  }

  /**
   * Filtra por gênero
   */
  filtrarPorGenero(genero) {
    this.filtrosAtivos.genero = genero || null;
    this.aplicarFiltros();
    return this.musicasFiltradas;
  }

  /**
   * Filtra por artista
   */
  filtrarPorArtista(artista) {
    this.filtrosAtivos.artista = artista || null;
    this.aplicarFiltros();
    return this.musicasFiltradas;
  }

  /**
   * Filtra por álbum
   */
  filtrarPorAlbum(album) {
    this.filtrosAtivos.album = album || null;
    this.aplicarFiltros();
    return this.musicasFiltradas;
  }

  /**
   * Aplica todos os filtros ativos
   */
  aplicarFiltros() {
    this.musicasFiltradas = this.musicas.filter(m => {
      // Filtro de busca
      if (this.filtrosAtivos.busca) {
        const busca = this.filtrosAtivos.busca;
        const match = m.titulo.toLowerCase().includes(busca) ||
                     m.artista.toLowerCase().includes(busca);
        if (!match) return false;
      }

      // Filtro de gênero
      if (this.filtrosAtivos.genero && m.genero !== this.filtrosAtivos.genero) {
        return false;
      }

      // Filtro de artista
      if (this.filtrosAtivos.artista && m.artista !== this.filtrosAtivos.artista) {
        return false;
      }

      // Filtro de álbum
      if (this.filtrosAtivos.album && m.album !== this.filtrosAtivos.album) {
        return false;
      }

      return true;
    });

    // Aplica ordenação
    this.aplicarOrdenacao();
    return this.musicasFiltradas;
  }

  /**
   * Ordena as músicas filtradas
   */
  ordenar(tipo) {
    this.ordenacaoAtiva = tipo;
    this.aplicarOrdenacao();
    return this.musicasFiltradas;
  }

  /**
   * Aplica a ordenação ativa
   */
  aplicarOrdenacao() {
    switch (this.ordenacaoAtiva) {
      case 'tocadas':
        this.musicasFiltradas.sort((a, b) => (b.tocadas || 0) - (a.tocadas || 0));
        break;
      case 'recentes':
        this.musicasFiltradas.sort((a, b) => {
          const dataA = new Date(a.dataAdicao || 0);
          const dataB = new Date(b.dataAdicao || 0);
          return dataB - dataA;
        });
        break;
      case 'alfabetico':
      default:
        this.musicasFiltradas.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
    }
  }

  /**
   * Limpa todos os filtros
   */
  limparFiltros() {
    this.filtrosAtivos = {
      genero: null,
      artista: null,
      album: null,
      busca: ''
    };
    this.ordenacaoAtiva = 'alfabetico';
    this.musicasFiltradas = [...this.musicas];
    this.aplicarOrdenacao();
    return this.musicasFiltradas;
  }

  /**
   * Obtém música por ID
   */
  obterMusica(id) {
    return this.musicas.find(m => m.id === id);
  }

  /**
   * Converte duração em segundos para MM:SS
   */
  static formatarDuracao(segundos) {
    const minutos = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${minutos}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Renderiza grid de cards responsivo
   * @param {HTMLElement} container - Elemento container
   * @param {Array} musicas - Array de músicas (default: musicasFiltradas)
   * @param {Function} onCardClick - Callback ao clicar card
   */
  renderGrid(container, musicas = null, onCardClick = null) {
    const musicasRender = musicas || this.musicasFiltradas;

    if (musicasRender.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Nenhuma música encontrada</p>';
      return;
    }

    container.className = 'grade-musicas';
    container.innerHTML = musicasRender.map(m => this.criarCard(m, onCardClick)).join('');

    // Adiciona event listeners aos cards
    document.querySelectorAll('.carta-musica').forEach((card, idx) => {
      const musica = musicasRender[idx];

      // Clique no card
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-menu]')) return; // Ignora clique no menu
        if (onCardClick) onCardClick(musica);
        // Dispatch custom event para integração com AudioPlayer
        window.dispatchEvent(new CustomEvent('musicSelected', { detail: musica }));
      });

      // Menu de contexto
      const btnMenu = card.querySelector('[data-menu]');
      if (btnMenu) {
        btnMenu.addEventListener('click', (e) => {
          e.stopPropagation();
          this.mostrarMenuContexto(card, musica);
        });
      }

      // Favorito
      const btnFavorito = card.querySelector('[data-favorito]');
      if (btnFavorito) {
        btnFavorito.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleFavorito(musica, btnFavorito);
        });
      }
    });
  }

  /**
   * Cria HTML do card de música
   */
  criarCard(musica, onCardClick = null) {
    const duracao = MusicLibrary.formatarDuracao(musica.duracao);
    const thumb = `./assets/${musica.thumb}`;

    return `
      <div class="carta-musica" data-id="${musica.id}">
        <div class="carta-imagem">
          <img src="${thumb}" alt="${musica.titulo}" loading="lazy">
          <div class="carta-overlay">
            <button class="btn-play" title="Tocar">
              <i class="fas fa-play"></i>
            </button>
          </div>
        </div>
        <div class="carta-info">
          <h3 class="carta-titulo">${musica.titulo}</h3>
          <p class="carta-artista">${musica.artista}</p>
          <p class="carta-meta">${musica.album} • ${musica.genero}</p>
        </div>
        <div class="carta-footer">
          <span class="duracao">${duracao}</span>
          <div class="carta-acoes">
            <button class="btn-icon" data-favorito title="Favoritar">
              <i class="far fa-heart"></i>
            </button>
            <button class="btn-icon" data-menu title="Opções">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Toggle favorito
   */
  toggleFavorito(musica, btnElement) {
    const favoritados = JSON.parse(localStorage.getItem('musicas-favoritadas') || '[]');
    const idx = favoritados.indexOf(musica.id);

    if (idx === -1) {
      favoritados.push(musica.id);
      btnElement.innerHTML = '<i class="fas fa-heart"></i>';
      btnElement.classList.add('favorito');
    } else {
      favoritados.splice(idx, 1);
      btnElement.innerHTML = '<i class="far fa-heart"></i>';
      btnElement.classList.remove('favorito');
    }

    localStorage.setItem('musicas-favoritadas', JSON.stringify(favoritados));
    window.dispatchEvent(new CustomEvent('favoritoToggled', { detail: musica }));
  }

  /**
   * Mostra menu de contexto
   */
  mostrarMenuContexto(card, musica) {
    // Remove menu anterior
    const menuAnterior = document.querySelector('.menu-contexto');
    if (menuAnterior) menuAnterior.remove();

    const menu = document.createElement('div');
    menu.className = 'menu-contexto';
    menu.innerHTML = `
      <button data-action="play">
        <i class="fas fa-play"></i> Tocar agora
      </button>
      <button data-action="add-queue">
        <i class="fas fa-plus"></i> Adicionar à fila
      </button>
      <button data-action="add-playlist">
        <i class="fas fa-folder-plus"></i> Adicionar a playlist
      </button>
      <hr>
      <button data-action="artista">
        <i class="fas fa-user"></i> Ver artista
      </button>
      <button data-action="album">
        <i class="fas fa-compact-disc"></i> Ver álbum
      </button>
      <button data-action="genero">
        <i class="fas fa-tag"></i> Ver gênero
      </button>
      <hr>
      <button data-action="info">
        <i class="fas fa-info-circle"></i> Informações
      </button>
    `;

    card.appendChild(menu);

    // Event listeners do menu
    menu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        this.executarAcaoMenu(action, musica, menu);
      });
    });

    // Fecha menu ao clicar fora
    document.addEventListener('click', () => menu.remove(), { once: true });
  }

  /**
   * Executa ações do menu de contexto
   */
  executarAcaoMenu(action, musica, menu) {
    menu.remove();

    switch (action) {
      case 'play':
        window.dispatchEvent(new CustomEvent('playMusic', { detail: musica }));
        break;
      case 'add-queue':
        window.dispatchEvent(new CustomEvent('addToQueue', { detail: musica }));
        break;
      case 'artista':
        window.location.hash = `#/artist/${musica.artista.replace(/\s+/g, '-')}`;
        break;
      case 'album':
        window.location.hash = `#/album/${musica.album.replace(/\s+/g, '-')}`;
        break;
      case 'genero':
        this.filtrarPorGenero(musica.genero);
        window.dispatchEvent(new CustomEvent('filtroMudou', { detail: { tipo: 'genero', valor: musica.genero } }));
        break;
      case 'info':
        this.mostrarInfoMusica(musica);
        break;
    }
  }

  /**
   * Mostra modal com informações da música
   */
  mostrarInfoMusica(musica) {
    const duracao = MusicLibrary.formatarDuracao(musica.duracao);
    const dataAdicao = new Date(musica.dataAdicao).toLocaleDateString('pt-BR');

    const modal = document.createElement('div');
    modal.className = 'modal-info-musica';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="btn-fechar">&times;</button>
        <img src="./assets/${musica.thumb}" alt="${musica.titulo}">
        <h2>${musica.titulo}</h2>
        <p class="artista">${musica.artista}</p>
        <div class="detalhes">
          <div class="detalhe">
            <span class="label">Álbum</span>
            <span class="valor">${musica.album}</span>
          </div>
          <div class="detalhe">
            <span class="label">Gênero</span>
            <span class="valor">${musica.genero}</span>
          </div>
          <div class="detalhe">
            <span class="label">Duração</span>
            <span class="valor">${duracao}</span>
          </div>
          <div class="detalhe">
            <span class="label">Adicionado em</span>
            <span class="valor">${dataAdicao}</span>
          </div>
          <div class="detalhe">
            <span class="label">Vezes tocadas</span>
            <span class="valor">${musica.tocadas}</span>
          </div>
        </div>
        <button class="btn-primary" data-action="play-now">Tocar agora</button>
      </div>
      <div class="modal-overlay"></div>
    `;

    document.body.appendChild(modal);

    // Eventos
    modal.querySelector('.btn-fechar').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
    modal.querySelector('[data-action="play-now"]').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('playMusic', { detail: musica }));
      modal.remove();
    });
  }

  /**
   * Renderiza filtros na sidebar
   */
  renderFiltros(container) {
    container.innerHTML = `
      <div class="filtros-biblioteca">
        <div class="filtro-grupo">
          <h4>Gêneros</h4>
          <div class="filtro-lista">
            ${this.generos.map(g => `
              <label>
                <input type="radio" name="genero" value="${g}" ${this.filtrosAtivos.genero === g ? 'checked' : ''}>
                <span>${g}</span>
              </label>
            `).join('')}
            ${this.filtrosAtivos.genero ? '<button class="btn-limpar" data-filtro="genero">Limpar</button>' : ''}
          </div>
        </div>

        <div class="filtro-grupo">
          <h4>Artistas</h4>
          <div class="filtro-lista">
            ${this.artistas.slice(0, 8).map(a => `
              <label>
                <input type="radio" name="artista" value="${a}" ${this.filtrosAtivos.artista === a ? 'checked' : ''}>
                <span>${a}</span>
              </label>
            `).join('')}
            ${this.filtrosAtivos.artista ? '<button class="btn-limpar" data-filtro="artista">Limpar</button>' : ''}
          </div>
        </div>

        <div class="filtro-grupo">
          <h4>Álbuns</h4>
          <div class="filtro-lista">
            ${this.albuns.slice(0, 6).map(a => `
              <label>
                <input type="radio" name="album" value="${a}" ${this.filtrosAtivos.album === a ? 'checked' : ''}>
                <span>${a}</span>
              </label>
            `).join('')}
            ${this.filtrosAtivos.album ? '<button class="btn-limpar" data-filtro="album">Limpar</button>' : ''}
          </div>
        </div>

        ${(this.filtrosAtivos.genero || this.filtrosAtivos.artista || this.filtrosAtivos.album) ? 
          '<button class="btn-limpar-tudo">Limpar todos os filtros</button>' : ''}
      </div>
    `;

    // Event listeners
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const tipo = e.target.name;
        const valor = e.target.checked ? e.target.value : null;
        this[`filtrarPor${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`](valor);
        window.dispatchEvent(new CustomEvent('bibliotecaMudou'));
      });
    });

    container.querySelectorAll('.btn-limpar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tipo = btn.getAttribute('data-filtro');
        this[`filtrarPor${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`](null);
        window.dispatchEvent(new CustomEvent('bibliotecaMudou'));
      });
    });

    const btnLimparTudo = container.querySelector('.btn-limpar-tudo');
    if (btnLimparTudo) {
      btnLimparTudo.addEventListener('click', () => {
        this.limparFiltros();
        window.dispatchEvent(new CustomEvent('bibliotecaMudou'));
      });
    }
  }
}

// Instância global
window.musicLibrary = new MusicLibrary();
