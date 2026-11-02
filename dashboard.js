const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

const state={
  module:'overview',
  period:'today',
  sector:'Todos',
  start:null,
  end:null
};


/* Agendamentos compartilhados do pitch.
   São somados aos dados fictícios já existentes sem alterar o layout. */
const sharedDemoApi={
  endpoint:'https://api.restful-api.dev/objects',
  projectKey:'unimed-sem-fila-divinopolis-pitch-final-2026',
  refreshMs:30000
};
let sharedAppointments=[];
function sharedBookingKey(b){return String((b&&(b.protocol||b.id))||'')}
function remoteToBooking(item){
  const d=item&&item.data||{};
  return normalizeBooking({
    id:'QR-'+String(item.id||d.protocol||''),
    protocol:String(d.protocol||item.id||''),
    user:'Participante QR',
    age:Number(d.age||35),
    origin:d.origin==='interchange'?'interchange':'local',
    service:String(d.service||'Outros'),
    sector:String(d.sector||'Atendimento Geral'),
    reason:String(d.reason||d.service||'Atendimento'),
    payment:String(d.payment||'—'),
    date:String(d.date||''),
    time:String(d.time||''),
    duration:Number(d.duration||20),
    blocks:Number(d.blocks||1),
    status:String(d.status||'Agendado'),
    source:'shared-demo'
  });
}
async function refreshSharedAppointments(){
  try{
    const response=await fetch(sharedDemoApi.endpoint,{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const objects=await response.json();
    sharedAppointments=(Array.isArray(objects)?objects:[])
      .filter(item=>item&&item.data&&item.data.projectKey===sharedDemoApi.projectKey&&item.data.type==='appointment')
      .map(remoteToBooking);
    render();
  }catch(error){
    /* O painel continua com os dados fictícios e registros locais caso
       a base demonstrativa esteja temporariamente indisponível. */
    console.warn('[Sem Fila] Não foi possível atualizar os agendamentos compartilhados.',error);
  }
}

const moduleMeta={
  overview:['Visão geral','Acompanhamento executivo da modalidade'],
  agenda:['Agenda','Capacidade, horários e comportamento operacional'],
  profile:['Perfil de utilização','Adesão ao agendamento online'],
  digital:['Serviços online','Eficiência dos direcionamentos digitais'],
  reports:['Relatórios','Consulta detalhada e exportação']
};

function dateISO(d){
  return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}

/* Calendário operacional 2026 — Divinópolis.
   O painel não cria capacidade/agendamentos fictícios em fins de semana ou feriados. */
const closedDates2026=new Set([
  '2026-01-01','2026-04-03','2026-04-21','2026-05-01',
  '2026-06-01','2026-06-04','2026-09-07','2026-10-12',
  '2026-11-02','2026-11-15','2026-11-20','2026-12-07','2026-12-25'
]);
function isClosedDateISO(iso){
  if(!iso)return true;
  const d=new Date(iso+'T12:00:00');
  return d.getDay()===0||d.getDay()===6||closedDates2026.has(iso);
}
function isFutureDateISO(iso){return iso>dateISO(new Date())}
function isTodayISO(iso){return iso===dateISO(new Date())}
function slotDateTime(date,time){return new Date(`${date}T${String(time||'00:00')}:00`)}
function isFutureSlot(date,time){return slotDateTime(date,time).getTime()>Date.now()}
function historicalDemoStatus(date,time,currentStatus,key=''){
  if(currentStatus==='Cancelado'||currentStatus==='Concluído'||currentStatus==='Falta')return currentStatus;
  const h=hashString(`${date}|${time}|${key}`);
  return h%9===0?'Falta':'Concluído';
}
function statusForSeed(date,time,seedStatus,key=''){
  if(isFutureSlot(date,time))return seedStatus==='Cancelado'?'Cancelado':'Agendado';
  return historicalDemoStatus(date,time,seedStatus,key);
}
function addDays(d,n){
  const x=new Date(d);x.setDate(x.getDate()+n);return x;
}
function pct(a,b){return b?Math.round(a/b*100):0}
function brDate(iso){
  if(!iso)return'—';
  const[y,m,d]=iso.split('-');
  return`${d}/${m}/${y}`;
}
function saved(){
  return JSON.parse(localStorage.getItem('semfila_bookings_v8')||'[]');
}
function savedDigital(){
  return JSON.parse(localStorage.getItem('semfila_digital_routes_v8')||'[]');
}
function ageBand(age){
  if(age<18)return'0-17';
  if(age<30)return'18-29';
  if(age<45)return'30-44';
  if(age<60)return'45-59';
  return'60+';
}
function sectorFromService(service=''){
  const s=String(service);
  const sectors=[];
  if(s.includes('Negociação'))sectors.push('Financeiro');
  if(s.includes('Troca de plano'))sectors.push('Cadastro');
  if(s.includes('Autorizações'))sectors.push('Autorizações');
  if(s.includes('Intercâmbio'))sectors.push('Intercâmbio');
  if(s.includes('Outros'))sectors.push('Atendimento Geral');
  return sectors.length?sectors.join(' + '):'Atendimento Geral';
}
function hashString(s){
  return[...s].reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),7)>>>0;
}
function seeded(date){
  const day=new Date(date+'T12:00:00');
  if(isClosedDateISO(date))return[];

  const names=['Mariana Souza','Carlos Henrique','Joana Lima','Rafael Martins','Bianca Alves','Paulo César','Fernanda Ribeiro','Lucas Rocha','Camila Mendes','Ricardo Nunes','Helena Duarte','Gustavo Alves'];
  const ages=[15,22,27,34,41,48,56,62,68,31,73,44,18,59,36,66,25,52,61,39,12,29,46,70,33,54,64,23];
  const services=['Negociação','Autorizações','Troca de plano','Outros','Negociação + Autorizações','Intercâmbio'];
  const times=['08:00','08:20','08:40','09:00','09:20','09:40','10:00','10:20','10:40','11:00','11:20','11:40','13:00','13:20','13:40','14:00','14:20','14:40','15:00','15:20','15:40','16:00','16:20','16:40'];
  const h=hashString(date);
  const count=20+(h%10);
  const arr=[];

  for(let i=0;i<count;i++){
    const idx=(i+(h%17));
    const age=ages[idx%ages.length];
    const service=services[(idx+h)%services.length];
    const sector=sectorFromService(service);
    const inter=service==='Intercâmbio'||(idx+h)%11===0;
    const historicalStatus=(idx+h)%17===0?'Cancelado':(idx+h)%12===0?'Falta':(idx+h)%3===0?'Concluído':'Agendado';
    const time=times[(idx+h)%times.length];
    const status=statusForSeed(date,time,historicalStatus,String(i));
    const duration=service.includes('+')?40:20;

    arr.push({
      id:`D-${date}-${i}`,
      user:names[idx%names.length],
      age,
      sector,
      origin:inter?'interchange':'local',
      service,
      reason:service,
      payment:service.includes('Negociação')?((idx+h)%2?'Cartão':'Boleto'):'—',
      date,
      time,
      duration,
      blocks:duration/20,
      status
    });
  }
  return arr;
}
function seededDigital(date){
  const day=new Date(date+'T12:00:00');
  if(day.getDay()===0||day.getDay()===6)return[];
  const services=[
    ['2ª via de boleto','Financeiro'],
    ['Autorização de guias','Autorizações'],
    ['Guia Médico','Atendimento Geral'],
    ['Extrato de utilização','Atendimento Geral'],
    ['Orçamento de exames','Atendimento Geral']
  ];
  const h=hashString('digital'+date);
  const count=5+(h%5);
  return Array.from({length:count},(_,i)=>{
    const s=services[(i+h)%services.length];
    const r=(i+h)%10;
    return{
      id:`DG-${date}-${i}`,
      date,
      service:s[0],
      sector:s[1],
      status:isFutureDateISO(date)?'pending':(r<7?'resolved':r<9?'pending':'not_resolved'),
      source:(i+h)%3===0?'identificacao':'assuntos'
    };
  });
}
function normalizeBooking(b){
  const normalized={...b,sector:b.sector||sectorFromService(b.service)};
  const date=String(normalized.date||'');
  const time=String(normalized.time||'00:00');
  const original=String(normalized.status||'Agendado');
  if(original==='Cancelado')normalized.status='Cancelado';
  else if(isFutureSlot(date,time))normalized.status='Agendado';
  else normalized.status=historicalDemoStatus(date,time,original,sharedBookingKey(normalized));
  return normalized;
}
function datesBetween(start,end){
  const out=[];
  let d=new Date(start+'T12:00:00');
  const e=new Date(end+'T12:00:00');
  while(d<=e){
    out.push(dateISO(d));
    d=addDays(d,1);
  }
  return out;
}
function resolvePeriod(){
  const today=new Date();
  let end=dateISO(today),start=end;
  if(state.period==='7')start=dateISO(addDays(today,-6));
  if(state.period==='30')start=dateISO(addDays(today,-29));
  if(state.period==='custom'){
    start=$('#startDate').value||end;
    end=$('#endDate').value||start;
    if(start>end)[start,end]=[end,start];
  }
  state.start=start;state.end=end;
  return{start,end,dates:datesBetween(start,end)};
}
function currentDataset(){
  const period=resolvePeriod();
  const dateSet=new Set(period.dates);

  let appointments=period.dates.flatMap(d=>seeded(d));
  const localAppointments=saved().filter(b=>dateSet.has(b.date)&&!isClosedDateISO(b.date)).map(normalizeBooking);
  const localKeys=new Set(localAppointments.map(sharedBookingKey).filter(Boolean));
  const remoteAppointments=sharedAppointments
    .filter(b=>dateSet.has(b.date)&&!isClosedDateISO(b.date))
    .filter(b=>!localKeys.has(sharedBookingKey(b)));
  appointments.push(...localAppointments,...remoteAppointments);

  let digital=period.dates.flatMap(d=>seededDigital(d));
  digital.push(...savedDigital().filter(x=>dateSet.has(x.date)).map(x=>({...x,status:x.status||'pending'})));

  if(state.sector!=='Todos'){
    appointments=appointments.filter(x=>String(x.sector||'').includes(state.sector));
    digital=digital.filter(x=>String(x.sector||'').includes(state.sector));
  }
  return{appointments,digital,period};
}
function businessDayCount(dates){
  return dates.filter(x=>!isClosedDateISO(x)).length;
}
function calcMetrics(data,digital,period){
  const active=data.filter(x=>x.status!=='Cancelado');
  const completed=data.filter(x=>x.status==='Concluído');
  const cancel=data.filter(x=>x.status==='Cancelado');
  const noShow=data.filter(x=>x.status==='Falta');
  const multi=active.filter(x=>(x.duration||20)>20);
  const blocks=active.reduce((a,b)=>a+(b.blocks||1),0);
  const businessDays=businessDayCount(period.dates);
  const capacity=96*businessDays;
  const occupancy=Math.min(100,pct(blocks,capacity));
  const avg=active.length?Math.round(active.reduce((a,b)=>a+(b.duration||20),0)/active.length):0;

  const dResolved=digital.filter(x=>x.status==='resolved').length;
  const dRate=pct(dResolved,digital.length);

  return{
    active:active.length,
    completed:completed.length,
    cancel:cancel.length,
    cancelRate:pct(cancel.length,data.length),
    noShow:noShow.length,
    noShowRate:pct(noShow.length,Math.max(1,active.length)),
    multi:multi.length,
    multiRate:pct(multi.length,Math.max(1,active.length)),
    blocks,capacity,businessDays,occupancy,avg,
    digitalTotal:digital.length,
    digitalResolved:dResolved,
    digitalRate:dRate
  };
}
function previousPeriod(period){
  const currentDays=period.dates.length;
  const prevEnd=dateISO(addDays(new Date(period.start+'T12:00:00'),-1));
  const prevStart=dateISO(addDays(new Date(prevEnd+'T12:00:00'),-(currentDays-1)));
  const dates=datesBetween(prevStart,prevEnd);
  const dateSet=new Set(dates);
  let appointments=dates.flatMap(d=>seeded(d));
  const localAppointments=saved().filter(b=>dateSet.has(b.date)&&!isClosedDateISO(b.date)).map(normalizeBooking);
  const localKeys=new Set(localAppointments.map(sharedBookingKey).filter(Boolean));
  const remoteAppointments=sharedAppointments
    .filter(b=>dateSet.has(b.date)&&!isClosedDateISO(b.date))
    .filter(b=>!localKeys.has(sharedBookingKey(b)));
  appointments.push(...localAppointments,...remoteAppointments);
  let digital=dates.flatMap(d=>seededDigital(d));
  if(state.sector!=='Todos'){
    appointments=appointments.filter(x=>String(x.sector||'').includes(state.sector));
    digital=digital.filter(x=>String(x.sector||'').includes(state.sector));
  }
  return calcMetrics(appointments,digital,{dates});
}
function trend(current,previous,isRate=false){
  if(previous===0)return current===0?['0','flat']:['novo','up'];
  const diff=isRate?Math.round(current-previous):Math.round((current-previous)/previous*100);
  if(diff===0)return['0','flat'];
  return[`${diff>0?'+':''}${diff}${isRate?' p.p.':'%'}`,diff>0?'up':'down'];
}
function toast(msg){
  const t=$('#dashboardToast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}
function setModule(name){
  state.module=name;
  $$('.dashboard-module').forEach(x=>x.classList.toggle('active',x.id===`module-${name}`));
  $$('.dashboard-nav-item').forEach(x=>x.classList.toggle('active',x.dataset.module===name));
  const meta=moduleMeta[name];
  $('#moduleHeaderTitle').textContent=meta[0];
  $('#moduleHeaderSubtitle').textContent=meta[1];
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderBarRows(target,rows,total=null,labelWidth=''){
  const box=$(target);
  const max=Math.max(1,...rows.map(x=>x[1]));
  box.innerHTML=rows.map(x=>`
    <div class="bar-row ${labelWidth}">
      <span>${x[0]}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x[1]/max*100}%"></div></div>
      <b>${x[1]}</b>
      ${total!==null?`<small>${pct(x[1],total)}%</small>`:''}
    </div>`).join('');
}
function sectorRows(data){
  const sectors=[
    ['Financeiro','Negociação'],
    ['Cadastro','Troca de plano'],
    ['Autorizações','Autorizações'],
    ['Intercâmbio','Intercâmbio'],
    ['Atendimento Geral','Outros']
  ];
  return sectors.map(([label,needle])=>[label,data.filter(x=>x.service.includes(needle)).length]);
}
function hourRows(data){
  const b=[['08–10h',0],['10–12h',0],['13–15h',0],['15–17h',0]];
  data.forEach(x=>{
    const h=parseInt(x.time);
    if(h<10)b[0][1]++;
    else if(h<12)b[1][1]++;
    else if(h<15)b[2][1]++;
    else b[3][1]++;
  });
  return b;
}
function renderOverview(data,digital,metrics,prev){
  const kpis=[
    ['Agendamentos',metrics.active,prev.active,false,'agenda'],
    ['Ocupação',metrics.occupancy+'%',prev.occupancy,true,'agenda'],
    ['Tempo médio',metrics.avg+' min',prev.avg,false,'agenda'],
    ['Múltiplos assuntos',metrics.multiRate+'%',prev.multiRate,true,'agenda'],
    ['Faltas',metrics.noShowRate+'%',prev.noShowRate,true,'agenda'],
    ['Resolução digital',metrics.digitalRate+'%',prev.digitalRate,true,'digital']
  ];

  $('#overviewKpis').innerHTML=kpis.map(k=>{
    const currentNum=typeof k[1]==='string'?parseFloat(k[1]):k[1];
    const t=trend(currentNum,k[2],k[3]);
    return`
      <button class="executive-kpi" type="button" data-open-module="${k[4]}">
        <span>${k[0]}</span>
        <strong>${k[1]}</strong>
        <small class="trend ${t[1]}">${t[1]==='up'?'▲':t[1]==='down'?'▼':'•'} ${t[0]} vs. período anterior</small>
      </button>`;
  }).join('');

  renderBarRows('#overviewSectorBars',sectorRows(data));

  const topSector=[...sectorRows(data)].sort((a,b)=>b[1]-a[1])[0];
  const insights=[];

  if(metrics.businessDays===0)insights.push(['info','Sem atendimento presencial no período selecionado: fim de semana ou feriado.']);
  else if(metrics.occupancy<50)insights.push(['opportunity',`Ocupação em ${metrics.occupancy}%: há capacidade disponível no período.`]);
  else if(metrics.occupancy>80)insights.push(['warning',`Ocupação em ${metrics.occupancy}%: vale acompanhar a capacidade dos horários.`]);
  else insights.push(['good',`Ocupação em ${metrics.occupancy}%: utilização dentro de uma faixa equilibrada.`]);

  if(metrics.noShowRate>5)insights.push(['warning',`Faltas em ${metrics.noShowRate}%: acima da referência de 5% usada no protótipo.`]);
  else insights.push(['good',`Faltas em ${metrics.noShowRate}%: indicador sob controle no período.`]);

  if(topSector&&topSector[1]>0)insights.push(['info',`${topSector[0]} concentrou ${pct(topSector[1],Math.max(1,data.length))}% dos atendimentos.`]);
  if(metrics.digitalTotal>0)insights.push(['info',`${metrics.digitalResolved} demanda(s) tiveram resolução digital registrada.`]);

  $('#managementInsights').innerHTML=insights.slice(0,3).map(x=>`
    <div class="management-insight ${x[0]}"><i></i><span>${x[1]}</span></div>
  `).join('');
}
function renderAgenda(data,metrics,period){
  const cards=[
    ['Ocupação',metrics.occupancy+'%','capacidade utilizada'],
    ['Faltas',metrics.noShowRate+'%',metrics.noShow+' ocorrência(s)'],
    ['Cancelamentos',metrics.cancel,metrics.cancelRate+'% dos registros'],
    ['Múltiplos assuntos',metrics.multi,metrics.multiRate+'% dos agendamentos']
  ];
  $('#agendaKpis').innerHTML=cards.map(x=>`
    <article class="module-kpi"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>
  `).join('');

  renderBarRows('#agendaHourBars',hourRows(data));

  const free=Math.max(0,metrics.capacity-metrics.blocks);
  $('#agendaCapacity').innerHTML=`
    <div class="capacity-meter"><div style="width:${metrics.occupancy}%"></div></div>
    <div class="capacity-stats">
      <div><span>Ocupação</span><b>${metrics.occupancy}%</b></div>
      <div><span>Blocos reservados</span><b>${metrics.blocks}</b></div>
      <div><span>Blocos livres</span><b>${free}</b></div>
    </div>
    <p>Capacidade demonstrativa considerando blocos de 20 minutos.</p>`;

  const rows=[...data]
    .filter(x=>x.status!=='Cancelado')
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
    .slice(0,8);

  $('#agendaPreviewTable').innerHTML=rows.map(x=>`
    <tr>
      <td>${brDate(x.date)}</td><td><b>${x.time}</b></td><td>${x.sector}</td>
      <td>${x.service}</td><td>${x.duration||20} min</td>
      <td><span class="status-pill ${slugStatus(x.status)}">${x.status}</span></td>
    </tr>`).join('');
}
function renderProfile(data){
  const bands=[['0–17','0-17'],['18–29','18-29'],['30–44','30-44'],['45–59','45-59'],['60+','60+']];
  const rows=bands.map(([label,key])=>[label,data.filter(x=>ageBand(Number(x.age||0))===key).length]);
  renderBarRows('#profileAgeBars',rows,data.length);

  const local=data.filter(x=>(x.origin||'local')==='local').length;
  const inter=data.length-local;
  $('#profileOriginGrid').innerHTML=[
    ['Unimed Divinópolis',local,pct(local,data.length)],
    ['Intercâmbio',inter,pct(inter,data.length)]
  ].map(x=>`
    <div class="profile-card"><span>${x[0]}</span><strong>${x[1]}</strong><em>${x[2]}%</em></div>
  `).join('');
}
function renderDigital(digital,metrics){
  const pending=digital.filter(x=>x.status==='pending').length;
  const notResolved=digital.filter(x=>x.status==='not_resolved').length;
  const cards=[
    ['Direcionamentos digitais',metrics.digitalTotal,'demandas encaminhadas'],
    ['Resolvidas online',metrics.digitalResolved,'resoluções registradas'],
    ['Taxa de resolução online',metrics.digitalRate+'%',`${metrics.digitalResolved} de ${metrics.digitalTotal}`],
    ['Sem confirmação',pending+notResolved,`${pending} pendente(s) • ${notResolved} não resolvido(s)`]
  ];
  $('#digitalKpis').innerHTML=cards.map((x,i)=>`
    <article class="digital-metric ${i===2?'rate':''}">
      <span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small>
    </article>`).join('');

  const serviceNames=['2ª via de boleto','Autorização de guias','Guia Médico','Extrato de utilização','Orçamento de exames'];
  const rows=serviceNames.map(name=>[name,digital.filter(x=>x.service===name).length]);
  renderBarRows('#digitalServiceBars',rows,digital.length,'digital-bar-row');

  const intro=digital.filter(x=>x.source==='identificacao').length;
  const subjects=digital.filter(x=>x.source==='assuntos').length;
  $('#digitalSourceGrid').innerHTML=[
    ['Antes da identificação',intro,pct(intro,digital.length)],
    ['Na escolha do assunto',subjects,pct(subjects,digital.length)]
  ].map(x=>`
    <div class="profile-card"><span>${x[0]}</span><strong>${x[1]}</strong><em>${x[2]}%</em></div>
  `).join('');
}
function slugStatus(s){
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s/g,'-');
}
function reportData(data){
  const status=$('#reportStatus').value;
  const service=$('#reportService').value;
  return data.filter(x=>{
    const statusOk=status==='Todos'||x.status===status;
    const serviceOk=service==='Todos'||x.service.includes(service);
    return statusOk&&serviceOk;
  }).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
}
function renderReports(data){
  const rows=reportData(data);
  $('#reportCount').textContent=rows.length;
  $('#reportTable').innerHTML=rows.slice(0,100).map(x=>`
    <tr>
      <td>${brDate(x.date)}</td><td><b>${x.time}</b></td><td>${x.user}</td><td>${x.sector}</td>
      <td>${(x.origin||'local')==='interchange'?'Intercâmbio':'Divinópolis'}</td>
      <td>${x.service}</td><td>${x.duration||20} min</td>
      <td><span class="status-pill ${slugStatus(x.status)}">${x.status}</span></td>
    </tr>`).join('');
}
function render(){
  const {appointments,digital,period}=currentDataset();
  const metrics=calcMetrics(appointments,digital,period);
  const prev=previousPeriod(period);

  renderOverview(appointments,digital,metrics,prev);
  renderAgenda(appointments,metrics,period);
  renderProfile(appointments);
  renderDigital(digital,metrics);
  renderReports(appointments);
}
function exportCsv(){
  const {appointments}=currentDataset();
  const rows=reportData(appointments);
  const header=['Data','Horário','Beneficiário','Setor','Origem','Assunto','Tempo','Status'];
  const csv=[header,...rows.map(x=>[
    brDate(x.date),x.time,x.user,x.sector,
    (x.origin||'local')==='interchange'?'Intercâmbio':'Divinópolis',
    x.service,`${x.duration||20} min`,x.status
  ])].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');

  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`sem-fila-relatorio-${state.start}-a-${state.end}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Relatório CSV gerado.');
}
function printReport(){
  setModule('reports');
  setTimeout(()=>window.print(),150);
}

/* Navegação */
$$('.dashboard-nav-item').forEach(btn=>btn.onclick=()=>setModule(btn.dataset.module));
$$('[data-open-module]').forEach(btn=>btn.onclick=()=>setModule(btn.dataset.openModule));

/* Período */
$$('#periodSwitch button').forEach(btn=>btn.onclick=()=>{
  state.period=btn.dataset.period;
  $$('#periodSwitch button').forEach(x=>x.classList.toggle('active',x===btn));
  $('#customPeriod').classList.toggle('hidden',state.period!=='custom');
  render();
});
$('#sectorFilter').onchange=e=>{state.sector=e.target.value;render()};
$('#startDate').onchange=render;
$('#endDate').onchange=render;
$('#reportStatus').onchange=()=>renderReports(currentDataset().appointments);
$('#reportService').onchange=()=>renderReports(currentDataset().appointments);
$('#exportCsv').onclick=exportCsv;
$('#printReport').onclick=printReport;

const today=dateISO(new Date());
$('#startDate').value=today;
$('#endDate').value=today;
render();
refreshSharedAppointments();
setInterval(()=>{if(!document.hidden)refreshSharedAppointments()},sharedDemoApi.refreshMs);
setInterval(()=>{if(!document.hidden)render()},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();refreshSharedAppointments()}});
