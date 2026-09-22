document.addEventListener('DOMContentLoaded', function() {
  const toggle  = document.getElementById('navToggle');
  const nav     = document.querySelector('nav');
  const overlay = document.getElementById('navOverlay');

  if (toggle && nav) {
    function abrirMenu() {
      toggle.classList.add('open');
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      if (overlay) overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function fecharMenu() {
      toggle.classList.remove('open');
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.classList.remove('show');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () =>
      nav.classList.contains('open') ? fecharMenu() : abrirMenu()
    );

    if (overlay) overlay.addEventListener('click', fecharMenu);

    nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', fecharMenu));

    document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenu(); });
  }
});

function validarFormulario(form) {
  const nome = form.querySelector('#nome');
  const email = form.querySelector('#email');
  const mensagem = form.querySelector('#mensagem');

  if (!nome.value.trim()) {
    alert('Por favor, preencha o campo Nome');
    return false;
  }

  if (!email.value.includes('@')) {
    alert('Por favor, preencha um email válido');
    return false;
  }

  if (!mensagem.value.trim()) {
    alert('Por favor, preencha a mensagem');
    return false;
  }

  return true;
}

function toggleMenu() {
  const nav = document.querySelector('nav');
  nav.classList.toggle('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

const animateOnScroll = () => {
  const elements = document.querySelectorAll('.card, .animate-on-scroll');

  elements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (elementTop < windowHeight) {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }
  });
};

window.addEventListener('scroll', animateOnScroll);
