/* ETAPA 33 — Interface compartilhada: menu, avisos e confirmações acessíveis.
   Promessas permitem aguardar a decisão sem bloquear o navegador. */
(()=>{'use strict';
 let queue=Promise.resolve();
 function dialog(message,mode='alert'){
  const task=()=>new Promise(resolve=>{
   const d=document.createElement('dialog');d.className='panna-ui-dialog';d.setAttribute('aria-labelledby','panna-ui-title');
   d.innerHTML=`<form><div class="panna-ui-mark">P</div><h2 id="panna-ui-title"></h2><p class="panna-ui-message"></p>${mode==='reason'?'<label>Motivo da inativação<textarea required maxlength="500" rows="4" placeholder="Descreva o motivo"></textarea></label>':''}<div class="panna-ui-actions">${mode==='alert'?'':'<button type="button" class="panna-ui-cancel">Cancelar</button>'}<button type="submit" class="panna-ui-ok">${mode==='alert'?'Entendi':mode==='reason'?'Inativar equipamento':'Confirmar'}</button></div></form>`;
   d.querySelector('h2').textContent=mode==='reason'?'Inativar equipamento':mode==='confirm'?'Confirmação':'Aviso do sistema';d.querySelector('p').textContent=message;
   const previous=document.activeElement;let done=false;
   const finish=value=>{if(done)return;done=true;d.close();d.remove();previous?.focus();resolve(value);};
   d.querySelector('form').onsubmit=e=>{e.preventDefault();const field=d.querySelector('textarea');if(field&&!field.value.trim()){field.setCustomValidity('Informe o motivo.');field.reportValidity();return;}finish(field?field.value.trim():true);};
   d.querySelector('textarea')?.addEventListener('input',e=>e.target.setCustomValidity(''));
   d.querySelector('.panna-ui-cancel')?.addEventListener('click',()=>finish(mode==='reason'?null:false));
   d.addEventListener('cancel',e=>{e.preventDefault();finish(mode==='reason'?null:false);});document.body.append(d);d.showModal();(d.querySelector('textarea,.panna-ui-cancel')||d.querySelector('.panna-ui-ok')).focus();
  });const result=queue.then(task);queue=result.catch(()=>{});return result;
 }
 window.pannaAlert=m=>dialog(m);window.pannaConfirm=m=>dialog(m,'confirm');window.pannaReason=name=>dialog('Informe por que o equipamento '+name+' será inativado.','reason');
 // ETAPA 34: menu aberto no desktop e recolhido em telas de até 1024px,
 // seguindo o breakpoint de gaveta já utilizado no CSS. Só o ícone alterna manualmente.
 document.addEventListener('DOMContentLoaded',()=>{
  const b=document.getElementById('toggle-sidebar');
  if(b){
   const mobile=window.matchMedia('(max-width: 1024px)');
   const side=document.getElementById('side-menu');
   const sync=closed=>{
    document.body.classList.toggle('sidebar-collapsed',closed);
    b.setAttribute('aria-expanded',String(!closed));
    b.title=closed?'Mostrar menu lateral':'Ocultar menu lateral';
    if(side)side.inert=closed; // Impede foco em links do menu oculto.
   };
   sync(mobile.matches);
   b.addEventListener('click',()=>sync(!document.body.classList.contains('sidebar-collapsed')));
   mobile.addEventListener('change',e=>sync(e.matches));
  }
  // ETAPA 34: link semântico no logo para o painel do técnico, sem alterar o acesso do operador.
  const logo=document.getElementById('navbar-logo');
  if(logo && sessionStorage.getItem('panna-assets-perfil')==='adm'){
   const link=document.createElement('a');
   link.href='HomeDesk.html';link.className='panna-home-logo';
   link.setAttribute('aria-label','Ir para a tela inicial do técnico');
   link.title='Ir para a tela inicial do técnico';
   logo.alt='Grupo Panna';logo.before(link);link.append(logo);
  }
 });
})();
