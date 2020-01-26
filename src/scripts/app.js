import * as THREE from 'three';
import Letters from './els/letters.js';

export default class App {
	setup() {
		this.raycaster = new THREE.Raycaster();

		this.width = window.innerWidth;
		this.height = window.innerHeight;

		this.backgroundColor = '#1b1b1b';
		this.gutter = { size: 1.2 };
		this.meshes = [];
		this.grid = { cols: 15, rows: 7 };
		this.repulsion = 1;

		const letters = new Letters().getGeometries();
		this.geometries = letters;
	}

	createScene() {
		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		document.body.appendChild(this.renderer.domElement);
	}

	createCamera() {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const ratio = width / height;

		this.camera = new THREE.PerspectiveCamera(45, ratio, 1);
		this.camera.position.set(0, 30, 0);

		this.scene.add(this.camera);
	}

	addAmbientLight() {
		const obj = { color: '#2900af' };
		const light = new THREE.AmbientLight(obj.color, 1);

		this.scene.add(light);

		/*
		const gui = this.gui.addFolder('Ambient Light');
		gui.addColor(obj, 'color').onChange((color) => {
			light.color = hexToRgbTreeJs(color);
        });
        */
	}

	addSpotLight() {
		const obj = { color: '#e000ff' };
		const light = new THREE.SpotLight(obj.color, 1, 1000);

		light.position.set(0, 27, 0);
		light.castShadow = true;

		this.scene.add(light);

		/*
		const gui = this.gui.addFolder('Spot Light');
		gui.addColor(obj, 'color').onChange((color) => {
			light.color = hexToRgbTreeJs(color);
        });
        */
	}

	addRectLight() {
		const obj = { color: '#0077ff' };
		const rectLight = new THREE.RectAreaLight(obj.color, 1, 2000, 2000);

		rectLight.position.set(5, 50, 50);
		rectLight.lookAt(0, 0, 0);

		this.scene.add(rectLight);

		/*
		const gui = this.gui.addFolder('Rect Light');
		gui.addColor(obj, 'color').onChange((color) => {
			rectLight.color = hexToRgbTreeJs(color);
        });
        */
	}

	addPointLight(color, position) {
		const pointLight = new THREE.PointLight(color, 1, 1000, 1);
		pointLight.position.set(position.x, position.y, position.z);

		this.scene.add(pointLight);
	}

	getRandomGeometry() {
		return this.geometries[
			Math.floor(Math.random() * Math.floor(this.geometries.length))
		];
	}

	init() {
		this.setup();
		this.createScene();
		this.createCamera();
		this.addAmbientLight();
		this.addSpotLight();
		this.addRectLight();
		this.getRandomGeometry();

		this.addPointLight(0xfff000, { x: 0, y: 10, z: -100 });
		this.addPointLight(0xfff000, { x: 100, y: 10, z: 0 });
		this.addPointLight(0x00ff00, { x: 20, y: 5, z: 20 });
	}
}
