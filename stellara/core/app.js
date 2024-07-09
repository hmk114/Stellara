import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertToJulianDate } from './time.js';

class Application {
    constructor(celestialObjects = []) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.00001, 100);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.celestialObjects = celestialObjects;
        for (const obj of this.celestialObjects) {
            this.scene.add(obj.meshGroup);
            obj.showRotationAxis = true;
        }

        // test
        // const geometry = new THREE.SphereGeometry(0.005, 32, 32);
        // const meshz = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
        // meshz.position.set(0, 0, 0.01);
        // meshz.castShadow = true;
        // meshz.receiveShadow = true;
        // this.scene.add(meshz);

        // light
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 3);
        pointLight.position.set(0, 0, 0);
        console.log(celestialObjects[0].position);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        pointLight.shadow.camera.near = 0.5;
        pointLight.shadow.camera.far = 100;

        // const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
        // directionalLight.position.set(celestialObjects[0].position);

        // directionalLight.castShadow = true;
        
        // this.scene.add(directionalLight);

        // console.log(celestialObjects[0].position);
        


        this.camera.position.set(0, 1, 0);
        this.camera.up.set(0, 0, 1);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;

        this.controls.trackTarget = function() {
            if (!this.targetLastPosition) {
                this.targetLastPosition = this.target.clone();
                return;
            }
            const targetPositionDelta = this.target.clone().sub(this.targetLastPosition);
            this.targetLastPosition = this.target.clone();
            this.object.position.add(targetPositionDelta);
        };

        this.currentTime = new Date();
        this.timeSpeed = 86400;
        this.lastRenderTime = null;

        document.body.appendChild(this.renderer.domElement);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.lastRenderTime) {
            this.currentTime = new Date(this.currentTime.getTime() + (Date.now() - this.lastRenderTime.getTime()) * this.timeSpeed);
        }
        this.lastRenderTime = new Date();

        const jd = convertToJulianDate(this.currentTime);
        this.celestialObjects[0].update(this.scene, this.camera, jd, [0, 0, 0]);

        this.controls.target = this.celestialObjects[1].position;
        this.controls.trackTarget();
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}

export default Application;
