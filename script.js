import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const cursorEl = document.getElementById('custom-cursor');
const fadeOverlay = document.getElementById('fade-overlay');
const launchBtn = document.getElementById('launch-game-btn');
const landingPage = document.getElementById('landing-page');
const gameContainer = document.getElementById('game-container');
const appleNav = document.getElementById('apple-nav');

const exitGame = () => {
    window.location.reload();
};

launchBtn.addEventListener('click', () => {
    landingPage.style.display = 'none';
    appleNav.style.display = 'none';
    gameContainer.classList.add('active');
    cursorEl.style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.body.style.cursor = 'none';
});

document.getElementById('quit-btn-hud').addEventListener('click', exitGame);
document.getElementById('btn-exit-to-menu').addEventListener('click', exitGame);

window.addEventListener('mousemove', (e) => {
    cursorEl.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
});
window.addEventListener('mousedown', () => cursorEl.innerText = '👊');
window.addEventListener('mouseup', () => cursorEl.innerText = '⚪️');

class AppleGame {
    constructor() {
        this.roomsCleared = 0;
        this.level = 1;
        this.isAlive = false;
        this.isPaused = false;
        this.isTransitioning = false;
        this.time = 40;
        this.moveState = { f: false, b: false, l: false, r: false };
        this.velocity = new THREE.Vector3();
        
        this.hoveredDoor = null;
        this.bobbingTime = 0;

        this.initAudio();
        this.initThree();
        this.setupEvents();
        this.animate();
    }

