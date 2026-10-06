import './styles.css';

const obligations = [
  ['Impuestos','IVA'], ['Impuestos','Ingresos Brutos'], ['Impuestos','ATM'],
  ['Servicios','EDEMSA local'], ['Servicios','EDEMSA casa'], ['Servicios','Ecogas'],
  ['Comunicaciones','Celular'], ['Comunicaciones','Internet local - Punto Net'], ['Comunicaciones','Movistar Fibra casa'],
  ['Software','Sistema Flexxus'], ['Educación','Colegio Giovani'],
  ['Alquileres','Alquiler local'], ['Alquileres','Alquiler casa'],
  ['Municipalidad','Municipalidad casa'], ['Municipalidad','Municipalidad local'], ['Seguros','Seguro local'],
  ['Servicios profesionales','Honorarios contador']
].map((item, i) => ({ id:i+1, category:item[0], name:item[1], active:true, notifications:true }))
 .sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'}));

const today = new Date();
const iso = d => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
const add = n => { const d = new Date(today); d.setDate(d.getDate()+n); return iso(d); };
const appState = {
  view:'inicio', filter:'all', search:'', records: JSON.parse(localStorage.getItem('cv_records_v2') || '[]'),
  settings: JSON.parse(localStorage.getItem('cv_settings') || 'null') || {time:'09:00', reminders:['7','3','1','0'], alerts:true}
};

const money = n => n == null ? 'Sin importe' : new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
const dateFmt = s => new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'short'}).format(new Date(`${s}T12:00:00`));
const statusMap = {paid:['Pagado','ok'], overdue:['Vencido','danger'], soon:['Próximo','warn'], pending:['Pendiente','neutral'], review:['Requiere revisión','review'], 'due-today':['Vence hoy','today']};
const icon = (name) => ({home:'⌂', list:'≡', calendar:'□', file:'▱', pay:'✓', report:'↗', settings:'⚙'}[name] || '•');

function nav(){
  const items=[['inicio','home','Inicio'],['vencimientos','list','Vencimientos'],['calendario','calendar','Calendario'],['documentos','file','Documentos'],['pagos','pay','Pagos'],['reportes','report','Reportes'],['configuracion','settings','Configuración']];
  return `<aside class="sidebar"><div class="brand"><span class="brandmark">✓</span><div><b>Control</b><small>de vencimientos</small></div></div><nav>${items.map(([v,i,l])=>`<button data-view="${v}" class="${appState.view===v?'active':''}"><span>${icon(i)}</span>${l}</button>`).join('')}</nav><div class="user"><div class="avatar">FP</div><div><b>Administrador</b><small>Cuenta principal</small></div></div></aside>`;
}

function top(title, subtitle='Todo bajo control, sin planillas.'){
  return `<header class="top"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="top-actions"><button class="icon-btn" id="notifyBtn" title="Notificaciones">♧<i></i></button><button class="primary" id="uploadTop">＋ Cargar documento</button></div></header>`;
}

function stat(label,value,meta,kind){return `<article class="stat ${kind}"><div class="stat-icon">${kind==='money'?'$':kind==='danger'?'!':kind==='warn'?'◷':kind==='ok'?'✓':'?'}</div><div><span>${label}</span><strong>${value}</strong><small>${meta}</small></div></article>`}
function row(r){const [label,kind]=statusMap[r.status]||statusMap.pending;return `<tr data-id="${r.id}"><td><div class="ob"><span class="catdot ${kind}"></span><div><b>${r.obligation}</b><small>${r.category}</small></div></div></td><td>${r.period}</td><td><b>${dateFmt(r.due)}</b></td><td class="amount">${money(r.amount)}</td><td><span class="badge ${kind}"><i></i>${label}</span></td><td><button class="more">•••</button></td></tr>`}
function obligationRow(o){return `<tr data-obligation="${o.id}"><td><div class="ob"><span class="catdot review"></span><div><b>${o.name}</b><small>${o.category}</small></div></div></td><td class="muted-cell">—</td><td class="muted-cell">Sin fecha</td><td class="muted-cell">Sin importe</td><td><span class="badge review"><i></i>Sin información</span></td><td><button class="row-upload" data-upload-obligation="${o.name}">＋ Cargar</button></td></tr>`}

