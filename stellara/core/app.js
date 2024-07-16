'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertToJulianDate } from './time.js';

class Application {
    #scene;
    #camera;
    #renderer;
    #controls;
    #raycaster;

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

        this.#raycaster = new THREE.Raycaster();

        this.#celestialObjects = celestialObjects;
        for (const obj of this.#celestialObjects) {
            this.#scene.add(obj.meshGroup);
            obj.showRotationAxis = true;
        }

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

        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
        this.#controls.enableDamping = true;
        this.#controls.dampingFactor = 0.1;

        this.#controls.trackTarget = function() {
            if (!this.targetLastPosition) {
                this.targetLastPosition = this.target.clone();
                return;
            }
            const targetPositionDelta = this.target.clone().sub(this.targetLastPosition);
            this.targetLastPosition = this.target.clone();
            this.object.position.add(targetPositionDelta);
        };

        // this.currentTime = new Date();
        this.#currentTime = new Date("2024-10-03 02:30:00");
        this.#timeSpeed = 86400; 
        this.#lastRenderTime = null;

        document.body.appendChild(this.#renderer.domElement);

        window.addEventListener('resize', () => {
            this.#camera.aspect = window.innerWidth / window.innerHeight;
            this.#camera.updateProjectionMatrix();
            this.#renderer.setSize(window.innerWidth, window.innerHeight);
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
            console.log("Camera Position:", this.#camera.position);
            console.log("Camera Rotation:", this.#camera.rotation);
            console.log("Camera Up Vector:", this.#camera.up);
            console.log("Camera Field of View (FOV):", this.#camera.fov);
            console.log("Camera Aspect Ratio:", this.#camera.aspect);
            console.log("Camera Near Clipping Plane:", this.#camera.near);
            console.log("Camera Far Clipping Plane:", this.#camera.far);
        });

        eventBus.subscribe('ViewSwitching', () => {
            this.#camera.position.set(0, 0, 1);
        });

    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.#lastRenderTime) {
            this.#currentTime = new Date(this.#currentTime.getTime() + (Date.now() - this.#lastRenderTime.getTime()) * this.#timeSpeed);
        }
        this.#lastRenderTime = new Date();

        const jd = convertToJulianDate(this.#currentTime);
        this.#celestialObjects[1].updatePosition(this.#scene, this.#camera, jd, [0, 0, 0]);

        // Note: You can use the following code to switch the texture of the Earth object.
            // this.celestialObjects[1].switchTexture(1);

        this.#controls.target = this.#centerObject.position;
        this.#controls.trackTarget();
        this.#controls.update();

        this.#updateShadow();
        this.#renderer.render(this.#scene, this.#camera);
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
