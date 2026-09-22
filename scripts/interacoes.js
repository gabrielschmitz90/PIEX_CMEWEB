document.addEventListener('DOMContentLoaded', function () {

  const filterBtns = document.querySelectorAll('[data-filter-btn]');
  const filterItems = document.querySelectorAll('[data-category]');

  if (filterBtns.length > 0) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filtro = this.dataset.filterBtn;

        filterBtns.forEach(function (b) {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline');
        });
        this.classList.remove('btn-outline');
        this.classList.add('btn-primary');

        filterItems.forEach(function (item) {
          if (filtro === 'todos' || item.dataset.category === filtro) {
            item.style.display = '';
            item.style.animation = 'fadeIn 0.3s ease';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  var buscaBiblioteca = document.getElementById('buscaBiblioteca');
  if (buscaBiblioteca) {
    buscaBiblioteca.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();
      document.querySelectorAll('[data-category]').forEach(function (card) {
        var texto = card.textContent.toLowerCase();
        card.style.display = (!query || texto.includes(query)) ? '' : 'none';
      });
    });
  }

  var formContato = document.getElementById('formContato');
  if (formContato) {
    formContato.addEventListener('submit', function (e) {
      e.preventDefault();

      var nome     = (formContato.querySelector('#nome')     || {}).value || '';
      var email    = (formContato.querySelector('#email')    || {}).value || '';
      var mensagem = (formContato.querySelector('#mensagem') || {}).value || '';

      nome     = nome.trim();
      email    = email.trim();
      mensagem = mensagem.trim();

      if (!nome || !email || !mensagem) return;

      var submitBtn = formContato.querySelector('[type="submit"]');
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;

      setTimeout(function () {
        formContato.innerHTML =
          '<div class="alert alert-success" style="text-align:center;padding:40px;">' +
            '<h4 style="color:var(--color-success);margin-bottom:10px;">Mensagem Enviada! ✓</h4>' +
            '<p>Obrigado, <strong>' + nome + '</strong>! Entraremos em contato em breve no e-mail <strong>' + email + '</strong>.</p>' +
          '</div>';
      }, 800);
    });
  }

  var btnCalendario = document.getElementById('btnCalendario');
  if (btnCalendario) {
    btnCalendario.addEventListener('click', function () {
      var proximosEventos = document.getElementById('proximosEventos');
      if (proximosEventos) {
        proximosEventos.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

});
