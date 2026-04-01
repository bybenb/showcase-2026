/**
 * QueueUI - Interface visual da fila de reprodução
 * Modal com drag & drop, histórico e controles
 */
class QueueUI {
  constructor() {
    this.modal = null;
    this.isDragging = false;
    this.draggedItem = null;
    this.draggedIndex = null;
  }

  /**
   * Abre o modal da fila
   */
  abrirModalFila() {
    if (this.modal) {
      this.modal.remove();
    }

    const queueInfo = window.queueManager.getQueueInfo();
    
    this.modal = document.createElement('div');
    this.modal.className = 'modal-fila';
    this.modal.innerHTML = `
      <div class="modal-fila-overlay"></div>
      <div class="modal-fila-content">
        <div class="modal-fila-header">
          <h2>Fila de Reprodução</h2>
          <button class="btn-fechar-modal">&times;</button>
        </div>

        <div class="modal-fila-body">
          <!-- Abas -->
          <div class="fila-abas">
            <button class="aba-btn ativo" data-aba="agora">
              <i class="fas fa-play-circle"></i> Tocando Agora
            </button>
            <button class="aba-btn" data-aba="proximas">
              <i class="fas fa-list"></i> Próximas (${queueInfo.proximas.length})
            </button>
            <button class="aba-btn" data-aba="historico">
              <i class="fas fa-history"></i> Histórico
            </button>
          </div>

          <!-- Conteúdo das abas -->
          <div class="fila-conteudo">
            <!-- TAB: Tocando Agora -->
            <div class="aba-content ativo" data-aba-content="agora">
              <div class="fila-musica-atual">
                ${queueInfo.musicaAtual ? `
                  <div class="musica-card-grande">
                    <img src="./assets/${queueInfo.musicaAtual.thumb}" alt="${queueInfo.musicaAtual.titulo}">
                    <div class="musica-info-grande">
                      <h3>${queueInfo.musicaAtual.titulo}</h3>
                      <p class="artista">${queueInfo.musicaAtual.artista}</p>
                      <p class="album">${queueInfo.musicaAtual.album}</p>
                      <p class="duracao">
                        <i class="fas fa-clock"></i>
                        ${QueueManager.formatarDuracao(queueInfo.musicaAtual.duracao)}
                      </p>
                    </div>
                  </div>
                ` : '<p style="text-align: center; color: var(--cor-texto-secundario);">Nenhuma música em reprodução</p>'}
              </div>

              <!-- Controles da fila -->
              <div class="fila-controles">
                <div class="controle-item">
                  <span>Modo:</span>
                  <button id="btn-modo-fila" class="btn-modo" title="Alterar modo (Normal → Loop All → Loop One)">
                    ${this.getModoIcon(queueInfo.loopMode)} ${this.getModoNome(queueInfo.loopMode)}
                  </button>
                </div>
                <div class="controle-item">
                  <span>Shuffle:</span>
                  <button id="btn-shuffle-fila" class="btn-modo ${queueInfo.shuffleMode ? 'ativo' : ''}" title="Ativar/desativar shuffle">
                    <i class="fas fa-random"></i> ${queueInfo.shuffleMode ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                <div class="controle-item">
                  <span>Tempo total:</span>
                  <span class="tempo-total-fila">
                    ${QueueManager.formatarDuracao(queueInfo.tempoTotal)}
                  </span>
                </div>
              </div>
            </div>

            <!-- TAB: Próximas -->
            <div class="aba-content" data-aba-content="proximas">
              <div class="proximas-lista" id="proximas-lista">
                ${queueInfo.proximas.length > 0 ? `
                  <div class="lista-aviso">Arraste para reordenar</div>
                  ${queueInfo.proximas.map((musica, idx) => this.criarItemFila(musica, queueInfo.indiceAtual + 1 + idx)).join('')}
                ` : '<p style="text-align: center; color: var(--cor-texto-secundario); padding: 1rem;">Fila vazia</p>'}
              </div>
              ${queueInfo.proximas.length > 0 ? `
                <button class="btn-limpar-fila">
                  <i class="fas fa-trash"></i> Limpar Fila
                </button>
              ` : ''}
            </div>

            <!-- TAB: Histórico -->
            <div class="aba-content" data-aba-content="historico">
              <div class="historico-lista" id="historico-lista">
                ${this.renderizarHistorico()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.configurarEventos();
  }

  /**
   * Cria item da fila
   */
  criarItemFila(musica, index) {
    return `
      <div class="item-fila" draggable="true" data-index="${index}">
        <div class="item-fila-grip">
          <i class="fas fa-bars"></i>
        </div>
        <div class="item-fila-numero">${index + 1}</div>
        <div class="item-fila-capa">
          <img src="./assets/${musica.thumb}" alt="${musica.titulo}">
        </div>
        <div class="item-fila-info">
          <h4>${musica.titulo}</h4>
          <p>${musica.artista}</p>
        </div>
        <div class="item-fila-duracao">
          ${QueueManager.formatarDuracao(musica.duracao)}
        </div>
        <button class="btn-remover" data-index="${index}" title="Remover da fila">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }

