(() => {
  const $ = s => document.querySelector(s);
  const scene = $('#scene'), bunny = $('#bunny'), relation = $('#relation');
  const prompt = $('#prompt'), feedback = $('#feedback'), cards = $('#cards');
  const scoreEl = $('#score'), confetti = $('#confetti');
  const defs = [['in','IN'],['inside','INSIDE'],['on','ON'],['under','UNDER'],['above','ABOVE'],['next','NEXT TO'],['near','NEAR'],['far','FAR FROM'],['front','IN FRONT OF'],['behind','BEHIND'],['between','BETWEEN'],['left','TO THE LEFT OF'],['right','TO THE RIGHT OF']];
  // Normalized foot anchors keep artwork and answers aligned on every screen.
  const anchors = {on:[.5,.60,30],under:[.5,.87,10],above:[.5,.38,30],next:[.275,.85,30],near:[.23,.91,30],far:[.075,.58,30],front:[.5,.965,30],behind:[.5,.72,10],between:[.74,.89,30],left:[.17,.91,30],right:[.945,.98,30],in:[.858,.865,30],inside:[.12,.845,30]};
  const word = key => defs.find(d => d[0] === key)[1];
  let mode = 'play', selected = 'on', target = null, score = 0;
  let drag = null, point = anchors.on.slice(), nextTask = null, celebration = null;
  try { score = Math.max(0, Number(localStorage.getItem('bunnyScore')) || 0); } catch {}
  scoreEl.textContent = score;
  function move(p) {
    point = p.slice();
    const placement = defs.find(([key]) => anchors[key].every((value, index) => value === p[index]))?.[0];
    scene.dataset.containment = !drag && (placement === 'in' || placement === 'inside') ? placement : '';
    if (!drag) bunny.classList.toggle('under-size', placement === 'under');
    bunny.style.left = (p[0] * scene.clientWidth - bunny.offsetWidth / 2) + 'px';
    bunny.style.top = (p[1] * scene.clientHeight - bunny.offsetHeight) + 'px';
    bunny.style.zIndex = p[2];
  }
  function distance(key) {
    const p = anchors[key];
    return Math.hypot((point[0]-p[0])*scene.clientWidth,(point[1]-p[1])*scene.clientHeight);
  }
  function insideContainer(key) {
    const object = $(key === 'in' ? '#cup' : '#basket');
    const left = object.offsetLeft / scene.clientWidth;
    const top = object.offsetTop / scene.clientHeight;
    const width = object.offsetWidth / scene.clientWidth;
    const height = object.offsetHeight / scene.clientHeight;
    // Accept a drop in the vessel's body, then seat Bunny at its opening.
    // The cup handle is outside the bowl and must not count as the interior.
    const right = left + width * (key === 'in' ? .82 : .95);
    return point[0] >= left + width * .05 && point[0] <= right &&
      point[1] >= top + height * .2 && point[1] <= Math.min(1, top + height * 1.5);
  }
  function nearest() {
    const need = mode === 'surprise' ? target : selected;
    const tolerance = Math.max(20, Math.min(scene.clientWidth * .065, 65));
    if ((need === 'in' || need === 'inside') && insideContainer(need)) return need;
    if (distance(need) < tolerance) return need;
    for (const key of ['in', 'inside']) if (insideContainer(key)) return key;
    const closest = defs.map(([key]) => [key, distance(key)]).sort((a,b) => a[1]-b[1])[0];
    return closest[1] < tolerance ? closest[0] : null;
  }
  function fireworks() {
    scoreEl.textContent = ++score;
    try { localStorage.setItem('bunnyScore', score); } catch {}
    feedback.textContent = '⭐ Great! Отличная работа!';
    confetti.replaceChildren();
    clearTimeout(celebration);
    const colors = ['#d69875','#e4bf65','#7e9c81','#b09bbb','#f0d7b5'];
    for (let i=0;i<50;i++) {
      const piece = document.createElement('i');
      piece.className = 'piece'; piece.style.left = Math.random()*100+'%';
      piece.style.background = colors[i%colors.length];
      piece.style.setProperty('--dx', (Math.random()*220-110)+'px');
      piece.style.setProperty('--fall', scene.clientHeight+30+'px');
      piece.style.animationDelay = Math.random()*.18+'s';
      confetti.appendChild(piece);
    }
    celebration = setTimeout(() => confetti.replaceChildren(), 1500);
    if (mode === 'surprise') nextTask = setTimeout(task, 1000);
  }
  function check() {
    if (nextTask !== null) return;
    const got = nearest(), need = mode === 'surprise' ? target : selected;
    if (got) { move(anchors[got]); relation.textContent = word(got); }
    if (got === need) fireworks(); else feedback.textContent = 'Попробуй ещё! Найди место для зайки 🐇';
  }
  function choose(key) {
    clearTimeout(nextTask); nextTask = null;
    selected = key;
    document.querySelectorAll('.card').forEach(card => {
      const active = card.dataset.k === key;
      card.classList.toggle('active',active); card.setAttribute('aria-pressed',active);
    });
    const reference = key === 'in' ? ' the cup' : key === 'inside' ? ' the basket' : key === 'between' ? ' the table and the cup' : ' the table';
    prompt.replaceChildren(document.createTextNode((mode === 'play' ? 'Drag Bunny ' : 'Put Bunny ') + word(key) + reference));
    relation.textContent = mode === 'play' ? word(key) : '?';
    feedback.textContent = mode === 'play' ? 'Перетащи зайку в правильное место' : 'Куда поставить зайку?';
    if (mode === 'surprise') target = key;
  }
  function task() {
    const choices = defs.filter(([key]) => key !== target);
    choose(choices[Math.floor(Math.random()*choices.length)][0]);
  }
  function illustration(key) {
    const positions = {on:[.5,.465,30],under:[.5,.95,10],above:[.5,.34,30],next:[.20,.86,30],near:[.16,.92,30],far:[.12,.9,30],front:[.5,.98,30],behind:[.5,.67,10],between:[.5,.91,30],left:[.16,.86,30],right:[.85,.86,30],in:[.46,.78,30],inside:[.5,.78,30]};
    const [x,y,z] = positions[key];
    const image = (name,style,cls='object') => `<img class="${cls}" src="assets/${name}.png" alt="" loading="lazy" draggable="false" style="${style}">`;
    const bg = image('room','opacity:.28','room');
    let objects;
    if (key === 'in' || key === 'inside') {
      const name = key === 'in' ? 'cup' : 'basket';
      const style = 'left:19%;top:53%;width:62%;height:44%';
      objects = image(name, style) + image(name, style, `object container-front ${name}-front`);
    } else if (key === 'between') {
      objects = image('table','left:2%;top:55%;width:30%;height:40%') + image('cup','left:71%;top:65%;width:27%;height:30%');
    } else {
      const left = key === 'far' ? 65 : (['next','near','left'].includes(key) ? 38 : key === 'right' ? 8 : 25);
      const width = key === 'far' ? 32 : 50;
      objects = image('table',`left:${left}%;top:35%;width:${width}%;height:60%`);
    }
    const rabbitWidth = key === 'under' ? 15 : 22, rabbitHeight = key === 'under' ? 26 : 38;
    const rabbit = image('bunny',`left:${x*100-rabbitWidth/2}%;top:${y*100-rabbitHeight}%;width:${rabbitWidth}%;height:${rabbitHeight}%;z-index:${z}`,'mini-bunny');
    return bg + objects + rabbit;
  }

  defs.forEach(([key,label]) => {
    const card = document.createElement('button');
    card.className = 'card'; card.dataset.k = key;
    card.innerHTML = `<div class="thumb" aria-hidden="true">${illustration(key)}</div><strong>${label}</strong>`;
    card.onclick = () => choose(key); cards.appendChild(card);
  });
  document.querySelectorAll('.tab').forEach(tab => tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => {t.classList.toggle('active',t===tab);t.setAttribute('aria-pressed',t===tab);});
    clearTimeout(nextTask); nextTask = null;
    mode = tab.dataset.mode; mode === 'surprise' ? task() : choose('on');
  });
  bunny.onpointerdown = event => {
    if (nextTask !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); const rect = bunny.getBoundingClientRect();
    drag = {id:event.pointerId,dx:event.clientX-rect.left,dy:event.clientY-rect.top,start:point.slice()};
    bunny.setPointerCapture(event.pointerId); bunny.classList.add('dragging'); bunny.style.zIndex = 40;
    scene.dataset.containment = '';
  };
  bunny.onpointermove = event => {
    if (!drag || event.pointerId !== drag.id) return;
    event.preventDefault(); const rect = scene.getBoundingClientRect();
    const x = Math.max(0,Math.min(scene.clientWidth-bunny.offsetWidth,event.clientX-rect.left-drag.dx));
    const y = Math.max(0,Math.min(scene.clientHeight-bunny.offsetHeight,event.clientY-rect.top-drag.dy));
    move([(x+bunny.offsetWidth/2)/scene.clientWidth,(y+bunny.offsetHeight)/scene.clientHeight,40]);
  };
  bunny.onpointerup = event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null; bunny.classList.remove('dragging');
    if (bunny.hasPointerCapture(event.pointerId)) bunny.releasePointerCapture(event.pointerId);
    check();
  };
  function cancel() {
    if (!drag) return; const start = drag.start; drag = null;
    bunny.classList.remove('dragging'); move(start);
  }
  bunny.onpointercancel = cancel; bunny.onlostpointercapture = cancel;
  bunny.onkeydown = event => {
    const steps = {ArrowLeft:[-.025,0],ArrowRight:[.025,0],ArrowUp:[0,-.025],ArrowDown:[0,.025]};
    if (steps[event.key]) {
      event.preventDefault(); const [x,y] = steps[event.key];
      move([Math.max(.05,Math.min(.95,point[0]+x)),Math.max(.25,Math.min(1,point[1]+y)),40]);
    } else if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();check();}
  };
  new ResizeObserver(() => {cancel();move(point);}).observe(scene);
  choose('on'); move(anchors.on);
})();
