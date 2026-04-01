/**
 * Classe AudioPlayer - Gerenciador completo de áudio com estado, fila e eventos customizados
 */
class AudioPlayer {
  constructor() {
    // Estado principal
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = this.restaurarEstado('volume', 70);
    this.currentTime = 0;
    this.duration = 0;
    
    // Fila de reprodução
    this.queue = [];
    this.queueIndex = 0;
    this.loopMode = this.restaurarEstado('loopMode', 0); // 0: sem loop, 1: loop tudo, 2: loop um
    this.shuffleMode = this.restaurarEstado('shuffleMode', false);
    
    // Estado de favoritos
    this.favoritados = JSON.parse(localStorage.getItem('musicas-favoritadas')) || [];
    
    // Elemento de áudio
    this.audioElement = new Audio();
    
    // Elementos do DOM
    this.playerThumb = document.getElementById('player-thumb');
    this.playerTitulo = document.getElementById('player-titulo');
    this.playerArtista = document.getElementById('player-artista');
    this.btnPlay = document.getElementById('btn-play-principal');
    this.btnAnterior = document.getElementById('btn-anterior');
    this.btnProximo = document.getElementById('btn-proximo');
    this.sliderProgresso = document.getElementById('slider-progresso');
    this.tempoAtual = document.getElementById('tempo-atual');
    this.tempoTotal = document.getElementById('tempo-total');
    this.sliderVolume = document.getElementById('slider-volume');
    this.btnVolume = document.getElementById('btn-volume');
    this.btnLoop = document.getElementById('btn-loop');
    this.btnShuffle = document.getElementById('btn-shuffle');
    this.btnFila = document.getElementById('btn-fila');
    this.btnFavorito = document.getElementById('btn-favorito');
    this.btnTelaCheia = document.getElementById('btn-tela-cheia');
    this.playerElement = document.querySelector('.player');
    
    this.atualizandoProgresso = false;
    this.todasAsMusicas = [];
    
    this.inicializar();
  }

  /**
   * Restaura valor do localStorage ou retorna default
   */
  restaurarEstado(chave, defaultVal) {
    const stored = localStorage.getItem(`player-${chave}`);
    if (stored !== null) {
      if (defaultVal === true || defaultVal === false) {
        return stored === 'true';
      } else if (typeof defaultVal === 'number') {
        return parseInt(stored, 10);
      }
      return stored;
    }
    return defaultVal;
  }

  /**
   * Salva estado no localStorage
   */
  salvarEstado(chave, valor) {
    localStorage.setItem(`player-${chave}`, String(valor));
  }

  /**
   * Inicializa o player
   */
  async inicializar() {
    await this.carregarMusicas();
    this.configurarEventosAudio();
    this.configurarEventosUI();
    this.configurarControlessTeclado();
    this.atualizarVolume();
    
    // Dispara evento de inicialização
    this.dispatchEvent('playerReady', {});
  }

  /**
   * Carrega todas as músicas do JSON
   */
  async carregarMusicas() {
    try {
      const response = await fetch('./assets/musicas.json');
      if (!response.ok) throw new Error(`Erro: ${response.status}`);
      const dados = await response.json();
      this.todasAsMusicas = dados.musicas || [];
      this.queue = [...this.todasAsMusicas];
      console.log(`Carregadas ${this.todasAsMusicas.length} músicas`);
    } catch (erro) {
      console.error('Erro ao carregar músicas:', erro);
      this.todasAsMusicas = [];
      this.queue = [];
    }
  }

