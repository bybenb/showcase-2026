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
// ano atual no rodapé


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
    botaoBaixar.addEventListener('click', function() {
        if (imagemQRCode.src && !botaoBaixar.disabled) {
            const linkDownload = document.createElement('a');
            linkDownload.href = imagemQRCode.src;
            linkDownload.download = `qr-studio-${Date.now()}.png`;
            document.body.appendChild(linkDownload);
            linkDownload.click();
            document.body.removeChild(linkDownload);
            mostrarNotificacao('QR Code baixado com sucesso!', 'success');
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