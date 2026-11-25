/* ETAPA 33 — Dashboard do técnico: leitura dos registros locais, sem modificar dados. */
(()=>{'use strict';
 const read=(k,f=[])=>{try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:f;}catch{return f;}};
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const done=v=>/concluid|finaliz/.test(norm(v));
 const day=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?Date.UTC(+m[1],+m[2]-1,+m[3]):NaN;};
 function render(){const root=document.getElementById('panna-dashboard');if(!root)return;
 const eq=read('panna-assets-equipamentos-v1',window.PANNA_EQUIPAMENTOS_INICIAIS||[]),tr=read('panna-assets-transferencias-v1');const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
 const calls=eq.flatMap(e=>(e.chamados||[]).map(c=>({e,c})));const open=c=>!c.estado||['aberto','pendente','aberta'].includes(norm(c.estado));
 const urgent=calls.filter(({c})=>!done(c.estadoManutencao||c.estado)&&!['recusado','recusada'].includes(norm(c.estado))&&norm(c.prioridade)==='urgente');
 const plans=eq.filter(e=>norm(e.situacao)!=='inativo').flatMap(e=>[...(e.planosPreventivos||[]).filter(p=>!done(p.estadoExecucao)),...(e.manutencoesExtras||[]).filter(p=>norm(p.categoria)==='preventiva'&&!done(p.estado))].map(p=>({e,p,days:(day(p.dataPrevista)-today)/86400000}))).filter(x=>Number.isFinite(x.days)).sort((a,b)=>a.days-b.days);
 const stats=[['Equipamentos cadastrados',eq.length,'GE1.html',''],['Em funcionamento',eq.filter(e=>norm(e.situacao)==='em funcionamento').length,'GE1.html','green'],['Parados',eq.filter(e=>norm(e.situacao)==='parado').length,'GE1.html','red'],['Em manutenção',eq.filter(e=>norm(e.situacao)==='em manutencao').length,'MAN2.html','amber'],['Inativos',eq.filter(e=>norm(e.situacao)==='inativo').length,'GE1.html',''],['Chamados em aberto',calls.filter(({c})=>open(c)).length,'MAN1.html','amber'],['Preventivas atrasadas',plans.filter(x=>x.days<0).length,'MAN2.html','red'],['Preventivas nos próximos 7 dias',plans.filter(x=>x.days>=0&&x.days<=7).length,'MAN2.html','amber'],['Transferências em movimento',tr.filter(t=>t.status==='movimento').length,'TE1.html','']];
 const grid=root.querySelector('.pd-grid');grid.replaceChildren();for(const [label,value,href,color] of stats){const a=document.createElement('a');a.href=href;a.className='pd-card '+color;const small=document.createElement('span'),strong=document.createElement('strong');small.textContent=label;strong.textContent=value.toLocaleString('pt-BR');a.append(small,strong);grid.append(a);}
 function rows(id,items){const el=document.getElementById(id);el.replaceChildren();if(!items.length){el.textContent='Nenhum registro nesta categoria.';return;}for(const [title,detail,href] of items.slice(0,6)){const a=document.createElement('a');a.href=href;const b=document.createElement('strong'),s=document.createElement('small');b.textContent=title;s.textContent=detail;a.append(b,s);el.append(a);}}
 rows('pd-urgent',urgent.map(({e,c})=>[e.nome,c.tipo+' · '+(c.estado||'Aberto'),'MAN1.html']).concat(eq.flatMap(e=>(e.manutencoesExtras||[]).filter(m=>norm(m.prioridade)==='urgente'&&!done(m.estado)).map(m=>[e.nome,m.tipo+' · '+m.estado,'MAN2.html']))));
 rows('pd-plans',plans.filter(x=>x.days<=7).map(({e,p,days})=>[e.nome+' · '+(p.tipo||'Preventiva'),days<0?`${-days} dia(s) de atraso`:days===0?'Vence hoje':`Em ${days} dia(s)`,'MAN2.html']));
 const locations=new Map();for(const e of eq){const k=e.localizacao||'Sem localização';locations.set(k,(locations.get(k)||0)+1);}rows('pd-locations',[...locations].sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v+' equipamento(s)','GE1.html']));
 }
 document.addEventListener('DOMContentLoaded',render);window.addEventListener('storage',render);window.addEventListener('pageshow',render);
})();