function dashboard(){
 const pending=appState.records.filter(r=>!['paid'].includes(r.status) && r.amount).reduce((a,r)=>a+r.amount,0);
 const overdue=appState.records.filter(r=>r.status==='overdue'); const soon=appState.records.filter(r=>['soon','due-today'].includes(r.status)); const paid=appState.records.filter(r=>r.status==='paid'); const review=appState.records.filter(r=>r.status==='review');
 const dueToday=appState.records.filter(r=>r.due===iso(today)&&r.status!=='paid');
 return `${top('Buen día 👋')}<section class="hero-alert"><div class="alert-bell">♧</div><div><span>HOY · RECORDATORIO ACTIVO</span><h2>${dueToday.length ? `${dueToday[0].obligation} vence hoy` : 'No hay vencimientos para hoy'}</h2><p>${dueToday.length ? `${dueToday[0].period} · ${money(dueToday[0].amount)} · Aún no figura como pagado.` : 'Cargá una factura para comenzar.'}</p></div>${dueToday.length?`<button data-view="vencimientos">Ver vencimiento <b>→</b></button>`:''}</section>
 <section class="stats">${stat('Total pendiente',money(pending),appState.records.length?'Obligaciones registradas':'Sin datos cargados','money')}${stat('Vencidos',overdue.length,overdue.length?'Requieren atención':'Sin vencidos','danger')}${stat('Próximos',soon.length,'En los próximos 5 días','warn')}${stat('Pagados',paid.length,'Este mes','ok')}${stat('Sin información',review.length,'Para revisar','review')}</section>
 <section class="two-col"><div class="panel"><div class="panel-head"><div><span class="eyebrow">PRIORIDAD</span><h2>Próximos vencimientos</h2></div><button class="link" data-view="vencimientos">Ver todos →</button></div><div class="table-wrap"><table><thead><tr><th>Obligación</th><th>Período</th><th>Vence</th><th>Importe</th><th>Estado</th><th></th></tr></thead><tbody>${appState.records.length?appState.records.filter(r=>r.status!=='paid').slice(0,5).map(row).join(''):'<tr><td colspan="6" class="empty">Todavía no cargaste vencimientos.</td></tr>'}</tbody></table></div></div>
 <div class="side-stack"><div class="panel upload-card"><span class="upload-icon">⇧</span><h2>¿Tenés un documento?</h2><p>Subí una factura o comprobante. Nosotros hacemos el resto.</p><button class="primary full" id="uploadCard">＋ Cargar documento</button><small>PDF, JPG o PNG · Máx. 15 MB</small></div><div class="panel mini"><div class="panel-head"><h3>Últimos pagos</h3><button class="link" data-view="pagos">Ver todos</button></div>${paid.length?paid.map(r=>`<div class="payment"><span>✓</span><div><b>${r.obligation}</b><small>${r.period} · ${dateFmt(r.paid)}</small></div><strong>${money(r.amount)}</strong></div>`).join(''):'<p class="empty">Todavía no hay pagos.</p>'}</div></div></section>`;
}

