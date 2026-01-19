/**
 * HistoricoUI - Gerencia visualização do histórico na sidebar
 */
class HistoricoUI {
  constructor() {
    this.listaHistorico = document.getElementById('lista-historico');
    this.botaoExpandir = document.querySelector('.botao-expandir-historico');
    this.inicializar();
  }

  inicializar() {
    if (!this.botaoExpandir || !this.listaHistorico) return;

    // Evento do botão expandir/recolher
    this.botaoExpandir.addEventListener('click', () => {
      this.listaHistorico.classList.toggle('expandida');
      const chevron = this.botaoExpandir.querySelector('.fas');
      chevron.classList.toggle('fa-chevron-down');
      chevron.classList.toggle('fa-chevron-up');
    });

    // Listener para atualizar histórico quando mudar
    window.addEventListener('queue:historyUpdated', () => {
      this.renderizarHistorico();
    });

    // Renderiza histórico inicial
    this.renderizarHistorico();
  }

  /**
   * Renderiza lista de histórico
   */
  renderizarHistorico() {
    const historico = window.queueManager.getHistory();

    if (historico.length === 0) {
      this.listaHistorico.innerHTML = '<li class="historico-vazio">Nenhuma música tocada</li>';
      return;
    }

    this.listaHistorico.innerHTML = historico.slice(0, 5).map((musica, idx) => `
      <li class="item-historico-sidebar" data-id="${musica.id}" title="${musica.titulo} - ${musica.artista}">
        <img src="./assets/${musica.thumb}" alt="${musica.titulo}" class="thumb-historico">
        <div class="info-historico">
          <span class="titulo-historico">${musica.titulo}</span>
          <span class="artista-historico">${musica.artista}</span>
        </div>
        <button class="btn-tocar-novamente" data-id="${musica.id}" title="Tocar novamente">
          <i class="fas fa-play"></i>
        </button>
      </li>
    `).join('') + (historico.length > 5 ? '<li class="historico-mais"><a href="#" data-acao="ver-tudo">Ver histórico completo →</a></li>' : '');

    // Event listeners
    this.listaHistorico.querySelectorAll('.btn-tocar-novamente').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const musicaId = parseInt(btn.getAttribute('data-id'));
        const musica = window.musicLibrary.obterMusica(musicaId);
        if (musica && window.audioPlayer) {
          window.audioPlayer.carregarMusica(musica);
          window.audioPlayer.play();
        }
      });
    });

    this.listaHistorico.querySelector('[data-acao="ver-tudo"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.queueUI.abrirModalFila();
      // Vai direto para a aba de histórico
      setTimeout(() => {
        const abas = document.querySelectorAll('.aba-btn');
        abas[2]?.click(); // Terceira aba é o histórico
      }, 100);
    });

    this.listaHistorico.querySelectorAll('.item-historico-sidebar').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-tocar-novamente')) return;
        const musicaId = parseInt(item.getAttribute('data-id'));
        const musica = window.musicLibrary.obterMusica(musicaId);
        if (musica && window.audioPlayer) {
          window.audioPlayer.carregarMusica(musica);
          window.audioPlayer.play();
        }
      });
    });
  }
}

// Instância global
window.historicoUI = new HistoricoUI();
