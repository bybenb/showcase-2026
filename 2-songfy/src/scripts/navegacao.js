class GerenciadorNavegacao {
  constructor() {
    this.itemsMenuMobile = document.querySelectorAll('.item-menu-mobile');
    this.itemsNavHeader = document.querySelectorAll('[data-nav]');
    this.btnTemaHeader = document.getElementById('btn-toggle-tema-header');
    this.btnTemaMobile = document.getElementById('btn-menu-mobile-tema');
    
    this.inicializar();
  }

  inicializar() {
    this.configurarMenuMobile();
    this.configurarHeaderNav();
    this.configurarBotoesTemaNão();
  }

  configurarMenuMobile() {
    this.itemsMenuMobile.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Se for o botão de tema, ativa o tema
        if (item.id === 'btn-menu-mobile-tema') {
          if (window.gerenciadorTema) {
            window.gerenciadorTema.alternarTema();
          }
          return;
        }

        const secao = item.getAttribute('data-nav');
        this.ativarNavegacao(secao, item);
      });
    });
  }

  configurarHeaderNav() {
    this.itemsNavHeader.forEach(item => {
      item.addEventListener('click', (e) => {
        if (item.tagName !== 'BUTTON') {
          e.preventDefault();
        }
        
        const secao = item.getAttribute('data-nav');
        this.ativarNavegacao(secao, item);
      });
    });
  }

  configurarBotoesTemaNão() {
    if (this.btnTemaHeader) {
      this.btnTemaHeader.addEventListener('click', () => {
        if (window.gerenciadorTema) {
          window.gerenciadorTema.alternarTema();
        }
      });
    }

    if (this.btnTemaMobile) {
      this.btnTemaMobile.addEventListener('click', () => {
        if (window.gerenciadorTema) {
          window.gerenciadorTema.alternarTema();
        }
      });
    }
  }

  ativarNavegacao(secao, item) {
    // Remove classe ativo de todos os items
    this.itemsMenuMobile.forEach(i => i.classList.remove('ativo'));
    this.itemsNavHeader.forEach(i => {
      if (i.tagName !== 'BUTTON') {
        i.classList.remove('ativo');
      }
    });

    // Adiciona classe ativo ao item clicado
    if (item) {
      item.classList.add('ativo');
    }

    // Também ativa no outro menu
    this.itemsMenuMobile.forEach(i => {
      if (i.getAttribute('data-nav') === secao) {
        i.classList.add('ativo');
      }
    });

    this.itemsNavHeader.forEach(i => {
      if (i.getAttribute('data-nav') === secao) {
        i.classList.add('ativo');
      }
    });

    console.log(`Navegação: ${secao}`);
    
    // Armazena no localStorage
    localStorage.setItem('secao-ativa-nav', secao);
  }

  restaurarEstado() {
    const secaoArmazenada = localStorage.getItem('secao-ativa-nav');
    if (secaoArmazenada) {
      this.ativarNavegacao(secaoArmazenada, null);
    }
  }
}

// Inicializa gerenciador de navegação
document.addEventListener('DOMContentLoaded', () => {
  window.gerenciadorNavegacao = new GerenciadorNavegacao();
  window.gerenciadorNavegacao.restaurarEstado();
});
