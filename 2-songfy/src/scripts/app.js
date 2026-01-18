// This file contains custom JavaScript functionality for the Songfy application.

// Event listener for DOMContentLoaded to ensure the script runs after the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Gerenciador de sidebar já inicializado em sidebar.js
    
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

    // Inicializa gerenciador de sidebar
    if (window.gerenciadorSidebar) {
        console.log('Gerenciador de sidebar carregado com sucesso');
    }
});