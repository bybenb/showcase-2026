# 🧪 Guia de Testes - Sistema de Biblioteca

## ✅ Checklist de Funcionalidades

### 1. Carregamento da Biblioteca
- [ ] Biblioteca carrega 50 músicas ao acessar `/#/library`
- [ ] Mensagem "Carregando biblioteca..." aparece e desaparece
- [ ] Grid de 4 colunas aparece no desktop
- [ ] Sem erros no Console (F12)

### 2. Renderização de Cards
- [ ] Cards exibem imagem da capa
- [ ] Cards exibem título, artista, álbum e gênero
- [ ] Cards exibem duração no formato MM:SS
- [ ] Overlay com botão play aparece ao passar mouse
- [ ] Botões de favorito e menu aparecem no footer

### 3. Hover Effects
- [ ] Cards sobem (translateY) ao passar mouse
- [ ] Sombra aumenta ao hover
- [ ] Botão play fica visível e animado
- [ ] Imagem faz zoom (1.05x) ao hover

### 4. Busca em Tempo Real
- [ ] Campo de busca funciona
- [ ] Busca por título filtra corretamente (ex: "Bilhete")
- [ ] Busca por artista filtra corretamente (ex: "Lord Sapiencia")
- [ ] Busca é case-insensitive
- [ ] "Nenhuma música encontrada" aparece se não houver resultados

