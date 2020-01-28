import "../styles/index.scss";
import * as THREE from "three";
import * as dat from "dat.gui";
import Letter from "./els/letter";
import { TweenMax, Expo } from "gsap/all";
import { radians, map, distance, hexToRgbTreeJs } from "./helpers";

export default class App {
  setup() {
    this.meshes = [];
    this.gutter = { size: 5 };
    this.grid = { cols: 4, rows: 8, type: 1 }; // type: 1(crossed); 2(rectangular)
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse3D = new THREE.Vector2();

    this.geometries = [
      new Letter("svg#dima_d"),
      new Letter("svg#dima_i"),
      new Letter("svg#dima_m"),
      new Letter("svg#dima_a")
      //new Letter("svg#dima_")
    ];

    this.meshColor = "#EE0F34";
    this.ambientLightColor = "#a7bfed";
    this.spotLightColor = "#2a2fb2";
    this.rectLightColor = "#000000";
    this.backgroundColor = "#11416B";
    this.meshMetalness = 0.1;
    this.meshRoughness = 1;
    this.meshReflectivity = 0.1;

    this.raycaster = new THREE.Raycaster();
  }

  createGUI() {
    this.gui = new dat.GUI();
    const gui = this.gui.addFolder("Background");
    gui.addColor(this, "backgroundColor").onChange(color => {
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
    this.camera.position.set(0, 65, 0);
    this.camera.rotation.x = -1.57;

    this.scene.add(this.camera);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight(this.ambientLightColor, 1);
    this.scene.add(light);

    const gui = this.gui.addFolder("Ambient Light");
    gui.addColor(this, "ambientLightColor").onChange(color => {
      light.color = hexToRgbTreeJs(color);
    });
  }

  addSpotLight() {
    const light = new THREE.SpotLight(this.spotLightColor, 1, 1000);
    light.position.set(0, 27, 0);
    light.castShadow = true;
    this.scene.add(light);

    const gui = this.gui.addFolder("Spot Light");
    gui.addColor(this, "spotLightColor").onChange(color => {
      light.color = hexToRgbTreeJs(color);
    });
  }

  addRectLight() {
    const light = new THREE.RectAreaLight(this.rectLightColor, 1, 2000, 2000);
    light.position.set(5, 50, 50);
    light.lookAt(0, 0, 0);
    this.scene.add(light);

    const gui = this.gui.addFolder("Rect Light");
    gui.addColor(this, "rectLightColor").onChange(color => {
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
    this.groupMesh = new THREE.Object3D();

    const meshParams = {
      color: this.meshColor,
      metalness: this.meshMetalness,
      emissive: "#000000",
      roughness: this.meshRoughness,
      reflectivity: this.meshReflectivity
    };

    const material = new THREE.MeshPhysicalMaterial(meshParams);

    // GUI
    const gui = this.gui.addFolder("Mesh Material");
    gui.addColor(meshParams, "color").onChange(color => {
      material.color = hexToRgbTreeJs(color);
    });
    gui.add(meshParams, "metalness", 0, 1).onChange(val => {
      material.metalness = val;
    });
    gui.add(meshParams, "roughness", 0, 1).onChange(val => {
      material.roughness = val;
    });
    gui.add(meshParams, "reflectivity", 0, 1).onChange(val => {
      material.reflectivity = val;
    });

    // Grid
    for (let row = 0; row < this.grid.rows; row++) {
      this.meshes[row] = [];

      for (let index = 0; index < 1; index++) {
        const totalCols =
          this.grid.type == 1 ? this.getTotalRows(row) : this.grid.cols;

        for (let col = 0; col < totalCols; col++) {
          const geometry = this.getRandomGeometry();
          const mesh = this.getMesh(geometry.geom, material);

          if (this.grid.type == 1) {
            mesh.position.x =
              col +
              col * this.gutter.size +
              (totalCols === this.grid.cols ? 0 : 2.5);
            mesh.position.y = 0;
            mesh.position.z = row + row * (index + 0.25);
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
    }

    const centerX =
      this.grid.type == 1
        ? (this.grid.cols / 2) * this.gutter.size - 1
        : (this.grid.cols - 1 + (this.grid.cols - 1) * this.gutter.size) * 0.5;
    const centerZ =
      this.grid.type == 1
        ? this.grid.rows / 2 - 0.8
        : (this.grid.rows - 1 + (this.grid.rows - 1) * this.gutter.size) * 0.5;

    //const centerX = (this.grid.cols / 2) * this.gutter.size - 1;
    //const centerZ = this.grid.rows / 2 - 0.8;

    this.groupMesh.position.set(-centerX, 0, -centerZ);

    this.scene.add(this.groupMesh);
  }

  getTotalRows(col) {
    return col % 2 === 0 ? this.grid.cols : this.grid.cols - 1;
  }

  getMesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  draw() {
    this.raycaster.setFromCamera(this.mouse3D, this.camera);

    const intersects = this.raycaster.intersectObjects([this.floor]);

    if (intersects.length) {
      const { x, z } = intersects[0].point;

      for (let row = 0; row < this.grid.rows; row++) {
        for (let index = 0; index < 1; index++) {
          const totalCols =
            this.grid.type == 1 ? this.getTotalRows(row) : this.grid.cols;

          for (let col = 0; col < totalCols; col++) {
            const mesh = this.meshes[row][col];

            const mouseDistance = distance(
              x,
              z,
              mesh.position.x + this.groupMesh.position.x,
              mesh.position.z + this.groupMesh.position.z
            );

            const y = map(mouseDistance, 7, 0, 0, 6);
            TweenMax.to(mesh.position, 0.3, {
              y: y < 1 ? 1 : y
            });

            const scaleFactor = mesh.position.y / 1.2;
            const scale = scaleFactor < 1 ? 1 : scaleFactor;
            TweenMax.to(mesh.scale, 0.3, {
              ease: Expo.easeOut,
              x: scale,
              y: scale,
              z: scale
            });

            TweenMax.to(mesh.rotation, 0.7, {
              ease: Expo.easeOut,
              x: map(
                mesh.position.y,
                -1,
                1,
                radians(270),
                mesh.initialRotation.x
              ),
              z: map(
                mesh.position.y,
                -1,
                1,
                radians(-90),
                mesh.initialRotation.z
              ),
              y: map(
                mesh.position.y,
                -1,
                1,
                radians(45),
                mesh.initialRotation.y
              )
            });
          }
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

    window.addEventListener("resize", this.onResize.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this), false);

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
