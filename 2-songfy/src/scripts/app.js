// Songfy - Aplicação de Streaming de Música
// Inicialização da aplicação e integração de módulos

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 Songfy iniciando...');

    // ========================================
    // 1. Inicializa a Biblioteca de Músicas
    // ========================================
    if (window.musicLibrary) {
        window.musicLibrary.carregar().then(qtd => {
            console.log(`✅ Biblioteca carregada: ${qtd} músicas`);
        }).catch(err => {
            console.error('❌ Erro ao carregar biblioteca:', err);
        });
    }

    // ========================================
    // 2. Integração: AudioPlayer + MusicLibrary
    // ========================================
    
    // Quando uma música é selecionada na biblioteca
    window.addEventListener('musicSelected', (e) => {
        const musica = e.detail;
        if (window.audioPlayer) {
            window.audioPlayer.carregarMusica(musica);
            console.log(`▶️ Música selecionada: ${musica.titulo}`);
        }
    });

    // Quando clica em "Tocar agora" no menu
    window.addEventListener('playMusic', (e) => {
        const musica = e.detail;
        if (window.audioPlayer) {
            window.audioPlayer.carregarMusica(musica);
            window.audioPlayer.play();
            console.log(`🎵 Tocando: ${musica.titulo}`);
        }
    });
    // Quando clica em "Adicionar à fila"
    window.addEventListener('addToQueue', (e) => {
        const musica = e.detail;
        if (window.audioPlayer) {
            window.audioPlayer.addToQueue(musica);
            console.log(`➕ Adicionado à fila: ${musica.titulo}`);
        }
        // Também adiciona ao QueueManager se disponível
        if (window.queueManager) {
            window.queueManager.addToQueue(musica);
        }
    });

    // ========================================
    // 3. Notificações de Evento
    // ========================================

    window.addEventListener('favoritoToggled', (e) => {
        const musica = e.detail;
        console.log(`❤️ Favorito toggled: ${musica.titulo}`);
    });

    window.addEventListener('bibliotecaMudou', () => {
        console.log(`🔄 Biblioteca filtros/ordenação mudou`);
    });

    // ========================================
    // 4. Navigation Links
    // ========================================
    const navLinks = document.querySelectorAll('[data-nav]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const nav = this.getAttribute('data-nav');
            console.log(`📍 Navegando para: ${nav}`);
        });
    });

    // ========================================
    // 5. Inicializa Tema
    // ========================================
    if (window.gerenciadorTema) {
        console.log('✅ Tema inicializado');
    }

    // ========================================
    // 6. Inicializa Sidebar
    // ========================================
    if (window.gerenciadorSidebar) {
        console.log('✅ Sidebar inicializado');
    }

    // ========================================
    // 7. Inicializa AudioPlayer
    // ========================================
    if (window.audioPlayer) {
        console.log('✅ AudioPlayer inicializado');
    }

    // ========================================
    // 8. Inicializa QueueManager e QueueUI
    // ========================================
    if (window.queueManager) {
        console.log('✅ QueueManager inicializado');
        // Sincroniza a fila do AudioPlayer com QueueManager se necessário
        if (window.audioPlayer && window.audioPlayer.queue.length > 0) {
            window.queueManager.setQueue(window.audioPlayer.queue, 0);
            console.log('🔄 Fila sincronizada do AudioPlayer para QueueManager');
        }
    }

    if (window.queueUI) {
        console.log('✅ QueueUI inicializado');
    }

    // ========================================
    // 9. Inicializa HistoricoUI
    // ========================================
    if (window.historicoUI) {
        window.historicoUI.inicializar();
        console.log('✅ HistoricoUI inicializado');
    }

    console.log('🎵 Songfy pronto para usar!');
});
