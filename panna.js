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

    // Lê a lista armazenada; na primeira utilização copia os exemplos da tela original.
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
    // Os mesmos campos de CE1 são usados para cadastrar e editar, evitando duplicar o formulário.
    const CAMPOS = {
        nome:'equipment-name', marca:'equipment-brand', modelo:'equipment-model',
        numeroSerie:'equipment-num-serial', patrimonio:'equipment-heritage', grupo:'equipment-group-equip',
        voltagem:'equipment-voltage', potencia:'equipment-power', fornecedor:'equipment-supplier',
        valorAquisicao:'equipment-cost-acquis', dataAquisicao:'equipment-date-acquis',
        fimGarantia:'equipment-warranty-end', localizacao:'equipment-location',
        responsavel:'equipment-answerable', observacoes:'equipment-techinical-notes',
        notaFiscal:'equipment-invoice', garantia:'equipment-warranty', foto:'equipment-photo',
        tipoManutencao:'equipment-type-maintenance', periodicidade:'periodicity',
        insumo:'equipment-supply', avisoAntecipado:'early-warning'
    };
    const urlDetalhe = codigo => 'GE2.html?codigo=' + encodeURIComponent(codigo);
    function selecionarValor(id, valor) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT' && valor && ![...el.options].some(o => o.value === valor)) {
            const option = new Option(valor, valor); el.add(option);
        }
        el.value = valor || '';
    }
    // Cadastra um equipamento sem alterar os campos e o visual do formulário existente.
    function iniciarCadastro() {
        const botao = $('#submit-equipment');
        if (!botao) return;
        const codigoEdicao = new URLSearchParams(location.search).get('editar');
        const original = codigoEdicao ? listarEquipamentos().find(e => e.codigo === codigoEdicao) : null;
        if (codigoEdicao && !original) { alert('Equipamento não encontrado para edição.'); location.href = 'GE1.html'; return; }
        if (original) {
            Object.entries(CAMPOS).forEach(([chave, id]) => selecionarValor(id, original[chave]));
            const titulo = $('.main-content > .title-h1');
            if (titulo) titulo.textContent = 'Editar equipamento';
            botao.textContent = 'Salvar alterações';
            const cancelar = $('.button--cancel');
            if (cancelar) cancelar.onclick = () => location.href = urlDetalhe(codigoEdicao);
        }
        botao.addEventListener('click', () => {
            const nome = campo('equipment-name');
            const patrimonio = campo('equipment-heritage');
            if (!nome) { alert('Informe o nome do equipamento.'); $('#equipment-name').focus(); return; }
            const lista = listarEquipamentos();
            if (patrimonio && lista.some(e => e.patrimonio === patrimonio && e.codigo !== codigoEdicao)) {
                alert('Já existe um equipamento com este patrimônio.'); return;
            }
            const codigo = original ? original.codigo : 'EQP-' + String(Date.now()).slice(-10);
            // Preserva informações de outras telas (histórico, situação, preventiva etc.) na edição.
            const equipamento = original ? {...original} : {
                codigo, proximaPreventiva:'', situacao:'Em funcionamento', criadoEm:new Date().toISOString()
            };
            Object.entries(CAMPOS).forEach(([chave, id]) => {
                // Campos de anexos são apenas demonstrativos; não substituímos referências antigas vazias.
                const valor = campo(id);
                if (!['notaFiscal','garantia','foto'].includes(chave) || valor) equipamento[chave] = valor;
            });
            if (original) {
                equipamento.atualizadoEm = new Date().toISOString();
                lista[lista.findIndex(e => e.codigo === codigoEdicao)] = equipamento;
            } else lista.push(equipamento);
            try { salvarEquipamentos(lista); }
            catch (erro) { alert('Não foi possível salvar no navegador. Verifique o armazenamento disponível.'); return; }
            if (original) location.href = urlDetalhe(codigo);
            else {
                sessionStorage.setItem('panna-ultimo-cadastro', codigo);
                location.href = 'CE2.html';
            }
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
                tr.classList.add('panna-clickable-row'); tr.tabIndex = 0;
                tr.title = 'Abrir detalhes de ' + e.nome;
                tr.addEventListener('click', event => {
                    if (!event.target.closest('button')) location.href = urlDetalhe(e.codigo);
                });
                tr.addEventListener('keydown', event => {
                    if (event.target === tr && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault(); location.href = urlDetalhe(e.codigo);
                    }
                });
                for (const valor of [e.codigo,e.nome,e.grupo,e.localizacao,e.voltagem,dataBR(e.proximaPreventiva)]) {
                    const td = document.createElement('td'); td.textContent = valor || '—'; tr.append(td);
                }
                const tdStatus = document.createElement('td');
                const badge = document.createElement('span'); badge.className = 'status-badge ' + (classes[e.situacao] || 'functioning');
                badge.textContent = '• ' + (e.situacao || 'Em funcionamento'); tdStatus.append(badge); tr.append(tdStatus);
                const acoes = document.createElement('td');
                // Mantemos os ícones originais. A edição agora reutiliza CE1; as demais ações ficam para depois.
                const grupo = document.createElement('div'); grupo.className = 'equipament-table__buttons';
                for (const [classe,icone,rotulo] of [['edit','icon_edit.svg','Editar'],['enable-disable','icon_enable_disable.png','Ativar ou desativar'],['delete','icon_delete.svg','Excluir']]) {
                    const botao = document.createElement('button'); botao.type='button'; botao.className='equipament-table__'+classe;
                    botao.title = classe === 'edit' ? rotulo : rotulo + ' (funcionalidade futura)'; botao.setAttribute('aria-label',rotulo + ' ' + e.nome);
                    const img=document.createElement('img'); img.src='assets/'+icone; img.alt=rotulo; img.width=20; botao.append(img);
                    if (classe === 'edit') botao.addEventListener('click', () => location.href = 'CE1.html?editar=' + encodeURIComponent(e.codigo));
                    grupo.append(botao);
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
        if (ver) ver.addEventListener('click',()=>location.href=urlDetalhe(codigo));
    }
    // ETAPA 3 — Datas aceitas: AAAA-MM-DD (formulário) e DD/MM/AAAA (dados antigos).
    // A comparação usa o calendário local, evitando diferença de um dia por fuso horário.
    function pannaLerData(valor) {
        if (!valor || valor === '-') return null;
        const texto = String(valor).slice(0, 10);
        const partes = texto.includes('/') ? texto.split('/').reverse() : texto.split('-');
        if (partes.length !== 3) return null;
        const [ano, mes, dia] = partes.map(Number);
        const data = new Date(ano, mes - 1, dia);
        return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null;
    }
    function pannaDataFormatada(data) { return data ? data.toLocaleDateString('pt-BR') : 'Não informada'; }
    function pannaDiasEntre(inicio, fim) {
        const diaUTC = d => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        return Math.round((diaUTC(fim) - diaUTC(inicio)) / 86400000);
    }
    function pannaPeriodicidadeDias(valor) {
        return ({'Diária':1,'Semanal':7,'Quinzenal':15,'Mensal':30,'Bimestral':60,
            'Trimestral':90,'Semestral':180,'Anual':365})[valor] || null;
    }
    function pannaAdicionarCampo(container, rotulo, valor) {
        const div = document.createElement('div'); div.className = 'panna-detail-field';
        const label = document.createElement('span'); label.textContent = rotulo;
        const texto = document.createElement('strong'); texto.textContent = valor || 'Não informado';
        div.append(label, texto); container.append(div);
    }
    // GE2: utiliza sempre o registro atual do localStorage, inclusive após uma edição.
    function iniciarDetalhes() {
        const raiz = $('#panna-detalhes');
        if (!raiz) return;
        const codigo = new URLSearchParams(location.search).get('codigo');
        const item = listarEquipamentos().find(e => e.codigo === codigo);
        if (!item) {
            raiz.replaceChildren();
            const aviso = document.createElement('p');
            aviso.textContent = 'Equipamento não encontrado. Volte ao gerenciamento e selecione outro item.';
            raiz.append(aviso);
            $('.panna-detail-aside').hidden = true;
            return;
        }
        $('#panna-detalhe-nome').textContent = item.nome || 'Equipamento';
        $('#panna-detalhe-codigo').textContent = item.codigo;
        $('#panna-detalhe-local').textContent = item.localizacao || 'Local não informado';
        const situacao = $('#panna-detalhe-situacao');
        situacao.textContent = item.situacao || 'Não informada';
        situacao.classList.add(({'Em funcionamento':'panna-status-ok','Em manutenção':'panna-status-warning',
            'Parado':'panna-status-danger','Inativo':'panna-status-muted'})[item.situacao] || 'panna-status-muted');
        $('#panna-editar').href = 'CE1.html?editar=' + encodeURIComponent(item.codigo);
        const grupos = [
            ['#panna-campos-equipamento', [
                ['Nome',item.nome],['Marca',item.marca],['Modelo',item.modelo],
                ['Número de série',item.numeroSerie],['Grupo',item.grupo],['Patrimônio',item.patrimonio],
                ['Voltagem',item.voltagem],['Potência',item.potencia],['Fornecedor',item.fornecedor],
                ['Valor de aquisição',item.valorAquisicao],['Data de aquisição',pannaDataFormatada(pannaLerData(item.dataAquisicao))],
                ['Fim da garantia',pannaDataFormatada(pannaLerData(item.fimGarantia))],
                ['Localização',item.localizacao],['Responsável',item.responsavel],
                ['Observações técnicas',item.observacoes]
            ]],
            ['#panna-campos-manutencao', [
                ['Tipo de manutenção',item.tipoManutencao],['Periodicidade',item.periodicidade],
                ['Insumo',item.insumo],['Aviso antecipado',item.avisoAntecipado]
            ]]
        ];
        grupos.forEach(([seletor, campos]) => {
            const container = $(seletor);
            campos.forEach(([rotulo, valor]) => pannaAdicionarCampo(container, rotulo, valor));
        });
        // Próxima preventiva: somente uma data cadastrada é exibida como agendada.
        // Nunca inventamos um agendamento a partir da periodicidade isolada.
        const prevista = pannaLerData(item.proximaPreventiva);
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const dias = prevista ? pannaDiasEntre(hoje, prevista) : null;
        $('#panna-dias-preventiva').textContent = dias === null ? '—' : Math.abs(dias);
        $('#panna-dias-unidade').textContent = dias === null ? 'sem previsão' : dias < 0 ? 'dias de atraso' : dias === 0 ? 'vence hoje' : 'dias restantes';
        $('#panna-data-preventiva').textContent = prevista ? 'Data prevista: ' + pannaDataFormatada(prevista) : 'Nenhuma preventiva agendada';
        const periodo = pannaPeriodicidadeDias(item.periodicidade);
        $('#panna-regra-preventiva').textContent = item.periodicidade ? 'Periodicidade: ' + item.periodicidade + (item.tipoManutencao ? ' · ' + item.tipoManutencao : '') : 'Periodicidade não informada';
        const progresso = $('#panna-progresso-preventiva');
        // Barra indicativa baseada na periodicidade, quando informada; caso contrário, sem porcentagem fictícia.
        const porcentagem = dias === null || !periodo ? 0 : Math.max(0, Math.min(100, Math.round((periodo - dias) / periodo * 100)));
        progresso.style.width = porcentagem + '%';
        $('.panna-progress').setAttribute('aria-valuenow', String(porcentagem));
        const alerta = $('#panna-alerta-preventiva');
        if (dias === null) { alerta.textContent = 'Sem manutenção programada'; alerta.className = 'panna-preventiva-alerta panna-alerta-neutral'; }
        else if (dias < 0) { alerta.textContent = 'Preventiva atrasada'; alerta.className = 'panna-preventiva-alerta panna-alerta-danger'; }
        else if (dias <= 7) { alerta.textContent = 'Preventiva próxima'; alerta.className = 'panna-preventiva-alerta panna-alerta-warning'; }
        else { alerta.textContent = 'Preventiva programada'; alerta.className = 'panna-preventiva-alerta panna-alerta-ok'; }
        $('#panna-qr-codigo').textContent = item.codigo;
        $('#panna-qr-nome').textContent = item.nome || 'Equipamento';
        // O histórico permanece vazio até a implementação dos registros de eventos.
        $('#panna-historico').textContent = 'Ainda não há eventos registrados para este equipamento.';
    }
    document.addEventListener('DOMContentLoaded', () => {
        iniciarMenu(); iniciarOpcoesCadastro(); iniciarCadastro(); iniciarGerenciamento(); iniciarConfirmacao(); iniciarDetalhes();
    });
})();
