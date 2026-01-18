class GerenciadorSidebar {
  constructor() {
    this.itensNav = document.querySelectorAll('.item-nav');
    this.campoBusca = document.getElementById('campo-busca-rapida');
    this.botaoExpandirPlaylists = document.querySelector('.botao-expandir-playlists');
    this.listaPlaylists = document.getElementById('lista-playlists');
    this.itemsPlaylist = document.querySelectorAll('.item-playlist');
    this.botaoNovaPlaylist = document.querySelector('.botao-nova-playlist');
    this.amigosOnline = document.querySelectorAll('.amigo-online');
    this.tituloConteudo = document.getElementById('titulo-conteudo');

    this.inicializar();
  }

  inicializar() {
    this.configurarNavegacao();
    this.configurarBusca();
    this.configurarPlaylists();
    this.configurarAmigos();
    this.restaurarEstado();
  }

  configurarNavegacao() {
    this.itensNav.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.ativarNavegacao(item);
      });
    });
  }

  ativarNavegacao(item) {
    // Remove classe ativo de todos os itens
    this.itensNav.forEach(nav => nav.classList.remove('ativo'));
    
    // Adiciona classe ativo ao item clicado
    item.classList.add('ativo');

    // Atualiza título do conteúdo
    const secao = item.getAttribute('data-secao');
    const nomeSecao = item.querySelector('span').textContent;
    this.tituloConteudo.textContent = `${nomeSecao}`;

    // Armazena no localStorage
    localStorage.setItem('secao-ativa', secao);

    console.log(`Navegação: ${secao}`);
  }

  configurarBusca() {
    this.campoBusca.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      this.filtrarPlaylists(termo);
    });
  }

  filtrarPlaylists(termo) {
    this.itemsPlaylist.forEach(item => {
      const nome = item.querySelector('span').textContent.toLowerCase();
      if (nome.includes(termo)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  configurarPlaylists() {
    // Botão expandir/colapsar
    this.botaoExpandirPlaylists.addEventListener('click', () => {
      this.botaoExpandirPlaylists.classList.toggle('colapsado');
      this.listaPlaylists.style.display = 
        this.listaPlaylists.style.display === 'none' ? 'block' : 'none';
    });

    // Items de playlist
    this.itemsPlaylist.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const nome = item.querySelector('span').textContent;
        console.log(`Abrindo playlist: ${nome}`);
        // Adicionar lógica para carregar playlist
      });
    });

    // Botão nova playlist
    this.botaoNovaPlaylist.addEventListener('click', () => {
      const nomeLista = prompt('Nome da nova playlist:');
      if (nomeLista) {
        this.criarNovaPlaylist(nomeLista);
      }
    });
  }

  criarNovaPlaylist(nome) {
    const novoItem = document.createElement('li');
    novoItem.className = 'item-playlist';
    novoItem.innerHTML = `
      <i class="fas fa-play-circle"></i>
      <span>${nome}</span>
      <span class="contador-playlist">0</span>
    `;

    this.listaPlaylists.appendChild(novoItem);

    // Adiciona evento de clique ao novo item
    novoItem.addEventListener('click', (e) => {
      e.preventDefault();
      console.log(`Abrindo playlist: ${nome}`);
    });

    console.log(`Nova playlist criada: ${nome}`);
  }

  configurarAmigos() {
    this.amigosOnline.forEach(amigo => {
      amigo.addEventListener('click', () => {
        const nome = amigo.getAttribute('title');
        console.log(`Chat aberto com: ${nome}`);
        // Adicionar lógica para abrir chat
      });

      amigo.addEventListener('mouseenter', () => {
        const nome = amigo.getAttribute('title');
        amigo.title = `${nome} - Online`;
      });
    });
  }

  restaurarEstado() {
    // Restaura seção ativa
    const secaoArmazenada = localStorage.getItem('secao-ativa');
    if (secaoArmazenada) {
      const item = document.querySelector(`[data-secao="${secaoArmazenada}"]`);
      if (item) {
        this.ativarNavegacao(item);
      }
    }
  }

  obterPlaylists() {
    return Array.from(this.itemsPlaylist).map(item => ({
      nome: item.querySelector('span').textContent,
      quantidade: item.querySelector('.contador-playlist').textContent
    }));
  }

  obterAmigosOnline() {
    return Array.from(this.amigosOnline).map(amigo => ({
      nome: amigo.getAttribute('title'),
      avatar: amigo.querySelector('img').src
    }));
  }
}

// Inicializa gerenciador de sidebar quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
  window.gerenciadorSidebar = new GerenciadorSidebar();
});