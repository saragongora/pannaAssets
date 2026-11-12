/* PANNA ASSETS — funcionalidades compartilhadas.
 * Os dados iniciais ficam em equipamentos-iniciais.js; alterações feitas no navegador
 * ficam no localStorage. Sem servidor, os dados NÃO são compartilhados entre computadores.
 */
(() => {
    'use strict';
    const STORAGE_KEY = 'panna-assets-equipamentos-v1';
    const MENU_KEY = 'panna-assets-menu-recolhido';
    const $ = (selector) => document.querySelector(selector);
    const campo = (id) => document.getElementById(id)?.value.trim() || '';

    // Lê a lista armazenada;
    function listarEquipamentos() {
        try {
            const salvo = localStorage.getItem(STORAGE_KEY);
            if (salvo !== null) {
                const lista = JSON.parse(salvo);
                if (Array.isArray(lista)) return lista;
            }
        } catch (erro) { console.warn('PANNA: dados locais inválidos.', erro); }
        return (window.PANNA_EQUIPAMENTOS_INICIAIS || []).map(item => ({...item}));
    }
    function salvarEquipamentos(lista) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    }
    // Menu: o estado é preservado durante a navegação entre as telas.
    function iniciarMenu() {
        const botao = $('#toggle-sidebar');
        if (!botao) return;
        const atualizar = (recolhido) => {
            document.body.classList.toggle('sidebar-collapsed', recolhido);
            botao.setAttribute('aria-expanded', String(!recolhido));
            botao.title = recolhido ? 'Mostrar menu lateral' : 'Ocultar menu lateral';
        };
        atualizar(localStorage.getItem(MENU_KEY) === 'true');
        botao.addEventListener('click', () => {
            const recolhido = !document.body.classList.contains('sidebar-collapsed');
            atualizar(recolhido);
            localStorage.setItem(MENU_KEY, String(recolhido));
        });
    }
    // Completa apenas os selects que estavam sem opções no protótipo original.
    function iniciarOpcoesCadastro() {
        const opcoes = {
            'equipment-group-equip': ['Aspiradores','Tratores','Betoneiras','Medição','Enceradeiras','Esmerilhadeiras','Outros'],
            'equipment-location': ['Toyota Sorocaba','ZF Sorocaba','Clarios Sorocaba','Dana Sorocaba','Emphasis Sorocaba','Dana Itu','Outros'],
            'equipment-type-maintenance': ['Troca de óleo','Troca de filtro','Revisão elétrica','Lubrificação','Inspeção','Outros'],
            'periodicity': ['Semanal','Mensal','Trimestral','Semestral','Anual']
        };
        Object.entries(opcoes).forEach(([id, valores]) => {
            const select = document.getElementById(id);
            if (!select) return;
            valores.forEach(valor => {
                if ([...select.options].some(o=>o.value===valor)) return;
                const option=document.createElement('option'); option.value=valor; option.textContent=valor; select.append(option);
            });
        });
    }
    // Cadastra um equipamento sem alterar os campos e o visual do formulário existente.
    function iniciarCadastro() {
        const botao = $('#submit-equipment');
        if (!botao) return;
        botao.addEventListener('click', () => {
            const nome = campo('equipment-name');
            const patrimonio = campo('equipment-heritage');
            if (!nome) { alert('Informe o nome do equipamento.'); $('#equipment-name').focus(); return; }
            const lista = listarEquipamentos();
            if (patrimonio && lista.some(e => e.patrimonio === patrimonio)) {
                alert('Já existe um equipamento com este patrimônio.'); return;
            }
            const codigo = 'EQP-' + String(Date.now()).slice(-10);
            const equipamento = {
                codigo, nome, patrimonio, marca: campo('equipment-brand'), modelo: campo('equipment-model'),
                numeroSerie: campo('equipment-num-serial'), grupo: campo('equipment-group-equip'),
                voltagem: campo('equipment-voltage'), potencia: campo('equipment-power'),
                fornecedor: campo('equipment-supplier'), valorAquisicao: campo('equipment-cost-acquis'),
                dataAquisicao: campo('equipment-date-acquis'), fimGarantia: campo('equipment-warranty-end'),
                localizacao: campo('equipment-location'), responsavel: campo('equipment-answerable'),
                observacoes: campo('equipment-techinical-notes'), notaFiscal: campo('equipment-invoice'),
                garantia: campo('equipment-warranty'), foto: campo('equipment-photo'),
                tipoManutencao: campo('equipment-type-maintenance'), periodicidade: campo('periodicity'),
                insumo: campo('equipment-supply'), avisoAntecipado: campo('early-warning'),
                proximaPreventiva: '', situacao: 'Em funcionamento', criadoEm: new Date().toISOString()
            };
            lista.push(equipamento);
            try { salvarEquipamentos(lista); }
            catch (erro) { alert('Não foi possível salvar no navegador. Verifique o armazenamento disponível.'); return; }
            sessionStorage.setItem('panna-ultimo-cadastro', codigo);
            window.location.href = 'CE2.html';
        });
    }
    function dataBR(valor) {
        if (!valor) return 'Não definida';
        if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor.split('-').reverse().join('/');
        return valor;
    }
    // A tabela é montada usando textContent para impedir a execução de HTML digitado no cadastro.
    function iniciarGerenciamento() {
        const tbody = $('.equipment-table__grid tbody');
        if (!tbody) return;
        const pesquisa = $('#equipment-search');
        const filtro = $('#all-situation');
        let lista = listarEquipamentos();
        const classes = {'Em funcionamento':'functioning','Em manutenção':'maintenance','Parado':'stopped','Inativo':'inactive'};
        const filtros = {'in-operation-sit':'Em funcionamento','under-maintenance':'Em manutenção','stopped-sit':'Parado','inactive-sit':'Inativo'};
        function renderizar() {
            tbody.replaceChildren();
            const busca = (pesquisa?.value || '').toLocaleLowerCase('pt-BR');
            const situacao = filtros[filtro?.value];
            const visiveis = lista.filter(e => (!situacao || e.situacao === situacao) &&
                [e.codigo,e.nome,e.grupo,e.localizacao,e.patrimonio].some(v => String(v || '').toLocaleLowerCase('pt-BR').includes(busca)));
            for (const e of visiveis) {
                const tr = document.createElement('tr'); tr.className = 'equipment-table__tr';
                for (const valor of [e.codigo,e.nome,e.grupo,e.localizacao,e.voltagem,dataBR(e.proximaPreventiva)]) {
                    const td = document.createElement('td'); td.textContent = valor || '—'; tr.append(td);
                }
                const tdStatus = document.createElement('td');
                const badge = document.createElement('span'); badge.className = 'status-badge ' + (classes[e.situacao] || 'functioning');
                badge.textContent = '• ' + (e.situacao || 'Em funcionamento'); tdStatus.append(badge); tr.append(tdStatus);
                const acoes = document.createElement('td');
                // Os botões originais são mantidos visualmente, mas suas ações serão desenvolvidas na próxima etapa.
                const grupo = document.createElement('div'); grupo.className = 'equipament-table__buttons';
                for (const [classe,icone,rotulo] of [['edit','icon_edit.svg','Editar'],['enable-disable','icon_enable_disable.png','Ativar ou desativar'],['delete','icon_delete.svg','Excluir']]) {
                    const botao = document.createElement('button'); botao.type='button'; botao.className='equipament-table__'+classe;
                    botao.title = rotulo + ' (funcionalidade futura)'; botao.setAttribute('aria-label',rotulo + ' ' + e.nome);
                    const img=document.createElement('img'); img.src='assets/'+icone; img.alt=rotulo; img.width=20; botao.append(img); grupo.append(botao);
                }
                acoes.append(grupo); tr.append(acoes); tbody.append(tr);
            }
            const quantidade = $('.equipment-table__title-group span');
            if (quantidade) quantidade.textContent = visiveis.length + ' registros encontrados';
            const cards = document.querySelectorAll('.equipment-summary__card .title-h1--ge');
            if (cards.length >= 4) {
                const totais = [lista.length,lista.filter(e=>e.situacao==='Em funcionamento').length,lista.filter(e=>e.situacao==='Em manutenção').length,lista.filter(e=>['Parado','Inativo'].includes(e.situacao)).length];
                cards.forEach((card,i)=>card.textContent=totais[i]);
            }
        }
        pesquisa?.addEventListener('input',renderizar);
        filtro?.addEventListener('change',renderizar);
        renderizar();
    }
    // Mostra na tela de confirmação o equipamento recém-cadastrado.
    function iniciarConfirmacao() {
        if (!location.pathname.endsWith('CE2.html')) return;
        const codigo = sessionStorage.getItem('panna-ultimo-cadastro');
        const item = listarEquipamentos().find(e=>e.codigo===codigo);
        if (!item) return;
        const titulo = $('.register-form__finish')?.previousElementSibling;
        if (titulo) {
            const h2 = titulo.querySelector('h2'); const h4 = titulo.querySelector('h4');
            if (h2) h2.textContent = item.nome;
            if (h4) h4.textContent = item.codigo;
        }
        const ver = [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Ver Equipamento');
        if (ver) ver.addEventListener('click',()=>location.href='GE1.html');
    }
    document.addEventListener('DOMContentLoaded', () => {
        iniciarMenu(); iniciarOpcoesCadastro(); iniciarCadastro(); iniciarGerenciamento(); iniciarConfirmacao();
    });
})();
