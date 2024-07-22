'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertToJulianDate } from './time.js';
import { radii } from './solar_system_data.js';

// init number : 86400

let initTimeSpeed = 8640;
let currentTimeSpeed = initTimeSpeed;

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

    #isShown = false;

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
        this.#centerObject = this.#celestialObjects[0];

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

        // this.#controlsAux = new OrbitControls(this.#cameraAux, this.#rendererAux.domElement);
        // this.#controlsAux.enableDamping = true;
        // this.#controlsAux.dampingFactor = 0.1;

        // this.#controlsAux.trackTarget = function () {
        //     if (!this.targetLastPosition) {
        //         this.targetLastPosition = this.target.clone();
        //         return;
        //     }
        //     const targetPositionDelta = this.target.clone().sub(this.targetLastPosition);
        //     this.targetLastPosition = this.target.clone();
        //     this.object.position.add(targetPositionDelta);
        // }

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
        });

        eventBus.subscribe('TimeSelection', selectedTime => {
            this.#currentTime = new Date(selectedTime);
            this.#lastRenderTime = null;
        });

        eventBus.subscribe('ViewSwitchingSun', () => {
            this.#centerObject = this.#celestialObjects[0];
        });

        eventBus.subscribe('ViewSwitchingEarth', () => {
            this.#centerObject = this.#celestialObjects[1];
        });

        eventBus.subscribe('ViewSwitchingMoon', () => {
            this.#centerObject = this.#celestialObjects[2].selectMesh;
        });

        eventBus.subscribe('TopView', () => {
            let vector = new THREE.Vector3();
            vector.subVectors(this.#camera.position, this.#centerObject.position);
            this.#camera.position.z = vector.length();
            this.#camera.position.x = this.#centerObject.position.x;
            this.#camera.position.y = this.#centerObject.position.y;
        });

        eventBus.subscribe('SideView', () => {
            let vector = new THREE.Vector3();
            vector.subVectors(this.#camera.position, this.#centerObject.position);
            var Position = vector.length() / Math.sqrt(2);
            this.#camera.position.x = this.#centerObject.position.x + Position;
            this.#camera.position.y = this.#centerObject.position.y + Position;
            this.#camera.position.z = 0;
        });

        eventBus.subscribe('3DView', () => {
            let vector = new THREE.Vector3();
            vector.subVectors(this.#camera.position, this.#centerObject.position);
            var Position = vector.length() / Math.sqrt(3);
            this.#camera.position.x = this.#centerObject.position.x + Position;
            this.#camera.position.y = this.#centerObject.position.y + Position;
            this.#camera.position.z = this.#centerObject.position.z + Position;
        });

        eventBus.subscribe('TwotimesSpeed', () => {
            currentTimeSpeed *= 2;
            this.#timeSpeed = currentTimeSpeed;
        });

        eventBus.subscribe('HalfSpeed', () => {
            currentTimeSpeed *= 0.5;
            this.#timeSpeed = currentTimeSpeed;
        });

        eventBus.subscribe('ReturnSpeed', () => {
            this.#timeSpeed = initTimeSpeed;
            currentTimeSpeed = initTimeSpeed;
        });

        eventBus.subscribe('Stop', () => {
            if (this.#timeSpeed === 0) {
                this.#timeSpeed = currentTimeSpeed;
            }
            else {
                this.#timeSpeed = 0;
            }
        });

        let timeout;
        eventBus.subscribe('totalSolarEclipse', () => {
            this.#isShown = true;
            var container = document.getElementById('container');
            if (timeout) {
                clearTimeout(timeout);
            }
            if (container.style.opacity === '0') {
                container.style.opacity = '100';
            }
            this.#centerObject = this.#celestialObjects[1];
            this.#currentTime = new Date("2024-04-08 18:00:00");
            this.animate();

            this.#camera.position.x = this.#centerObject.position.x + 0.0002;
            this.#camera.position.y = this.#centerObject.position.y + 0.0001;
            this.#camera.position.z = 0.0003;

            this.#cameraAux.position.x = this.#centerObject.position.x;
            this.#cameraAux.position.y = this.#centerObject.position.y;
            this.#cameraAux.position.z = this.#centerObject.position.z;
            this.#cameraAux.fov = 5;
            this.#cameraAux.updateProjectionMatrix();
            timeout = setTimeout(() => {
                document.getElementById('container').style.opacity = '0';
                this.#isShown = false;
            }, 8000);
        });

        eventBus.subscribe('partialSolarEclipse', () => {
            this.#isShown = true;
            var container = document.getElementById('container');
            if (timeout) {
                clearTimeout(timeout);
            }
            if (container.style.opacity === '0') {
                container.style.opacity = '100';
            }
            this.#centerObject = this.#celestialObjects[1];
            this.#currentTime = new Date("2023-04-20 05:00:00");
            this.animate();

            this.#camera.position.x = this.#centerObject.position.x + 0.0003;
            this.#camera.position.y = this.#centerObject.position.y + 0.0003;
            this.#camera.position.z = 0;

            this.#cameraAux.position.x = this.#centerObject.position.x;
            this.#cameraAux.position.y = this.#centerObject.position.y;
            this.#cameraAux.position.z = this.#centerObject.position.z;
            this.#cameraAux.fov = 5;
            this.#cameraAux.updateProjectionMatrix();
            timeout = setTimeout(() => {
                document.getElementById('container').style.opacity = '0';
                this.#isShown = false;
            }, 8000);
        });

        eventBus.subscribe('annularSolarEclipse', () => {
            this.#isShown = true;
            var container = document.getElementById('container');
            if (timeout) {
                clearTimeout(timeout);
            }
            if (container.style.opacity === '0') {
                container.style.opacity = '100';
            }
            this.#centerObject = this.#celestialObjects[1];
            this.#currentTime = new Date("2024-10-02 15:00:00");
            this.animate();

            this.#camera.position.x = this.#centerObject.position.x - 0.0004;
            this.#camera.position.y = this.#centerObject.position.y;
            this.#camera.position.z = 0;

            this.#cameraAux.position.x = this.#centerObject.position.x;
            this.#cameraAux.position.y = this.#centerObject.position.y;
            this.#cameraAux.position.z = this.#centerObject.position.z;
            this.#cameraAux.fov = 5;
            this.#cameraAux.updateProjectionMatrix();
            timeout = setTimeout(() => {
                document.getElementById('container').style.opacity = '0';
                this.#isShown = false;
            }, 8000);
        });

        eventBus.subscribe('totalLunarEclipse', () => {
            var container = document.getElementById('container');
            this.#isShown = true;
            if (timeout) {
                clearTimeout(timeout);
            }
            if (container.style.opacity === '0') {
                container.style.opacity = '100';
            }
            this.#centerObject = this.#celestialObjects[2];
            this.#currentTime = new Date("2025-03-14 05:00:00");
            this.animate();

            this.#camera.position.x = this.#centerObject.position.x + 0.0001;
            this.#camera.position.y = this.#centerObject.position.y;
            this.#camera.position.z = 0;

            this.#cameraAux.position.x = this.#centerObject.position.x;
            this.#cameraAux.position.y = this.#centerObject.position.y;
            this.#cameraAux.position.z = this.#centerObject.position.z;
            this.#cameraAux.fov = 5;
            this.#cameraAux.updateProjectionMatrix();
            timeout = setTimeout(() => {
                document.getElementById('container').style.opacity = '0';
                this.#isShown = false;
            }, 8000);
        });

        eventBus.subscribe('partialLunarEclipse', () => {
            var container = document.getElementById('container');
            this.#isShown = true;
            if (timeout) {
                clearTimeout(timeout);
            }
            if (container.style.opacity === '0') {
                container.style.opacity = '100';
            }
            this.#centerObject = this.#celestialObjects[2];
            this.#currentTime = new Date("2024-09-18 05:00:00");
            this.animate();

            this.#camera.position.x = this.#centerObject.position.x - 0.0001;
            this.#camera.position.y = this.#centerObject.position.y;
            this.#camera.position.z = 0;

            this.#cameraAux.position.x = this.#centerObject.position.x;
            this.#cameraAux.position.y = this.#centerObject.position.y;
            this.#cameraAux.position.z = this.#centerObject.position.z;
            this.#cameraAux.fov = 5;
            this.#cameraAux.updateProjectionMatrix();
            timeout = setTimeout(() => {
                document.getElementById('container').style.opacity = '0';
                this.#isShown = false;
            }, 8000);
        });

        eventBus.subscribe('annularLunarEclipse', () => {
            var container = document.getElementById('container');
            this.#isShown = true;
            if (timeout) {
                clearTimeout(timeout);
            }
            if (container.style.opacity === '0') {
                container.style.opacity = '100';
            }
            this.#centerObject = this.#celestialObjects[2];
            this.#currentTime = new Date("2023-05-05 10:00:00");
            this.animate();

            this.#camera.position.x = this.#centerObject.position.x + 0.00005;
            this.#camera.position.y = this.#centerObject.position.y + 0.00005;
            this.#camera.position.z = 0.0001;

            this.#cameraAux.position.x = this.#centerObject.position.x;
            this.#cameraAux.position.y = this.#centerObject.position.y;
            this.#cameraAux.position.z = this.#centerObject.position.z;
            this.#cameraAux.fov = 5;
            this.#cameraAux.updateProjectionMatrix();
            timeout = setTimeout(() => {
                document.getElementById('container').style.opacity = '0';
                this.#isShown = false;
            }, 8000);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.#lastRenderTime) {
            this.#currentTime = new Date(this.#currentTime.getTime() + (Date.now() - this.#lastRenderTime.getTime()) * this.#timeSpeed);
            document.getElementById("nowtime").innerText = this.#currentTime.toLocaleString();
        }
        this.#lastRenderTime = new Date();
        document.getElementById('timespeed').innerText = 'Time Speed: *' + (currentTimeSpeed / initTimeSpeed >= 1 ? currentTimeSpeed / initTimeSpeed : '1/' + initTimeSpeed / currentTimeSpeed);

        const jd = convertToJulianDate(this.#currentTime);
        this.#celestialObjects[0].updatePosition(this.#scene, jd, [0, 0, 0]);
        this.#updateShadow();

        this.#controls.target = this.#centerObject.position;
        this.#controls.trackTarget();
        this.#controls.update();

        // this.#cameraAux.position.set(this.#camera.position.x, this.#camera.position.y, this.#camera.position.z);
        if (this.#isShown) {
            let vector = new THREE.Vector3();
            vector.subVectors(this.#centerObject.position, this.#celestialObjects[0].position);
            if (this.#centerObject === this.#celestialObjects[1]) {
                vector = vector.multiplyScalar(1 - (radii.earth / vector.length()) - 0.00001).add(this.#celestialObjects[0].position);
            } else if (this.#centerObject === this.#celestialObjects[2]) {
                vector = vector.multiplyScalar(1 - (radii.moon / vector.length()) - 0.0001).add(this.#celestialObjects[0].position);
            }
            this.#cameraAux.position.set(vector.x, vector.y, vector.z);
            this.#cameraAux.lookAt(this.#celestialObjects[0].position);
            this.#rendererAux.render(this.#scene, this.#cameraAux);
        } 

        this.#updateSelectMeshScale(this.#camera);
        this.#updateMeshScale(this.#camera);
        this.#renderer.render(this.#scene, this.#camera);

//         this.#updateMeshScale(this.#cameraAux);
//         this.#rendererAux.render(this.#scene, this.#cameraAux);
    }

    #updateShadow() {
        const opaqueObjects = this.#celestialObjects.filter(obj => obj.visible && obj.castShadow);
        const shadowReceivingObjects = this.#celestialObjects.filter(obj => obj.visible && obj.receiveShadow);

        for (const obj of shadowReceivingObjects) {
            obj.updateShadow(opaqueObjects);
        }
    }

    #updateSelectMeshScale(camera) {
        for (const obj of this.#celestialObjects) {
            obj.updateSelectMeshScale(camera);
        }
    }

    #updateMeshScale(camera) {
        for (const obj of this.#celestialObjects) {
            obj.updateMeshScale(camera);
        }
    }
}

export default Application;
