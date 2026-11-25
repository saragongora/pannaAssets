/* ETAPA 33: mensagens padronizadas e confirmações assíncronas. */
/* ETAPA 19 — Painel de manutenções pendentes.
   Arquivo isolado para preservar o cadastro, os chamados e as outras telas.
   Todas as alterações são gravadas no mesmo equipamento no localStorage. */
(()=>{'use strict';
if(!location.pathname.endsWith('/MAN2.html'))return;
const KEY='panna-assets-equipamentos-v1', VIEW='panna-pendentes-visualizacao';
const $=s=>document.querySelector(s), safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return []}};
const save=all=>localStorage.setItem(KEY,JSON.stringify(all));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const date=s=>{if(!s)return null;const v=String(s),m=v.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?new Date(+m[1],+m[2]-1,+m[3]):new Date(v)};
const fmt=s=>{const d=date(s);return d&&!isNaN(d)?d.toLocaleDateString('pt-BR'):'Sem data'};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
// Prioridades antigas podem estar em campos diferentes; preventivas não têm prioridade obrigatória.
const priority=i=>{const p=norm(i.source.prioridade||i.source.nivelPrioridade||i.source.prioridadeManutencao);return p.includes('urgent')?'Urgente':p.includes('alta')||p==='alto'?'Alta':p.includes('media')||p==='medio'?'Média':p.includes('baixa')||p==='baixo'?'Baixa':'Não definida'};
// Ordem de prioridade: urgentes primeiro; sem prioridade definida ao final.
const priorityRank=i=>({'Urgente':0,'Alta':1,'Média':2,'Baixa':3,'Não definida':4})[priority(i)]??4;
const dateValue=i=>{const d=date(i.data);return d&&!isNaN(d.getTime())?d.getTime():Infinity};
const sortItems=(a,b,order)=>{
 const byPriority=priorityRank(a)-priorityRank(b);
 const byDate=dateValue(a)-dateValue(b);
 const byName=a.e.nome.localeCompare(b.e.nome,'pt-BR');
 if(order==='date')return byDate||byPriority||byName;
 if(order==='date-desc')return (dateValue(a)===Infinity?1:dateValue(b)===Infinity?-1:dateValue(b)-dateValue(a))||byPriority||byName;
 if(order==='equipment')return byName||byPriority||byDate;
 return byPriority||byDate||byName;
};
const units=['un','ml','L','mg','g','kg','mm','cm','m','m²','m³','par','jogo','kit','rolo'];
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
function event(e,title,description){e.eventos??=[];e.eventos.push({id:'evt-'+uid(),tipo:'manutencao',titulo:title,descricao:description,data:new Date().toISOString()});}
function status(raw){const s=norm(raw);if(['concluida','concluido','finalizada','finalizado'].includes(s))return 'Concluída';if(['em manutencao','em andamento','iniciada','iniciado'].includes(s))return 'Em manutenção';return 'Pendente';}
// ETAPA 23 — status operacional só acompanha corretivas, nunca preventivas rotineiras.
function corrective(kind,record){return kind==='chamado'||(kind==='extra'&&norm(record.categoria)!=='preventiva');}
function otherBlocking(eq,kind,id){
 const calls=(eq.chamados||[]).some(c=>!(kind==='chamado'&&c.id===id)&&['aceito','aceita','aprovado','aprovada','em manutencao'].includes(norm(c.estado))&&status(c.estadoManutencao||c.estado)!=='Concluída');
 const extras=(eq.manutencoesExtras||[]).some(m=>!(kind==='extra'&&m.id===id)&&corrective('extra',m)&&status(m.estado)!=='Concluída');
 return calls||extras;
}
function operational(eq,next,reason){
 const previous=eq.situacao||'Em funcionamento';
 if(previous===next)return;
 eq.situacao=next;
 event(eq,'Status do equipamento: '+next,`${previous} → ${next} · ${reason}`);
}
function items(){return read().flatMap(e=>{
 const plans=(e.planosPreventivos||[]).filter(p=>p&&p.id).map(p=>({kind:'preventiva',e,id:p.id,data:p.dataPrevista||'',title:p.tipo||'Preventiva',state:status(p.estadoExecucao),source:p}));
 const calls=(e.chamados||[]).filter(c=>['aceito','aceita','aprovado','aprovada','em manutencao','concluido','concluida'].includes(norm(c.estado))||c.estadoManutencao).map(c=>({kind:'chamado',e,id:c.id,data:c.dataPrevista||c.criadoEm||'',title:c.tipo||'Chamado corretivo',state:status(c.estadoManutencao||c.estado),source:c}));
 const extras=(e.manutencoesExtras||[]).map(m=>({kind:'extra',e,id:m.id,data:m.dataPrevista||'',title:m.tipo||'Manutenção',state:status(m.estado),source:m}));
 return [...plans,...calls,...extras];}).sort((a,b)=>(date(a.data)?.getTime()||Infinity)-(date(b.data)?.getTime()||Infinity));}