  /**
   * Configura eventos de áudio (play, pause, timeupdate, etc)
   */
  configurarEventosAudio() {
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.playerElement?.classList.add('tocando');
      this.atualizarIconePlay();
      this.dispatchEvent('playStateChange', { isPlaying: true });
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.playerElement?.classList.remove('tocando');
      this.atualizarIconePlay();
      this.dispatchEvent('playStateChange', { isPlaying: false });
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.atualizandoProgresso) {
        this.currentTime = this.audioElement.currentTime;
        this.atualizarProgresso();
      }
      this.dispatchEvent('timeUpdate', { currentTime: this.currentTime, duration: this.duration });
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.duration = this.audioElement.duration;
      this.tempoTotal.textContent = this.formatarTempo(this.duration);
      this.sliderProgresso.max = this.duration;
    });

    this.audioElement.addEventListener('ended', () => {
      this.proximaMusica();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.error('Erro ao carregar áudio:', e);
      this.dispatchEvent('error', { error: e });
    });
  }

  /**
   * Configura eventos da UI (botões, sliders)
   */
  configurarEventosUI() {
    this.btnPlay.addEventListener('click', () => this.togglePlayPause());
    this.btnAnterior.addEventListener('click', () => this.previous());
    this.btnProximo.addEventListener('click', () => this.next());
    
    this.sliderProgresso.addEventListener('mousedown', () => (this.atualizandoProgresso = true));
    this.sliderProgresso.addEventListener('mouseup', () => (this.atualizandoProgresso = false));
    this.sliderProgresso.addEventListener('input', (e) => this.seek(parseFloat(e.target.value)));
    
    this.sliderVolume.addEventListener('input', (e) => this.setVolume(parseInt(e.target.value, 10)));
    this.btnVolume.addEventListener('click', () => this.toggleMute());
    
    this.btnLoop.addEventListener('click', () => this.toggleLoopMode());
    this.btnShuffle.addEventListener('click', () => this.toggleShuffleMode());
    this.btnFila.addEventListener('click', () => this.mostrarFila());
    this.btnFavorito.addEventListener('click', () => this.toggleFavorito());
    this.btnTelaCheia.addEventListener('click', () => this.ativarTelaCheia());
  }

  /**
   * Configura controles de teclado
   */
  configurarControlessTeclado() {
    window.addEventListener('keydown', (e) => {
      // Espaço: play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      }
      // Seta para cima: aumenta volume
      else if (e.code === 'ArrowUp') {
        e.preventDefault();
        this.setVolume(Math.min(100, this.volume + 5));
      }
      // Seta para baixo: diminui volume
      else if (e.code === 'ArrowDown') {
        e.preventDefault();
        this.setVolume(Math.max(0, this.volume - 5));
      }
      // Seta para direita: avança 5s
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.seek(Math.min(this.duration, this.currentTime + 5));
      }
      // Seta para esquerda: volta 5s
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.seek(Math.max(0, this.currentTime - 5));
      }
      // M: mute/unmute
      else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        this.toggleMute();
      }
      // N: próxima música
      else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.next();
      }
      // P: música anterior
      else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.previous();
      }
    });
  }

  /**
   * Toca a música
   */
  play() {
    if (this.audioElement.src) {
      this.audioElement.play().catch(e => console.error('Erro ao reproduzir:', e));
    }
  }

  /**
   * Pausa a música
   */
  pause() {
    this.audioElement.pause();
  }

  /**
   * Para a música e reseta para o início
   */
  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.currentTime = 0;
    this.atualizarProgresso();
  }

  /**
   * Alterna entre play e pause
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Próxima música
   */
  next() {
    // Se QueueManager está disponível, usar dele
    if (window.queueManager && window.queueManager.queue.length > 0) {
      const proximaMusica = window.queueManager.getNextTrack();
      if (proximaMusica) {
        this.currentTrack = proximaMusica;
        this.carregarFila(window.queueManager.queueIndex);
        if (this.isPlaying) this.play();
      }
    } else {
      // Fallback para o comportamento antigo se QueueManager não estiver disponível
      if (this.shuffleMode) {
        this.queueIndex = Math.floor(Math.random() * this.queue.length);
      } else {
        this.queueIndex = (this.queueIndex + 1) % this.queue.length;
      }
      this.carregarFila(this.queueIndex);
      if (this.isPlaying) this.play();
    }
  }

  /**
   * Música anterior
   */
  previous() {
    // Se QueueManager está disponível, usar dele
    if (window.queueManager && window.queueManager.queue.length > 0) {
      const musicaAnterior = window.queueManager.getPreviousTrack();
      if (musicaAnterior) {
        this.currentTrack = musicaAnterior;
        this.carregarFila(window.queueManager.queueIndex);
        if (this.isPlaying) this.play();
      }
    } else {
      // Fallback para o comportamento antigo se QueueManager não estiver disponível
      this.queueIndex = this.queueIndex > 0 ? this.queueIndex - 1 : this.queue.length - 1;
      this.carregarFila(this.queueIndex);
      if (this.isPlaying) this.play();
    }
  }

  /**
   * Define volume (0-100)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    this.audioElement.volume = this.volume / 100;
    this.sliderVolume.value = this.volume;
    this.atualizarIconeVolume();
    this.salvarEstado('volume', this.volume);
  }

  /**
   * Atualiza o ícone do volume
   */
  atualizarIconeVolume() {
    const icone = this.btnVolume.querySelector('i');
    if (this.volume === 0) {
      icone.className = 'fas fa-volume-mute';
      this.btnVolume.classList.add('mudo');
    } else if (this.volume < 50) {
      icone.className = 'fas fa-volume-down';
      this.btnVolume.classList.remove('mudo');
    } else {
      icone.className = 'fas fa-volume-up';
      this.btnVolume.classList.remove('mudo');
    }
  }

  /**
   * Alterna mute
   */
  toggleMute() {
    if (this.volume === 0) {
      this.setVolume(70);
    } else {
      this.setVolume(0);
    }
  }

  /**
   * Define o tempo de reprodução
   */
  seek(tempo) {
    this.currentTime = Math.max(0, Math.min(tempo, this.duration));
    this.audioElement.currentTime = this.currentTime;
    this.atualizarProgresso();
  }

  /**
   * Carrega uma música da fila
   */
  carregarFila(indice) {
    if (indice < 0 || indice >= this.queue.length) return;
    this.queueIndex = indice;
    this.currentTrack = this.queue[indice];
    
    this.playerThumb.src = `./assets/${this.currentTrack.thumb}`;
    this.playerTitulo.textContent = this.currentTrack.titulo;
    this.playerArtista.textContent = this.currentTrack.artista;
    
    this.audioElement.src = `./assets/${this.currentTrack.arquivo}`;
    this.audioElement.load();
    
    this.currentTime = 0;
    this.sliderProgresso.value = 0;
    this.tempoAtual.textContent = '0:00';
    
    this.atualizarFavorito();
    this.dispatchEvent('trackChange', { track: this.currentTrack });
    
    // Adiciona ao histórico se QueueManager está disponível
    if (window.queueManager) {
      window.queueManager.addToHistory(this.currentTrack);
    }
    
    console.log(`Música carregada: ${this.currentTrack.titulo}`);
  }

  /**
   * Atualiza barra de progresso
   */
  atualizarProgresso() {
    const progresso = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    this.sliderProgresso.value = this.currentTime;
    this.tempoAtual.textContent = this.formatarTempo(this.currentTime);
    this.sliderProgresso.style.background = 
      `linear-gradient(to right, var(--cor-primaria) 0%, var(--cor-primaria) ${progresso}%, var(--cor-borda) ${progresso}%, var(--cor-borda) 100%)`;
  }

  /**
   * Alterna modo de loop (0, 1, 2)
   */
  toggleLoopMode() {
    this.loopMode = (this.loopMode + 1) % 3;
    this.salvarEstado('loopMode', this.loopMode);
    
    const icone = this.btnLoop.querySelector('i');
    if (this.loopMode === 0) {
      this.btnLoop.classList.remove('ativo');
      this.btnLoop.title = 'Loop (Desativado)';
      icone.className = 'fas fa-redo';
    } else if (this.loopMode === 1) {
      this.btnLoop.classList.add('ativo');
      this.btnLoop.title = 'Loop (Todas)';
      icone.className = 'fas fa-redo';
    } else {
      this.btnLoop.classList.add('ativo');
      this.btnLoop.title = 'Loop (Uma)';
      icone.innerHTML = '<i class="fas fa-redo"></i>';
    }
    
    this.dispatchEvent('loopModeChange', { loopMode: this.loopMode });
  }

  /**
   * Alterna modo shuffle
   */
  toggleShuffleMode() {
    this.shuffleMode = !this.shuffleMode;
    this.salvarEstado('shuffleMode', this.shuffleMode);
    
    if (this.shuffleMode) {
      this.btnShuffle.classList.add('ativo');
      console.log('Shuffle: Ativado');
    } else {
      this.btnShuffle.classList.remove('ativo');
      console.log('Shuffle: Desativado');
    }
    
    this.dispatchEvent('shuffleModeChange', { shuffleMode: this.shuffleMode });
  }

  /**
   * Adiciona música à fila
   */
  addToQueue(track) {
    this.queue.push(track);
    this.dispatchEvent('queueUpdate', { queue: this.queue });
  }

  /**
   * Limpa a fila
   */
  clearQueue() {
    this.queue = [];
    this.queueIndex = 0;
    this.dispatchEvent('queueUpdate', { queue: this.queue });
  }

  /**
   * Embaralha a fila
   */
  shuffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.dispatchEvent('queueUpdate', { queue: this.queue });
  }

  /**
   * Mostra a fila em um alert/modal
   */
  mostrarFila() {
    // Se QueueUI está disponível, usar a modal visual
    if (window.queueUI) {
      window.queueUI.abrirModalFila();
    } else {
      // Fallback para o método antigo (alert com texto)
      const nomes = this.queue.map((m, i) => `${i + 1}. ${m.titulo} - ${m.artista}`).join('\n');
      console.log('Fila:\n' + nomes);
      alert('Fila de reprodução:\n' + nomes);
    }
  }

  /**
   * Alterna favorito da música atual
   */
  toggleFavorito() {
    if (!this.currentTrack) return;
    
    const idx = this.favoritados.findIndex(m => m.id === this.currentTrack.id);
    if (idx > -1) {
      this.favoritados.splice(idx, 1);
    } else {
      this.favoritados.push(this.currentTrack);
    }
    
    localStorage.setItem('musicas-favoritadas', JSON.stringify(this.favoritados));
    this.atualizarFavorito();
    this.dispatchEvent('favoritoChange', { favoritados: this.favoritados });
  }

  /**
   * Atualiza ícone de favorito
   */
  atualizarFavorito() {
    if (!this.currentTrack) return;
    
    const favoritada = this.favoritados.some(m => m.id === this.currentTrack.id);
    const icone = this.btnFavorito.querySelector('i');
    
    if (favoritada) {
      icone.className = 'fas fa-heart';
      this.btnFavorito.classList.add('favoritado');
    } else {
      icone.className = 'far fa-heart';
      this.btnFavorito.classList.remove('favoritado');
    }
  }

  /**
   * Atualiza ícone de play/pause
   */
  atualizarIconePlay() {
    const icone = this.btnPlay.querySelector('i');
    icone.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
  }

  /**
   * Atualiza volume (setter)
   */
  atualizarVolume() {
    this.audioElement.volume = this.volume / 100;
    this.sliderVolume.value = this.volume;
    this.atualizarIconeVolume();
  }

  /**
   * Ativa modo tela cheia
   */
  ativarTelaCheia() {
    console.log('Modo tela cheia ativado');
    // Implementar modo tela cheia futuro
  }

  /**
   * Formata tempo em MM:SS
   */
  formatarTempo(segundos) {
    if (isNaN(segundos)) return '0:00';
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }

  /**
   * Dispara eventos customizados
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(`audioPlayer:${eventName}`, { detail });
    window.dispatchEvent(event);
  }

  /**
   * Retorna a música atual
   */
  getCurrentTrack() {
    return this.currentTrack;
  }

  /**
   * Retorna o estado do player
   */
  getState() {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      volume: this.volume,
      currentTime: this.currentTime,
      duration: this.duration,
      queue: this.queue,
      queueIndex: this.queueIndex,
      loopMode: this.loopMode,
      shuffleMode: this.shuffleMode,
      favoritados: this.favoritados
    };
  }

  /**
   * Retorna favoritos
   */
  getFavoritados() {
    return this.favoritados;
  }

  /**
   * Carrega primeira música ao iniciar (compatibilidade com código antigo)
   */
  carregarMusica(indice) {
    this.carregarFila(indice);
  }

  obterMusicaAtual() {
    return this.currentTrack;
  }

  obterFavoritados() {
    return this.favoritados;
  }
}

// Inicializa o player
document.addEventListener('DOMContentLoaded', () => {
  window.gerenciadorPlayer = new AudioPlayer();
  // Alias para compatibilidade com código antigo
  window.audioPlayer = window.gerenciadorPlayer;
});
