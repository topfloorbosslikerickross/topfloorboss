const app = document.getElementById('app');
let data = JSON.parse(localStorage.getItem('levels')||'[]');
let selectedDate = new Date().toISOString().slice(0,10);
function saveData(){
  localStorage.setItem('levels', JSON.stringify(data));
}
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.style.display='block';
  setTimeout(()=>t.style.display='none',2000);
}
function renderStats(){
  const total=data.length;
  const hits=data.filter(l=>getStatus(l)==='hit').length;
  const nohits=total-hits;
  const rate=total?((hits/total*100).toFixed(1)+'%'):'';
  return `<div class="stats">Total: ${total} | ✅ ${hits} | ❌ ${nohits} | Hit Rate: ${rate}</div>`;
}
function getStatus(level){
  return level.statusHistory[level.statusHistory.length-1].status;
}
function toggleStatus(id){
  const level=data.find(l=>l.id===id);
  const cur=getStatus(level);
  const next=cur==='hit'?'no-hit':'hit';
  level.statusHistory.push({status:next,time:new Date().toISOString()});
  saveData();
  render();
}
function renderLevels(){
  const list=data.filter(l=>l.date===selectedDate);
  if(!list.length) return '<div class="levels">No levels</div>';
  return '<div class="levels">'+list.map(l=>{
    const status=getStatus(l)==='hit'?'✅ Hit':'❌ No Hit';
    return `<div class="level-item ${l.color}">
      <div>Price: ${l.price}</div>
      <div>Status: <button onclick="toggleStatus(${l.id})">${status}</button></div>
      ${l.note?`<div>Note: ${l.note}</div>`:''}
      ${l.img?`<img class="thumb" src="${l.img}"/>`:''}
    </div>`;}).join('')+'</div>';
}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function renderCalendar(){
  const d=new Date(selectedDate);const y=d.getFullYear(),m=d.getMonth();
  let html='<div class="calendar"><div>'+d.toLocaleString('default',{month:'long',year:'numeric'})+'</div><div class="calendar-grid">';
  const first=new Date(y,m,1).getDay();
  for(let i=0;i<first;i++) html+='<div></div>';
  const days=daysInMonth(y,m);
  for(let day=1;day<=days;day++){
    const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const sel=date===selectedDate?'selected':'';
    html+=`<div class="calendar-cell ${sel}" onclick="selectDate('${date}')">${day}</div>`;
  }
  html+='</div></div>';
  return html;
}
function selectDate(date){selectedDate=date;render();}
function render(){
  app.innerHTML=renderStats()+renderCalendar()+renderLevels()+`<button class="add-btn" onclick="openModal()">+</button><div id="toast" class="toast"></div>`+document.getElementById('modal').outerHTML;
}
function openModal(){document.getElementById('modal').style.display='flex';}
function closeModal(){document.getElementById('modal').style.display='none';}
function addLevel(e){e.preventDefault();
  const form=e.target;const price=form.price.value;const color=form.color.value;const note=form.note.value;const file=form.image.files[0];
  if(!price) return;
  const reader=file?new FileReader():null;
  const id=Date.now();
  const finish=(img)=>{
    data.push({id,price,color,note,img,date:selectedDate,statusHistory:[{status:'no-hit',time:new Date().toISOString()}]});
    saveData();
    closeModal();
    toast('Level saved');
    render();
  };
  if(reader){reader.onload=()=>finish(reader.result);reader.readAsDataURL(file);}else{finish('');}
}
document.body.insertAdjacentHTML('beforeend',`<div id="modal" class="modal"><div class="modal-content"><form onsubmit="addLevel(event)"><input name="price" type="number" placeholder="Price" step="0.25" required><select name="color"><option value="red">Red</option><option value="orange">Orange</option></select><textarea name="note" placeholder="Note"></textarea><input name="image" type="file" accept="image/*"><button type="submit">Save</button><button type="button" onclick="closeModal()">Cancel</button></form></div></div>`);
render();
function exportData(format){
  const zip=new JSZip();
  const levels=data.map(l=>({...l,img:''}));
  if(format==='json'){zip.file('levels.json',JSON.stringify(levels,null,2));}
  else{
    const csv=['id,price,color,note,date,status'];
    levels.forEach(l=>{csv.push(`${l.id},${l.price},${l.color},${(l.note||'').replace(/,/g,';')},${l.date},${getStatus(l)}`);});
    zip.file('levels.csv',csv.join('\n'));
  }
  data.forEach(l=>{if(l.img){const base=l.img.split(',')[1];zip.file(`img_${l.id}.png`,base,{base64:true});}});
  zip.generateAsync({type:'blob'}).then(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='topTickData.zip';a.click();});
}
document.body.insertAdjacentHTML('beforeend',`<div style="position:fixed;top:.5rem;right:.5rem;"><button onclick="exportData('json')">Export JSON</button><button onclick="exportData('csv')">Export CSV</button></div>`);
