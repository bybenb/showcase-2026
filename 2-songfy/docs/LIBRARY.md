# Sistema de Biblioteca de Músicas - Songfy

## Visão Geral

Sistema completo de gerenciamento de biblioteca de músicas com **50 músicas mock**, filtros avançados, busca em tempo real e interface responsiva.

## Funcionalidades

### 1. **Classe MusicLibrary**
Gerencia toda a lógica da biblioteca com os seguintes métodos:

#### Métodos de Filtro
- `filtrarPorGenero(genero)` - Filtra por gênero
- `filtrarPorArtista(artista)` - Filtra por artista
- `filtrarPorAlbum(album)` - Filtra por álbum
- `buscar(texto)` - Busca por título ou artista
- `limparFiltros()` - Remove todos os filtros ativos

#### Métodos de Ordenação
- `ordenar('alfabetico')` - A-Z por título
- `ordenar('tocadas')` - Por mais tocadas (descendente)
- `ordenar('recentes')` - Por data de adição (mais recentes primeiro)

#### Métodos de Renderização
- `renderGrid(container, musicas, onCardClick)` - Renderiza grid responsivo
- `renderFiltros(container)` - Renderiza painel de filtros

#### Métodos Utilitários
- `carregar()` - Carrega músicas do JSON
- `obterMusica(id)` - Obtém uma música específica
- `toggleFavorito(musica, btnElement)` - Adiciona/remove favorito

### 2. **Dados Mock**
- **50 músicas** com campos:
  - `id` - Identificador único
  - `titulo` - Nome da música
  - `artista` - Nome do artista
  - `album` - Nome do álbum
  - `duracao` - Duração em segundos
  - `genero` - Gênero musical
  - `arquivo` - Caminho do arquivo de áudio
  - `thumb` - Caminho da capa
  - `dataAdicao` - Data em que foi adicionada (YYYY-MM-DD)
  - `tocadas` - Número de vezes tocadas

### 3. **Grid Responsivo**
Adapta-se a diferentes tamanhos de tela:
- **Desktop** (>1200px): 4 colunas
- **Tablet** (992px-1199px): 3 colunas
- **Mobile** (768px-991px): 2 colunas
- **Mobile Small** (<768px): 2 colunas

### 4. **Componentes Interativos**

#### Card de Música
```html
<div class="carta-musica">
  <div class="carta-imagem">
    <img src="...">
    <div class="carta-overlay">
      <button class="btn-play">▶</button>
    </div>
  </div>
  <div class="carta-info">
    <h3 class="carta-titulo">Título</h3>
    <p class="carta-artista">Artista</p>
    <p class="carta-meta">Álbum • Gênero</p>
  </div>
  <div class="carta-footer">
    <span class="duracao">3:45</span>
    <div class="carta-acoes">
      <button data-favorito>♡</button>
      <button data-menu>⋮</button>
    </div>
  </div>
</div>
```

#### Menu de Contexto
- Tocar agora
- Adicionar à fila
- Adicionar a playlist
- Ver artista
- Ver álbum
- Ver gênero
- Informações

#### Modal de Informações
Exibe:
- Capa da música
- Título e artista
- Álbum, gênero, duração
- Data de adição e vezes tocadas

### 5. **Filtros e Busca**

#### Busca em Tempo Real
Busca por:
- Título da música
- Nome do artista

#### Filtros Avançados
- **Por Gênero**: 25 gêneros disponíveis
- **Por Artista**: 24 artistas únicos
- **Por Álbum**: 20+ álbuns

#### Ordenação
- **Alfabético** (A-Z)
- **Mais Tocadas** (descendente)
- **Mais Recentes** (por data de adição)

### 6. **Sistema de Favoritos**
- Persistência em localStorage
- Toggle com coração animado
- Integração com AudioPlayer

## Estilos CSS

Arquivo: `styles/library.css` (600+ linhas)

### Classes Principais
- `.biblioteca-container` - Container principal
- `.grade-musicas` - Grid responsivo
- `.carta-musica` - Card de música
- `.menu-contexto` - Menu dropdown
- `.modal-info-musica` - Modal de informações

### Animações
- `slideIn` - Menu de contexto
- `slideUp` - Modal de informações
- Hover effects com transformações suaves

## Responsividade

### Breakpoints
```css
1200px - Desktop (4 colunas)
992px  - Tablet (3 colunas)
768px  - Mobile (2 colunas)
480px  - Mobile Small (2 colunas)
```

### Adaptações por Tamanho
- Tamanho dos cards reduzido em mobile
- Botões menores em telas pequenas
- Layout flexível para inputs
- Menu de ordenação responsivo

## Integração com Outros Módulos

### AudioPlayer
```javascript
// Dispara quando uma música é selecionada
window.addEventListener('musicSelected', (e) => {
  window.audioPlayer.carregarMusica(e.detail);
});

// Dispara ao tocar agora
window.addEventListener('playMusic', (e) => {
  window.audioPlayer.play();
});

// Adiciona à fila
window.addEventListener('addToQueue', (e) => {
  window.audioPlayer.addToQueue(e.detail);
});
```

### Router
- Rota: `/#/library`
- Renderiza interface completa com busca e filtros

### LocalStorage
- `musicas-favoritadas` - Array de IDs de músicas favoritas

## Uso

### Carregamento
```javascript
// A biblioteca é carregada automaticamente via router
// Mas pode ser feito manualmente:
await window.musicLibrary.carregar();
```

### Renderizar Grid
```javascript
const container = document.getElementById('grid-biblioteca');
window.musicLibrary.renderGrid(container, null, (musica) => {
  console.log('Música selecionada:', musica);
});
```

### Buscar e Filtrar
```javascript
// Busca
window.musicLibrary.buscar('Bilhete');

// Filtrar por gênero
window.musicLibrary.filtrarPorGenero('Hip-Hop');

// Ordenar
window.musicLibrary.ordenar('tocadas');

// Limpar tudo
window.musicLibrary.limparFiltros();
```

## Custom Events

```javascript
// Música selecionada
window.addEventListener('musicSelected', (e) => {
  console.log('Música:', e.detail);
});

// Favorito toggled
window.addEventListener('favoritoToggled', (e) => {
  console.log('Favorito:', e.detail);
});

// Biblioteca mudou (filtro aplicado)
window.addEventListener('bibliotecaMudou', () => {
  console.log('Biblioteca atualizada');
});

// Tocar música
window.addEventListener('playMusic', (e) => {
  console.log('Tocando:', e.detail);
});

// Adicionar à fila
window.addEventListener('addToQueue', (e) => {
  console.log('Adicionado à fila:', e.detail);
});

// Filtro mudou
window.addEventListener('filtroMudou', (e) => {
  console.log('Novo filtro:', e.detail);
});
```

## 🎯 Recursos Futuros

- [ ] Paginação de resultados
- [ ] Categorias de playlists
- [ ] Recomendações baseadas em gênero
- [ ] Histórico de reprodução
- [ ] Compartilhamento de playlists
- [ ] Sincronização com serviços externos

## 📝 Notas Técnicas

- Usar `window.musicLibrary` para acessar a instância global
- Todos os eventos utilizam `CustomEvent` do DOM
- Imagens são carregadas com lazy loading
- LocalStorage persiste favoritos entre sessões
- Suporta tema claro e escuro



> `Beny B. Reis, 19.01.2026-04:38AM`
