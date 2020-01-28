import '../styles/index.scss';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Letter from './els/letter';
import gsap, { Expo } from 'gsap/all';
import {
	radians,
	map,
	distance,
	hexToRgbTreeJs,
	visibleHeightAtZDepth,
	visibleWidthAtZDepth
} from './helpers';

export default class App {
	setup() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.meshes = [];
		this.gutter = { size: 2 };
		this.grid = { cols: 17, rows: 10, type: 1 }; // type: 1(crossed); 2(rectangular)

		this.mouse3D = new THREE.Vector2();

		this.geometries = [
			new Letter('svg#dima_d'),
			new Letter('svg#dima_i'),
			new Letter('svg#dima_m'),
			new Letter('svg#dima_a')
			//new Letter('svg#dima_')
		];

		this.meshColor = '#EE0F34';
		this.ambientLightColor = '#a7bfed';
		this.spotLightColor = '#2a2fb2';
		this.rectLightColor = '#000000';
		this.backgroundColor = '#11416B';
		this.meshMetalness = 0.1;
		this.meshRoughness = 1;
		this.meshReflectivity = 0.1;

		// handles mouse coordinates mapping from 2D canvas to 3D world
		this.raycaster = new THREE.Raycaster();
	}

	createGUI() {
		this.gui = new dat.GUI();

		const gui = this.gui.addFolder('Background');
		gui.addColor(this, 'backgroundColor').onChange((color) => {
			document.body.style.backgroundColor = color;
		});
	}

	createScene() {
		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		document.body.appendChild(this.renderer.domElement);
	}

	createCamera() {
		const ratio = window.innerWidth / window.innerHeight;

		this.camera = new THREE.PerspectiveCamera(20, ratio, 1);

		// set the distance our camera will have from the grid
		this.camera.position.set(0, 65, 0);

		// we rotate our camera so we can get a view from the top
		this.camera.rotation.x = -1.57;

		this.scene.add(this.camera);

		// divide grid elements throught the screen size
		this.grid.cols = Math.floor(
			visibleWidthAtZDepth(65, this.camera) / this.gutter.size
		);
		this.grid.rows = Math.floor(
			visibleHeightAtZDepth(65, this.camera) / this.gutter.size
		);
	}

	addAmbientLight() {
		const light = new THREE.AmbientLight(this.ambientLightColor, 1);
		this.scene.add(light);

		const gui = this.gui.addFolder('Ambient Light');
		gui.addColor(this, 'ambientLightColor').onChange((color) => {
			light.color = hexToRgbTreeJs(color);
		});
	}

	addSpotLight() {
		const light = new THREE.SpotLight(this.spotLightColor, 1, 1000);
		light.position.set(0, 27, 0);
		light.castShadow = true;
		this.scene.add(light);

		const gui = this.gui.addFolder('Spot Light');
		gui.addColor(this, 'spotLightColor').onChange((color) => {
			light.color = hexToRgbTreeJs(color);
		});
	}

	addRectLight() {
		const light = new THREE.RectAreaLight(this.rectLightColor, 1, 2000, 2000);
		light.position.set(5, 50, 50);
		light.lookAt(0, 0, 0);
		this.scene.add(light);

		const gui = this.gui.addFolder('Rect Light');
		gui.addColor(this, 'rectLightColor').onChange((color) => {
			light.color = hexToRgbTreeJs(color);
		});
	}

	addPointLight(color, position) {
		const light = new THREE.PointLight(color, 1, 1000, 1);
		light.position.set(position.x, position.y, position.z);

		this.scene.add(light);
	}

	addFloor() {
		const geometry = new THREE.PlaneGeometry(100, 100);
		const material = new THREE.ShadowMaterial({ opacity: 0.3 });

		this.floor = new THREE.Mesh(geometry, material);
		this.floor.position.y = 0;
		this.floor.rotateX(-Math.PI / 2);
		this.floor.receiveShadow = true;

		this.scene.add(this.floor);
	}

	getRandomGeometry() {
		return this.geometries[
			Math.floor(Math.random() * Math.floor(this.geometries.length))
		];
	}

	createGrid() {
		// create a basic 3D object to be used as a container for our grid elements so we can move all of them together
		this.groupMesh = new THREE.Object3D();

		const meshParams = {
			color: this.meshColor,
			metalness: this.meshMetalness,
			emissive: '#000000',
			roughness: this.meshRoughness,
			reflectivity: this.meshReflectivity
		};

		// we create our material outside the loop to keep it more performant
		const material = new THREE.MeshPhysicalMaterial(meshParams);

		// GUI
		const gui = this.gui.addFolder('Mesh Material');
		gui.addColor(meshParams, 'color').onChange((color) => {
			material.color = hexToRgbTreeJs(color);
		});
		gui.add(meshParams, 'metalness', 0, 1).onChange((val) => {
			material.metalness = val;
		});
		gui.add(meshParams, 'roughness', 0, 1).onChange((val) => {
			material.roughness = val;
		});
		gui.add(meshParams, 'reflectivity', 0, 1).onChange((val) => {
			material.reflectivity = val;
		});

		switch (this.grid.type) {
			case 1: {
				this.addCrossedGrid(material);
				break;
			}
			case 2: {
				this.addNormalGrid(material);
				break;
			}
			default: {
				this.addNormalGrid(material);
				break;
			}
		}
	}

	addCrossedGrid(material) {
		// Create grid
		for (let row = 0; row < this.grid.rows; row++) {
			this.meshes[row] = [];
			const totalCols = this.getTotalCols(row);

			for (let col = 0; col < totalCols; col++) {
				const geometry = this.getRandomGeometry();
				const mesh = this.getMesh(geometry.geom, material);

				mesh.position.x =
					col * this.gutter.size +
					(totalCols === this.grid.cols ? 0 : this.gutter.size / 2);
				mesh.position.y = 0;
				mesh.position.z = row + row * (this.gutter.size / 2);

				mesh.rotation.x = geometry.rotationX;
				mesh.rotation.y = geometry.rotationY;
				mesh.rotation.z = geometry.rotationZ;

				// store the initial rotation values of each element so we can animate back
				mesh.initialRotation = {
					x: mesh.rotation.x,
					y: mesh.rotation.y,
					z: mesh.rotation.z
				};

				this.groupMesh.add(mesh);

				// store the element inside our array so we can get back when need to animate
				this.meshes[row][col] = mesh;
			}
		}

		//center on the X and Z our group mesh containing all the grid elements
		const centerX = (this.grid.cols / 2) * this.gutter.size - 1;
		const centerZ = (this.grid.rows / 2) * this.gutter.size - 1;

		this.groupMesh.position.set(-centerX, 0, -centerZ);

		this.scene.add(this.groupMesh);
	}

	addNormalGrid(material) {
		// Create grid
		for (let row = 0; row < this.grid.rows; row++) {
			this.meshes[row] = [];

			for (let col = 0; col < this.grid.cols; col++) {
				const geometry = this.getRandomGeometry();
				const mesh = this.getMesh(geometry.geom, material);

				mesh.position.x = col + col * this.gutter.size;
				mesh.position.y = 0;
				mesh.position.z = row + row * this.gutter.size;

				mesh.rotation.x = geometry.rotationX;
				mesh.rotation.y = geometry.rotationY;
				mesh.rotation.z = geometry.rotationZ;

				// store the initial rotation values of each element so we can animate back
				mesh.initialRotation = {
					x: mesh.rotation.x,
					y: mesh.rotation.y,
					z: mesh.rotation.z
				};

				this.groupMesh.add(mesh);

				// store the element inside our array so we can get back when need to animate
				this.meshes[row][col] = mesh;
			}
		}

		//center on the X and Z our group mesh containing all the grid elements
		const centerX =
			(this.grid.cols - 1 + (this.grid.cols - 1) * this.gutter.size) / 2;
		const centerZ =
			(this.grid.rows - 1 + (this.grid.rows - 1) * this.gutter.size) * 0.5;
		this.groupMesh.position.set(-centerX, 0, -centerZ);

		this.scene.add(this.groupMesh);
	}

	getTotalCols(col) {
		return col % 2 === 0 ? this.grid.cols : this.grid.cols - 1;
	}

	getMesh(geometry, material) {
		const mesh = new THREE.Mesh(geometry, material);

		mesh.castShadow = true;
		mesh.receiveShadow = true;

		return mesh;
	}

	draw() {
		// maps our mouse coordinates from the camera perspective
		this.raycaster.setFromCamera(this.mouse3D, this.camera);

		// checks if our mouse coordinates intersect with our floor shape
		const intersects = this.raycaster.intersectObjects([this.floor]);

		if (intersects.length) {
			// get the x and z positions of the intersection
			const { x, z } = intersects[0].point;

			for (let row = 0; row < this.grid.rows; row++) {
				const totalCols =
					this.grid.type == 1 ? this.getTotalCols(row) : this.grid.cols;

				for (let col = 0; col < totalCols; col++) {
					// extract out mesh base on the grid location
					const mesh = this.meshes[row][col];

					// calculate the distance from the intersection down to the grid element
					const mouseDistance = distance(
						x,
						z,
						mesh.position.x + this.groupMesh.position.x,
						mesh.position.z + this.groupMesh.position.z
					);

					// based on the distance we map the value to our min max Y position
					// it works similar to a radius range
					const startDistance = 6;
					const endDistance = 0;
					const minPositionY = 0;
					const maxPositionY = 8;
					const y = map(
						mouseDistance,
						startDistance,
						endDistance,
						minPositionY,
						maxPositionY
					);

					// based on the y position we animate the mesh.position.y
					// we don´t go below position y of 1
					gsap.to(mesh.position, { duration: 0.3, y: y < 1 ? 1 : y });

					// create a scale factor based on the mesh.position.y
					// increase value = decreases scale height
					const scaleFactor = mesh.position.y / 1.2;

					// to keep our scale to a minimum size of 1 we check if the scaleFactor is below 1
					const scale = scaleFactor < 1 ? 1 : scaleFactor;

					// animates the mesh scale properties
					gsap.to(mesh.scale, {
						duration: 0.3,
						ease: Expo.easeOut,
						x: scale,
						y: scale,
						z: scale
					});

					// rotate our element
					gsap.to(mesh.rotation, {
						duration: 0.5,
						ease: Expo.easeOut,
						x: map(mesh.position.y, -1, 1, radians(0), mesh.initialRotation.x),
						z: map(mesh.position.y, -1, 1, radians(90), mesh.initialRotation.z),
						y: map(mesh.position.y, -1, 1, radians(90), mesh.initialRotation.y)
					});
				}
			}
		}
	}

	init() {
		this.setup();
		this.createGUI();
		this.createScene();
		this.createCamera();
		this.createGrid();
		this.addFloor();

		this.addAmbientLight();
		this.addSpotLight();
		this.addRectLight();
		this.addPointLight(0xfff000, { x: 0, y: 10, z: -100 });
		this.addPointLight(0xfff000, { x: 100, y: 10, z: 0 });
		this.addPointLight(0x00ff00, { x: 20, y: 5, z: 20 });

		this.animate();

		//window.addEventListener('resize', this.onResize.bind(this));
		window.addEventListener('mousemove', this.onMouseMove.bind(this), false);

		// we call this to simulate the initial position of the mouse cursor
		this.onMouseMove({ clientX: 0, clientY: 0 });
	}

	onMouseMove({ clientX, clientY }) {
		this.mouse3D.x = (clientX / this.width) * 2 - 1;
		this.mouse3D.y = -(clientY / this.height) * 2 + 1;
	}

	onResize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height);
	}

	animate() {
		this.draw();

		this.renderer.render(this.scene, this.camera);

		requestAnimationFrame(this.animate.bind(this));
	}
}