    initAudio() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.playTone = (f, t = 'sine', d = 0.3, vol = 0.05) => {
            if(this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.type = t; o.frequency.value = f;
            g.gain.setValueAtTime(vol, this.audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + d);
            o.connect(g); g.connect(this.audioCtx.destination);
            o.start(); o.stop(this.audioCtx.currentTime + d);
        };
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        gameContainer.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        
        this.ceilingLight = new THREE.RectAreaLight(0xffffff, 2.5, 6, 6);
        this.ceilingLight.position.set(0, 3.4, 0);
        this.ceilingLight.lookAt(0, 0, 0);
        this.scene.add(this.ceilingLight);

        this.pointLight = new THREE.PointLight(0xffffff, 12, 20);
        this.pointLight.position.set(0, 3, 0);
        this.pointLight.castShadow = true;
        this.scene.add(this.pointLight);

        this.controls = new PointerLockControls(this.camera, document.body);
        this.raycaster = new THREE.Raycaster();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupEvents() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.audioCtx.resume();
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('ui').classList.remove('hidden');
            this.isAlive = true;
            this.controls.lock();
            this.spawnRoom();
            this.startTimer();
        });

        document.getElementById('pause-btn').addEventListener('click', () => this.controls.unlock());
        document.getElementById('btn-resume').addEventListener('click', () => this.controls.lock());

        this.controls.addEventListener('lock', () => {
            this.isPaused = false;
            document.getElementById('pause-screen').classList.add('hidden');
        });

        this.controls.addEventListener('unlock', () => {
            if (this.isAlive) {
                this.isPaused = true;
                document.getElementById('pause-screen').classList.remove('hidden');
            }
        });

        window.addEventListener('keydown', (e) => {
            if(e.code === 'KeyW') this.moveState.f = true;
            if(e.code === 'KeyS') this.moveState.b = true;
            if(e.code === 'KeyA') this.moveState.l = true;
            if(e.code === 'KeyD') this.moveState.r = true;
        });
        window.addEventListener('keyup', (e) => {
            if(e.code === 'KeyW') this.moveState.f = false;
            if(e.code === 'KeyS') this.moveState.b = false;
            if(e.code === 'KeyA') this.moveState.l = false;
            if(e.code === 'KeyD') this.moveState.r = false;
        });

        window.addEventListener('mousedown', () => { 
            if(this.controls.isLocked && !this.isTransitioning) this.interact(); 
        });
    }

    spawnRoom() {
        if(this.roomGroup) this.scene.remove(this.roomGroup);
        this.roomGroup = new THREE.Group();
        
        let wallColor = 0xffffff;
        let bgColor = 0xf5f5f7;
        let accent = 0xd2d2d7;

        if(this.level > 1 && this.level <= 10) {
            wallColor = 0xffffff; bgColor = 0xf5f5f7; accent = 0x0071e3;
        } else if(this.level > 10 && this.level <= 20) {
            wallColor = 0x1d1d1f; bgColor = 0x000000; accent = 0xd4af37;
        } else if(this.level > 20) {
            wallColor = 0x013220; bgColor = 0x001a11; accent = 0xc0c0c0;
        }

        this.scene.background = new THREE.Color(bgColor);

        const floorMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.1, metalness: 0.05 });
        const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 12), floorMat);
        floor.position.y = -3.7; floor.receiveShadow = true;
        this.roomGroup.add(floor);

        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 12), floorMat);
        ceiling.position.y = 3.7;
        this.roomGroup.add(ceiling);

        const wallGeom = new THREE.BoxGeometry(12, 7, 0.5);
        const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 });
        
        const wallConfigs = [
            { p: [0, 0, -6.25], r: [0, 0, 0] },
            { p: [0, 0, 6.25], r: [0, 0, 0] },
            { p: [6.25, 0, 0], r: [0, Math.PI/2, 0] },
            { p: [-6.25, 0, 0], r: [0, Math.PI/2, 0] }
        ];

        wallConfigs.forEach(c => {
            const w = new THREE.Mesh(wallGeom, wallMat);
            w.position.set(...c.p); w.rotation.set(...c.r);
            w.receiveShadow = true;
            this.roomGroup.add(w);

            const skirting = new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 0.1), new THREE.MeshStandardMaterial({ color: accent }));
            skirting.position.set(c.p[0], -3.3, c.p[2]); skirting.rotation.set(...c.r);
            skirting.translateZ(c.p[2] > 0 || c.p[0] > 0 ? -0.26 : 0.26);
            this.roomGroup.add(skirting);
        });

        this.doors = [];
        const pos = [{p:[0, -1, -5.9], r:0}, {p:[5.9, -1, 0], r:-Math.PI/2}, {p:[-5.9, -1, 0], r:Math.PI/2}];
        const doorCount = (this.roomsCleared > 5) ? 3 : 2;
        const layouts = pos.sort(() => 0.5 - Math.random()).slice(0, doorCount);
        let roles = ['correct', 'wrong'];
        if(doorCount === 3) roles.push('trap');
        roles = roles.sort(() => 0.5 - Math.random());

        layouts.forEach((l, i) => {
            const role = roles[i];
            const dGroup = new THREE.Group();
            const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 5.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x86868b, metalness: 0.5 }));
            dGroup.add(frameOuter);

            const hinge = new THREE.Group();
            hinge.position.set(-1.4, 0, 0.1);

            const door = new THREE.Mesh(
                new THREE.BoxGeometry(3, 5, 0.15),
                new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, thickness: 1, transparent: true, opacity: 0.4 })
            );
            door.position.set(1.5, 0, 0); 
            door.userData = { role, hinge, originalZ: 0 };
            hinge.add(door);

            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.2), new THREE.MeshStandardMaterial({ color: accent }));
            handle.position.set(2.6, 0, 0.1);
            door.userData.handle = handle;
            hinge.add(handle);
            dGroup.add(hinge);

            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = (wallColor === 0xffffff) ? '#1d1d1f' : '#ffffff';
            ctx.font = '600 70px system-ui'; ctx.textAlign = 'center';
            let eqText = this.genEq(role === 'correct');
            if(role === 'trap') eqText = "VOID";
            ctx.fillText(eqText, 256, 80);

            const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
            sign.position.set(0, 3.4, 0.31);
            dGroup.add(sign);

            dGroup.position.set(...l.p); dGroup.rotation.y = l.r;
            this.roomGroup.add(dGroup); 
            this.doors.push(door);
        });

        this.scene.add(this.roomGroup);
        this.camera.position.set(0, 1.6, 0);
        this.velocity.set(0,0,0);
    }

    genEq(corr) {
        const phase = Math.floor((this.roomsCleared % 60) / 20);
        let a, b, ans, op = "+";
        if (phase === 0) { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; ans = a + b; }
        else if (phase === 1) { a = Math.floor(Math.random() * 40) + 10; b = Math.floor(Math.random() * 30) + 5; op = Math.random() > 0.5 ? "+" : "-"; ans = (op === "+") ? a + b : a - b; }
        else { if (Math.random() > 0.5) { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 9) + 2; op = "×"; ans = a * b; } else { a = Math.floor(Math.random() * 15); b = Math.floor(Math.random() * 15); let c = Math.floor(Math.random() * 15); ans = a + b + c; let eq = `${a} + ${b} + ${c}`; if (!corr) ans += (Math.random() > 0.5 ? 2 : -2); return `${eq} = ${ans}`; } }
        if (!corr) ans += (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
        return `${a} ${op} ${b} = ${ans}`;
    }

    handleHover() {
        this.raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        const hits = this.raycaster.intersectObjects(this.doors);
        if(hits.length > 0) {
            const d = hits[0].object;
            if(this.hoveredDoor !== d) {
                if(this.hoveredDoor) this.hoveredDoor.userData.handle.material.emissive.setHex(0x000000);
                this.hoveredDoor = d;
                d.userData.handle.material.emissive.setHex(0x333333);
                if(d.userData.role === 'correct') this.playTone(440, 'sine', 0.1, 0.01);
                else this.playTone(100, 'sawtooth', 0.1, 0.01);
            }
        } else if(this.hoveredDoor) {
            this.hoveredDoor.userData.handle.material.emissive.setHex(0x000000);
            this.hoveredDoor = null;
        }
    }

    interact() {
        if(!this.hoveredDoor) return;
        const d = this.hoveredDoor;
        const role = d.userData.role;

        if(role === 'correct') {
            this.playTone(880, 'sine', 0.15);
            this.isTransitioning = true;
            let doorRot = 0;
            const openDoor = () => {
                if(doorRot > -1.55) { doorRot -= 0.08; d.userData.hinge.rotation.y = doorRot; requestAnimationFrame(openDoor); }
            };
            openDoor();

            setTimeout(() => fadeOverlay.style.opacity = "1", 300);
            setTimeout(() => {
                this.roomsCleared++;
                this.level = Math.floor(this.roomsCleared / 20) + 1;
                this.time = 40; 
                document.getElementById('score-hud').innerText = `LEVEL ${this.level} | ROOM ${this.roomsCleared.toString().padStart(2, '0')}`;
                this.spawnRoom();
                fadeOverlay.style.opacity = "0";
                this.isTransitioning = false;
            }, 800);
        } else if(role === 'trap') {
            this.playTone(50, 'square', 0.8, 0.1);
            this.roomsCleared = Math.max(0, this.roomsCleared - 5);
            this.spawnRoom();
        } else {
            this.playTone(110, 'sine', 0.5); this.time -= 10;
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if(this.isAlive && !this.isPaused && !this.isTransitioning) {
                this.time--;
                const tEl = document.getElementById('timer');
                tEl.innerText = `00:${Math.max(0, this.time).toString().padStart(2, '0')}`;
                if(this.time <= 10 && this.time > 0) tEl.classList.add('low-time');
                else tEl.classList.remove('low-time');
                if(this.time <= 0) this.die();
            }
        }, 1000);
    }

    die() {
        this.isAlive = false; this.controls.unlock();
        clearInterval(this.timerInterval);
        document.getElementById('final-score').innerText = `Progress: ${this.roomsCleared} rooms across ${this.level} levels.`;
        document.getElementById('fail-screen').classList.remove('hidden');
        document.getElementById('ui').classList.add('hidden');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if(this.isAlive && !this.isPaused && this.controls.isLocked && !this.isTransitioning) {
            const d = 0.016;
            this.velocity.x *= 0.88; this.velocity.z *= 0.88;
            if(this.moveState.f) this.velocity.z -= 40 * d;
            if(this.moveState.b) this.velocity.z += 40 * d;
            if(this.moveState.l) this.velocity.x -= 40 * d;
            if(this.moveState.r) this.velocity.x += 40 * d;
            this.controls.moveRight(this.velocity.x * d);
            this.controls.moveForward(-this.velocity.z * d);
            if(Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1) {
                this.bobbingTime += d * 10;
                this.camera.position.y = 1.6 + Math.sin(this.bobbingTime) * 0.04;
            }
            this.handleHover();
        }
        this.renderer.render(this.scene, this.camera);
    }
}

new AppleGame();