// Formulário de captura de leads
document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        interesse: document.getElementById('interesse').value
    };
    
    const button = document.querySelector('.cta-button');
    const originalText = button.textContent;
    button.textContent = 'Enviando...';
    button.disabled = true;
    
    try {
        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.sucesso) {
            showMessage('✅ Cadastro realizado! Verifique seu email.', 'success');
            document.getElementById('leadForm').reset();
            
            // Redirecionar para página de obrigado após 2 segundos
            setTimeout(() => {
                window.location.href = '/obrigado.html';
            }, 2000);
        } else {
            showMessage('❌ ' + result.erro, 'error');
        }
    } catch (error) {
        showMessage('❌ Erro ao enviar. Tente novamente.', 'error');
    }
    
    button.textContent = originalText;
    button.disabled = false;
});

function showMessage(message, type) {
    // Remove mensagens anteriores
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    const form = document.getElementById('leadForm');
    form.appendChild(messageDiv);
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Smooth scroll para links de navegação
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animação de entrada dos elementos
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animação aos elementos
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.phase, .testimonial');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Contador de visitantes (simulado)
function updateVisitorCount() {
    const count = Math.floor(Math.random() * 50) + 150;
    const visitorElement = document.getElementById('visitor-count');
    if (visitorElement) {
        visitorElement.textContent = count;
    }
}

// Atualizar contador a cada 30 segundos
setInterval(updateVisitorCount, 30000);
updateVisitorCount();