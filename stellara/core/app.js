'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertToJulianDate } from './time.js';

// init number : 86400
let initTimeSpeed = 8640;

class Application {
    #scene;
    #camera;
    #renderer;
    #controls;
    #raycaster;

    #rendererAux;
    #cameraAux;
    #controlsAux;

    #celestialObjects;

    #currentTime;
    #timeSpeed;
    #lastRenderTime;

    #centerObject;

    constructor(celestialObjects = [], eventBus) {

        this.#scene = new THREE.Scene();
        this.#camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.00001, 100);
        this.#renderer = new THREE.WebGLRenderer({ antialias: true });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.autoUpdate = true;
        this.#renderer.shadowMap.needsUpdate = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.#rendererAux = new THREE.WebGLRenderer({ antialias: true });
        const container = document.getElementById('container');
        this.#rendererAux.setSize(container.clientWidth, container.clientHeight);
        this.#rendererAux.shadowMap.enabled = true;
        this.#rendererAux.shadowMap.autoUpdate = true;
        this.#rendererAux.shadowMap.needsUpdate = true;
        this.#rendererAux.shadowMap.type = THREE.PCFSoftShadowMap;


        this.#raycaster = new THREE.Raycaster();

        this.#celestialObjects = celestialObjects;
        for (const obj of this.#celestialObjects) {
            this.#scene.add(obj.meshGroup);
            obj.showRotationAxis = true;
        }

        // debug
        // const sphere = new THREE.SphereGeometry(0.01, 32, 32);
        // const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        // const mesh = new THREE.Mesh(sphere, material);
        // this.#scene.add(mesh);

        // 切换主题
        this.#centerObject = this.#celestialObjects[0].selectMesh;

        // light
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.#scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 3);
        pointLight.position.set(0, 0, 0);
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 512;
        pointLight.shadow.mapSize.height = 512;
        pointLight.shadow.camera.near = 0.00005;
        pointLight.shadow.camera.far = 10;
        this.#scene.add(pointLight);

        // camera init
        this.#camera.position.set(0, 1, 0);
        this.#camera.up.set(0, 0, 1);

        this.#cameraAux = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.00001, 100);
        this.#cameraAux.position.set(1.2, 1, 1.3);
        this.#cameraAux.up.set(0, 0, 1);

        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
        this.#controls.enableDamping = true;
        this.#controls.dampingFactor = 0.1;

        this.#controls.trackTarget = function () {
            if (!this.targetLastPosition) {
                this.targetLastPosition = this.target.clone();
                return;
            }
            const targetPositionDelta = this.target.clone().sub(this.targetLastPosition);
            this.targetLastPosition = this.target.clone();
            this.object.position.add(targetPositionDelta);
        };

        this.#controlsAux = new OrbitControls(this.#cameraAux, this.#rendererAux.domElement);
        this.#controlsAux.enableDamping = true;
        this.#controlsAux.dampingFactor = 0.1;

        this.#controlsAux.trackTarget = function () {
            if (!this.targetLastPosition) {
                this.targetLastPosition = this.target.clone();
                return;
            }
            const targetPositionDelta = this.target.clone().sub(this.targetLastPosition);
            this.targetLastPosition = this.target.clone();
            this.object.position.add(targetPositionDelta);
        }

        // this.currentTime = new Date();
        this.#currentTime = new Date("2024-10-03 02:30:00");
        this.#timeSpeed = initTimeSpeed;
        this.#lastRenderTime = null;

        document.body.appendChild(this.#renderer.domElement);
        document.getElementById('container').appendChild(this.#rendererAux.domElement);

        window.addEventListener('resize', () => {
            this.#camera.aspect = window.innerWidth / window.innerHeight;
            this.#camera.updateProjectionMatrix();
            this.#renderer.setSize(window.innerWidth, window.innerHeight);

            this.#rendererAux.setSize(container.clientWidth, container.clientHeight);
            this.#cameraAux.aspect = container.clientWidth / container.clientHeight;
            this.#cameraAux.updateProjectionMatrix();
        });

        window.addEventListener('click', e => {
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                - (e.clientY / window.innerHeight) * 2 + 1
            );
            this.#raycaster.setFromCamera(mouse, this.#camera);
            const intersects = this.#raycaster.intersectObjects(this.#celestialObjects.map(obj => obj.selectMesh));
            if (intersects.length > 0) {
                this.#centerObject = intersects[0].object;
            }
        });

        // eventBus
        eventBus.subscribe('EarthTransformation', () => {
            this.#celestialObjects[1].switchTexture(this.#celestialObjects[1].curMaterialIndex ^ 1);
            this.#centerObject = this.#celestialObjects[1].selectMesh;
            console.log(this.#camera)
        });

        eventBus.subscribe('TimeSelection', selectedTime => {
            let t = selectedTime.split('T');
            let tt = t[0] + ' ' + t[1] + ':00';
            this.#currentTime = new Date(tt);
            this.#lastRenderTime = null;
        });
        
        eventBus.subscribe('ViewSwitchingSun', () => {
            this.#centerObject = this.#celestialObjects[0].selectMesh;
        });

        eventBus.subscribe('ViewSwitchingEarth', () => {
            this.#centerObject = this.#celestialObjects[1].selectMesh;
        });

        eventBus.subscribe('ViewSwitchingMoon', () => {
            this.#centerObject = this.#celestialObjects[2].selectMesh;
        });

        eventBus.subscribe('topView', () => {
            this.#camera.position.set(0, 0, 2.5);
        });

        eventBus.subscribe('sideView', () => {
            this.#camera.position.set(2, 0, 0.1);
        });

        eventBus.subscribe('3DView', () => {
            this.#camera.position.set(1.5, 1.5, 1.5);
        });

        eventBus.subscribe('TwotimesSpeed', () => {
            this.#timeSpeed *= 2;
        });

        eventBus.subscribe('HalfSpeed', () => {
            this.#timeSpeed *= 0.5;
        });

        eventBus.subscribe('ReturnSpeed', () => {
            console.log('ReturnSpeed');
            this.#timeSpeed = initTimeSpeed;
        });

        eventBus.subscribe('Stop', () => {
            this.#timeSpeed = 0;
        });

        eventBus.subscribe('popwindow', () => {

        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.#lastRenderTime) {
            this.#currentTime = new Date(this.#currentTime.getTime() + (Date.now() - this.#lastRenderTime.getTime()) * this.#timeSpeed);
            document.getElementById("nowtime").innerText = this.#currentTime.toLocaleString();
        }
        this.#lastRenderTime = new Date();

        const jd = convertToJulianDate(this.#currentTime);
        this.#celestialObjects[1].updatePosition(this.#scene, this.#camera, jd, [0, 0, 0]);

        this.#controls.target = this.#centerObject.position;
        this.#controls.trackTarget();
        this.#controls.update();

        this.#controlsAux.target = this.#centerObject.position;
        this.#controlsAux.trackTarget();
        this.#controlsAux.update();

        this.#updateShadow();
        this.#renderer.render(this.#scene, this.#camera);
        this.#rendererAux.render(this.#scene, this.#cameraAux);
        // console.log(this.#camera.position);
        // console.log(this.#cameraAux.position);
    }

    #updateShadow() {
        const opaqueObjects = this.#celestialObjects.filter(obj => obj.visible && obj.castShadow);
        const shadowReceivingObjects = this.#celestialObjects.filter(obj => obj.visible && obj.receiveShadow);

        for (const obj of shadowReceivingObjects) {
            obj.updateShadow(opaqueObjects);
        }
    }
}

export default Application;
