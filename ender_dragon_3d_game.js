(() => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7464a6);
  scene.fog = new THREE.FogExp2(0x7464a6, 0.0035);

  const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 600);
  camera.position.set(0, 2.1, 10);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xf0edff, 0x8a78a0, 2.7));
  scene.add(new THREE.AmbientLight(0xd8caff, 1.8));
  const moon = new THREE.DirectionalLight(0xfff4dc, 3.0);
  moon.position.set(-30, 50, 20);
  moon.castShadow = true;
  scene.add(moon);

  // Voxel island foundation: stacked cubic layers create a Minecraft-like block silhouette.
  const endStoneMats = [0xded69a,0xe9e0ad,0xcfc58b,0xf0e7b5].map(color =>
    new THREE.MeshStandardMaterial({color, roughness:1})
  );
  const cliffMats = [0xb9ae7c,0xc9bf8a,0xa99e70].map(color =>
    new THREE.MeshStandardMaterial({color, roughness:1})
  );
  const blockSize = 4;
  // Wide tiled top surface, clipped into a rough circle. Every tile is an individual cube.
  for(let x=-48;x<=48;x+=blockSize){
    for(let z=-48;z<=48;z+=blockSize){
      const dist=Math.hypot(x,z);
      if(dist>49) continue;
      const tile=new THREE.Mesh(new THREE.BoxGeometry(blockSize,1.2,blockSize),endStoneMats[Math.floor(Math.random()*endStoneMats.length)]);
      tile.position.set(x,-.6,z);
      tile.receiveShadow=true;
      scene.add(tile);
      // Deep square layers underneath form stepped block cliffs rather than a smooth cylinder.
      const layers=dist>41?1:dist>34?2:3;
      for(let layer=1;layer<=layers;layer++){
        const edgeBlock=new THREE.Mesh(new THREE.BoxGeometry(blockSize,2.1,blockSize),cliffMats[(Math.floor(Math.random()*cliffMats.length))]);
        edgeBlock.position.set(x,-1.2-layer*2.0,z);
        edgeBlock.receiveShadow=true;
        scene.add(edgeBlock);
      }
    }
  }

  // Obsidian-ish pillars
  const pillarMat = new THREE.MeshStandardMaterial({color:0x211b30, roughness:1});
  const crystalMat = new THREE.MeshStandardMaterial({
    color:0xffbaff, emissive:0xe000ff, emissiveIntensity:3.2, roughness:.25
  });
  const crystals = [];
  const crystalPositions = [[-22,12,-8],[22,12,-5],[0,14,-29]];
  crystalPositions.forEach((p,i)=>{
    const glow = new THREE.PointLight(0xe45cff, 145, 42, 2);
    glow.position.set(p[0], 25, p[2]); scene.add(glow);
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(4.8,28,4.8), pillarMat);
    pillar.position.set(p[0],12,p[2]);
    pillar.castShadow = pillar.receiveShadow = true;
    scene.add(pillar);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.35,0), crystalMat);
    crystal.position.set(p[0],27,p[2]);
    // Chunky obsidian cage around each healing crystal, like Minecraft End pillars.
    const cageMat = new THREE.MeshStandardMaterial({color:0x383047, roughness:1});
    for (const dx of [-1.8,1.8]) for (const dz of [-1.8,1.8]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.22,3.5,.22), cageMat);
      bar.position.set(p[0]+dx,27,p[2]+dz); scene.add(bar);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(4.4,.25,4.4), cageMat);
    cap.position.set(p[0],29,p[2]); scene.add(cap);
    crystal.userData = {alive:true, index:i};
    scene.add(crystal);
    crystals.push(crystal);
  });

  // Raised square patches and occasional single-block steps make the walkable surface read as voxels.
  for(let i=0;i<95;i++){
    const x=Math.round(((Math.random()-.5)*86)/2)*2;
    const z=Math.round(((Math.random()-.5)*86)/2)*2;
    if(Math.hypot(x,z)>45) continue;
    const b=new THREE.Mesh(new THREE.BoxGeometry(1.8,.22,1.8),endStoneMats[Math.floor(Math.random()*endStoneMats.length)]);
    b.position.set(x,.58,z);
    b.receiveShadow=true; scene.add(b);
  }
  // Small blocky End rocks
  const rockMat = new THREE.MeshStandardMaterial({color:0xb7ad7e, roughness:1});
  for(let i=0;i<65;i++){
    const a=Math.random()*Math.PI*2, r=8+Math.random()*45;
    const rock=new THREE.Mesh(new THREE.BoxGeometry(.5+Math.random()*1.5,.4+Math.random()*1.4,.5+Math.random()*1.5),rockMat);
    rock.position.set(Math.cos(a)*r,.05,Math.sin(a)*r);
    rock.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
    scene.add(rock);
  }

  // Minecraft-inspired Ender Dragon: blocky body, long neck/tail, horns, legs and huge angular wings.
  const dragon = new THREE.Group();
  const dragonMat = new THREE.MeshStandardMaterial({color:0x24202b, roughness:1});
  const dragonDark = new THREE.MeshStandardMaterial({color:0x100d18, roughness:1});
  const wingMat = new THREE.MeshStandardMaterial({color:0x52315f, side:THREE.DoubleSide, transparent:true, opacity:.96, roughness:1});
  const eyeMat = new THREE.MeshStandardMaterial({color:0xb000ff, emissive:0x7700ff, emissiveIntensity:4});

  const cube=(w,h,d,mat=dragonMat)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  const body=cube(6,3.1,4.2); body.position.y=0; dragon.add(body);
  const chest=cube(3.2,3.8,3.1); chest.position.set(0,.15,-2.2); dragon.add(chest);

  // Long segmented neck and tail.
  for(let i=0;i<5;i++){
    const seg=cube(2.2-i*.18,2.0-i*.12,2.3-i*.18);
    seg.position.set(0,.45,-4.0-i*1.55);
    seg.rotation.x=-.10;
    dragon.add(seg);
  }
  for(let i=0;i<8;i++){
    const seg=cube(2.5-i*.24,1.55-i*.10,2.5-i*.25,dragonDark);
    seg.position.set(0,-.15,3.0+i*1.45);
    seg.rotation.y=(i%2?-.035:.035);
    dragon.add(seg);
  }

  // Blocky head and jaw.
  const head=cube(3.0,2.35,3.0); head.position.set(0,.5,-10.4); dragon.add(head);
  const snout=cube(2.15,1.35,2.25,dragonDark); snout.position.set(0,.05,-12.15); dragon.add(snout);
  const jaw=cube(2.05,.55,2.1); jaw.position.set(0,-.75,-12.05); dragon.add(jaw);
  for(const side of [-1,1]){
    const eye=cube(.42,.42,.18,eyeMat); eye.position.set(side*.86,.85,-11.72); dragon.add(eye);
    const horn=cube(.42,1.65,.42,dragonDark); horn.position.set(side*1.0,2.0,-10.25); horn.rotation.z=side*.22; dragon.add(horn);
  }

  // Four blocky legs with feet.
  for(const side of [-1,1]) for(const z of [-1.2,1.25]){
    const upper=cube(.72,2.8,.8); upper.position.set(side*2.05,-2.1,z); upper.rotation.z=side*.12; dragon.add(upper);
    const lower=cube(.6,1.7,.65,dragonDark); lower.position.set(side*2.2,-4.0,z-.2); lower.rotation.z=side*.1; dragon.add(lower);
    const foot=cube(1.25,.45,1.65); foot.position.set(side*2.35,-4.9,z-.45); dragon.add(foot);
  }

  // Angular Minecraft-like wings: broad dark supports plus purple membrane.
  for(const side of [-1,1]){
    const arm=cube(1.0,.75,8.8,dragonDark); arm.position.set(side*3.9,1.0,-.1); arm.rotation.z=side*.05; arm.rotation.y=side*.12; dragon.add(arm);
    const wingGeom=new THREE.BufferGeometry();
    const verts=new Float32Array([
      0,0,0,  side*5.0,1.0,-3.0,  side*8.5,0.4,-.4,
      0,0,0,  side*8.5,.4,-.4,  side*7.0,-.6,3.4,
      0,0,0,  side*7.0,-.6,3.4,  side*4.2,-1.0,5.8
    ]);
    wingGeom.setAttribute('position',new THREE.BufferAttribute(verts,3));
    wingGeom.computeVertexNormals();
    const wing=new THREE.Mesh(wingGeom,wingMat); wing.position.set(side*3.4,1.8,0); dragon.add(wing);
  }

  dragon.position.set(0,18,-30);
  dragon.scale.set(1.7,1.7,1.7);
  scene.add(dragon);

  // Player
  const player = {health:100, speed:0.13, sprint:0.22, yaw:0, pitch:0};
  const keys = {};
  const arrows = [];
  let rightMouseHeld = false;
  const fireballs = [];
  let score=0, dragonHP=100, state='start', lastShot=0, dragonAttackTimer=0, dragonChargeTimer=0;
  let gameStartTime=0;
  let audioCtx=null;

  const scoreEl=document.getElementById('score');
  const crystalEl=document.getElementById('crystals');
  const playerBar=document.getElementById('playerHealthBar');
  const dragonBar=document.getElementById('dragonBar');
  const message=document.getElementById('message');
  const timerEl=document.getElementById('timer');

  function showMessage(t){
    message.textContent=t; message.style.opacity=1;
    clearTimeout(showMessage.timer); showMessage.timer=setTimeout(()=>message.style.opacity=0,1200);
  }
  function updateHUD(){
    scoreEl.textContent=score;
    if(gameStartTime){
      const remaining=Math.max(0,45-Math.floor((performance.now()-gameStartTime)/1000));
      const mins=String(Math.floor(remaining/60)).padStart(2,'0');
      const secs=String(remaining%60).padStart(2,'0');
      timerEl.textContent=`${mins}:${secs}`;
      timerEl.style.color=remaining<=10?'#ff6b6b':'#8be9fd';
      if(remaining===0 && state==='playing') endGame(false, true);
    }
    crystalEl.textContent=crystals.filter(c=>c.userData.alive).length;
    playerBar.style.width=Math.max(0,player.health)+'%';
    dragonBar.style.width=Math.max(0,dragonHP)+'%';
  }

  function reset(){
    location.reload();
  }

  function pointSound(){
    try{
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
      const now=audioCtx.currentTime;
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      osc.type='square';
      osc.frequency.setValueAtTime(520,now);
      osc.frequency.exponentialRampToValueAtTime(760,now+0.09);
      gain.gain.setValueAtTime(0.055,now);
      gain.gain.exponentialRampToValueAtTime(0.001,now+0.11);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now); osc.stop(now+0.12);
    }catch(e){}
  }

  document.getElementById('startBtn').onclick=()=>{
    try{ audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); audioCtx.resume(); }catch(e){}
    document.getElementById('start').style.display='none';
    state='playing';
    gameStartTime=performance.now();
    renderer.domElement.requestPointerLock();
  };
  document.getElementById('restartBtn').onclick=reset;
  document.getElementById('restartHud').onclick=reset;

  addEventListener('keydown',e=>{
    keys[e.code]=true;
    if(e.code==='KeyR' && state!=='playing') reset();
  });
  addEventListener('keyup',e=>keys[e.code]=false);

  addEventListener('mousemove',e=>{
    if(document.pointerLockElement!==renderer.domElement || state!=='playing' || !rightMouseHeld) return;
    player.yaw -= e.movementX*0.0025;
    player.pitch -= e.movementY*0.0022;
    player.pitch=Math.max(-1.35,Math.min(1.35,player.pitch));
  });

  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  renderer.domElement.addEventListener('mousedown',e=>{
    if(state!=='playing') return;
    if(document.pointerLockElement!==renderer.domElement){ renderer.domElement.requestPointerLock(); }
    if(e.button===0) shoot();
    if(e.button===2) rightMouseHeld=true;
  });
  renderer.domElement.addEventListener('mouseup',e=>{
    if(e.button===2) rightMouseHeld=false;
  });
  addEventListener('blur',()=>rightMouseHeld=false);

  const raycaster = new THREE.Raycaster();

  function shoot(){
    const now=performance.now();
    if(now-lastShot<180) return;
    lastShot=now;
    const dir=new THREE.Vector3(0,0,-1);
    dir.applyEuler(new THREE.Euler(player.pitch,player.yaw,0,'YXZ'));
    const start=camera.position.clone().add(dir.clone().multiplyScalar(.8));
    const arrow=new THREE.Mesh(
      new THREE.CylinderGeometry(.045,.045,1.3,6),
      new THREE.MeshStandardMaterial({color:0xd7d7d7})
    );
    arrow.position.copy(start);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
    arrow.userData={vel:dir.multiplyScalar(.75),life:120};
    scene.add(arrow); arrows.push(arrow);
  }

  function spawnFireball(){
    const pos=dragon.position.clone();
    const target=camera.position.clone();
    const dir=target.sub(pos).normalize();
    const ball=new THREE.Mesh(
      new THREE.SphereGeometry(.55,12,8),
      new THREE.MeshStandardMaterial({color:0xff5b24,emissive:0xff2600,emissiveIntensity:2})
    );
    ball.position.copy(pos);
    ball.userData={vel:dir.multiplyScalar(.28),life:260};
    scene.add(ball); fireballs.push(ball);
  }

  function damagePlayer(amount){
    player.health-=amount;
    updateHUD();
    if(player.health<=0) endGame(false);
  }

  function destroyCrystal(c){
    if(!c.userData.alive) return;
    c.userData.alive=false;
    scene.remove(c);
    score+=100;
    pointSound();
    showMessage('+100  CRYSTAL DESTROYED');
    updateHUD();
  }

  function endGame(win, timeUp=false){
    if(state!=='playing') return;
    state=win?'win':'lose';
    document.exitPointerLock?.();
    document.getElementById('endScreen').style.display='flex';
    document.getElementById('endTitle').textContent=win?'VICTORY!':'DEFEATED';
    document.getElementById('endText').innerHTML=win
      ? `The Ender Dragon has been defeated.<br><br><b>Final Score: ${score}</b>`
      : `${timeUp?'Time ran out! The Ender Dragon escaped.':'The End claimed you.'}<br><br><b>Score: ${score}</b>`;
  }

  function damageDragon(amount){
    if(crystals.some(c=>c.userData.alive)){
      showMessage('DESTROY THE HEALING CRYSTALS!');
      return;
    }
    dragonHP-=amount; score+=10;
    pointSound();
    if(dragonHP<=0) { dragonHP=0; score+=500; updateHUD(); endGame(true); return; }
    updateHUD();
  }

  function updatePlayer(){
    const forward=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
    const right=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
    const move=new THREE.Vector3();
    if(keys.KeyW) move.add(forward);
    if(keys.KeyS) move.sub(forward);
    if(keys.KeyD) move.add(right);
    if(keys.KeyA) move.sub(right);
    if(move.lengthSq()>0){
      move.normalize().multiplyScalar(keys.ShiftLeft||keys.ShiftRight?player.sprint:player.speed);
      camera.position.add(move);
      camera.position.x=Math.max(-47,Math.min(47,camera.position.x));
      camera.position.z=Math.max(-47,Math.min(47,camera.position.z));
    }
    camera.position.y=2.1;
    camera.rotation.order='YXZ';
    camera.rotation.y=player.yaw;
    camera.rotation.x=player.pitch;
  }

  function updateDragon(t){
    const target=new THREE.Vector3(0,15,-15);
    const orbit= t*.00035;
    dragon.position.x=Math.cos(orbit)*28;
    dragon.position.z=-18+Math.sin(orbit)*22;
    dragon.position.y=16+Math.sin(t*.002)*4;
    dragon.lookAt(camera.position.x,camera.position.y,camera.position.z);

    dragonAttackTimer-=16;
    if(dragonAttackTimer<=0){
      spawnFireball();
      dragonAttackTimer=1800+Math.random()*1200;
    }

    dragonChargeTimer-=16;
    if(dragonChargeTimer<=0){
      const dir=camera.position.clone().sub(dragon.position).normalize();
      dragon.position.add(dir.multiplyScalar(3.8));
      damagePlayer(8);
      showMessage('DRAGON CHARGE!');
      dragonChargeTimer=5000+Math.random()*2500;
    }
  }

  function updateProjectiles(){
    // arrows
    for(let i=arrows.length-1;i>=0;i--){
      const a=arrows[i];
      a.position.add(a.userData.vel);
      a.userData.life--;
      let hit=false;
      for(const c of crystals){
        if(c.userData.alive && a.position.distanceTo(c.position)<1.7){
          destroyCrystal(c); hit=true; break;
        }
      }
      if(!hit && a.position.distanceTo(dragon.position)<5.2){
        damageDragon(3); hit=true;
      }
      if(hit || a.userData.life<=0){
        scene.remove(a); arrows.splice(i,1);
      }
    }

    // fireballs
    for(let i=fireballs.length-1;i>=0;i--){
      const f=fireballs[i];
      f.position.add(f.userData.vel);
      f.userData.life--;
      if(f.position.distanceTo(camera.position)<1.4){
        damagePlayer(18);
        scene.remove(f); fireballs.splice(i,1);
        continue;
      }
      if(f.userData.life<=0){scene.remove(f);fireballs.splice(i,1);}
    }
  }

  function animate(t){
    requestAnimationFrame(animate);
    if(state==='playing'){
      updatePlayer();
      updateDragon(t);
      updateProjectiles();
      updateHUD();
      // subtle dragon glow
      dragon.rotation.z=Math.sin(t*.003)*.08;
    }
    renderer.render(scene,camera);
  }
  animate(0);

  addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
  updateHUD();
})();
