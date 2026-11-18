/* ETAPA 14 — integração dos perfis e chamados. Arquivo isolado para preservar panna.js.
   Autenticação demonstrativa apenas: localStorage não oferece segurança real. */
(()=>{'use strict';
const K='panna-assets-equipamentos-v1', S='panna-assets-perfil', M='panna-assets-menu-recolhido';
const $=s=>document.querySelector(s), page=location.pathname.split('/').pop()||'index.html';
const read=()=>{try{let x=JSON.parse(localStorage.getItem(K));return Array.isArray(x)?x:(window.PANNA_EQUIPAMENTOS_INICIAIS||[]).map(e=>({...e}));}catch{return (window.PANNA_EQUIPAMENTOS_INICIAIS||[]).map(e=>({...e}));}};
const write=x=>localStorage.setItem(K,JSON.stringify(x));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
const ev=(e,titulo,descricao,tipo='manutencao')=>{e.eventos??=[];e.eventos.push({id:uid('evt'),tipo,titulo,descricao,data:new Date().toISOString()});};
const update=(codigo,fn)=>{let all=read(),e=all.find(x=>x.codigo===codigo);if(!e)throw Error('Equipamento não encontrado');fn(e);write(all);return e;};
const route=(target)=>location.href=target;
const HOME_OPERADOR='operacao-campo.html';
/* Telas de campo: o administrador e o operador podem abri-las. */
const compartilhadas=['operacao-campo.html','consulta-equipamento.html','abrir-chamado.html','registrar-avaria.html'];
const operador=[];
const adm=['HomeDesk.html','CE1.html','CE2.html','GE1.html','GE2.html','TE1.html','MAN1.html','MAN2.html','regras-alertas.html'];
function protect(){if(page==='index.html')return true;let role=sessionStorage.getItem(S);if(!role){route('index.html');return false;}if((operador.includes(page)&&role!=='operador')||(adm.includes(page)&&role!=='adm')){route(role==='adm'?'HomeDesk.html':HOME_OPERADOR);return false;}return true;}
function login(){let b=$('.login__enter');if(!b)return;b.removeAttribute('onclick');const go=()=>{let u=$('#username')?.value.trim().toLowerCase(),pass=$('#password')?.value;if(pass!=='123'||!['adm','operador'].includes(u)){alert('Usuário ou senha inválidos.');return;}sessionStorage.setItem(S,u);route(u==='adm'?'HomeDesk.html':HOME_OPERADOR);};b.addEventListener('click',go);['#username','#password'].forEach(s=>$(s)?.addEventListener('keydown',e=>{if(e.key==='Enter')go();}));$('.login__exit')?.addEventListener('click',()=>{sessionStorage.removeItem(S);$('#username').value='';$('#password').value='';});}
function logout(){sessionStorage.removeItem(S);route('index.html');}
/* ==========================================================
   TELAS DE MANUTENÇÃO (compartilhadas entre administrador e operador)
   Páginas: operacao-campo, consulta-equipamento, abrir-chamado, registrar-avaria e regras-alertas.
   ========================================================== */
const isShared=compartilhadas.includes(page);
const role=()=>sessionStorage.getItem(S);
const campoRoutes={chamado:'abrir-chamado.html',avaria:'registrar-avaria.html'};
const parseDate=v=>{if(!v)return null;let m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return new Date(+m[1],m[2]-1,+m[3]);m=String(v).match(/^(\d{2})\/(\d{2})\/(\d{4})/);return m?new Date(+m[3],m[2]-1,+m[1]):null;};
const nextDate=e=>[...(e.planosPreventivos||[]).map(p=>p.dataPrevista),e.proximaPreventiva].map(parseDate).filter(Boolean).sort((a,b)=>a-b)[0]||null;
const findEquip=v=>{const t=String(v||'').trim().toLowerCase();return read().find(x=>x.codigo.toLowerCase()===t||x.nome?.toLowerCase()===t);};
function attachCodes(code){if(!code)return;const list=document.createElement('datalist');list.id='panna-codigos';read().forEach(e=>{const o=document.createElement('option');o.value=e.codigo;o.label=e.nome;list.append(o);});code.setAttribute('list',list.id);code.after(list);}

/* Operador: troca o menu do administrador por um menu só com as telas de campo. */
function operatorShell(){
 if(!isShared||role()!=='operador')return;
 const side=$('#side-menu');if(!side)return;
 const item=(href,pages,icon,label)=>`<li class="sidebar__buttons${pages.includes(page)?' sidebar__buttons--active':''}"><button type="button" class="navbar__btn-menu" data-href="${href}"><img src="assets/${icon}" alt="" style="width:20px;height:20px">${label}</button></li>`;
 side.innerHTML=`<ul>${item('operacao-campo.html',['operacao-campo.html','consulta-equipamento.html','abrir-chamado.html','registrar-avaria.html'],'icon_box.svg','Operação em campo')}</ul><footer class="footer_sidebar"><button type="button" class="navbar__btn-menu" id="panna-op-sair" aria-label="Sair"><img src="assets/logo_profile.svg" alt="Sair"></button></footer>`;
 side.querySelectorAll('[data-href]').forEach(b=>b.onclick=()=>route(b.dataset.href));
 $('#panna-op-sair').onclick=logout;
}
/* Tablet e celular: o menu abre como gaveta, começa fechado e fecha ao tocar fora dele. */
function responsiveMenu(){
 if(!isShared&&page!=='regras-alertas.html')return;
 const mq=matchMedia('(max-width:1024px)'),b=$('#toggle-sidebar');
 const collapse=on=>{document.body.classList.toggle('sidebar-collapsed',on);b?.setAttribute('aria-expanded',String(!on));};
 if(mq.matches)collapse(true);
 mq.addEventListener('change',e=>{if(e.matches)collapse(true);});
 document.addEventListener('click',e=>{if(!mq.matches||document.body.classList.contains('sidebar-collapsed'))return;if(e.target.closest('#side-menu,#toggle-sidebar'))return;collapse(true);});
 /* Só liga a animação depois do primeiro desenho, para o menu não "piscar" abrindo ao carregar a página. */
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.add('is-ready')));
}
/* Operação em campo: identifica o equipamento (QR Code ou código) e oferece as ações de campo. */
function home(){
 if(page!=='operacao-campo.html')return;
 const code=$('#equipment-code'),hint=$('#field-hint');attachCodes(code);
 const say=t=>{hint.textContent=t;};
 const identified=()=>{if(!code.value.trim()){say('Leia o QR Code ou digite o código do equipamento.');code.focus();return null;}const e=findEquip(code.value);if(!e)say('Equipamento não encontrado. Confira o código.');return e||null;};
 const consult=()=>{const e=identified();if(e)route('consulta-equipamento.html?codigo='+encodeURIComponent(e.codigo));};
 const go=acao=>{const e=identified();if(e)route(campoRoutes[acao]+'?codigo='+encodeURIComponent(e.codigo));};
 $('#field-continue').onclick=consult;
 code.addEventListener('keydown',ev=>{if(ev.key==='Enter')consult();});
 code.addEventListener('input',()=>say(''));
 $('#field-open-ticket').addEventListener('click',()=>go('chamado'));
 $('#field-report-fault').addEventListener('click',()=>go('avaria'));
 $('#field-logout').addEventListener('click',logout);
 qrScanner(code,say,consult);
}
/* Leitura de QR Code pela câmera (precisa de HTTPS ou localhost e de um navegador com BarcodeDetector, como o Chrome). */
function qrScanner(code,say,onFound){
 const btn=$('#qr-start'),video=$('#qr-video'),frame=$('#qr-frame');let stream=null,timer=null;
 const stop=()=>{clearInterval(timer);stream?.getTracks().forEach(t=>t.stop());stream=null;video.hidden=true;frame.classList.remove('qr-scan--active');btn.textContent='Ler QR Code';};
 btn.onclick=async()=>{
  if(stream){stop();return;}
  if(!('BarcodeDetector' in window)||!navigator.mediaDevices?.getUserMedia){say('Este navegador não lê QR Code pela câmera. Digite o código do equipamento.');return;}
  try{
   const detector=new BarcodeDetector({formats:['qr_code']});
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
   video.srcObject=stream;video.hidden=false;await video.play();frame.classList.add('qr-scan--active');btn.textContent='Parar leitura';say('');
   timer=setInterval(async()=>{try{const r=await detector.detect(video);if(!r.length)return;let v=String(r[0].rawValue||'').trim();try{v=new URL(v).searchParams.get('codigo')||v;}catch{}stop();code.value=v;onFound();}catch{}},400);
  }catch{stop();say('Não foi possível usar a câmera. Confira a permissão do navegador ou digite o código.');}
 };
}
/* Consulta do equipamento: mostra as informações do produto lido e leva para abrir chamado ou registrar avaria. */
function consulta(){
 if(page!=='consulta-equipamento.html')return;
 const params=new URLSearchParams(location.search),acao=params.get('acao')==='avaria'?'avaria':'chamado';
 const item=read().find(x=>x.codigo===params.get('codigo'));
 if(!item){alert('Equipamento não encontrado. Leia o QR Code ou digite o código.');route(HOME_OPERADOR);return;}
 const dash=v=>String(v||'').trim()||'—',dateBR=d=>d?d.toLocaleDateString('pt-BR'):'—';
 $('#info-name').textContent=item.nome;$('#info-code').textContent=item.codigo;
 const st=dash(item.situacao==null||item.situacao===''?'Em funcionamento':item.situacao);
 const kind=/manut/i.test(st)?'maintenance':/parad|inativ/i.test(st)?'stopped':'running';
 const badge=$('#info-status');badge.textContent=st;badge.className='equipment-info__status equipment-info__status--'+kind;
 const fields=[['Marca',item.marca],['Modelo',item.modelo],['Nº de série',item.numeroSerie],['Patrimônio',item.patrimonio],['Grupo',item.grupo],['Voltagem',item.voltagem],['Potência (W)',item.potencia],['Localização',item.localizacao],['Responsável',item.responsavel],['Próxima preventiva',dateBR(nextDate(item))]];
 $('#info-grid').innerHTML=fields.map(([l,v])=>`<div class="equipment-info__field"><dt class="equipment-info__label">${l}</dt><dd class="equipment-info__value">${esc(dash(v))}</dd></div>`).join('');
 if(item.observacoes){$('#info-notes').textContent=item.observacoes;}else{$('#info-notes-section').hidden=true;}
 const events=(item.eventos||[]).slice(-3).reverse();
 $('#info-events').innerHTML=events.length?events.map(x=>`<li class="equipment-info__event"><strong>${esc(x.titulo)}</strong><span>${new Date(x.data).toLocaleDateString('pt-BR')} · ${esc(x.descricao)}</span></li>`).join(''):'<li class="equipment-info__event equipment-info__event--empty">Nenhum registro até agora.</li>';
 const ticket=$('#info-open-ticket'),fault=$('#info-report-fault');
 [[ticket,'chamado'],[fault,'avaria']].forEach(([b,a])=>{b.className='equipment-info__button '+(a===acao?'button--register-equip':'button--cancel');});
 ticket.onclick=()=>route('abrir-chamado.html?codigo='+encodeURIComponent(item.codigo));
 fault.onclick=()=>route('registrar-avaria.html?codigo='+encodeURIComponent(item.codigo));
 $('#info-back').onclick=()=>route(HOME_OPERADOR);
}
/* Abrir chamado e Registrar avaria: mesma tela no celular e no desktop. */
function form(){
 if(!['abrir-chamado.html','registrar-avaria.html'].includes(page))return;
 const code=new URLSearchParams(location.search).get('codigo'),item=read().find(x=>x.codigo===code);
 if(!item){alert('Selecione primeiro um equipamento.');route(HOME_OPERADOR);return;}
 $('#equipment-label-name').textContent=item.nome;$('#equipment-label-code').textContent=item.codigo;
 $('#field-cancel').onclick=()=>route('consulta-equipamento.html?codigo='+encodeURIComponent(code));
 const fill=(selector,options)=>{const el=$(selector);options.forEach(v=>el.add(new Option(v,v)));};
 if(page==='abrir-chamado.html'){
  fill('#ticket-type',['Corretiva','Preventiva','Inspeção','Elétrica','Mecânica','Outros']);
  fill('#ticket-priority',['Baixa','Média','Alta','Urgente']);
  $('#submit-ticket').onclick=()=>{
   const tipo=$('#ticket-type').value,prioridade=$('#ticket-priority').value,desc=$('#ticket-comment').value.trim();
   if(!tipo||!prioridade||!desc){alert('Preencha todos os campos.');return;}
   const id=uid('CH');
   update(code,e=>{e.chamados??=[];e.chamados.push({id,tipo,prioridade,descricao:desc,estado:'Aberto',criadoEm:new Date().toISOString(),origem:role()||'operador'});ev(e,'Chamado de manutenção aberto',id+' · '+tipo+' · '+prioridade+' · '+desc,'chamado');});
   alert('Chamado '+id+' enviado.');route(HOME_OPERADOR);
  };
 }else{
  fill('#breakdown-type',['Elétrica','Mecânica','Vazamento','Ruído anormal','Desgaste','Outro']);
  const photo=$('#breakdown-photo'),file=document.createElement('input');
  file.type='file';file.accept='image/*';file.hidden=true;photo.after(file);
  $('#photo-upload').onclick=()=>file.click();
  file.onchange=()=>{photo.value=file.files[0]?.name||'';};
  $('#submit-fault').onclick=()=>{
   const tipo=$('#breakdown-type').value,desc=$('#breakdown-comment').value.trim(),can=$('input[name="answer"]:checked')?.value==='yes';
   if(!tipo||!desc){alert('Informe o tipo e a descrição da avaria.');return;}
   const id=uid('AV');
   update(code,e=>{
    e.avarias??=[];e.avarias.push({id,tipo,descricao:desc,podeContinuar:can,arquivoNome:file.files[0]?.name||'',criadoEm:new Date().toISOString()});
    ev(e,'Avaria registrada',id+' · '+tipo+' · '+desc,'avaria');
    if(!can){const cid=uid('CH');e.chamados??=[];e.chamados.push({id:cid,tipo:'Corretiva',prioridade:'Alta',descricao:'Avaria '+id+': '+desc,estado:'Aberto',criadoEm:new Date().toISOString(),origem:'avaria',avariaId:id});ev(e,'Chamado aberto automaticamente',cid+' · Equipamento não pode continuar em uso','chamado');e.situacao='Parado';ev(e,'Status alterado para Parado','Avaria impede o uso do equipamento.','status');}
   });
   alert(can?'Avaria registrada.':'Avaria registrada e chamado de manutenção aberto automaticamente.');route(HOME_OPERADOR);
  };
 }
}
/* Dropdown de manutenção: inserido no menu original, sem alterar outras entradas. */
/* [link, nome no menu, páginas em que o item fica destacado]. As telas de chamado, avaria e consulta fazem parte do fluxo da Operação em campo. */
const maintScreens=[['MAN1.html','Solicitações de manutenção',['MAN1.html']],['MAN2.html','Manutenções pendentes',['MAN2.html']],['regras-alertas.html','Regras e alertas',['regras-alertas.html']],['operacao-campo.html','Operação em campo',['operacao-campo.html','consulta-equipamento.html','abrir-chamado.html','registrar-avaria.html']]];
function adminMenu(){
 if(!(adm.includes(page)||isShared)||(isShared&&role()==='operador'))return;
 const side=$('#side-menu');if(!side)return;const ul=side.querySelector('ul');if(!ul)return;
 [...ul.querySelectorAll('li')].filter(li=>/^(Manutenção|Solicitações de manutenção|Manutenções pendentes)$/.test(li.textContent.trim())).forEach(li=>li.remove());
 const li=document.createElement('li');li.className='sidebar__buttons panna-maint-menu';
 const open=maintScreens.some(x=>x[2].includes(page));
 li.innerHTML=`<button type="button" class="navbar__btn-menu panna-maint-toggle ${open?'panna-maint-active':''}" aria-expanded="${open}" aria-controls="panna-maint-submenu"><img src="assets/icon_maintenance.png" alt="" style="width:20px;height:20px">Manutenção <span class="panna-menu-chevron">⌄</span></button><div id="panna-maint-submenu" class="panna-maint-submenu" ${open?'':'hidden'}>${maintScreens.map(([href,label,pages])=>`<a class="${pages.includes(page)?'active':''}" href="${href}">${label}</a>`).join('')}</div>`;
 const oldReport=[...ul.children].find(x=>x.textContent.trim()==='Relatórios');
 if(oldReport)ul.insertBefore(li,oldReport);else ul.append(li);
 const toggle=li.querySelector('.panna-maint-toggle'),sub=li.querySelector('.panna-maint-submenu');
 toggle.onclick=()=>{sub.hidden=!sub.hidden;toggle.setAttribute('aria-expanded',String(!sub.hidden));};
}
/* Regras e alertas de preventiva: regras por grupo, exceção por equipamento, alertas e formas de aviso. */
function rules(){
 if(page!=='regras-alertas.html')return;
 const RK='panna-assets-regras-v1';
 const base={grupos:[{grupo:'Aspiradores',meses:3,aviso:'30 / 15 / 7'},{grupo:'Tratores',meses:6,aviso:'30 / 15 / 7'},{grupo:'Betoneiras',meses:4,aviso:'30 / 15 / 7'},{grupo:'Enceradeiras',meses:3,aviso:'15 / 7'},{grupo:'Esmerilhadeiras',meses:2,aviso:'15 / 7'},{grupo:'Medição',meses:1,aviso:'7'}],excecoes:{},avisos:{sistema:true,email:true,app:false}};
 const load=()=>{try{const x=JSON.parse(localStorage.getItem(RK));if(x&&Array.isArray(x.grupos))return {...base,...x};}catch{}return JSON.parse(JSON.stringify(base));};
 const state=load(),save=()=>localStorage.setItem(RK,JSON.stringify(state)),equips=read();
 const every=m=>m===1?'A cada 1 mês':'A cada '+m+' meses';
 const monthsOptions=[1,2,3,4,6,12].map(m=>`<option value="${m}">${every(m)}</option>`).join('');
 const pencil='<svg class="rules-table__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 14l1-3.5L11.5 2 14 4.5 5.5 13z"/><path d="M9.5 4l2.5 2.5"/></svg>';
 let editing=-1;
 function renderRules(){
  $('#rules-count').textContent=state.grupos.length+(state.grupos.length===1?' grupo configurado':' grupos configurados');
  $('#rules-body').innerHTML=state.grupos.map((g,i)=>`<tr class="rules-table__row"><td class="rules-table__td rules-table__td--name" data-label="Grupo">${esc(g.grupo)}</td><td class="rules-table__td" data-label="Intervalo">${every(g.meses)}</td><td class="rules-table__td" data-label="Aviso antecipado">${esc(g.aviso)} dias</td><td class="rules-table__td" data-label="Equip.">${equips.filter(e=>e.grupo===g.grupo).length}</td><td class="rules-table__td rules-table__td--actions"><button type="button" class="rules-table__edit" data-i="${i}" aria-label="Editar regra de ${esc(g.grupo)}">${pencil}</button></td></tr>`).join('');
 }
 function renderAlerts(){
  const today=new Date();today.setHours(0,0,0,0);
  const list=equips.map(e=>({e,d:nextDate(e)})).filter(x=>x.d).map(x=>({...x,days:Math.round((x.d-today)/864e5)})).sort((a,b)=>a.days-b.days).slice(0,6);
  $('#alerts-title').textContent='Alertas ('+list.length+')';
  $('#alerts-list').innerHTML=list.length?list.map(({e,days})=>{const kind=days<0?'late':days<=30?'soon':'ok';const text=days<0?'Preventiva atrasada há '+(-days)+' dias':days===0?'Preventiva hoje':'Preventiva em '+days+' dias';return `<div class="alert-card alert-card--${kind}"><div><p class="alert-card__name">${esc(e.nome)}</p><p class="alert-card__text">${text}</p></div><a class="alert-card__link" href="GE2.html?codigo=${encodeURIComponent(e.codigo)}">Ver</a></div>`;}).join(''):'<p class="alert-card__empty">Nenhuma preventiva agendada.</p>';
 }
 $('#exc-equip').innerHTML='<option value="">Selecione</option>'+equips.map(e=>`<option value="${esc(e.codigo)}">${esc(e.codigo)} · ${esc(e.nome)}</option>`).join('');
 $('#exc-interval').innerHTML='<option value="">Selecione</option>'+monthsOptions;
 $('#rule-months').innerHTML=monthsOptions;
 $('#exc-equip').onchange=()=>{$('#exc-interval').value=state.excecoes[$('#exc-equip').value]||'';$('#exc-status').textContent='';};
 $('#exc-save').onclick=()=>{const c=$('#exc-equip').value,m=+$('#exc-interval').value;const st=$('#exc-status');if(!c||!m){st.style.color='#AD2929';st.textContent='Escolha o equipamento e o intervalo.';return;}state.excecoes[c]=m;save();st.style.color='';st.textContent='Exceção salva: '+c+' · '+every(m)+'.';};
 const dlg=$('#rule-dialog');
 const openRule=i=>{editing=i;const g=state.grupos[i]||{grupo:'',meses:3,aviso:'30 / 15 / 7'};$('#rule-dialog-title').textContent=i<0?'Nova regra':'Editar regra';$('#rule-group').value=g.grupo;$('#rule-months').value=g.meses;$('#rule-notice').value=g.aviso;dlg.showModal();};
 $('#rule-new').onclick=()=>openRule(-1);
 $('#rules-body').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b)openRule(+b.dataset.i);});
 $('#rule-cancel').onclick=()=>dlg.close();
 $('#rule-save').onclick=()=>{const grupo=$('#rule-group').value.trim();if(!grupo){$('#rule-group').focus();return;}const r={grupo,meses:+$('#rule-months').value,aviso:$('#rule-notice').value};const same=state.grupos.findIndex(x=>x.grupo.toLowerCase()===grupo.toLowerCase());if(editing>=0)state.grupos[editing]=r;else if(same>=0)state.grupos[same]=r;else state.grupos.push(r);save();renderRules();dlg.close();};
 [['sw-sistema','sistema'],['sw-email','email'],['sw-app','app']].forEach(([id,k])=>{const el=$('#'+id);el.checked=!!state.avisos[k];el.onchange=()=>{state.avisos[k]=el.checked;save();};});
 renderRules();renderAlerts();
}
/* ETAPA 16 — Os quatro indicadores mostram chamados de todos os estados.
   As listas de aceitos e recusados permitem revisar a decisão sem apagar o histórico. */