  /**
   * Renderiza histórico
   */
  renderizarHistorico() {
    const historico = window.queueManager.getHistory();
    
    if (historico.length === 0) {
      return '<p style="text-align: center; color: var(--cor-texto-secundario); padding: 1rem;">Histórico vazio</p>';
    }

    return `
      ${historico.map((musica, idx) => `
        <div class="item-historico">
          <div class="item-historico-numero">${idx + 1}</div>
          <div class="item-historico-capa">
            <img src="./assets/${musica.thumb}" alt="${musica.titulo}">
          </div>
          <div class="item-historico-info">
            <h4>${musica.titulo}</h4>
            <p>${musica.artista}</p>
            <small>${this.formatarHora(musica.tocadaEm)}</small>
          </div>
          <div class="item-historico-duracao">
            ${QueueManager.formatarDuracao(musica.duracao)}
          </div>
          <button class="btn-readicionar" data-id="${musica.id}" title="Tocar novamente">
            <i class="fas fa-redo"></i>
          </button>
        </div>
      `).join('')}
      ${historico.length > 0 ? `
        <button class="btn-limpar-historico">
          <i class="fas fa-trash"></i> Limpar Histórico
        </button>
      ` : ''}
    `;
  }

  /**
   * Formata hora para exibição
   */
  formatarHora(isoString) {
    const data = new Date(isoString);
    const agora = new Date();
    const diff = agora - data;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}m atrás`;
    if (horas < 24) return `${horas}h atrás`;
    return `${dias}d atrás`;
  }

  /**
   * Obtém nome do modo
   */
  getModoNome(loopMode) {
    const nomes = ['Normal', 'Loop All', 'Loop One'];
    return nomes[loopMode] || 'Normal';
  }

  /**
   * Obtém ícone do modo
   */
  getModoIcon(loopMode) {
    switch (loopMode) {
      case 1: return '<i class="fas fa-redo"></i>';
      case 2: return '<i class="fas fa-redo"></i> <sup>1</sup>';
      default: return '<i class="fas fa-play"></i>';
    }
  }

  /**
   * Configura event listeners
   */
  configurarEventos() {
    // Fechar modal
    const btnFechar = this.modal.querySelector('.btn-fechar-modal');
    const overlay = this.modal.querySelector('.modal-fila-overlay');
    
    btnFechar.addEventListener('click', () => this.fecharModal());
    overlay.addEventListener('click', () => this.fecharModal());

    // Abas
    this.modal.querySelectorAll('.aba-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const abaAlvo = e.currentTarget.getAttribute('data-aba');
        this.mudarAba(abaAlvo);
      });
    });

    // Controles de modo e shuffle
    const btnModo = this.modal.getElementById ? this.modal.getElementById('btn-modo-fila') : 
                    this.modal.querySelector('#btn-modo-fila');
    if (btnModo) {
      btnModo.addEventListener('click', () => {
        window.queueManager.toggleLoopMode();
        this.abrirModalFila(); // Recarrega modal
      });
    }

    const btnShuffle = this.modal.querySelector('#btn-shuffle-fila');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        window.queueManager.toggleShuffle();
        this.abrirModalFila(); // Recarrega modal
      });
    }

    // Drag & drop
    this.configurarDragDrop();

    // Botões de ação
    this.modal.querySelectorAll('.btn-remover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.getAttribute('data-index'));
        window.queueManager.removeFromQueue(index);
        this.abrirModalFila(); // Recarrega
      });
    });

    this.modal.querySelector('.btn-limpar-fila')?.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja limpar a fila?')) {
        window.queueManager.clearQueue();
        this.abrirModalFila();
      }
    });

    this.modal.querySelectorAll('.btn-readicionar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const musicaId = parseInt(btn.getAttribute('data-id'));
        const musica = window.musicLibrary.obterMusica(musicaId);
        if (musica && window.audioPlayer) {
          window.audioPlayer.carregarMusica(musica);
          window.audioPlayer.play();
        }
      });
    });

    this.modal.querySelector('.btn-limpar-historico')?.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja limpar o histórico?')) {
        window.queueManager.clearHistory();
        this.abrirModalFila();
      }
    });
  }

  /**
   * Configura drag & drop
   */
  configurarDragDrop() {
    const proximasLista = this.modal.querySelector('#proximas-lista');
    if (!proximasLista) return;

    proximasLista.querySelectorAll('.item-fila').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.draggedItem = item;
        this.draggedIndex = parseInt(item.getAttribute('data-index'));
        item.style.opacity = '0.5';
      });

      item.addEventListener('dragend', (e) => {
        item.style.opacity = '1';
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.style.borderTop = '3px solid var(--cor-primaria)';
      });

      item.addEventListener('dragleave', (e) => {
        item.style.borderTop = 'none';
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.style.borderTop = 'none';

        if (this.draggedItem === item) return;

        const targetIndex = parseInt(item.getAttribute('data-index'));
        window.queueManager.reorderQueue(this.draggedIndex, targetIndex);
        this.abrirModalFila();
      });
    });
  }

  /**
   * Muda de aba
   */
  mudarAba(nomeAba) {
    // Remove ativo das abas
    this.modal.querySelectorAll('.aba-btn').forEach(btn => btn.classList.remove('ativo'));
    this.modal.querySelectorAll('.aba-content').forEach(content => content.classList.remove('ativo'));

    // Adiciona ativo para a selecionada
    this.modal.querySelector(`[data-aba="${nomeAba}"]`).classList.add('ativo');
    this.modal.querySelector(`[data-aba-content="${nomeAba}"]`).classList.add('ativo');
  }

  /**
   * Fecha o modal
   */
  fecharModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}

// Instância global
window.queueUI = new QueueUI();