/*
  addGrid() {
    
    for (let row = 0; row < this.grid.rows; row++) {
      this.meshes[row] = [];
      console.log("Row: " + row);

      const totalCols =
        this.grid.type == 1 ? this.getTotalCols(row) : this.grid.cols;

      for (let col = 0; col < totalCols; col++) {
        const geometry = this.getRandomGeometry();
        const mesh = this.getMesh(geometry.geom, material);
        console.log("Col: " + col);

        if (this.grid.type == 1) {
          mesh.position.x =
            col * this.gutter.size +
            (totalCols === this.grid.cols ? 0 : this.gutter.size / 2);
          mesh.position.y = 0;
          mesh.position.z = row + row * (this.gutter.size / 2);
        } else {
          mesh.position.x = col + col * this.gutter.size;
          mesh.position.y = 0;
          mesh.position.z = row + row * this.gutter.size;
        }

        mesh.rotation.x = geometry.rotationX;
        mesh.rotation.y = geometry.rotationY;
        mesh.rotation.z = geometry.rotationZ;

        mesh.initialRotation = {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z
        };

        this.groupMesh.add(mesh);
        this.meshes[row][col] = mesh;
      }
    }

    // Center Grid
    const centerX =
      this.grid.type == 1
        ? (this.grid.cols / 2) * this.gutter.size - 1
        : (this.grid.cols - 1 + (this.grid.cols - 1) * this.gutter.size) / 2;
    const centerZ =
      this.grid.type == 1
        ? this.grid.rows + this.grid.type / 2
        : (this.grid.rows - 1 + (this.grid.rows - 1) * this.gutter.size) * 0.5;

    this.groupMesh.position.set(-centerX, 0, -centerZ);

	this.scene.add(this.groupMesh);
	
  }
  */
