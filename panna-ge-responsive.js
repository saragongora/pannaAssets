/* ETAPA 24 — Responsividade das telas de gerenciamento (GE1 e GE2).
 * Código isolado: não altera a navegação nem o armazenamento de equipamentos.
 */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const corpo = document.body;
    // ETAPA 25: aplica o mesmo menu móvel às telas de cadastro/edição.
    if (!corpo.classList.contains('panna-ge') && !corpo.classList.contains('panna-ce')) return;
    const botao = document.getElementById('toggle-sidebar');
    const fundo = document.querySelector('.panna-ge-backdrop');
    const mobile = window.matchMedia('(max-width: 900px)');
    if (!botao || !fundo) return;

    // ETAPA 26: o menu já inicia fechado em todas as telas; aqui sincronizamos a camada móvel.
    function sincronizar(aoMudarTamanho = false) {
      if (mobile.matches && !aoMudarTamanho) corpo.classList.add('sidebar-collapsed');
      if (mobile.matches && aoMudarTamanho) corpo.classList.add('sidebar-collapsed');
      const aberto = !corpo.classList.contains('sidebar-collapsed');
      botao.setAttribute('aria-expanded', String(aberto));
      fundo.hidden = !mobile.matches || !aberto;
    }
    sincronizar();

    // ETAPA 24: o listener existente do panna.js abre/fecha o menu; este atualiza a camada.
    botao.addEventListener('click', () => sincronizarVisual());
    function sincronizarVisual() {
      const aberto = !corpo.classList.contains('sidebar-collapsed');
      fundo.hidden = !mobile.matches || !aberto;
    }
    // ETAPA 24: tocar fora do menu fecha a navegação lateral.
    fundo.addEventListener('click', () => {
      if (!corpo.classList.contains('sidebar-collapsed')) botao.click();
    });
    // ETAPA 24: tecla Escape fecha o menu quando estiver aberto no celular.
    document.addEventListener('keydown', evento => {
      if (evento.key === 'Escape' && mobile.matches && !corpo.classList.contains('sidebar-collapsed')) botao.click();
    });
    // ETAPA 24: ajusta a navegação quando a janela muda entre celular e desktop.
    mobile.addEventListener('change', () => sincronizar(true));
  });
})();
