/**
 * QueueManager - Gerenciador de fila de reprodução e histórico
 * Controla: fila atual, histórico, modos (normal, loop, shuffle)
 */
class QueueManager {
  constructor() {
    this.queue = [];
    this.queueIndex = 0;
    this.history = [];
    this.maxHistorySize = 10;
    
    this.loopMode = this.restaurarEstado('queueLoopMode', 0);     // 0: normal, 1: loop all, 2: loop one
    this.shuffleMode = this.restaurarEstado('queueShuffleMode', false);
    
    // Para rastreamento interno
    this.originalQueue = [];  // Cópia original antes do shuffle
    
    this.carregarHistoricoLocalStorage();
  }

  /**
   * Restaura valor do localStorage
   */
  restaurarEstado(chave, defaultVal) {
    const stored = localStorage.getItem(`queue-${chave}`);
    if (stored !== null) {
      if (typeof defaultVal === 'boolean') {
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
    localStorage.setItem(`queue-${chave}`, String(valor));
  }

  /**
   * Define a fila de reprodução
   */
  setQueue(musicas, startIndex = 0) {
    this.queue = [...musicas];
    this.originalQueue = [...musicas];
    this.queueIndex = Math.min(startIndex, musicas.length - 1);
    
    if (this.shuffleMode) {
      this.aplicarShuffle();
    }
    
    this.dispatchEvent('queueChanged', { queue: this.queue, index: this.queueIndex });
  }

  /**
   * Adiciona uma música à fila
   */
  addToQueue(musica) {
    this.queue.push(musica);
    if (!this.shuffleMode) {
      this.originalQueue.push(musica);
    }
    this.dispatchEvent('queueUpdated', { queue: this.queue });
  }

  /**
   * Adiciona múltiplas músicas à fila
   */
  addMultipleToQueue(musicas) {
    this.queue.push(...musicas);
    if (!this.shuffleMode) {
      this.originalQueue.push(...musicas);
    }
    this.dispatchEvent('queueUpdated', { queue: this.queue });
  }

  /**
   * Remove uma música da fila por índice
   */
  removeFromQueue(index) {
    if (index === this.queueIndex) {
      // Se for a atual, passa para próxima
      this.queueIndex = Math.min(this.queueIndex, this.queue.length - 2);
    } else if (index < this.queueIndex) {
      this.queueIndex--;
    }
    
    this.queue.splice(index, 1);
    if (!this.shuffleMode) {
      this.originalQueue = [...this.queue];
    }
    
    this.dispatchEvent('queueUpdated', { queue: this.queue });
  }

  /**
   * Limpa a fila inteira
   */
  clearQueue() {
    this.queue = [];
    this.queueIndex = 0;
    this.originalQueue = [];
    this.dispatchEvent('queueCleared');
  }

  /**
   * Reordena a fila (drag & drop)
   */
  reorderQueue(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    const musica = this.queue.splice(fromIndex, 1)[0];
    this.queue.splice(toIndex, 0, musica);
    
    // Ajusta índice de reprodução se necessário
    if (fromIndex === this.queueIndex) {
      this.queueIndex = toIndex;
    } else if (fromIndex < this.queueIndex && toIndex >= this.queueIndex) {
      this.queueIndex--;
    } else if (fromIndex > this.queueIndex && toIndex <= this.queueIndex) {
      this.queueIndex++;
    }
    
    if (!this.shuffleMode) {
      this.originalQueue = [...this.queue];
    }
    
    this.dispatchEvent('queueReordered', { queue: this.queue, index: this.queueIndex });
  }

  /**
   * Obtém próxima música
   */
  getNextTrack() {
    if (this.queue.length === 0) return null;
    
    let nextIndex = this.queueIndex + 1;
    
    if (nextIndex >= this.queue.length) {
      if (this.loopMode === 1) {
        // Loop all - volta ao início
        nextIndex = 0;
      } else {
        // Sem loop - retorna null
        return null;
      }
    }
    
    return { track: this.queue[nextIndex], index: nextIndex };
  }

  /**
   * Obtém música anterior
   */
  getPreviousTrack() {
    if (this.queue.length === 0) return null;
    
    let prevIndex = this.queueIndex - 1;
    
    if (prevIndex < 0) {
      if (this.loopMode === 1) {
        // Loop all - vai para o final
        prevIndex = this.queue.length - 1;
      } else {
        // Sem loop - retorna null
        return null;
      }
    }
    
    return { track: this.queue[prevIndex], index: prevIndex };
  }

  /**
   * Pula para uma música específica na fila
   */
  jumpToTrack(index) {
    if (index >= 0 && index < this.queue.length) {
      this.queueIndex = index;
      this.dispatchEvent('queueJumped', { track: this.queue[index], index });
      return this.queue[index];
    }
    return null;
  }

  /**
   * Ativa/desativa shuffle
   */
  toggleShuffle() {
    this.shuffleMode = !this.shuffleMode;
    this.salvarEstado('queueShuffleMode', this.shuffleMode);
    
    if (this.shuffleMode) {
      this.originalQueue = [...this.queue];
      this.aplicarShuffle();
    } else {
      // Volta à ordem original
      const musicaAtual = this.queue[this.queueIndex];
      this.queue = [...this.originalQueue];
      this.queueIndex = this.queue.indexOf(musicaAtual);
    }
    
    this.dispatchEvent('shuffleToggled', { enabled: this.shuffleMode, queue: this.queue });
  }

  /**
   * Aplica shuffle Fisher-Yates à fila
   */
  aplicarShuffle() {
    const arr = [...this.queue];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.queue = arr;
  }

  /**
   * Alterna modo de loop
   */
  toggleLoopMode() {
    this.loopMode = (this.loopMode + 1) % 3; // 0 → 1 → 2 → 0
    this.salvarEstado('queueLoopMode', this.loopMode);
    
    const modos = ['normal', 'loop-all', 'loop-one'];
    this.dispatchEvent('loopModeChanged', { mode: this.loopMode, modoNome: modos[this.loopMode] });
  }

  /**
   * Adiciona música ao histórico
   */
  addToHistory(musica) {
    // Remove se já existe (para evitar duplicatas)
    const idx = this.history.findIndex(m => m.id === musica.id);
    if (idx !== -1) {
      this.history.splice(idx, 1);
    }
    
    // Adiciona no início
    this.history.unshift({
      ...musica,
      tocadaEm: new Date().toISOString()
    });
    
    // Limita a 10 últimas
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
    
    this.salvarHistoricoLocalStorage();
    this.dispatchEvent('historyUpdated', { history: this.history });
  }

  /**
   * Obtém histórico
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Limpa histórico
   */
  clearHistory() {
    this.history = [];
    this.salvarHistoricoLocalStorage();
    this.dispatchEvent('historyCleared');
  }

  /**
   * Carrega histórico do localStorage
   */
  carregarHistoricoLocalStorage() {
    const stored = localStorage.getItem('queue-history');
    if (stored) {
      try {
        this.history = JSON.parse(stored);
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        this.history = [];
      }
    }
  }

  /**
   * Salva histórico no localStorage
   */
  salvarHistoricoLocalStorage() {
    try {
      localStorage.setItem('queue-history', JSON.stringify(this.history));
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  }

  /**
   * Obtém informações da fila
   */
  getQueueInfo() {
    return {
      totalMusicas: this.queue.length,
      indiceAtual: this.queueIndex,
      musicaAtual: this.queue[this.queueIndex] || null,
      proximas: this.queue.slice(this.queueIndex + 1),
      loopMode: this.loopMode,
      shuffleMode: this.shuffleMode,
      tempoTotal: this.calcularTempoTotal()
    };
  }

  /**
   * Calcula tempo total da fila
   */
  calcularTempoTotal() {
    return this.queue.reduce((total, musica) => total + (musica.duracao || 0), 0);
  }

  /**
   * Formata duração em MM:SS
   */
  static formatarDuracao(segundos) {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Dispara custom event
   */
  dispatchEvent(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent(`queue:${eventName}`, { detail }));
  }
}

// Instância global
window.queueManager = new QueueManager();
