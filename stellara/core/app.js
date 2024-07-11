'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertToJulianDate } from './time.js';

class Application {
    #scene;
    #camera;
    #renderer;
    #controls;

    #celestialObjects;

    #currentTime;
    #timeSpeed;
    #lastRenderTime;

    constructor(celestialObjects = []) {
        this.#scene = new THREE.Scene();
        this.#camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.00001, 100);
        this.#renderer = new THREE.WebGLRenderer({ antialias: true });
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.autoUpdate = true;
        this.#renderer.shadowMap.needsUpdate = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        

        this.#celestialObjects = celestialObjects;
        for (const obj of this.#celestialObjects) {
            this.#scene.add(obj.meshGroup);
            obj.showRotationAxis = true;
        }

        // test
        // const geometry = new THREE.SphereGeometry(0.005, 32, 32);
        // const meshz = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
        // meshz.position.set(0, 0, 0.01);
        // meshz.castShadow = true;
        // meshz.receiveShadow = true;
        // this.scene.add(meshz);

        // let meshz_shadow = new ShadowMesh(meshz);
        // this.scene.add(meshz_shadow);

        // const geometry1 = new THREE.SphereGeometry(0.005, 32, 32);
        // const meshz1 = new THREE.Mesh(geometry1, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
        // meshz1.position.set(0, 0, 0.025);
        // meshz1.castShadow = true;
        // meshz1.receiveShadow = true;
        // this.scene.add(meshz1);

        // let meshz_shadow1 = new ShadowMesh(meshz1);
        // this.scene.add(meshz_shadow1);

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
        this.#timeSpeed = 120;
        this.#lastRenderTime = null;

        document.body.appendChild(this.#renderer.domElement);

        window.addEventListener('resize', () => {
            this.#camera.aspect = window.innerWidth / window.innerHeight;
            this.#camera.updateProjectionMatrix();
            this.#renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.#lastRenderTime) {
            this.#currentTime = new Date(this.#currentTime.getTime() + (Date.now() - this.#lastRenderTime.getTime()) * this.#timeSpeed);
        }
        this.#lastRenderTime = new Date();

        const jd = convertToJulianDate(this.#currentTime);
        this.#celestialObjects[0].updatePosition(this.#scene, this.#camera, jd, [0, 0, 0]);

        // Note: You can use the following code to switch the texture of the Earth object.
            // this.celestialObjects[1].switchTexture();

        this.#controls.target = this.#celestialObjects[1].position;
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