### 5. Ordenação
- [ ] Botão "A-Z" ordena alfabeticamente (padrão)
- [ ] Botão "🔥" ordena por mais tocadas (descendente)
- [ ] Botão "⏱️" ordena por mais recentes (data de adição)
- [ ] Botão ativo fica com fundo verde (#1DB954)

### 6. Menu de Contexto
- [ ] Menu aparece ao clicar em ⋮
- [ ] Menu desaparece ao clicar fora
- [ ] Opções disponíveis:
  - [ ] Tocar agora - começa reprodução
  - [ ] Adicionar à fila - adiciona ao AudioPlayer
  - [ ] Artista - navega para página do artista
  - [ ] Álbum - navega para página do álbum
  - [ ] Gênero - filtra por gênero
  - [ ] Informações - abre modal

### 7. Modal de Informações
- [ ] Modal aparece com imagem, título, artista
- [ ] Exibe álbum, gênero, duração
- [ ] Exibe data de adição e vezes tocadas
- [ ] Botão "Tocar agora" funciona
- [ ] Botão X fecha o modal
- [ ] Clique fora fecha o modal

### 8. Sistema de Favoritos
- [ ] Clique no ♡ adiciona favorito
- [ ] Ícone muda para ♥ (cheio) quando favoritado
- [ ] Favoritos persistem ao recarregar página (localStorage)
- [ ] Dispatch event "favoritoToggled" funciona

### 9. Responsividade
- [ ] Desktop (>1200px): 4 colunas
- [ ] Tablet (992-1199px): 3 colunas
- [ ] Mobile (768-991px): 2 colunas
- [ ] Mobile Small (<768px): 2 colunas
- [ ] Botões e texto dimensionam corretamente
- [ ] Sem scroll horizontal

### 10. Integração com AudioPlayer
- [ ] Clique no card toca a música
- [ ] Clique em "Tocar agora" do menu toca
- [ ] "Adicionar à fila" adiciona ao queue
- [ ] Ícone de play no player atualiza
- [ ] Título/artista no player atualiza

### 11. Integração com Tema (Dark/Light)
- [ ] Cores adaptam com mudança de tema
- [ ] Cards têm cor correta em cada tema
- [ ] Texto tem contraste suficiente
- [ ] Botões visíveis em ambos temas
- [ ] Nenhum "flash" de cor ao mudar tema

### 12. Performance
- [ ] Grid renderiza rapidamente (<1s)
- [ ] Scroll suave sem jank
- [ ] Imagens carregam com lazy loading
- [ ] Sem memory leaks (verificar DevTools)

## 🧪 Testes no Console (F12)

```javascript
// Testar carregamento
console.log(window.musicLibrary.musicas.length); // Deve ser 50

// Testar busca
window.musicLibrary.buscar('rock');
console.log(window.musicLibrary.musicasFiltradas.length); // Número de rock

// Testar filtro por gênero
window.musicLibrary.filtrarPorGenero('Hip-Hop');
console.log(window.musicLibrary.musicasFiltradas); // Array de Hip-Hop

// Testar ordenação
window.musicLibrary.ordenar('tocadas');
console.log(window.musicLibrary.musicasFiltradas[0].tocadas); // Maior número

// Testar metadados
console.log(window.musicLibrary.generos); // Array de gêneros
console.log(window.musicLibrary.artistas); // Array de artistas
console.log(window.musicLibrary.albuns); // Array de álbuns

// Testar eventos
window.addEventListener('musicSelected', (e) => console.log('Selecionado:', e.detail));
window.addEventListener('favoritoToggled', (e) => console.log('Favorito:', e.detail));
```

## 🎨 Testes Visuais

### Cores Esperadas - Tema Claro
- Card background: #FFFFFF (branco)
- Texto principal: #191414 (cinza escuro)
- Texto secundário: #6A6A6A (cinza médio)
- Botão hover: #1DB954 (verde Spotify)
- Border: #E0E0E0 (cinza claro)

### Cores Esperadas - Tema Escuro
- Card background: #1F2937 (cinza escuro)
- Texto principal: #F3F4F6 (branco)
- Texto secundário: #D1D5DB (cinza claro)
- Botão hover: #1DB954 (verde Spotify)
- Border: #4B5563 (cinza médio)

## 📊 Dados de Teste

### Exemplo de Música
```json
{
  "id": 1,
  "titulo": "Bilhete",
  "artista": "Lord Sapiencia",
  "album": "Filosofia do Nada",
  "duracao": 139,
  "genero": "Hip-Hop",
  "arquivo": "../musics/music4.mp3",
  "thumb": "./image/covers/cover_2.png",
  "dataAdicao": "2025-12-15",
  "tocadas": 145
}
```

### Gêneros para Filtrar
Hip-Hop, Lo-Fi, Synthwave, Ambient, Jazz, Rock, Reggae, Blues, Eletrônico, etc.

### Artistas para Filtrar
Lord Sapiencia, Lofi Petit, Synthwave Master, Ambient Audio, Jazz Collective, etc.

## 🚀 Fluxo de Teste Completo

1. **Abrir `src/index.html`**
2. **Navegar para Biblioteca** (menu > Biblioteca ou /#/library)
3. **Verificar loading** - Deve desaparecer rapidamente
4. **Testar busca** - Digitar "rock" no campo
5. **Testar ordenação** - Clicar cada botão
6. **Testar hover** - Passar mouse sobre card
7. **Testar menu** - Clicar em ⋮ e selecionar opções
8. **Testar favorito** - Clicar em ♡
9. **Testar responsividade** - Redimensionar janela
10. **Testar tema** - Clicar botão de tema (lua/sol)
11. **Testar integração** - Clicar "Tocar agora" e verificar player

## 🐛 Possíveis Problemas e Soluções

### Cards não aparecem
- [ ] Verificar se library.js é carregado antes de router.js
- [ ] Verificar console para erros de fetch do JSON
- [ ] Verificar se ./assets/musicas.json existe

### Menu não funciona
- [ ] Verificar z-index de .menu-contexto (deve ser 1000+)
- [ ] Verificar se click handler foi adicionado ao btn-icon

### Favoritos não persistem
- [ ] Verificar localStorage em DevTools (Application > Storage)
- [ ] Verificar chave "musicas-favoritadas"
- [ ] Verificar se browser permite localStorage

### Imagens não carregam
- [ ] Verificar caminho `./assets/image/covers/`
- [ ] Verificar se arquivos PNG existem
- [ ] Verificar console para 404 errors

### Responsividade não funciona
- [ ] Verificar se media queries em library.css são aplicadas
- [ ] Verificar viewport meta tag no HTML
- [ ] Testar em DevTools Mobile Emulation

## 📝 Relatório de Teste

Use este template para documentar testes:

```
Data: __/__/____
Browser: ____________________
Resolução: _____x_____
Tema: [ ] Claro [ ] Escuro

✅ Funcionalidade: ___________________
📝 Observações: ___________________

❌ Bug: ___________________
📝 Descrição: ___________________
📝 Passos para reproduzir: ___________________
```

---

**Desenvolvido com ❤️ para Songfy**
