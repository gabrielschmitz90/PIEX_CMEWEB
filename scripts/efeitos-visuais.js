const header = document.querySelector('header');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

function setActiveLink() {
  const links = document.querySelectorAll('nav a.nav-link');
  const currentFile = window.location.pathname.split('/').pop() || 'pagina-inicial.html';

  links.forEach(link => {
    link.classList.remove('active');
    const linkFile = link.getAttribute('href').split('/').pop();
    if (linkFile === currentFile) {
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', setActiveLink);

const searchInput = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');

if (searchButton && searchInput) {
  searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.classList.toggle('expanded');

    if (searchInput.classList.contains('expanded')) {
      searchInput.focus();
    } else {
      searchInput.blur();
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.classList.remove('expanded');
    }
  });
}

document.addEventListener('click', (e) => {
  const button = e.target.closest('.btn-ripple, .btn');

  if (button && !button.classList.contains('no-ripple')) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }
});

const revealElements = document.querySelectorAll('section, .card, .fade-in-stagger');

const revealOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -100px 0px'
};

const revealOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'slideInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
      entry.target.style.opacity = '0';

      setTimeout(() => {
        entry.target.style.opacity = '1';
      }, 10);

      revealOnScroll.unobserve(entry.target);
    }
  });
}, revealOptions);

revealElements.forEach(element => {
  revealOnScroll.observe(element);
});

const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');

dropdownTriggers.forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const menu = trigger.nextElementSibling;

    if (menu && menu.classList.contains('dropdown-menu')) {
      menu.classList.toggle('show');
    }
  });

  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !trigger.nextElementSibling?.contains(e.target)) {
      const menu = trigger.nextElementSibling;
      if (menu) menu.classList.remove('show');
    }
  });
});

window.addEventListener('load', () => {
  const loader = document.getElementById('loading-screen');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      loader.style.transition = 'opacity 0.5s ease-out';
    }, 500);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    const particlesContainer = document.createElement('div');
    particlesContainer.classList.add('hero-particles');

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');

      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.width = (Math.random() * 3 + 2) + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';

      particlesContainer.appendChild(particle);
    }

    heroSection.appendChild(particlesContainer);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const h1 = document.querySelector('.hero-content h1');
  if (h1) {
    const words = h1.textContent.split(' ');
    h1.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
  }
});

if (CSS.supports('scroll-behavior', 'smooth')) {
  document.documentElement.style.scrollBehavior = 'smooth';
}

if ('IntersectionObserver' in window) {
  const images = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}
