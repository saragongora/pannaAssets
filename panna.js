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
    // ETAPA 5 — modelo: equipamento.planosPreventivos = [{id,tipo,periodicidade,dataPrevista,avisoAntecipado,insumos:[{nome,quantidade,unidade}]}].
    // Migração em memória: cadastros antigos continuam legíveis, sem regravar o localStorage até salvar.
    function planosDoEquipamento(e) {
        if (Array.isArray(e.planosPreventivos)) return e.planosPreventivos;
        if (!e.tipoManutencao && !e.periodicidade && !e.insumo && !e.proximaPreventiva) return [];
        return [{id:'legado-'+e.codigo, tipo:e.tipoManutencao||'', periodicidade:e.periodicidade||'',
            dataPrevista:e.proximaPreventiva||'', avisoAntecipado:e.avisoAntecipado||'',
            insumos:e.insumo?[{nome:e.insumo,quantidade:1,unidade:'un'}]:[]}];
    }
    const criarIdPlano = () => 'prev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
    // ETAPA 6 — sugestões de preventivas por grupo. São sugestões editáveis,
    // não regras obrigatórias: cada equipe pode acrescentar outras opções.
    const TIPOS_PREVENTIVA_POR_GRUPO = {
        aspiradores:['Troca de filtro','Limpeza do reservatório','Inspeção de mangueiras','Revisão elétrica','Inspeção do motor'],
        medicao:['Calibração','Verificação metrológica','Inspeção de sensores','Teste de precisão','Limpeza técnica'],
        tratores:['Troca de óleo','Troca de filtros','Lubrificação','Inspeção hidráulica','Revisão de freios'],
        betoneiras:['Lubrificação','Inspeção de correias','Limpeza do tambor','Revisão elétrica'],
        enceradeiras:['Troca de escovas','Inspeção do disco','Revisão elétrica','Lubrificação'],
        esmerilhadeiras:['Inspeção do disco','Inspeção de rolamentos','Revisão elétrica','Limpeza técnica']
    };
    const TIPOS_GERAIS = ['Inspeção geral','Limpeza','Lubrificação','Troca de filtro','Revisão elétrica','Calibração','Outros'];
    const UNIDADES_INSUMO = ['un','ml','L','mg','g','kg','mm','cm','m','m²','m³','par','jogo','kit','rolo'];
    function iniciarEditorPreventivas(original) {
        const lista = $('#panna-lista-planos');
        if (!lista) return () => [];
        const planos = structuredClone(planosDoEquipamento(original||{})).map(p=>({...p,insumos:p.insumos||[],_salvo:true}));
        const periodos=['Diária','Semanal','Quinzenal','Mensal','Bimestral','Trimestral','Semestral','Anual'];
        let aberto=null;
        const grupoSelect=$('#equipment-group-equip');
        const normalizar=v=>(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        function sugestoes() {
            const grupo=normalizar(grupoSelect?.value);
            const chave=Object.keys(TIPOS_PREVENTIVA_POR_GRUPO).find(k=>grupo.includes(k));
            return [...new Set([...(TIPOS_PREVENTIVA_POR_GRUPO[chave]||[]),...TIPOS_GERAIS])];
        }
        function seletor(opcoes,valor) {
            const select=document.createElement('select');select.className='register-form__input';
            select.add(new Option('Selecione',''));
            opcoes.forEach(v=>select.add(new Option(v,v)));
            if(valor&&!opcoes.includes(valor))select.add(new Option(valor,valor));
            select.value=valor||'';return select;
        }
        function campoPlano(rotulo,controle) {
            const label=document.createElement('label');label.className='panna-plano-campo';
            const span=document.createElement('span');span.textContent=rotulo;
            label.append(span,controle);return label;
        }
        function validar(p,indice) {
            if(!p.tipo||!p.periodicidade||!p.dataPrevista){alert('Preencha tipo, periodicidade e próxima data da preventiva '+(indice+1)+'.');return false;}
            for(const insumo of p.insumos){
                if(!String(insumo.nome||'').trim()||!(Number(insumo.quantidade)>0)||!String(insumo.unidade||'').trim()){
                    alert('Preencha nome, quantidade e unidade de todos os insumos da preventiva '+(indice+1)+'.');return false;
                }
            }
            return true;
        }
        // ETAPA 7: ícones SVG locais, sem dependência de bibliotecas externas.
        // O texto acessível permanece em aria-label/title, mesmo sem botão textual.
        function botaoIcone(nome, titulo, acao) {
            const botao=document.createElement('button');
            botao.type='button';
            botao.className='panna-icone-acao panna-icone-'+nome;
            botao.setAttribute('aria-label',titulo);
            botao.title=titulo;
            const caminhos={
                editar:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
                excluir:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 10v6"/><path d="M14 10v6"/>'
            };
            botao.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+caminhos[nome]+'</svg>';
            botao.onclick=acao;
            return botao;
        }
        function render() {
            lista.replaceChildren();
            if(!planos.length){const vazio=document.createElement('p');vazio.className='panna-planos-vazio';vazio.textContent='Nenhuma preventiva cadastrada.';lista.append(vazio);}
            planos.forEach((p,i)=>{
                const card=document.createElement('article');card.className='panna-plano-card'+(aberto===p.id?' panna-plano-aberto':'');
                const cab=document.createElement('div');cab.className='panna-plano-topo panna-plano-cabecalho';
                const titulo=document.createElement('button');titulo.type='button';titulo.className='panna-plano-toggle';
                titulo.textContent=(p._salvo?'▸ ':'▾ ')+(p.tipo||'Nova preventiva')+' · '+(p.periodicidade||'Sem periodicidade')+(p.dataPrevista?' · '+p.dataPrevista:'');
                titulo.setAttribute('aria-expanded',String(aberto===p.id));titulo.onclick=()=>{aberto=aberto===p.id?null:p.id;render();};
                const acoes=document.createElement('div');acoes.className='panna-plano-acoes';
                const editar=botaoIcone('editar','Editar preventiva',()=>{p._salvo=false;aberto=p.id;render();});
                const excluir=botaoIcone('excluir','Excluir preventiva',()=>{if(confirm('Excluir esta manutenção preventiva?')){planos.splice(i,1);if(aberto===p.id)aberto=null;render();}});
                if(p._salvo)acoes.append(editar);acoes.append(excluir);cab.append(titulo,acoes);card.append(cab);
                if(aberto===p.id){
                    const grid=document.createElement('div');grid.className='panna-plano-grid';
                    const tipo=seletor(sugestoes(),p.tipo);tipo.onchange=()=>{p.tipo=tipo.value;p._salvo=false;};
                    const periodo=seletor(periodos,p.periodicidade);periodo.onchange=()=>{p.periodicidade=periodo.value;p._salvo=false;};
                    const data=document.createElement('input');data.type='date';data.className='register-form__input';data.value=normalizarDataISO(p.dataPrevista);data.onchange=()=>{p.dataPrevista=data.value;p._salvo=false;};
                    const aviso=seletor(['7 dias','15 dias','30 dias'],p.avisoAntecipado);aviso.onchange=()=>{p.avisoAntecipado=aviso.value;p._salvo=false;};
                    grid.append(campoPlano('Tipo de manutenção',tipo),campoPlano('Periodicidade',periodo),campoPlano('Próxima data prevista',data),campoPlano('Aviso antecipado',aviso));card.append(grid);
                    const linhaTopo=document.createElement('div');linhaTopo.className='panna-plano-topo';
                    const subt=document.createElement('h4');subt.textContent='Insumos necessários';
                    const adicionar=document.createElement('button');adicionar.type='button';adicionar.className='panna-outline-btn';adicionar.textContent='+ Insumo';adicionar.onclick=()=>{p.insumos.push({nome:'',quantidade:1,unidade:'un'});p._salvo=false;render();};
                    linhaTopo.append(subt,adicionar);card.append(linhaTopo);
                    p.insumos.forEach((insumo,j)=>{
                        const linha=document.createElement('div');linha.className='panna-insumo-linha';
                        const nome=document.createElement('input');nome.className='register-form__input';nome.placeholder='Nome do insumo';nome.setAttribute('aria-label','Nome do insumo');nome.value=insumo.nome||'';nome.oninput=()=>{insumo.nome=nome.value;p._salvo=false;};
                        const qtd=document.createElement('input');qtd.className='register-form__input';qtd.type='number';qtd.min='0.01';qtd.step='any';qtd.placeholder='Qtd.';qtd.setAttribute('aria-label','Quantidade');qtd.value=insumo.quantidade??1;qtd.oninput=()=>{insumo.quantidade=qtd.value;p._salvo=false;};
                        const unidade=seletor(UNIDADES_INSUMO,insumo.unidade||'un');unidade.setAttribute('aria-label','Unidade');unidade.onchange=()=>{insumo.unidade=unidade.value;p._salvo=false;};
                        const remover=botaoIcone('excluir','Remover insumo',()=>{p.insumos.splice(j,1);p._salvo=false;render();});
                        linha.append(nome,qtd,unidade,remover);card.append(linha);
                    });
                    const salvar=document.createElement('button');salvar.type='button';salvar.className='panna-yellow-btn panna-salvar-plano';salvar.textContent='Salvar preventiva';
                    salvar.onclick=()=>{if(!validar(p,i))return;p._salvo=true;aberto=null;render();};card.append(salvar);
                }
                lista.append(card);
            });
        }
        $('#panna-adicionar-plano').addEventListener('click',()=>{
            const p={id:criarIdPlano(),tipo:'',periodicidade:'',dataPrevista:'',avisoAntecipado:'',insumos:[],_salvo:false};
            planos.push(p);aberto=p.id;render();
        });
        // Atualiza as sugestões quando o grupo mudar; mantém valores já escolhidos.
        grupoSelect?.addEventListener('change',()=>{if(aberto!==null)render();});
        render();
        return () => {
            for(let i=0;i<planos.length;i++){
                if(!validar(planos[i],i))return null;
                if(!planos[i]._salvo){alert('Clique em “Salvar preventiva” antes de salvar o equipamento.');return null;}
            }
            return planos.map(({_salvo,...p})=>structuredClone(p));
        };
    }
    function normalizarDataISO(data) {
        if(/^\d{4}-\d{2}-\d{2}$/.test(data||''))return data;
        if(/^\d{2}\/\d{2}\/\d{4}$/.test(data||'')){const [d,m,a]=data.split('/');return a+'-'+m+'-'+d;}
        return '';
    }
    // Cadastra um equipamento sem alterar os campos e o visual do formulário existente.
    function iniciarCadastro() {
        const botao = $('#submit-equipment');
        if (!botao) return;
        const codigoEdicao = new URLSearchParams(location.search).get('editar');
        const original = codigoEdicao ? listarEquipamentos().find(e => e.codigo === codigoEdicao) : null;
        if (codigoEdicao && !original) { alert('Equipamento não encontrado para edição.'); location.href = 'GE1.html'; return; }
        const lerPlanos = iniciarEditorPreventivas(original);
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
            const planos = lerPlanos();
            if (planos === null) return;
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
            equipamento.planosPreventivos = planos;
            // Compatibilidade com telas antigas: a próxima data é a menor data cadastrada.
            const proximas = planos.map(p=>normalizarDataISO(p.dataPrevista)).filter(Boolean).sort();
            equipamento.proximaPreventiva = proximas[0] || '';
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
        // ETAPA 4 — ações de situação e exclusão do equipamento.
        // A situação anterior é guardada para que reativar não transforme
        // indevidamente um equipamento em manutenção em "Em funcionamento".
        const alternar = $('#panna-alternar-status');
        const excluir = $('#panna-excluir');
        const dialogo = $('#panna-confirmar-exclusao');
        const atualizarBotaoSituacao = () => {
            const inativo = item.situacao === 'Inativo';
            alternar.textContent = inativo ? 'Reativar' : 'Inativar';
            alternar.classList.toggle('panna-yellow-btn', inativo);
            alternar.classList.toggle('panna-outline-btn', !inativo);
            alternar.setAttribute('aria-label', (inativo ? 'Reativar' : 'Inativar') + ' ' + (item.nome || 'equipamento'));
        };
        atualizarBotaoSituacao();
        alternar.addEventListener('click', () => {
            const lista = listarEquipamentos();
            const indice = lista.findIndex(e => e.codigo === item.codigo);
            if (indice < 0) { alert('Este equipamento não existe mais.'); location.href = 'GE1.html'; return; }
            const atual = lista[indice];
            const inativo = atual.situacao === 'Inativo';
            if (inativo) {
                atual.situacao = atual.situacaoAntesInativacao || 'Em funcionamento';
                delete atual.situacaoAntesInativacao;
            } else {
                atual.situacaoAntesInativacao = atual.situacao || 'Em funcionamento';
                atual.situacao = 'Inativo';
            }
            atual.atualizadoEm = new Date().toISOString();
            try { salvarEquipamentos(lista); }
            catch (erro) { alert('Não foi possível alterar a situação.'); return; }
            // Recarrega os dados e o indicador da preventiva, preservando a URL.
            location.reload();
        });
        excluir.addEventListener('click', () => {
            $('#panna-confirmar-texto').textContent =
                'Excluir definitivamente "' + (item.nome || 'Equipamento') + '" (' + item.codigo + ')? Esta ação não pode ser desfeita.';
            dialogo.showModal();
        });
        $('#panna-cancelar-exclusao').addEventListener('click', () => dialogo.close());
        // Clique fora do conteúdo também cancela; a tecla Esc é nativa do dialog.
        dialogo.addEventListener('click', evento => { if (evento.target === dialogo) dialogo.close(); });
        $('#panna-confirmar-excluir').addEventListener('click', () => {
            const lista = listarEquipamentos();
            const restante = lista.filter(e => e.codigo !== item.codigo);
            if (restante.length === lista.length) { dialogo.close(); alert('Equipamento já excluído.'); location.href = 'GE1.html'; return; }
            try { salvarEquipamentos(restante); }
            catch (erro) { alert('Não foi possível excluir o equipamento.'); return; }
            // Retorna à listagem, que recalcula contadores e filtros.
            location.href = 'GE1.html';
        });
        const grupos = [
            ['#panna-campos-equipamento', [
                ['Nome',item.nome],['Marca',item.marca],['Modelo',item.modelo],
                ['Número de série',item.numeroSerie],['Grupo',item.grupo],['Patrimônio',item.patrimonio],
                ['Voltagem',item.voltagem],['Potência',item.potencia],['Fornecedor',item.fornecedor],
                ['Valor de aquisição',item.valorAquisicao],['Data de aquisição',pannaDataFormatada(pannaLerData(item.dataAquisicao))],
                ['Fim da garantia',pannaDataFormatada(pannaLerData(item.fimGarantia))],
                ['Localização',item.localizacao],['Responsável',item.responsavel],
                ['Observações técnicas',item.observacoes]
            ]]
        ];
        grupos.forEach(([seletor, campos]) => {
            const container = $(seletor);
            campos.forEach(([rotulo, valor]) => pannaAdicionarCampo(container, rotulo, valor));
        });
        // ETAPA 5: detalhamento de N preventivas e seus N insumos, sem HTML interpolado.
        const planos=planosDoEquipamento(item);
        const area=$('#panna-campos-manutencao');
        area.classList.add('panna-planos-detalhe');
        area.replaceChildren();
        if (!planos.length) {const p=document.createElement('p');p.textContent='Nenhuma preventiva cadastrada.';area.append(p);}
        planos.forEach((plano,i)=>{
            const card=document.createElement('article');card.className='panna-plano-resumo';
            const h=document.createElement('h3');h.textContent=plano.tipo||'Preventiva';card.append(h);const etiqueta=document.createElement('span');etiqueta.className='panna-plano-etiqueta';etiqueta.textContent='Preventiva '+(i+1);card.append(etiqueta);
            pannaAdicionarCampo(card,'Periodicidade',plano.periodicidade);
            pannaAdicionarCampo(card,'Próxima data prevista',dataBR(plano.dataPrevista));
            pannaAdicionarCampo(card,'Aviso antecipado',plano.avisoAntecipado);
            const subt=document.createElement('strong');subt.textContent='Insumos';card.append(subt);
            const ul=document.createElement('ul');
            (plano.insumos||[]).forEach(insumo=>{const li=document.createElement('li');li.textContent=insumo.nome+' — '+insumo.quantidade+' '+(insumo.unidade||'');ul.append(li);});
            if(!ul.children.length){const li=document.createElement('li');li.textContent='Nenhum insumo cadastrado';ul.append(li);}
            card.append(ul);area.append(card);
        });
        // ETAPA 7: a gestão das preventivas ficará na aba de Manutenções.
        // Não exibimos mais o atalho de edição nesta área de detalhes.
        // Próxima preventiva: somente uma data cadastrada é exibida como agendada.
        // Nunca inventamos um agendamento a partir da periodicidade isolada.
        const datas = planos.map(p=>({plano:p,data:pannaLerData(p.dataPrevista)})).filter(x=>x.data).sort((a,b)=>a.data-b.data);
        const proxima = datas[0];
        const prevista = proxima ? proxima.data : null;
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const dias = prevista ? pannaDiasEntre(hoje, prevista) : null;
        $('#panna-dias-preventiva').textContent = dias === null ? '—' : Math.abs(dias);
        $('#panna-dias-unidade').textContent = dias === null ? 'sem previsão' : dias < 0 ? 'dias de atraso' : dias === 0 ? 'vence hoje' : 'dias restantes';
        $('#panna-data-preventiva').textContent = prevista ? 'Data prevista: ' + pannaDataFormatada(prevista) : 'Nenhuma preventiva agendada';
        const periodo = pannaPeriodicidadeDias(proxima?.plano.periodicidade);
        $('#panna-regra-preventiva').textContent = proxima ? 'Periodicidade: ' + proxima.plano.periodicidade + ' · ' + proxima.plano.tipo + ' · ' + planos.length + ' preventiva(s)' : 'Nenhuma preventiva com data informada';
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
