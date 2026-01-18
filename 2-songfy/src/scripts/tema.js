class GerenciadorTema {
  constructor() {
    this.HTML = document.documentElement;
    this.temaArmazenado = localStorage.getItem('tema-songfy');
    this.botaoToggle = null;
    this.inicializar();
  }

  inicializar() {
    // Detecta preferência do sistema
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Define tema inicial
    if (this.temaArmazenado) {
      this.definirTema(this.temaArmazenado);
    } else {
      const temaPadrao = prefereEscuro ? 'escuro' : 'claro';
      this.definirTema(temaPadrao);
    }

    // Detecta mudanças no tema do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.temaArmazenado) {
        this.definirTema(e.matches ? 'escuro' : 'claro');
      }
    });

    this.configurarBotaoToggle();
  }

  definirTema(tema) {
    if (tema === 'escuro') {
      this.HTML.setAttribute('data-tema', 'escuro');
      this.atualizarIconeBotao('☀️');
    } else {
      this.HTML.removeAttribute('data-tema');
      this.atualizarIconeBotao('🌙');
    }
    localStorage.setItem('tema-songfy', tema);
  }

  alternarTema() {
    const temaAtual = this.HTML.getAttribute('data-tema');
    const novoTema = temaAtual === 'escuro' ? 'claro' : 'escuro';
    this.definirTema(novoTema);
  }

  atualizarIconeBotao(icone) {
    if (this.botaoToggle) {
      this.botaoToggle.textContent = icone;
    }
  }

  configurarBotaoToggle() {
    this.botaoToggle = document.getElementById('btn-toggle-tema');
    if (this.botaoToggle) {
      this.botaoToggle.addEventListener('click', () => this.alternarTema());
      
      // Define icone inicial
      const temaAtual = this.HTML.getAttribute('data-tema');
      this.atualizarIconeBotao(temaAtual === 'escuro' ? '☀️' : '🌙');
    }
  }

  obterTemaAtual() {
    return this.HTML.getAttribute('data-tema') || 'claro';
  }
}

// Inicializa o gerenciador de temas
document.addEventListener('DOMContentLoaded', () => {
  new GerenciadorTema();
});// ...existing code...

document.addEventListener('DOMContentLoaded', function() {
    // Inicializa gerenciador de temas (já inicializado em tema.js)
    
    // Initialize navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            console.log(`Navegando para ${this.textContent}`);
        });
    });

    // Carrega dados de músicas do JSON
    function carregarDados() {
        fetch('../assets/data.json')
            .then(response => response.json())
            .then(dados => {
                console.log(dados);
                // Lógica para exibir dados de músicas pode ser adicionada aqui
            })
            .catch(erro => console.error('Erro ao carregar dados:', erro));
    }

    carregarDados();

    // Funcionalidade do player
    const botaoPlay = document.getElementById('btn-play');
    if (botaoPlay) {
        botaoPlay.addEventListener('click', function() {
            console.log('Botão play clicado');
        });
    }
});