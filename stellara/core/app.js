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
            this.scene.add(obj.mesh);
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

    $updateObject(obj, jd, basePosition) {
        // calculate the position of the object
        const [baseX, baseY, baseZ] = basePosition;
        const position = obj.positionAtTime(jd);

        const [x, y, z] = [position.x + baseX, position.y + baseY, position.z + baseZ];
        obj.mesh.position.set(x, y, z);

        // set scale
        const minAngularRadius = 0.005;
        const dis = this.camera.position.distanceTo(obj.mesh.position);
        const realAngularRadius = Math.atan(obj.radius / dis);

        obj.mesh.scale.setScalar(Math.max(minAngularRadius / realAngularRadius, 1));

        for (const child of obj.children) {
            this.$updateObject(child, jd, [x, y, z]);
        }
    }

    renderAtTime(jd) {
        // assume the first object is the sun
        this.$updateObject(this.celestialObjects[0], jd, [0, 0, 0]);
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
