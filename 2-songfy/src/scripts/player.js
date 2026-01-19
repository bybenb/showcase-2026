class GerenciadorPlayer {
  constructor() {
    // Elementos do player
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
    this.player = document.querySelector('.player');

    // Estado do player
    this.musicas = [];
    this.indiceMusicaAtual = 0;
    this.tocando = false;
    this.volume = 70;
    this.loop = 0;
    this.shuffle = false;
    this.favoritados = JSON.parse(localStorage.getItem('musicas-favoritadas')) || [];
    this.audio = new Audio();
    this.atualizandoProgresso = false;

    this.inicializar();
  }

  inicializar() {
    this.carregarMusicas();
    this.configurarEventos();
    this.atualizarVolume();
  }

  carregarMusicas() {
    // Carrega a lista de músicas do JSON
    fetch('./assets/musicas.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar JSON: ${response.status}`);
        }
        return response.json();
      })
      .then(dados => {
        this.musicas = dados.musicas;
        console.log(`Carregadas ${this.musicas.length} músicas`);
        if (this.musicas.length > 0) {
          this.carregarMusica(0);
        }
      })
      .catch(erro => {
        console.error('Erro ao carregar músicas:', erro);
        // Carrega músicas padrão se falhar
        this.carregarMusicasPadrao();
      });
  }

  carregarMusicasPadrao() {
    // Fallback para músicas padrão
    this.musicas = [
      {
        id: 1,
        titulo: 'Neon Dreams',
        artista: 'Lorde Vibes',
        duracao: 245,
        arquivo: '../musics/music4.mp3',
        thumb: '../assets/image/covers/cover_2.png'
      },
      {
        id: 2,
        titulo: 'Electric Heart',
        artista: 'LofiDigital Souls',
        duracao: 198,
        arquivo: '../musics/music2.mp3',
        thumb: '../assets/image/covers/cover_1.png'
      }
    ];
  }

  configurarEventos() {
    this.btnPlay.addEventListener('click', () => this.alternarPlayPausa());
    this.btnAnterior.addEventListener('click', () => this.musicaAnterior());
    this.btnProximo.addEventListener('click', () => this.proximaMusica());
    this.sliderProgresso.addEventListener('mousedown', () => this.atualizandoProgresso = true);
    this.sliderProgresso.addEventListener('mouseup', () => this.atualizandoProgresso = false);
    this.sliderProgresso.addEventListener('input', (e) => this.mudarProgresso(e));
    this.sliderVolume.addEventListener('input', (e) => this.mudarVolume(e));
    this.btnVolume.addEventListener('click', () => this.alternarMudo());
    this.btnLoop.addEventListener('click', () => this.alternarLoop());
    this.btnShuffle.addEventListener('click', () => this.alternarShuffle());
    this.btnFila.addEventListener('click', () => this.abrirFila());
    this.btnFavorito.addEventListener('click', () => this.alternarFavorito());
    this.btnTelaCheia.addEventListener('click', () => this.ativarTelaCheia());
    
    // Eventos de áudio
    this.audio.addEventListener('timeupdate', () => this.atualizarProgresso());
    this.audio.addEventListener('ended', () => this.aoFimMusica());
    this.audio.addEventListener('play', () => {
      this.tocando = true;
      this.player.classList.add('tocando');
      this.atualizarIconePlay();
    });
    this.audio.addEventListener('pause', () => {
      this.tocando = false;
      this.player.classList.remove('tocando');
      this.atualizarIconePlay();
    });
    this.audio.addEventListener('loadedmetadata', () => {
      this.tempoTotal.textContent = this.formatarTempo(this.audio.duration);
      this.sliderProgresso.max = this.audio.duration;
    });
    this.audio.addEventListener('error', (e) => {
      console.error('Erro ao carregar áudio:', e);
      console.log('Fonte do áudio:', this.audio.src);
    });
  }

  carregarMusica(indice) {
    if (indice < 0 || indice >= this.musicas.length) return;

    this.indiceMusicaAtual = indice;
    const musica = this.musicas[indice];

    // Atualiza UI
    // Resolve o caminho da thumbnail relativo à pasta assets
    this.playerThumb.src = './assets/' + musica.thumb;
    this.playerTitulo.textContent = musica.titulo;
    this.playerArtista.textContent = musica.artista;

    // Carrega o áudio - resolve o caminho relativo à pasta assets
    this.audio.src = './assets/' + musica.arquivo;
    this.audio.load();

    // Reset do progresso
    this.sliderProgresso.value = 0;
    this.tempoAtual.textContent = '0:00';

    this.atualizarFavorito();

    console.log(`Música carregada: ${musica.titulo} - ${this.audio.src}`);
  }

  alternarPlayPausa() {
    if (this.tocando) {
      this.audio.pause();
    } else {
      this.audio.play().catch(erro => {
        console.error('Erro ao reproduzir áudio:', erro);
      });
    }
  }

  musicaAnterior() {
    let novoIndice = this.indiceMusicaAtual - 1;
    if (novoIndice < 0) {
      novoIndice = this.musicas.length - 1;
    }
    this.carregarMusica(novoIndice);
    if (this.tocando) {
      setTimeout(() => {
        this.audio.play().catch(erro => console.error('Erro ao reproduzir:', erro));
      }, 100);
    }
  }

  proximaMusica() {
    if (this.shuffle) {
      // Próxima aleatória
      this.indiceMusicaAtual = Math.floor(Math.random() * this.musicas.length);
    } else {
      // Próxima sequencial
      this.indiceMusicaAtual = (this.indiceMusicaAtual + 1) % this.musicas.length;
    }
    this.carregarMusica(this.indiceMusicaAtual);
    if (this.tocando) {
      setTimeout(() => {
        this.audio.play().catch(erro => console.error('Erro ao reproduzir:', erro));
      }, 100);
    }
  }

  aoFimMusica() {
    if (this.loop === 2) {
      // Loop de uma música
      this.audio.currentTime = 0;
      this.audio.play();
    } else if (this.loop === 1 || this.shuffle) {
      // Loop de tudo ou shuffle
      this.proximaMusica();
    } else {
      // Sem loop - próxima música
      this.proximaMusica();
    }
  }

  mudarProgresso(e) {
    const tempo = parseFloat(e.target.value);
    this.audio.currentTime = tempo;
  }

  atualizarProgresso() {
    if (this.atualizandoProgresso) return;

    const tempoAtualMs = this.audio.currentTime;
    const duracaoMs = this.audio.duration || 0;

    this.sliderProgresso.value = tempoAtualMs;
    this.tempoAtual.textContent = this.formatarTempo(tempoAtualMs);

    // Atualiza background do slider
    if (duracaoMs > 0) {
      const progresso = (tempoAtualMs / duracaoMs) * 100;
      this.sliderProgresso.style.background = 
        `linear-gradient(to right, var(--cor-primaria) 0%, var(--cor-primaria) ${progresso}%, var(--cor-borda) ${progresso}%, var(--cor-borda) 100%)`;
    }
  }

  mudarVolume(e) {
    this.volume = parseInt(e.target.value);
    this.atualizarVolume();
    localStorage.setItem('volume-songfy', this.volume);
  }

  atualizarVolume() {
    this.audio.volume = this.volume / 100;
    this.atualizarIconeVolume();
  }

  alternarMudo() {
    if (this.volume === 0) {
      this.volume = 70;
      this.sliderVolume.value = 70;
    } else {
      this.volume = 0;
      this.sliderVolume.value = 0;
    }
    this.atualizarVolume();
  }

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

  alternarLoop() {
    this.loop = (this.loop + 1) % 3;
    const icone = this.btnLoop.querySelector('i');

    if (this.loop === 0) {
      this.btnLoop.classList.remove('ativo');
      this.btnLoop.title = 'Loop (0)';
      icone.className = 'fas fa-redo';
    } else if (this.loop === 1) {
      this.btnLoop.classList.add('ativo');
      this.btnLoop.title = 'Loop (Tudo)';
      icone.className = 'fas fa-redo';
    } else {
      this.btnLoop.classList.add('ativo');
      this.btnLoop.title = 'Loop (Um)';
      icone.innerHTML = '<i class="fas fa-redo"></i><span style="font-size: 0.6em; position: absolute;">1</span>';
    }

    console.log(`Loop: ${['Desativado', 'Tudo', 'Um'][this.loop]}`);
  }

  alternarShuffle() {
    this.shuffle = !this.shuffle;
    if (this.shuffle) {
      this.btnShuffle.classList.add('ativo');
      console.log('Shuffle: Ativado');
    } else {
      this.btnShuffle.classList.remove('ativo');
      console.log('Shuffle: Desativado');
    }
  }

  abrirFila() {
    console.log('Fila de músicas:', this.musicas);
    alert('Fila: ' + this.musicas.map(m => m.titulo).join('\n'));
  }

  alternarFavorito() {
    const musicaAtual = this.musicas[this.indiceMusicaAtual];
    const index = this.favoritados.findIndex(m => m.id === musicaAtual.id);

    if (index > -1) {
      this.favoritados.splice(index, 1);
    } else {
      this.favoritados.push(musicaAtual);
    }

    localStorage.setItem('musicas-favoritadas', JSON.stringify(this.favoritados));
    this.atualizarFavorito();
  }

  atualizarFavorito() {
    const musicaAtual = this.musicas[this.indiceMusicaAtual];
    const favoritada = this.favoritados.some(m => m.id === musicaAtual.id);

    const icone = this.btnFavorito.querySelector('i');
    if (favoritada) {
      icone.className = 'fas fa-heart';
      this.btnFavorito.classList.add('favoritado');
    } else {
      icone.className = 'far fa-heart';
      this.btnFavorito.classList.remove('favoritado');
    }
  }

  ativarTelaCheia() {
    console.log('Modo tela cheia ativado');
    // Implementar modo tela cheia
  }

  atualizarIconePlay() {
    const icone = this.btnPlay.querySelector('i');
    icone.className = this.tocando ? 'fas fa-pause' : 'fas fa-play';
  }

  formatarTempo(segundos) {
    if (isNaN(segundos)) return '0:00';
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }

  obterMusicaAtual() {
    return this.musicas[this.indiceMusicaAtual];
  }

  obterFavoritados() {
    return this.favoritados;
  }
}

// Inicializa o gerenciador do player
document.addEventListener('DOMContentLoaded', () => {
  window.gerenciadorPlayer = new GerenciadorPlayer();
});