// ETAPA 22 — cálculo por calendário, igual ao usado em GE2.
// Mantém a data da execução como referência; nunca soma 30 dias para um mês.
function nextDate(iso,period){
 const d=date(iso);if(!d||isNaN(d))return null;
 const key=norm(period).trim(),days={'diaria':1,'diario':1,'semanal':7,'quinzenal':15};
 const months={'mensal':1,'bimestral':2,'trimestral':3,'quadrimestral':4,'semestral':6,'anual':12};
 let n;if(days[key])n=new Date(d.getFullYear(),d.getMonth(),d.getDate()+days[key]);
 else if(months[key]){const first=new Date(d.getFullYear(),d.getMonth()+months[key],1);const last=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();n=new Date(first.getFullYear(),first.getMonth(),Math.min(d.getDate(),last));}
 else return null;
 return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}
// Não sobrescreve planos nem execuções antigas; cada realização tem ID próprio.
async function finishMaintenance(item,execution){
 const all=read(),eq=all.find(e=>e.codigo===item.e.codigo);
 if(!eq)return pannaAlert('Equipamento não encontrado.');
 const collection=item.kind==='preventiva'?eq.planosPreventivos:item.kind==='chamado'?eq.chamados:eq.manutencoesExtras;
 const record=(collection||[]).find(m=>m.id===item.id);
 if(!record)return pannaAlert('Manutenção não encontrada.');
 const oldDate=record.dataPrevista||'';
 const isCorrective=corrective(item.kind,record);
 // A liberação depende de confirmação e de não haver outra corretiva pendente.
 let release=false;
 if(isCorrective){release=await pannaConfirm('A manutenção foi concluída. O equipamento está liberado para voltar a funcionar?\n\nOK: liberar (se não houver outras corretivas).\nCancelar: manter parado.');}
 const recurring=item.kind==='preventiva'||(item.kind==='extra'&&norm(record.categoria)==='preventiva');
 const upcoming=recurring?nextDate(execution.dataExecucao,record.periodicidade):null;
 if(recurring&&!upcoming&&!await pannaConfirm('Periodicidade não reconhecida. Concluir sem reagendar automaticamente?'))return;
 const entry={id:'exec-'+uid(),planoId:item.kind==='preventiva'?record.id:null,
  manutencaoId:record.id,tipo:record.tipo||item.title,dataExecucao:execution.dataExecucao,
  responsavel:execution.responsavel,observacoes:execution.observacoes,insumos:execution.insumos,
  dataPrevistaAnterior:oldDate,proximaDataPrevista:upcoming,registradoEm:new Date().toISOString()};
 eq.historicoManutencoes??=[];eq.historicoManutencoes.push(entry);
 record.atualizadoEm=new Date().toISOString();
 if(recurring){
  // Uma preventiva recorrente volta a ficar pendente para o próximo ciclo.
  if(upcoming){record.dataPrevista=upcoming;if(item.kind==='preventiva')record.estadoExecucao='Pendente';else record.estado='Pendente';}
  else if(item.kind==='preventiva')record.estadoExecucao='Concluída';else record.estado='Concluída';
 }else if(item.kind==='chamado'){
  record.estadoManutencao='Concluída';record.estado='Concluído';
 }else record.estado='Concluída';
 const dates=(eq.planosPreventivos||[]).map(p=>p.dataPrevista).filter(Boolean).sort();
 eq.proximaPreventiva=dates[0]||'';
 event(eq,'Manutenção concluída: '+entry.tipo,`Responsável: ${entry.responsavel} · Data: ${fmt(entry.dataExecucao)}${entry.observacoes?' · '+entry.observacoes:''}`);
 const evt=eq.eventos[eq.eventos.length-1];evt.execucaoId=entry.id;evt.dataRealizacao=entry.dataExecucao;evt.insumos=entry.insumos;
 if(upcoming)event(eq,'Próxima preventiva reagendada: '+entry.tipo,`Previsão anterior: ${fmt(oldDate)} · Nova previsão: ${fmt(upcoming)} · Periodicidade: ${record.periodicidade}`);
 if(isCorrective){
  if(release&&!otherBlocking(eq,item.kind,item.id)&&!['inativo'].includes(norm(eq.situacao)))operational(eq,'Em funcionamento','Corretiva concluída e equipamento liberado após confirmação');
  else if(norm(eq.situacao)!=='inativo')operational(eq,'Parado',release?'Há outras corretivas pendentes ou em andamento':'Concluída sem liberação para operação');
 }
 eq.atualizadoEm=new Date().toISOString();
 try{save(all)}catch{return pannaAlert('Não foi possível salvar a conclusão.');}
 return upcoming||true;
}
function start(){const main=$('.main-content');if(!main)return;
 main.innerHTML=`<section class="panna-maint-page panna-pending"><div class="panna-maint-heading"><div><small>OPERAÇÕES / MANUTENÇÃO</small><h1>Manutenções pendentes</h1><p>Acompanhe preventivas, chamados aceitos e manutenções adicionadas.</p></div><button class="panna-pending-primary" id="pm-new">+ Nova manutenção</button></div>
 <div class="pm-stats" id="pm-stats"></div><div class="pm-toolbar"><input id="pm-search" type="search" placeholder="Buscar equipamento ou manutenção" aria-label="Pesquisar manutenção"><select id="pm-kind" aria-label="Filtrar tipo"><option value="">Todos os tipos</option><option value="preventiva">Preventivas</option><option value="chamado">Chamados aceitos</option><option value="extra">Adicionadas manualmente</option></select><select id="pm-status" aria-label="Filtrar situação"><option value="">Todas as situações</option><option selected>Pendente</option><option>Em manutenção</option><option>Concluída</option></select><select id="pm-time" aria-label="Filtrar prazo"><option value="">Todas as datas</option><option value="late">Atrasadas</option><option value="week">Próximos 7 dias</option></select><label class="pm-order-label" for="pm-order">Ordenar por<select id="pm-order" aria-label="Ordenar manutenções"><option value="priority">Prioridade (urgentes primeiro)</option><option value="date">Data (mais próximas primeiro)</option><option value="date-desc">Data (mais distantes primeiro)</option><option value="equipment">Nome do equipamento (A–Z)</option></select></label><div class="pm-switch" aria-label="Modo de visualização"><button type="button" id="pm-list">☷ Lista</button><button type="button" id="pm-board">▦ Kanban</button></div></div><p id="pm-result" class="pm-result"></p><div id="pm-content"></div></section>
 <div class="pm-overlay" id="pm-overlay" hidden><section class="pm-dialog" role="dialog" aria-modal="true" aria-labelledby="pm-dialog-title"><div class="pm-dialog-head"><h2 id="pm-dialog-title"></h2><button id="pm-close" type="button" aria-label="Fechar">×</button></div><div id="pm-dialog-body"></div></section></div>`;
 let view=localStorage.getItem(VIEW)==='kanban'?'kanban':'lista';
 const overlay=$('#pm-overlay');function close(){overlay.hidden=true;$('#pm-dialog-body').replaceChildren();}$('#pm-close').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close();};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});
 function persist(item,fn){const all=read(),e=all.find(x=>x.codigo===item.e.codigo);if(!e)return pannaAlert('Equipamento não encontrado.');let source=item.kind==='preventiva'?(e.planosPreventivos||[]):item.kind==='chamado'?(e.chamados||[]):(e.manutencoesExtras||[]);const target=source.find(x=>x.id===item.id);if(!target)return pannaAlert('Manutenção não encontrada.');fn(target,e);try{save(all)}catch{pannaAlert('Não foi possível salvar os dados.');return;}close();render();}
 // Ao concluir, recolhemos os dados reais da execução antes de mudar o estado.
 function openCompletion(item){
  $('#pm-dialog-title').textContent='Concluir manutenção — '+item.title;
  const insumos=structuredClone(Array.isArray(item.source.insumos)?item.source.insumos:[]);
  $('#pm-dialog-body').innerHTML=`<form id="pm-finish"><p class="pm-finish-intro">Registre os dados efetivos da realização. Os insumos previstos podem ser ajustados.</p><label>Data da realização<input id="pm-finish-date" type="date" max="${today()}" value="${today()}" required></label><label>Responsável<input id="pm-finish-owner" maxlength="100" placeholder="Nome de quem realizou" required></label><label>Observações<textarea id="pm-finish-note" rows="3" placeholder="Serviços realizados (opcional)"></textarea></label><div class="pm-supplies-head"><strong>Insumos utilizados</strong><button id="pm-finish-add" type="button">+ Insumo</button></div><div id="pm-finish-supplies"></div><div class="pm-actions"><button type="button" id="pm-finish-cancel">Cancelar</button><button type="submit" class="panna-pending-primary">Confirmar conclusão</button></div></form>`;
  const list=$('#pm-finish-supplies');
  function draw(){list.replaceChildren();insumos.forEach((ins,i)=>{const row=document.createElement('div');row.className='pm-supply-row';row.innerHTML=`<input class="pm-supply-name" aria-label="Nome do insumo" maxlength="100" required><input class="pm-supply-qty" type="number" min="0.001" step="any" required aria-label="Quantidade utilizada"><select class="pm-supply-unit" aria-label="Unidade">${units.map(u=>`<option>${u}</option>`).join('')}</select><button class="pm-remove-supply" type="button" aria-label="Remover insumo" title="Remover insumo">✕</button>`;row.querySelector('.pm-supply-name').value=ins.nome||'';row.querySelector('.pm-supply-qty').value=ins.quantidade??1;row.querySelector('.pm-supply-unit').value=units.includes(ins.unidade)?ins.unidade:'un';row.querySelector('.pm-remove-supply').onclick=()=>{insumos.splice(i,1);draw();};list.append(row);});}
  draw();$('#pm-finish-add').onclick=()=>{insumos.push({nome:'',quantidade:1,unidade:'un'});draw();};$('#pm-finish-cancel').onclick=()=>openItem(item);
  $('#pm-finish').onsubmit=async e=>{e.preventDefault();const dataExecucao=$('#pm-finish-date').value,responsavel=$('#pm-finish-owner').value.trim();if(!dataExecucao||dataExecucao>today()||!responsavel)return pannaAlert('Confira a data e o responsável.');const used=Array.from(list.querySelectorAll('.pm-supply-row')).map(row=>({nome:row.querySelector('.pm-supply-name').value.trim(),quantidade:Number(row.querySelector('.pm-supply-qty').value),unidade:row.querySelector('.pm-supply-unit').value}));if(used.some(i=>!i.nome||!(i.quantidade>0)))return pannaAlert('Confira os insumos utilizados.');const result=await finishMaintenance(item,{dataExecucao,responsavel,observacoes:$('#pm-finish-note').value.trim(),insumos:used});if(result){close();render();pannaAlert(typeof result==='string'?'Manutenção realizada. Próxima previsão: '+fmt(result)+'.':'Manutenção concluída e registrada no histórico.');}};
  overlay.hidden=false;$('#pm-finish-date').focus();
 }
 function openItem(item){$('#pm-dialog-title').textContent=item.title;const s=item.source;
 $('#pm-dialog-body').innerHTML=`<div class="pm-info"><p><b>Equipamento:</b> ${safe(item.e.nome)} (${safe(item.e.codigo)})</p><p><b>Origem:</b> ${item.kind==='preventiva'?'Preventiva cadastrada':item.kind==='chamado'?'Chamado aceito':'Manutenção manual'}</p><p><b>Local:</b> ${safe(item.e.localizacao||'Não informado')}</p><p><b>Previsão:</b> ${safe(fmt(item.data))}</p><p><b>Situação:</b> ${safe(item.state)}</p><p><b>Prioridade:</b> ${safe(priority(item))}</p><p><b>Periodicidade:</b> ${safe(s.periodicidade||'—')}</p><p><b>Descrição:</b> ${safe(s.descricao||'—')}</p><p><b>Insumos:</b> ${safe((s.insumos||[]).map(i=>`${i.nome} (${i.quantidade} ${i.unidade})`).join(', ')||'Nenhum cadastrado')}</p></div><form id="pm-update"><label>Alterar situação<select id="pm-next"><option>Pendente</option><option>Em manutenção</option><option>Concluída</option></select></label><label>Observação da alteração<textarea id="pm-note" rows="3" placeholder="Opcional"></textarea></label><div class="pm-actions"><button type="button" id="pm-cancel">Cancelar</button><button type="submit" class="panna-pending-primary">Salvar alteração</button></div></form>`;
 $('#pm-next').value=item.state;$('#pm-cancel').onclick=close;$('#pm-update').onsubmit=e=>{e.preventDefault();const next=$('#pm-next').value,note=$('#pm-note').value.trim();if(next===item.state){close();return;}if(next==='Concluída'){openCompletion(item);return;}persist(item,(record,equip)=>{if(item.kind==='preventiva')record.estadoExecucao=next;else if(item.kind==='chamado')record.estadoManutencao=next;else record.estado=next;record.atualizadoEm=new Date().toISOString();if(corrective(item.kind,record)&&norm(equip.situacao)!=='inativo'){if(next==='Em manutenção')operational(equip,'Em manutenção','Início da corretiva '+item.title);else if(next==='Pendente'&&norm(equip.situacao)==='em manutencao'&&!otherBlocking(equip,item.kind,item.id))operational(equip,'Parado','Corretiva retornou para pendente');}event(equip,'Manutenção '+next.toLowerCase(),`${item.title} · ${item.id} · ${item.state} → ${next}${note?' · '+note:''}`);});};overlay.hidden=false;$('#pm-next').focus();}
 // Busca escalável: não renderiza mil opções. A lista mostra até 12 correspondências.
 function add(){const equipment=read();if(!equipment.length)return pannaAlert('Cadastre um equipamento antes de adicionar manutenções.');
 $('#pm-dialog-title').textContent='Nova manutenção';
 $('#pm-dialog-body').innerHTML=`<form id="pm-create">
 <label>Pesquisar equipamento<input id="pm-equipment-search" type="search" autocomplete="off" placeholder="Digite nome, código ou patrimônio" required aria-controls="pm-equipment-results" aria-expanded="false"></label>
 <div id="pm-equipment-results" class="pm-equipment-results" role="listbox" hidden></div><p id="pm-equipment-selected" class="pm-selected" aria-live="polite">Nenhum equipamento selecionado</p>
 <label>Tipo<select id="pm-new-kind"><option value="Corretiva">Corretiva</option><option value="Preventiva">Preventiva</option></select></label>
 <label>Nome da manutenção<input id="pm-title" required maxlength="100" placeholder="Ex.: Revisão do motor"></label>
 <div id="pm-corrective"><label>Nível de prioridade<select id="pm-priority"><option value="Baixa">Baixa</option><option value="Média" selected>Média</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option></select></label></div>
 <div id="pm-preventive" hidden><label>Periodicidade<select id="pm-period"><option value="">Selecione</option>${['Diária','Semanal','Quinzenal','Mensal','Bimestral','Trimestral','Quadrimestral','Semestral','Anual'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Aviso antecipado (dias)<input id="pm-warning" type="number" min="0" step="1" value="7"></label></div>
 <label>Data prevista<input id="pm-date" type="date" required value="${today()}"></label><label>Descrição<textarea id="pm-description" rows="3"></textarea></label>
 <div class="pm-supplies-head"><strong>Insumos previstos</strong><button type="button" id="pm-add-supply">+ Insumo</button></div><div id="pm-supplies"></div>
 <div class="pm-actions"><button type="button" id="pm-cancel">Cancelar</button><button type="submit" class="panna-pending-primary">Adicionar manutenção</button></div></form>`;
 let selected=null;const search=$('#pm-equipment-search'),results=$('#pm-equipment-results');
 const selectEquipment=eq=>{selected=eq.codigo;search.value=`${eq.nome} · ${eq.codigo}`;$('#pm-equipment-selected').textContent=`Selecionado: ${eq.nome} (${eq.codigo})`;results.hidden=true;search.setAttribute('aria-expanded','false');};
 const showMatches=()=>{selected=null;$('#pm-equipment-selected').textContent='Nenhum equipamento selecionado';const q=norm(search.value.trim());results.replaceChildren();if(!q){results.hidden=true;search.setAttribute('aria-expanded','false');return;}const matches=equipment.filter(e=>norm([e.nome,e.codigo,e.patrimonio,e.numeroPatrimonio].join(' ')).includes(q)).slice(0,12);matches.forEach(eq=>{const btn=document.createElement('button');btn.type='button';btn.className='pm-equipment-option';btn.setAttribute('role','option');btn.textContent=`${eq.nome} · ${eq.codigo}${eq.patrimonio?' · '+eq.patrimonio:''}`;btn.onclick=()=>selectEquipment(eq);results.append(btn);});if(!matches.length){const msg=document.createElement('p');msg.textContent='Nenhum equipamento encontrado';results.append(msg);}results.hidden=false;search.setAttribute('aria-expanded','true');};
 search.addEventListener('input',showMatches);search.addEventListener('keydown',e=>{if(e.key==='Enter'&&!results.hidden){const first=results.querySelector('button');if(first){e.preventDefault();first.click();}}});
 $('#pm-new-kind').onchange=()=>{const preventive=$('#pm-new-kind').value==='Preventiva';$('#pm-preventive').hidden=!preventive;$('#pm-corrective').hidden=preventive;$('#pm-period').required=preventive;};
 const supplyRow=()=>{const row=document.createElement('div');row.className='pm-supply-row';row.innerHTML=`<input class="pm-supply-name" placeholder="Nome do insumo" maxlength="100" required aria-label="Nome do insumo"><input class="pm-supply-qty" type="number" min="0.001" step="any" placeholder="Qtd." required aria-label="Quantidade"><select class="pm-supply-unit" aria-label="Unidade">${units.map(u=>`<option>${u}</option>`).join('')}</select><button type="button" class="pm-remove-supply" aria-label="Remover insumo" title="Remover insumo">✕</button>`;row.querySelector('button').onclick=()=>row.remove();$('#pm-supplies').append(row);};
 $('#pm-add-supply').onclick=supplyRow;$('#pm-cancel').onclick=close;
 $('#pm-create').onsubmit=e=>{e.preventDefault();const all=read(),eq=all.find(x=>x.codigo===selected);if(!eq){search.setCustomValidity('Selecione um equipamento na lista de resultados.');search.reportValidity();search.setCustomValidity('');return;}const title=$('#pm-title').value.trim();if(!title)return;const preventive=$('#pm-new-kind').value==='Preventiva';const insumos=Array.from(document.querySelectorAll('.pm-supply-row')).map(row=>({nome:row.querySelector('.pm-supply-name').value.trim(),quantidade:Number(row.querySelector('.pm-supply-qty').value),unidade:row.querySelector('.pm-supply-unit').value}));const m={id:'MAN-'+uid(),tipo:title,categoria:preventive?'Preventiva':'Corretiva',prioridade:preventive?'':$('#pm-priority').value,periodicidade:preventive?$('#pm-period').value:'',avisoDias:preventive?Number($('#pm-warning').value):null,insumos,dataPrevista:$('#pm-date').value,descricao:$('#pm-description').value.trim(),estado:'Pendente',criadoEm:new Date().toISOString()};eq.manutencoesExtras??=[];eq.manutencoesExtras.push(m);event(eq,'Manutenção adicionada',`${m.categoria}: ${title} · ${preventive?'Periodicidade '+m.periodicidade:'Prioridade '+m.prioridade} · Previsão ${fmt(m.dataPrevista)} · ${insumos.length} insumo(s)`);try{save(all)}catch{return pannaAlert('Falha ao salvar.')}close();render();};overlay.hidden=false;search.focus();}
 $('#pm-new').onclick=add;
 function render(){const all=items(),q=norm($('#pm-search').value),kind=$('#pm-kind').value,st=$('#pm-status').value,time=$('#pm-time').value;const now=new Date();now.setHours(0,0,0,0);const week=new Date(now);week.setDate(week.getDate()+7);
 const filtered=all.filter(i=>{const d=date(i.data);return (!q||norm([i.e.nome,i.e.codigo,i.title,i.id,i.source.descricao,priority(i)].join(' ')).includes(q))&&(!kind||i.kind===kind)&&(!st||i.state===st)&&(!time||(d&&!isNaN(d)&&(time==='late'?d<now:d>=now&&d<=week)));}).sort((a,b)=>sortItems(a,b,$('#pm-order').value));
 const counts=[['Programadas',all.length],['Pendentes',all.filter(i=>i.state==='Pendente').length],['Em manutenção',all.filter(i=>i.state==='Em manutenção').length],['Concluídas',all.filter(i=>i.state==='Concluída').length]];$('#pm-stats').innerHTML=counts.map(([label,num])=>`<div class="pm-stat"><small>${label}</small><strong>${num}</strong></div>`).join('');$('#pm-result').textContent=filtered.length+' manutenção(ões) encontrada(s)';$('#pm-list').classList.toggle('selected',view==='lista');$('#pm-board').classList.toggle('selected',view==='kanban');
 const card=i=>`<button type="button" class="pm-item pm-item-${norm(priority(i)).replace(/[^a-z]/g,'')}" data-kind="${i.kind}" data-id="${safe(i.id)}" data-equip="${safe(i.e.codigo)}"><span class="pm-item-top"><b>${safe(i.title)}</b><span class="pm-item-badges"><span class="pm-priority pm-priority-${norm(priority(i)).replace(/[^a-z]/g,'')}">${safe(priority(i))}</span><span class="pm-pill pm-state-${norm(i.state).replace(/[^a-z]/g,'')}">${safe(i.state)}</span></span></span><span>${safe(i.e.nome)} · ${safe(i.e.codigo)}</span><span>${i.kind==='preventiva'?'Preventiva':i.kind==='chamado'?'Chamado aceito':'Manual'} · ${safe(fmt(i.data))}</span></button>`;
 if(view==='kanban')$('#pm-content').innerHTML=`<div class="pm-board">${['Pendente','Em manutenção','Concluída'].map(s=>`<section class="pm-column"><h3>${s} <span>${filtered.filter(i=>i.state===s).length}</span></h3>${filtered.filter(i=>i.state===s).map(card).join('')||'<p class="pm-muted">Nenhuma manutenção</p>'}</section>`).join('')}</div>`;
 else $('#pm-content').innerHTML=`<div class="pm-list">${filtered.map(card).join('')||'<p class="pm-muted">Nenhuma manutenção encontrada.</p>'}</div>`;
 $('#pm-content').querySelectorAll('.pm-item').forEach(b=>b.onclick=()=>{const i=filtered.find(i=>i.id===b.dataset.id&&i.e.codigo===b.dataset.equip&&i.kind===b.dataset.kind);if(i)openItem(i);});}
 ['pm-search','pm-kind','pm-status','pm-time','pm-order'].forEach(id=>$('#'+id).addEventListener(id==='pm-search'?'input':'change',render));$('#pm-list').onclick=()=>{view='lista';localStorage.setItem(VIEW,view);render()};$('#pm-board').onclick=()=>{view='kanban';localStorage.setItem(VIEW,view);$('#pm-status').value=''; // ETAPA 26: Kanban sempre mostra todas as situações ao ser selecionado.
 render()};
 // ETAPA 26: se o último modo salvo era Kanban, mostrar todas as colunas ao entrar.
 if(view==='kanban')$('#pm-status').value='';render();}
document.addEventListener('DOMContentLoaded',start);
})();