function recordsView(){
 let records=appState.records.filter(r=>appState.filter==='all'||r.status===appState.filter);
 if(appState.search){const q=appState.search.toLowerCase();records=records.filter(r=>`${r.obligation} ${r.category} ${r.period} ${r.amount}`.toLowerCase().includes(q));}
 let emptyObligations=[];
 if(appState.filter==='all'||appState.filter==='review'){
   const q=appState.search.toLowerCase();
   emptyObligations=obligations.filter(o=>!appState.records.some(r=>r.obligation===o.name)&&(!q||`${o.name} ${o.category}`.toLowerCase().includes(q)));
 }
 const rows=[...records.map(row),...emptyObligations.map(obligationRow)].join('');
 return `${top('Vencimientos','Tus ${obligations.length} obligaciones aparecen siempre, aunque todavía no tengan una factura cargada.')}<div class="toolbar"><label class="search">⌕<input id="search" placeholder="Buscar obligación, período o importe" value="${appState.search}"></label><button class="outline">☷ Filtros</button></div><div class="tabs">${[['all','Todos'],['paid','Pagados'],['pending','Pendientes'],['soon','Próximos'],['overdue','Vencidos'],['review','Sin información']].map(([k,l])=>`<button class="${appState.filter===k?'active':''}" data-filter="${k}">${l}</button>`).join('')}</div><div class="panel records"><div class="records-head"><b>${records.length+emptyObligations.length} ítems</b><span>Los ítems sin factura no generan alertas.</span></div><div class="table-wrap"><table><thead><tr><th>Obligación</th><th>Período</th><th>Vencimiento</th><th>Importe</th><th>Estado</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="empty">No encontramos resultados.</td></tr>`}</tbody></table></div></div>`;
}

function settingsView(){const s=appState.settings;const granted='Notification' in window&&Notification.permission==='granted';return `${top('Configuración','Personalizá alertas y preferencias de la aplicación.')}<div class="settings-grid"><section class="panel settings-card"><div class="setting-title"><span class="setting-icon">♧</span><div><h2>Alertas de vencimiento</h2><p>Recibí notificaciones en este teléfono aunque la aplicación esté cerrada.</p></div><label class="switch"><input id="alertsToggle" type="checkbox" ${s.alerts?'checked':''}><span></span></label></div><div class="setting-row"><div><b>Alerta el día del vencimiento</b><small>Solo si no existe un pago confirmado</small></div><strong class="required">Obligatoria</strong></div><div class="setting-row"><div><b>Horario de notificación</b><small>Zona horaria: Buenos Aires (GMT-3)</small></div><input id="alertTime" type="time" value="${s.time}"></div><div class="setting-row vertical"><div><b>Recordatorios anticipados</b><small>Elegí cuándo querés recibir avisos adicionales</small></div><div class="checks">${[['7','7 días antes'],['3','3 días antes'],['1','1 día antes'],['0','El mismo día']].map(([v,l])=>`<label><input type="checkbox" data-reminder="${v}" ${s.reminders.includes(v)?'checked':''}> ${l}</label>`).join('')}</div></div><button class="primary" id="enablePush">Activar notificaciones en este dispositivo</button><p class="hint" id="pushStatus">${granted?'✓ Notificaciones autorizadas en este navegador.':'Se solicitará permiso del sistema.'}</p></section><section class="panel settings-card"><h2>Obligaciones</h2><p>Las ${obligations.length} obligaciones iniciales están preparadas, sin importes ni vencimientos ficticios.</p><div class="obligation-list">${obligations.map(o=>`<div><span>${o.name}</span><small>${o.category}</small></div>`).join('')}</div></section></div>`}

function placeholder(){const names={calendario:'Calendario',documentos:'Documentos',pagos:'Pagos',reportes:'Reportes'};return `${top(names[appState.view]||'Control de Vencimientos')}<section class="panel placeholder"><span>${appState.view==='calendario'?'□':appState.view==='pagos'?'✓':'▱'}</span><h2>${names[appState.view]}</h2><p>Esta sección está preparada para conectar los datos reales de tus documentos.</p><button class="primary" id="uploadPlaceholder">＋ Cargar primer documento</button></section>`}

function mobileNav(){return `<div class="mobile-nav">${[['inicio','⌂','Inicio'],['vencimientos','≡','Vence.'],['upload','＋',''],['calendario','□','Calendario'],['configuracion','⚙','Ajustes']].map(([v,i,l])=>v==='upload'?`<button class="upload-fab" id="mobileUpload">${i}</button>`:`<button data-view="${v}" class="${appState.view===v?'active':''}"><span>${i}</span>${l}</button>`).join('')}</div>`}
function render(){let content=appState.view==='inicio'?dashboard():appState.view==='vencimientos'?recordsView():appState.view==='configuracion'?settingsView():placeholder();document.querySelector('#app').innerHTML=`${nav()}<main>${content}</main>${mobileNav()}<input hidden id="fileInput" type="file" accept="application/pdf,image/jpeg,image/png" capture="environment"><div id="modalRoot"></div><div id="toast"></div>`;bind();}

function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3200)}
function openUpload(){document.querySelector('#fileInput').click()}
function closeModal(){document.querySelector('#modalRoot').innerHTML=''}
function openLoadMenu(target=''){
 document.querySelector('#modalRoot').innerHTML=`<div class="modal-backdrop"><section class="modal choice-modal"><button class="modal-close" data-close>×</button><span class="modal-kicker">NUEVO REGISTRO</span><h2>${target?target:'Cargar información'}</h2><p>Elegí cómo querés incorporar los datos.</p><div class="choice-grid"><button id="chooseFile"><span>⇧</span><b>Subir documento</b><small>PDF, JPG o PNG</small></button><button id="chooseManual"><span>✎</span><b>Carga manual</b><small>Completá los datos</small></button></div></section></div>`;
 document.querySelector('[data-close]').onclick=closeModal;
 document.querySelector('.modal-backdrop').onclick=e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()};
 document.querySelector('#chooseFile').onclick=()=>{if(target)localStorage.setItem('cv_upload_target',target);closeModal();openUpload()};
 document.querySelector('#chooseManual').onclick=()=>openManualForm(target);
}
function openManualForm(target=''){
 const options=obligations.map(o=>`<option value="${o.name}" ${o.name===target?'selected':''}>${o.name}</option>`).join('');
 document.querySelector('#modalRoot').innerHTML=`<div class="modal-backdrop"><section class="modal form-modal"><button class="modal-close" data-close>×</button><span class="modal-kicker">CARGA MANUAL</span><h2>Nuevo vencimiento</h2><p>Los campos marcados con * son obligatorios.</p><form id="manualForm"><label class="wide">Obligación *<select name="obligation" required><option value="">Seleccionar…</option>${options}</select></label><label>Período *<input name="period" placeholder="Ej. 10/2026" required></label><label>Moneda<select name="currency"><option value="ARS">ARS - Pesos</option><option value="USD">USD - Dólares</option></select></label><label>Fecha de emisión<input name="issued" type="date"></label><label>Fecha de vencimiento *<input name="due" type="date" required></label><label>Importe *<input name="amount" type="number" min="0" step="0.01" placeholder="0,00" required></label><label>Número de factura<input name="invoice" placeholder="Ej. 0001-00001234"></label><label class="wide">Observaciones<textarea name="notes" rows="3" placeholder="Información adicional"></textarea></label><div class="form-actions wide"><button type="button" class="outline" data-close>Cancelar</button><button type="submit" class="primary">Guardar vencimiento</button></div></form></section></div>`;
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
 document.querySelector('.modal-backdrop').onclick=e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()};
 document.querySelector('#manualForm').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));const obligation=obligations.find(o=>o.name===data.obligation);const due=new Date(`${data.due}T12:00:00`);const diff=Math.ceil((due-today)/86400000);const status=diff<0?'overdue':diff===0?'due-today':diff<=5?'soon':'pending';appState.records.push({id:Date.now(),obligation:data.obligation,category:obligation?.category||'',period:data.period,due:data.due,issued:data.issued,amount:Number(data.amount),currency:data.currency,invoice:data.invoice,notes:data.notes,status,created:iso(new Date())});localStorage.setItem('cv_records_v2',JSON.stringify(appState.records));closeModal();appState.view='vencimientos';render();toast('Vencimiento guardado correctamente')};
}
function bind(){
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{appState.view=b.dataset.view;render()});
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{appState.filter=b.dataset.filter;render()});
 ['uploadTop','uploadCard','uploadPlaceholder','mobileUpload'].forEach(id=>{const e=document.getElementById(id);if(e)e.onclick=()=>openLoadMenu()});
 const input=document.querySelector('#fileInput');input.onchange=()=>{if(!input.files[0])return;toast(`Analizando ${input.files[0].name}…`);setTimeout(()=>toast('Documento recibido. Listo para conectar con OCR/IA.'),1800)};
 document.querySelectorAll('[data-upload-obligation]').forEach(b=>b.onclick=()=>openLoadMenu(b.dataset.uploadObligation));
 const search=document.querySelector('#search');if(search)search.oninput=e=>{appState.search=e.target.value;setTimeout(render,180)};
 const toggle=document.querySelector('#alertsToggle');if(toggle)toggle.onchange=e=>saveSettings({...appState.settings,alerts:e.target.checked});
 const time=document.querySelector('#alertTime');if(time)time.onchange=e=>saveSettings({...appState.settings,time:e.target.value});
 document.querySelectorAll('[data-reminder]').forEach(c=>c.onchange=()=>saveSettings({...appState.settings,reminders:[...document.querySelectorAll('[data-reminder]:checked')].map(x=>x.dataset.reminder)}));
 const enable=document.querySelector('#enablePush');if(enable)enable.onclick=async()=>{if(!('Notification'in window)){toast('Este navegador no admite notificaciones.');return}const p=await Notification.requestPermission();document.querySelector('#pushStatus').textContent=p==='granted'?'✓ Notificaciones autorizadas. El backend podrá enviar las alertas.':'No se otorgó permiso para notificaciones.';if(p==='granted')new Notification('Alertas activadas',{body:`Te avisaremos a las ${appState.settings.time} cuando un vencimiento siga pendiente.`,icon:'/icon.svg'})};
}
function saveSettings(s){appState.settings=s;localStorage.setItem('cv_settings',JSON.stringify(s));toast('Configuración guardada')}

if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js');
render();
