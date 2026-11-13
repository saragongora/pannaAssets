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
    // ETAPA 11 — Trilha de auditoria POR EQUIPAMENTO.
    // Cada evento guarda o instante real do registro, seu tipo e uma descrição.
    // Não criamos eventos retroativos para ações que nunca foram registradas.
    function registrarEvento(equipamento, tipo, titulo, descricao = '', dataEvento = null) {
        if (!Array.isArray(equipamento.eventos)) equipamento.eventos = [];
        equipamento.eventos.push({
            id: 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
            tipo, titulo, descricao,
            data: dataEvento || new Date().toISOString()
        });
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
                registrarEvento(equipamento, 'edicao', 'Dados do equipamento atualizados');
                equipamento.atualizadoEm = new Date().toISOString();
                lista[lista.findIndex(e => e.codigo === codigoEdicao)] = equipamento;
            } else {
                registrarEvento(equipamento, 'cadastro', 'Equipamento cadastrado', 'Cadastro inicial do equipamento no sistema.');
                lista.push(equipamento);
            }
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
    // ETAPA 12 — Reagendamento por calendário, não por aproximações de 30/365 dias.
    // Para meses sem o mesmo dia (ex.: 31/01 + 1 mês), usa o último dia do mês.
    // O cálculo parte da data efetiva de realização e não modifica o histórico.
    function pannaProximaDataPreventiva(dataExecucao, periodicidade) {
        const inicio = pannaLerData(dataExecucao);
        if (!inicio) return null;
        const chave = String(periodicidade || '').trim().toLocaleLowerCase('pt-BR');
        const dias = {'diária':1,'diario':1,'diário':1,'semanal':7,'quinzenal':15};
        const meses = {'mensal':1,'bimestral':2,'trimestral':3,'quadrimestral':4,
            'semestral':6,'anual':12};
        let destino;
        if (dias[chave]) {
            destino = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + dias[chave]);
        } else if (meses[chave]) {
            const primeiro = new Date(inicio.getFullYear(), inicio.getMonth() + meses[chave], 1);
            const ultimoDia = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0).getDate();
            destino = new Date(primeiro.getFullYear(), primeiro.getMonth(), Math.min(inicio.getDate(), ultimoDia));
        } else {
            // Periodicidade não reconhecida: não cria previsão incorreta.
            return null;
        }
        return [destino.getFullYear(), String(destino.getMonth()+1).padStart(2,'0'),
            String(destino.getDate()).padStart(2,'0')].join('-');
    }
    function pannaAdicionarCampo(container, rotulo, valor) {
        const div = document.createElement('div'); div.className = 'panna-detail-field';
        const label = document.createElement('span'); label.textContent = rotulo;
        const texto = document.createElement('strong'); texto.textContent = valor || 'Não informado';
        div.append(label, texto); container.append(div);
    }
    // ETAPA 9 — Execuções concluídas são registros independentes dos planos.
    // Excluir ou editar um plano não apaga o histórico já registrado.
    function historicoManutencoes(e) {
        return Array.isArray(e.historicoManutencoes) ? e.historicoManutencoes : [];
    }
    // ETAPA 11 — Linha do tempo unificada: eventos do sistema e execuções antigas.
    // Registros da Etapa 9 continuam aparecendo sem migração destrutiva.
    function renderizarHistoricoManutencoes(codigo) {
        const area = $('#panna-historico');
        if (!area) return;
        const equipamento = listarEquipamentos().find(e => e.codigo === codigo);
        area.replaceChildren();
        if (!equipamento) return;
        const eventos = Array.isArray(equipamento.eventos) ? [...equipamento.eventos] : [];
        // Execuções anteriores à trilha de auditoria não possuíam evento correspondente.
        // Assim, combinamos os dados sem duplicar execuções já registradas na nova versão.
        const idsExecucao = new Set(eventos.map(e => e.execucaoId).filter(Boolean));
        historicoManutencoes(equipamento).forEach(r => {
            if (idsExecucao.has(r.id)) return;
            eventos.push({
                id: 'exec-historico-' + r.id,
                tipo: 'manutencao', titulo: 'Manutenção preventiva realizada: ' + (r.tipo || 'Preventiva'),
                descricao: 'Responsável: ' + (r.responsavel || 'Não informado') + (r.observacoes ? ' · ' + r.observacoes : ''),
                data: r.registradoEm || (r.dataExecucao ? r.dataExecucao + 'T12:00:00' : ''),
                dataRealizacao: r.dataExecucao,
                insumos: r.insumos || []
            });
        });
        // Cadastro antigo: só usamos a data existente, sem inventar outros eventos.
        if (equipamento.criadoEm && !eventos.some(e => e.tipo === 'cadastro')) {
            eventos.push({id:'cadastro-legado',tipo:'cadastro',titulo:'Equipamento cadastrado',descricao:'Registro inicial do equipamento.',data:equipamento.criadoEm});
        }
        eventos.sort((a,b) => (Date.parse(b.data)||0)-(Date.parse(a.data)||0));
        if (!eventos.length) {
            const vazio = document.createElement('p');
            vazio.className = 'panna-planos-vazio';
            vazio.textContent = 'Ainda não existem eventos registrados para este equipamento. As próximas ações aparecerão aqui.';
            area.append(vazio); return;
        }
        eventos.forEach(ev => {
            const linha = document.createElement('article');
            linha.className = 'panna-evento-linha';
            const ponto = document.createElement('span');
            ponto.className = 'panna-evento-ponto panna-evento-' + (['cadastro','status','manutencao','preventiva','edicao'].includes(ev.tipo) ? ev.tipo : 'outro');
            ponto.setAttribute('aria-hidden','true');
            const corpo = document.createElement('div'); corpo.className = 'panna-evento-corpo';
            const titulo = document.createElement('strong'); titulo.textContent = ev.titulo || 'Evento registrado';
            corpo.append(titulo);
            if (ev.descricao) {const detalhe = document.createElement('p'); detalhe.textContent = ev.descricao; corpo.append(detalhe);}
            if (ev.dataRealizacao) {const exec = document.createElement('p'); exec.textContent = 'Realizada em ' + dataBR(ev.dataRealizacao); corpo.append(exec);}
            if (Array.isArray(ev.insumos) && ev.insumos.length) {
                const detalhes = document.createElement('details');
                const resumo = document.createElement('summary'); resumo.textContent = 'Insumos utilizados (' + ev.insumos.length + ')';
                const lista = document.createElement('ul');
                ev.insumos.forEach(x => {const li=document.createElement('li');li.textContent=(x.nome||'Insumo')+' — '+x.quantidade+' '+(x.unidade||'');lista.append(li);});
                detalhes.append(resumo,lista); corpo.append(detalhes);
            }
            const data = document.createElement('time');
            const instante = new Date(ev.data);
            data.textContent = Number.isNaN(instante.getTime()) ? 'Data não informada' : instante.toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
            if (!Number.isNaN(instante.getTime())) data.dateTime=instante.toISOString();
            corpo.append(data); linha.append(ponto,corpo); area.append(linha);
        });
    }
    // ETAPA 8 — Editor exclusivo da aba Manutenção em GE2.
    // Cada alteração é persistida imediatamente no equipamento, sem modificar o formulário CE1.
    // Os identificadores dos planos são preservados para permitir edição e exclusão seguras.
    function iniciarGestaoPreventivas(item, atualizarDetalhes) {
        const area = $('#panna-campos-manutencao');
        const editor = $('#panna-editor-manutencao');
        const novo = $('#panna-nova-manutencao');
        if (!area || !editor || !novo) return;
        const periodos = ['Diária','Semanal','Quinzenal','Mensal','Bimestral','Trimestral','Semestral','Anual'];
        const normalizar = v => (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        const grupo = normalizar(item.grupo);
        const chave = Object.keys(TIPOS_PREVENTIVA_POR_GRUPO).find(k => grupo.includes(k));
        const sugestoes = [...new Set([...(TIPOS_PREVENTIVA_POR_GRUPO[chave] || []), ...TIPOS_GERAIS])];
        let emEdicao = null;
        function botao(texto, classe, acao) {
            const b = document.createElement('button'); b.type='button'; b.className=classe;
            b.textContent=texto; b.addEventListener('click',acao); return b;
        }
        function campo(rotulo, elemento) {
            const label=document.createElement('label'); label.className='panna-plano-campo';
            const span=document.createElement('span'); span.textContent=rotulo;
            label.append(span,elemento); return label;
        }
        function seletor(valores, valor) {
            const select=document.createElement('select'); select.className='register-form__input';
            select.add(new Option('Selecione',''));
            valores.forEach(v=>select.add(new Option(v,v)));
            if(valor&&!valores.includes(valor))select.add(new Option(valor,valor));
            select.value=valor||''; return select;
        }
        function registroAtual() { return listarEquipamentos().find(e=>e.codigo===item.codigo); }
        function gravar(planos, evento = null) {
            const lista=listarEquipamentos();
            const indice=lista.findIndex(e=>e.codigo===item.codigo);
            if(indice<0) {alert('Equipamento não encontrado.');return false;}
            lista[indice].planosPreventivos=planos;
            // Compatibilidade com a listagem GE1 e com registros anteriores.
            const datas=planos.map(p=>normalizarDataISO(p.dataPrevista)).filter(Boolean).sort();
            lista[indice].proximaPreventiva=datas[0]||'';
            lista[indice].atualizadoEm=new Date().toISOString();
            if (evento) registrarEvento(lista[indice], 'preventiva', evento.titulo, evento.descricao);
            try {salvarEquipamentos(lista);} catch(e) {alert('Não foi possível salvar as preventivas.');return false;}
            return true;
        }
        function abrir(plano) {
            const atual=registroAtual(); if(!atual)return;
            const existente=plano ? planosDoEquipamento(atual).find(p=>p.id===plano.id) : null;
            const r=structuredClone(existente||{id:criarIdPlano(),tipo:'',periodicidade:'',dataPrevista:'',avisoAntecipado:'',insumos:[]});
            r.insumos=Array.isArray(r.insumos)?r.insumos:[];
            emEdicao=r.id;
            editor.hidden=false; editor.replaceChildren();
            const topo=document.createElement('div');topo.className='panna-manutencao-heading';
            const titulo=document.createElement('h3');titulo.textContent=existente?'Editar preventiva':'Nova preventiva';
            topo.append(titulo);editor.append(topo);
            const grid=document.createElement('div');grid.className='panna-plano-grid';
            const tipo=seletor(sugestoes,r.tipo); const periodicidade=seletor(periodos,r.periodicidade);
            const data=document.createElement('input');data.type='date';data.className='register-form__input';data.value=normalizarDataISO(r.dataPrevista);
            const aviso=seletor(['7 dias','15 dias','30 dias'],r.avisoAntecipado);
            grid.append(campo('Tipo de manutenção',tipo),campo('Periodicidade',periodicidade),campo('Próxima data prevista',data),campo('Aviso antecipado',aviso));editor.append(grid);
            const insumosTitulo=document.createElement('div');insumosTitulo.className='panna-manutencao-heading';
            const h=document.createElement('h4');h.textContent='Insumos necessários';
            insumosTitulo.append(h,botao('+ Insumo','panna-outline-btn',()=>{r.insumos.push({nome:'',quantidade:1,unidade:'un'});desenharInsumos();}));
            editor.append(insumosTitulo);
            const listaInsumos=document.createElement('div');editor.append(listaInsumos);
            function desenharInsumos() {
                listaInsumos.replaceChildren();
                r.insumos.forEach((insumo,i)=>{
                    const linha=document.createElement('div');linha.className='panna-insumo-linha';
                    const nome=document.createElement('input');nome.className='register-form__input';nome.placeholder='Nome do insumo';nome.setAttribute('aria-label','Nome do insumo');nome.value=insumo.nome||'';nome.oninput=()=>insumo.nome=nome.value;
                    const quantidade=document.createElement('input');quantidade.className='register-form__input';quantidade.type='number';quantidade.min='0.01';quantidade.step='any';quantidade.setAttribute('aria-label','Quantidade');quantidade.value=insumo.quantidade??1;quantidade.oninput=()=>insumo.quantidade=quantidade.value;
                    const unidade=seletor(UNIDADES_INSUMO,insumo.unidade||'un');unidade.setAttribute('aria-label','Unidade');unidade.onchange=()=>insumo.unidade=unidade.value;
                    const remover=botao('✕','panna-icone-acao panna-icone-excluir',()=>{r.insumos.splice(i,1);desenharInsumos();});remover.title='Remover insumo';remover.setAttribute('aria-label','Remover insumo');
                    linha.append(nome,quantidade,unidade,remover);listaInsumos.append(linha);
                });
            }
            desenharInsumos();
            const rodape=document.createElement('div');rodape.className='panna-editor-acoes';
            rodape.append(botao('Cancelar','panna-outline-btn',fechar));
            rodape.append(botao('Salvar preventiva','panna-yellow-btn',()=>{
                r.tipo=tipo.value;r.periodicidade=periodicidade.value;r.dataPrevista=data.value;r.avisoAntecipado=aviso.value;
                if(!r.tipo||!r.periodicidade||!r.dataPrevista){alert('Preencha tipo, periodicidade e próxima data prevista.');return;}
                if(r.insumos.some(x=>!String(x.nome||'').trim()||!(Number(x.quantidade)>0)||!x.unidade)){alert('Preencha nome, quantidade e unidade de todos os insumos.');return;}
                const atual=registroAtual();if(!atual)return;
                const planos=structuredClone(planosDoEquipamento(atual));
                const indice=planos.findIndex(p=>p.id===r.id);
                if(indice>=0)planos[indice]=r;else planos.push(r);
                if(gravar(planos, {titulo:indice>=0?'Preventiva atualizada':'Preventiva cadastrada',descricao:r.tipo})){fechar();atualizarDetalhes();}
            }));
            editor.append(rodape);
            editor.scrollIntoView({behavior:'smooth',block:'nearest'});
        }
        // Formulário de realização: copia os insumos planejados como ponto de partida,
        // mas permite informar as quantidades efetivamente utilizadas.
        function abrirRegistro(plano) {
            fechar();
            editor.hidden=false;editor.replaceChildren();
            const cab=document.createElement('div');cab.className='panna-manutencao-heading';
            const titulo=document.createElement('h3');titulo.textContent='Registrar realização — '+(plano.tipo||'Preventiva');
            cab.append(titulo,botao('Cancelar','panna-outline-btn',fechar));editor.append(cab);
            const grade=document.createElement('div');grade.className='panna-plano-grid';
            const data=document.createElement('input');data.type='date';data.className='register-form__input';data.value=new Date().toLocaleDateString('en-CA');
            const responsavel=document.createElement('input');responsavel.className='register-form__input';responsavel.placeholder='Nome do responsável';
            grade.append(campo('Data da realização',data),campo('Responsável',responsavel));editor.append(grade);
            const observacoes=document.createElement('textarea');observacoes.className='register-form__input';observacoes.rows=3;observacoes.placeholder='Serviços realizados, ocorrências e observações';
            editor.append(campo('Observações',observacoes));
            const h=document.createElement('h4');h.textContent='Insumos utilizados (ajuste as quantidades)';editor.append(h);
            const insumos=structuredClone(Array.isArray(plano.insumos)?plano.insumos:[]);
            const listaInsumos=document.createElement('div');editor.append(listaInsumos);
            function desenhar(){listaInsumos.replaceChildren();insumos.forEach((x,i)=>{
                const linha=document.createElement('div');linha.className='panna-insumo-linha';
                const nome=document.createElement('input');nome.className='register-form__input';nome.placeholder='Insumo';nome.value=x.nome||'';nome.setAttribute('aria-label','Nome do insumo');nome.oninput=()=>x.nome=nome.value;
                const qtd=document.createElement('input');qtd.type='number';qtd.min='0.01';qtd.step='any';qtd.className='register-form__input';qtd.value=x.quantidade??1;qtd.setAttribute('aria-label','Quantidade utilizada');qtd.oninput=()=>x.quantidade=qtd.value;
                const unidade=seletor(UNIDADES_INSUMO,x.unidade||'un');unidade.setAttribute('aria-label','Unidade do insumo');unidade.onchange=()=>x.unidade=unidade.value;
                const remover=botao('✕','panna-icone-acao panna-icone-excluir',()=>{insumos.splice(i,1);desenhar();});remover.title='Remover insumo';remover.setAttribute('aria-label','Remover insumo');
                linha.append(nome,qtd,unidade,remover);listaInsumos.append(linha);
            });}
            desenhar();
            editor.append(botao('+ Insumo utilizado','panna-outline-btn',()=>{insumos.push({nome:'',quantidade:1,unidade:'un'});desenhar();}));
            editor.append(botao('Confirmar realização','panna-yellow-btn panna-salvar-plano',()=>{
                if(!data.value||data.value>new Date().toLocaleDateString('en-CA')){alert('Informe uma data de realização válida, até hoje.');return;}
                if(!responsavel.value.trim()){alert('Informe o responsável pela realização.');return;}
                if(insumos.some(x=>!String(x.nome||'').trim()||!(Number(x.quantidade)>0)||!x.unidade)){alert('Confira os insumos utilizados.');return;}
                const equipamentos=listarEquipamentos();const indice=equipamentos.findIndex(e=>e.codigo===item.codigo);
                if(indice<0){alert('Equipamento não encontrado.');return;}
                const e=equipamentos[indice];
                const registro={id:'exec-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),
                    planoId:plano.id||null,tipo:plano.tipo||'Preventiva',dataExecucao:data.value,
                    responsavel:responsavel.value.trim(),observacoes:observacoes.value.trim(),
                    insumos:insumos.map(x=>({nome:String(x.nome).trim(),quantidade:Number(x.quantidade),unidade:x.unidade})),
                    registradoEm:new Date().toISOString()};
                // Busca o plano atual pelo ID, evitando sobrescrever outras alterações.
                const planoAtual = (Array.isArray(e.planosPreventivos) ? e.planosPreventivos : [])
                    .find(p => p.id === plano.id);
                if (!planoAtual) {
                    alert('Esta preventiva não existe mais. Atualize a página antes de registrar.');
                    return;
                }
                const dataAnterior = planoAtual.dataPrevista || '';
                const proximaData = pannaProximaDataPreventiva(registro.dataExecucao, planoAtual.periodicidade);
                if (!proximaData && !confirm('Periodicidade não reconhecida. Registrar a realização sem reagendar automaticamente?')) return;
                // A realização é preservada independentemente de um futuro ajuste no plano.
                registro.dataPrevistaAnterior = dataAnterior;
                registro.proximaDataPrevista = proximaData || null;
                if (proximaData) planoAtual.dataPrevista = proximaData;
                const datasAtualizadas = e.planosPreventivos.map(p => normalizarDataISO(p.dataPrevista))
                    .filter(Boolean).sort();
                e.proximaPreventiva = datasAtualizadas[0] || '';
                e.historicoManutencoes=[...historicoManutencoes(e),registro];
                registrarEvento(e,'manutencao','Manutenção preventiva realizada: '+registro.tipo,
                    'Responsável: '+registro.responsavel+(registro.observacoes?' · '+registro.observacoes:''));
                e.eventos[e.eventos.length-1].execucaoId=registro.id;
                e.eventos[e.eventos.length-1].dataRealizacao=registro.dataExecucao;
                e.eventos[e.eventos.length-1].insumos=registro.insumos;
                if (proximaData) {
                    registrarEvento(e, 'preventiva', 'Próxima preventiva reagendada: ' + registro.tipo,
                        'Previsão anterior: ' + (dataAnterior ? dataBR(dataAnterior) : 'não informada') +
                        ' · Nova previsão: ' + dataBR(proximaData) +
                        ' · Periodicidade: ' + planoAtual.periodicidade);
                }
                e.atualizadoEm=new Date().toISOString();
                try{salvarEquipamentos(equipamentos);}catch(erro){alert('Não foi possível registrar a realização.');return;}
                fechar();
                // Recarrega a tela para sincronizar a lista, o card lateral e a linha do tempo.
                alert(proximaData
                    ? 'Realização registrada! Próxima preventiva: ' + dataBR(proximaData) + '.'
                    : 'Realização registrada no histórico. Reagendamento manual necessário.');
                location.reload();
            }));
            editor.scrollIntoView({behavior:'smooth',block:'nearest'});
        }
        function fechar(){emEdicao=null;editor.hidden=true;editor.replaceChildren();}
        function render() {
            const atual=registroAtual();if(!atual)return;
            const planos=planosDoEquipamento(atual);
            area.replaceChildren();
            if(!planos.length){const vazio=document.createElement('p');vazio.className='panna-planos-vazio';vazio.textContent='Nenhuma manutenção preventiva cadastrada.';area.append(vazio);}
            // ETAPA 10 — Lista compacta com detalhes expansíveis, sem alterar os planos salvos.
            // <details> oferece abertura por clique e teclado sem criar estado adicional.
            planos.forEach((p,i)=>{
                const linha=document.createElement('details');linha.className='panna-manutencao-linha';
                const resumo=document.createElement('summary');resumo.className='panna-manutencao-linha-resumo';
                const celula=(texto,classe)=>{const el=document.createElement('span');el.className=classe||'';el.textContent=texto;return el;};
                resumo.append(celula(p.tipo||'Preventiva','panna-col-tipo'));
                const insumos=Array.isArray(p.insumos)?p.insumos:[];
                resumo.append(celula(insumos.length?insumos.map(x=>x.nome).filter(Boolean).join(', '):'—','panna-col-insumos'));
                resumo.append(celula(p.periodicidade||'—','panna-col-periodo'));
                resumo.append(celula(p.dataPrevista?dataBR(p.dataPrevista):'—','panna-col-data'));
                const seta=document.createElement('span');seta.className='panna-linha-seta';seta.textContent='⌄';seta.setAttribute('aria-hidden','true');resumo.append(seta);
                linha.append(resumo);
                const detalhe=document.createElement('div');detalhe.className='panna-manutencao-linha-detalhes';
                const grade=document.createElement('div');grade.className='panna-plano-grid';
                pannaAdicionarCampo(grade,'Tipo de manutenção',p.tipo);
                pannaAdicionarCampo(grade,'Periodicidade',p.periodicidade);
                pannaAdicionarCampo(grade,'Próxima data prevista',dataBR(p.dataPrevista));
                pannaAdicionarCampo(grade,'Aviso antecipado',p.avisoAntecipado);
                detalhe.append(grade);
                const titulo=document.createElement('strong');titulo.textContent='Insumos necessários';detalhe.append(titulo);
                const ul=document.createElement('ul');
                insumos.forEach(x=>{const li=document.createElement('li');li.textContent=x.nome+' — '+x.quantidade+' '+x.unidade;ul.append(li);});
                if(!insumos.length){const li=document.createElement('li');li.textContent='Nenhum insumo cadastrado';ul.append(li);}
                detalhe.append(ul);
                const acoes=document.createElement('div');acoes.className='panna-manutencao-acoes panna-acoes-linha';
                const realizar=botao('Marcar como realizado','panna-outline-btn panna-registrar-realizacao',()=>abrirRegistro(p));
                const editar=botao('','panna-icone-acao panna-icone-editar',()=>abrir(p));
                editar.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg>';
                editar.title='Editar preventiva';editar.setAttribute('aria-label','Editar '+(p.tipo||'preventiva'));
                const excluir=botao('','panna-icone-acao panna-icone-excluir',()=>{
                    if(!confirm('Excluir a preventiva "'+(p.tipo||'')+'"?'))return;
                    const dados=registroAtual();if(!dados)return;
                    const restante=planosDoEquipamento(dados).filter((x,j)=>x.id!==p.id || (p.id==null && j!==i));
                    if(gravar(restante, {titulo:'Preventiva excluída',descricao:p.tipo||'Preventiva'})){fechar();atualizarDetalhes();}
                });
                // Ícone de lixeira SVG correto, sem depender de fontes ou bibliotecas externas.
                excluir.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7"/></svg>';
                excluir.title='Excluir preventiva';excluir.setAttribute('aria-label','Excluir '+(p.tipo||'preventiva'));
                acoes.append(realizar,editar,excluir);detalhe.append(acoes);linha.append(detalhe);area.append(linha);
            });
        }
        novo.addEventListener('click',()=>abrir(null));
        render();
        return render;
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
            registrarEvento(atual, 'status', inativo ? 'Equipamento reativado' : 'Equipamento inativado',
                'Situação alterada de '+(inativo?'Inativo':atual.situacaoAntesInativacao)+' para '+atual.situacao+'.');
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
        // ETAPA 8: a aba Manutenção possui seu próprio editor, com salvamento imediato.
        // A função abaixo atualiza os cartões e o indicador lateral após cada operação.
        const atualizarPreventivas = () => location.reload();
        iniciarGestaoPreventivas(item, atualizarPreventivas);
        const planos=planosDoEquipamento(item);
        // Abas reais: cada seção é exibida isoladamente, sem alterar o menu lateral.
        const secoes={equipamento:$('#panna-detalhes'),manutencao:$('#panna-manutencao'),historico:$('#panna-historico-card')};
        function selecionarAba(nome) {
            if(!secoes[nome])nome='equipamento';
            Object.entries(secoes).forEach(([chave,secao])=>secao.hidden=chave!==nome);
            document.querySelectorAll('[data-panna-tab]').forEach(a=>{
                const ativo=a.dataset.pannaTab===nome;
                a.classList.toggle('panna-tab-active',ativo);
                if(ativo)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
            });
        }
        document.querySelectorAll('[data-panna-tab]').forEach(a=>a.addEventListener('click',evento=>{
            evento.preventDefault();const aba=a.dataset.pannaTab;
            history.replaceState(null,'','#'+(aba==='manutencao'?'panna-manutencao':aba==='historico'?'panna-historico-card':'panna-detalhes'));
            selecionarAba(aba);
        }));
        document.querySelector('[data-panna-abrir-manutencao]')?.addEventListener('click',evento=>{
            evento.preventDefault();history.replaceState(null,'','#panna-manutencao');selecionarAba('manutencao');
        });
        selecionarAba(location.hash==='#panna-manutencao'?'manutencao':location.hash==='#panna-historico-card'?'historico':'equipamento');
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
        // Atualiza a linha do tempo unificada com eventos e execuções existentes.
        renderizarHistoricoManutencoes(item.codigo);
    }
    document.addEventListener('DOMContentLoaded', () => {
        iniciarMenu(); iniciarOpcoesCadastro(); iniciarCadastro(); iniciarGerenciamento(); iniciarConfirmacao(); iniciarDetalhes();
    });
})();
