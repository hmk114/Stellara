import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { convertToJulianDate } from './time.js';

class Application {
    constructor(celestialObjects = []) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 100);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.celestialObjects = celestialObjects;
        for (const obj of this.celestialObjects) {
            this.scene.add(obj.meshGroup);
            obj.showRotationAxis = true;
        }

        // test
        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const meshz = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
        meshz.position.set(0, 0, 1);
        this.scene.add(meshz);

        this.camera.position.set(0, 5, 0);
        this.camera.up.set(0, 0, 1);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;

        this.currentTime = new Date()
        this.timeSpeed = 30 * 86400;
        this.lastRenderTime = null;

        document.body.appendChild(this.renderer.domElement);
    }

    renderAtTime(jd) {
        // assume the first object is the sun
        this.celestialObjects[0].update(this.scene, this.camera, jd, [0, 0, 0]);
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();

        if (this.lastRenderTime) {
            this.currentTime = new Date(this.currentTime.getTime() + (Date.now() - this.lastRenderTime) * this.timeSpeed);
        }
        this.lastRenderTime = Date.now();
        this.renderAtTime(convertToJulianDate(this.currentTime));
    }
}

export default Application;