function maintenance(){
 if(!['MAN1.html','MAN2.html'].includes(page))return;
 const main=$('.main-content');if(!main)return;
 if(page==='MAN2.html'){
  main.innerHTML='<section class="panna-maint-page"><div class="panna-maint-heading"><div><small>OPERAÇÕES / MANUTENÇÃO</small><h1>Manutenções pendentes</h1><p>Área reservada para o acompanhamento das manutenções aceitas e preventivas.</p></div></div><div class="panna-maint-empty">Nenhuma manutenção exibida nesta etapa.</div></section>';return;
 }
 const all=read(),calls=all.flatMap(e=>(e.chamados||[]).map(c=>({e,c})));
 const date=v=>{if(!v)return '—';const d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('pt-BR');};
 const cls=v=>String(v||'Média').trim().toLowerCase();
 /* Normaliza estados legados para não esconder chamados criados em outras etapas. */
 const state=v=>{const raw=cls(v||'Aberto');if(['aceito','aceita','aprovado','aprovada'].includes(raw))return 'aceito';if(['recusado','recusada','rejeitado','rejeitada'].includes(raw))return 'recusado';if(['aberto','aberta','pendente','solicitado','solicitada','em aberto','aguardando','aguardando aceite'].includes(raw))return 'aberto';return raw;};
 let view='aberto',selected=null;
 main.innerHTML=`<section class="panna-maint-page panna-requests"><div class="panna-maint-heading"><div><small>OPERAÇÕES / MANUTENÇÃO</small><h1>Chamados de manutenção</h1><p>Consulte solicitações e revise as decisões de aceite ou recusa.</p></div><a class="panna-outline-btn" href="MAN2.html">Ver pendentes</a></div>
 <div class="panna-request-stats" aria-label="Filtrar chamados por situação">
 <button type="button" class="panna-stat" data-view="aberto"><small>Chamados em aberto</small><strong id="panna-count-open">0</strong><span>● Ver chamados aguardando decisão</span></button>
 <button type="button" class="panna-stat" data-view="urgente"><small>Urgentes</small><strong id="panna-count-urgent">0</strong><span>● Ver urgentes abertos</span></button>
 <button type="button" class="panna-stat" data-view="aceito"><small>Aceitos</small><strong id="panna-count-accepted">0</strong><span>● Ver chamados aceitos</span></button>
 <button type="button" class="panna-stat" data-view="recusado"><small>Recusados</small><strong id="panna-count-rejected">0</strong><span>● Ver chamados recusados</span></button></div>
 <section class="panna-request-panel"><div class="panna-request-toolbar"><div><h2 id="panna-list-title">Chamados em aberto</h2><small id="panna-results"></small></div><div><input id="panna-request-search" type="search" placeholder="Buscar chamado" aria-label="Buscar chamado"><select id="panna-request-priority" aria-label="Filtrar prioridade"><option value="">Todas as prioridades</option><option>Baixa</option><option>Média</option><option>Alta</option><option>Urgente</option></select></div></div><div class="panna-request-scroll"><table class="panna-request-table"><thead><tr><th>CÓDIGO</th><th>EQUIPAMENTO</th><th>TIPO DE MANUTENÇÃO</th><th>DATA</th><th>LOCAL</th><th>PRIORIDADE</th><th>SITUAÇÃO</th><th>AÇÕES</th></tr></thead><tbody id="panna-request-rows"></tbody></table></div></section></section>
 <div class="panna-modal-backdrop" id="panna-request-modal" hidden><section class="panna-request-dialog" role="dialog" aria-modal="true" aria-labelledby="panna-dialog-title"><button type="button" class="panna-dialog-close" aria-label="Fechar">×</button><h2 id="panna-dialog-title"></h2><p id="panna-dialog-equipment"></p><span id="panna-dialog-priority" class="panna-priority"></span><p id="panna-dialog-status" class="panna-dialog-status"></p><div class="panna-dialog-fields"><label>TIPO DE MANUTENÇÃO<div id="panna-dialog-type"></div></label><label>DATA<div id="panna-dialog-date"></div></label><label>LOCAL<div id="panna-dialog-location"></div></label><label>RESPONSÁVEL<div id="panna-dialog-responsible"></div></label><label class="panna-field-wide">DESCRIÇÃO<div id="panna-dialog-description"></div></label></div><div class="panna-dialog-actions"><button type="button" id="panna-reject">Recusar</button><button type="button" id="panna-accept">Aceitar</button></div></section></div>`;
 const rows=$('#panna-request-rows'),modal=$('#panna-request-modal');
 const stats={open:calls.filter(x=>state(x.c.estado)==='aberto').length,urgent:calls.filter(x=>state(x.c.estado)==='aberto'&&cls(x.c.prioridade)==='urgente').length,accepted:calls.filter(x=>state(x.c.estado)==='aceito').length,rejected:calls.filter(x=>state(x.c.estado)==='recusado').length};
 $('#panna-count-open').textContent=stats.open;$('#panna-count-urgent').textContent=stats.urgent;$('#panna-count-accepted').textContent=stats.accepted;$('#panna-count-rejected').textContent=stats.rejected;
 function close(){modal.hidden=true;selected=null;}
 modal.querySelector('.panna-dialog-close').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();});
 function open(item){selected=item;const {e,c}=item;$('#panna-dialog-title').textContent='Manutenção '+c.id;$('#panna-dialog-equipment').textContent='Equipamento '+e.codigo+' · '+e.nome;$('#panna-dialog-priority').textContent='● Prioridade '+(c.prioridade||'Média');$('#panna-dialog-priority').className='panna-priority '+cls(c.prioridade);$('#panna-dialog-status').textContent='Situação atual: '+(c.estado||'Aberto');$('#panna-dialog-type').textContent=c.tipo||'Corretiva';$('#panna-dialog-date').textContent=date(c.criadoEm);$('#panna-dialog-location').textContent=c.localAtendimento||e.localizacao||'Toyota Sorocaba';$('#panna-dialog-responsible').textContent=c.responsavel||'João da Silva';$('#panna-dialog-description').textContent=c.descricao||'Sem descrição';$('#panna-accept').hidden=state(c.estado)==='aceito';$('#panna-reject').hidden=state(c.estado)==='recusado';modal.hidden=false;modal.querySelector('.panna-dialog-close').focus();}
 function change(next){if(!selected)return;const {e,c}=selected;if(state(c.estado)===cls(next)){close();return;}update(e.codigo,item=>{const call=(item.chamados||[]).find(x=>x.id===c.id);if(!call)return;const previous=call.estado||'Aberto';call.estado=next;call.atualizadoEm=new Date().toISOString();call.responsavel='João da Silva';call.localAtendimento=item.localizacao||'Toyota Sorocaba';ev(item,'Chamado '+(next==='Aceito'?'aceito':'recusado'),call.id+' · Situação anterior: '+previous+' · '+call.descricao,'chamado');});close();maintenance();}
 $('#panna-accept').onclick=()=>change('Aceito');$('#panna-reject').onclick=()=>{if(confirm('Recusar este chamado?'))change('Recusado');};
 const labels={aberto:'Chamados em aberto',urgente:'Chamados urgentes',aceito:'Chamados aceitos',recusado:'Chamados recusados'};
 function render(){document.querySelectorAll('.panna-stat').forEach(b=>{const active=b.dataset.view===view;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});$('#panna-list-title').textContent=labels[view];/* Valor vazio significa TODAS as prioridades: não aplicar cls(), que define Média como padrão. */const q=$('#panna-request-search').value.toLowerCase(),priorityValue=$('#panna-request-priority').value,filter=priorityValue?cls(priorityValue):'';const items=calls.filter(({e,c})=>{const status=state(c.estado);return (view==='todos'||(view==='urgente'?status==='aberto'&&cls(c.prioridade)==='urgente':status===view))&&(!filter||cls(c.prioridade)===filter)&&[e.nome,e.codigo,c.id,c.tipo,c.descricao].some(x=>String(x||'').toLowerCase().includes(q));});rows.replaceChildren();$('#panna-results').textContent=items.length+' registros encontrados';items.forEach(item=>{const {e,c}=item,tr=document.createElement('tr');tr.tabIndex=0;tr.innerHTML=`<td>${esc(c.id)}</td><td><strong>${esc(e.nome)}</strong><small>${esc(e.codigo)}</small></td><td>${esc(c.tipo||'Corretiva')}</td><td>${esc(date(c.criadoEm))}</td><td>${esc(c.localAtendimento||e.localizacao||'Toyota Sorocaba')}</td><td><span class="panna-priority ${cls(c.prioridade)}">● ${esc(c.prioridade||'Média')}</span></td><td><span class="panna-request-status">${esc(c.estado||'Aberto')}</span></td><td><button type="button" class="panna-row-action">Ver detalhes</button></td>`;tr.onclick=()=>open(item);tr.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();open(item);}};rows.append(tr);});if(!items.length){const tr=document.createElement('tr');tr.innerHTML='<td colspan="8" class="panna-no-requests">Nenhum chamado encontrado.</td>';rows.append(tr);}}
 document.querySelectorAll('.panna-stat').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();});$('#panna-request-search').oninput=render;$('#panna-request-priority').onchange=render;render();
}
function openTab(){if(page!=='GE2.html'||location.hash!=='#manutencao')return;setTimeout(()=>document.querySelector('[data-panna-tab="manutencao"]')?.click(),30);}
document.addEventListener('DOMContentLoaded',()=>{login();if(!protect())return;operatorShell();responsiveMenu();home();consulta();form();adminMenu();rules();maintenance();openTab();});
})();