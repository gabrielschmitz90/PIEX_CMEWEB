// Galeria estática: amplia a foto clicada em uma janela (<dialog>).
(function () {
  var modal = document.getElementById('galeriaModal');
  var modalImg = document.getElementById('galeriaModalImg');
  var modalLegenda = document.getElementById('galeriaModalLegenda');
  var fechar = document.getElementById('galeriaFechar');
  if (!modal || typeof modal.showModal !== 'function') return;

  document.querySelectorAll('.galeria-botao').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var img = botao.querySelector('img');
      if (!img) return; // foto ainda não adicionada
      modalImg.src = img.src;
      modalImg.alt = img.alt;
      modalLegenda.textContent = botao.dataset.legenda || '';
      modal.showModal();
    });
  });

  fechar.addEventListener('click', function () { modal.close(); });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.close(); // clique fora da foto
  });
})();