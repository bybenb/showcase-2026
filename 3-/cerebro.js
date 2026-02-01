document.addEventListener('DOMContentLoaded', function() {
    const conteudoQR = document.getElementById('conteudoQR');
    const tamanhoQR = document.getElementById('tamanhoQR');
    const corQR = document.getElementById('corQR');
    const botaoGerar = document.getElementById('botaoGerar');
    const botaoBaixar = document.getElementById('botaoBaixar');
    const imagemQRCode = document.getElementById('imagemQRCode');
    const placeholderQR = document.getElementById('placeholderQR');
    const spinnerCarregamento = document.getElementById('spinnerCarregamento');
    const notificacao = document.getElementById('notificacao');
    const anoAtual = document.getElementById('anoAtual');
    const colorModal = document.getElementById('colorModal');
    const closeModal = colorModal.querySelector('.close');
    const colorSwatches = colorModal.querySelectorAll('.color-swatch');
// ano atual no rodapé

    // Detectar se é mobile
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    // Evento para abrir modal de cor em mobile
    corQR.addEventListener('click', function(e) {
        if (isMobile) {
            e.preventDefault();
            colorModal.style.display = 'block';
        }
    });

    // Fechar modal
    closeModal.addEventListener('click', () => colorModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === colorModal) colorModal.style.display = 'none';
    });

    // Selecionar cor no modal
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            corQR.value = swatch.dataset.color;
            colorModal.style.display = 'none';
        });
    });


    // Gerar QR Code
    botaoGerar.addEventListener('click', gerarQRCode);

    // Permitir Enter para gerar
    conteudoQR.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            gerarQRCode();
        }
    });

    // Função para gerar QR Code
    function gerarQRCode() {
        const conteudo = conteudoQR.value.trim();
        const tamanho = tamanhoQR.value;
        const cor = corQR.value.replace('#', '');
        
        if (!conteudo) {
            mostrarNotificacao('Por favor, insira algum conteúdo para o QR Code', 'error');
            conteudoQR.focus();
            return;
        }

        // Mostrar loading
        placeholderQR.style.display = 'none';
        imagemQRCode.style.display = 'none';
        spinnerCarregamento.style.display = 'block';
        
        // URL da API (QRCodeAPI)
        const urlAPI = `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&data=${encodeURIComponent(conteudo)}&color=${cor}`;
        
        // Definir a imagem
        imagemQRCode.onload = function() {
            spinnerCarregamento.style.display = 'none';
            imagemQRCode.style.display = 'block';
            botaoBaixar.disabled = false;
            mostrarNotificacao('QR Code gerado com sucesso!', 'success');
        };
        
        imagemQRCode.onerror = function() {
            spinnerCarregamento.style.display = 'none';
            placeholderQR.style.display = 'block';
            mostrarNotificacao('Erro ao gerar QR Code. Tente novamente.', 'error');
        };
        
        imagemQRCode.src = urlAPI;
    }

    // Baixar QR Code
    botaoBaixar.addEventListener('click', async function() {
        if (imagemQRCode.src && !botaoBaixar.disabled) {
            try {
                const response = await fetch(imagemQRCode.src);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const linkDownload = document.createElement('a');
                linkDownload.href = url;
                linkDownload.download = `qr-studio-${Date.now()}.png`;
                document.body.appendChild(linkDownload);
                linkDownload.click();
                document.body.removeChild(linkDownload);
                URL.revokeObjectURL(url);
                mostrarNotificacao('QR Code baixado com sucesso!', 'success');
            } catch (error) {
                mostrarNotificacao('Erro ao baixar QR Code.', 'error');
            }
        }
    });

    // Mostrar notificação
    function mostrarNotificacao(mensagem, tipo) {
        notificacao.textContent = mensagem;
        notificacao.style.backgroundColor = tipo === 'error' ? '#ff4757' : '#00b09b';
        notificacao.style.display = 'block';
        
        setTimeout(() => {
            notificacao.style.display = 'none';
        }, 3000);
    }

        setTimeout(() => {
        anoAtual.textContent = `${new Date().getFullYear()}`
    }, 100);

    // Gerar um QR Code inicial ao carregar a página
    gerarQRCode();
});