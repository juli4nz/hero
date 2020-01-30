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
  visibleWidthAtZDepth,
  debounce
} from './helpers';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js';

export default class App {
  // SETUP ==================
  setup() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.meshes = [];
    this.gutter = { size: 2 };
    this.grid = {
      cols: 5, // default
      rows: 5, // default
      type: 1 // type: 1(crossed); 2(rectangular)
    };

    this.geometries = [
      new Letter('svg#dima_d'),
      new Letter('svg#dima_i'),
      new Letter('svg#dima_m'),
      new Letter('svg#dima_a')
      //new Letter('svg#dima_')
    ];

    this.light = {
      ambient: '#a7bfed',
      spot: '#2a2fb2',
      rect: '#000000'
    };

    this.matParams = {
      color: '#333c42', // blue #242370 // red #EE0F34
      metalness: 0.1,
      roughness: 1,
      reflectivity: 0.1,
      transparent: true,
      opacity: 1,
      emissive: '#000000'
    };

    // holds mouse/touch 2D coordinates
    this.mouse3D = new THREE.Vector2();

    // handles mouse coordinates mapping from 2D canvas to 3D world
    this.raycaster = new THREE.Raycaster();

    // create a basic 3D object to be used as a container for our grid elements so we can move all of them together
    this.groupMesh = new THREE.Object3D();

    // we create our material outside the loop to keep it more performant
    this.material = new THREE.MeshPhysicalMaterial(this.matParams);

    // create GUI to be used as a container to gui elements
    const gui = new dat.GUI();
    gui.close();
    //gui.hide(); // activate in production!
    this.guiDirs = {
      mesh: gui.addFolder('Mesh Material'),
      light: gui.addFolder('Light Colors')
    };
  }

  // SCENE =================================
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

  // CAMERA ==================================
  createCamera() {
    const ratio = window.innerWidth / window.innerHeight;
    this.depth = 65;

    this.camera = new THREE.PerspectiveCamera(20, ratio, 1);

    // set the distance our camera will have from the grid
    this.camera.position.set(0, this.depth, 0);

    // we rotate our camera so we can get a view from the top
    this.camera.rotation.x = -1.57;

    this.scene.add(this.camera);
  }

  // AMBIENT LIGHT ==============================
  addAmbientLight() {
    const light = new THREE.AmbientLight(this.light.ambient, 1);
    this.scene.add(light);

    this.guiDirs.light.addColor(this.light, 'ambient').onChange(color => {
      light.color = hexToRgbTreeJs(color);
    });
  }

  // SPOT LIGHT ==============================
  addSpotLight() {
    const light = new THREE.SpotLight(this.light.spot, 1, 1000);
    light.position.set(0, 27, 0);
    light.castShadow = true;
    this.scene.add(light);

    this.guiDirs.light.addColor(this.light, 'spot').onChange(color => {
      light.color = hexToRgbTreeJs(color);
    });
  }

  // RECT LIGHT =================================
  addRectLight() {
    const light = new THREE.RectAreaLight(this.light.rect, 1, 2000, 2000);
    light.position.set(5, 50, 50);
    light.lookAt(0, 0, 0);
    this.scene.add(light);

    this.guiDirs.light.addColor(this.light, 'rect').onChange(color => {
      light.color = hexToRgbTreeJs(color);
    });
  }

  // POINT LIGHT =================================
  addPointLight(color, position) {
    const light = new THREE.PointLight(color, 1, 1000, 1);
    light.position.set(position.x, position.y, position.z);

    this.scene.add(light);
  }

  // FLOOR =======================================
  addFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.ShadowMaterial({ opacity: 0.3 });

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.position.y = 0;
    this.floor.rotateX(-Math.PI / 2);
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  addPostProcessing() {
    // Post-processing inits
    this.composer = new EffectComposer(this.renderer);

    // render pass
    const renderPass = new RenderPass(this.scene, this.camera);

    const renderTargetParameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false
    };

    // save pass
    const savePass = new SavePass(
      new THREE.WebGLRenderTarget(
        this.width,
        this.height,
        renderTargetParameters
      )
    );

    // blend pass
    const blendPass = new ShaderPass(BlendShader, 'tDiffuse1');
    blendPass.uniforms['tDiffuse2'].value = savePass.renderTarget.texture;
    blendPass.uniforms['mixRatio'].value = 0.5;

    // output pass
    const outputPass = new ShaderPass(CopyShader);
    outputPass.renderToScreen = true;

    // adding passes to composer
    this.composer.addPass(renderPass);
    this.composer.addPass(blendPass);
    this.composer.addPass(savePass);
    this.composer.addPass(outputPass);
  }

  // RANDOM GEOMETRY ===========================
  getRandomGeometry() {
    return this.geometries[
      Math.floor(Math.random() * Math.floor(this.geometries.length))
    ];
  }

  // FULLSCREEN GRID ==============================
  setGrid() {
    // get the number of grid elements throught the screen size
    this.grid.cols = Math.floor(
      visibleWidthAtZDepth(this.depth, this.camera) / this.gutter.size
    );
    this.grid.rows = Math.floor(
      visibleHeightAtZDepth(this.depth, this.camera) / this.gutter.size
    );
  }

  // CREATE GRID ===========================
  createGrid() {
    switch (this.grid.type) {
      case 1: {
        this.addCrossedGrid(this.material);
        break;
      }
      case 2: {
        this.addNormalGrid(this.material);
        break;
      }
      default: {
        this.addNormalGrid(this.material);
        break;
      }
    }

    this.scene.add(this.groupMesh);
  }

  // GRID TYPE CROSSED ===========================
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
  }

  // GRID TYPE NORMAL ==============================
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
      (this.grid.rows - 1 + (this.grid.rows - 1) * this.gutter.size) / 2;

    this.groupMesh.position.set(-centerX, 0, -centerZ);
  }

  // REMOVE GRID =======================================
  removeGrid() {
    // remove Mesh group from the scene
    this.scene.remove(this.groupMesh);

    // null the Mesh group
    this.groupMesh = null;

    // new instance of Mesh group
    this.groupMesh = new THREE.Object3D();
  }

  // GET TOTAL COLS =======================================
  getTotalCols(col) {
    // return a difrent value every 2 steps
    return col % 2 === 0 ? this.grid.cols : this.grid.cols - 1;
  }

  // GET MESH =============================================
  getMesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  // GET MATERIAL ========================================
  addMaterialGUI() {
    this.guiDirs.mesh.add(this.matParams, 'transparent', 0, 1).onChange(val => {
      this.material.transparent = val;
    });
    this.guiDirs.mesh.add(this.matParams, 'opacity', 0, 1).onChange(val => {
      this.material.opacity = val;
    });
    this.guiDirs.mesh.addColor(this.matParams, 'color').onChange(color => {
      this.material.color = hexToRgbTreeJs(color);
    });
    this.guiDirs.mesh.add(this.matParams, 'metalness', 0, 1).onChange(val => {
      this.material.metalness = val;
    });
    this.guiDirs.mesh.add(this.matParams, 'roughness', 0, 1).onChange(val => {
      this.material.roughness = val;
    });
    this.guiDirs.mesh
      .add(this.matParams, 'reflectivity', 0, 1)
      .onChange(val => {
        this.material.reflectivity = val;
      });
  }

  // DRAW OBJECTS =====================================
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
          gsap.to(mesh.position, {
            duration: 0.3,
            y: y < 1 ? 1 : y
          });

          // create a scale factor based on the mesh.position.y
          // increase value = decreases scale height
          const scaleFactor = mesh.position.y / 1.5;

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

  // INIT ======================================
  init() {
    this.setup();
    this.createScene();
    this.createCamera();
    this.setGrid();
    this.createGrid();
    this.addFloor();
    this.addPostProcessing();
    this.addMaterialGUI();

    this.addAmbientLight();
    //this.addSpotLight();
    //this.addRectLight();
    //this.addPointLight('#fff000', { x: 0, y: 10, z: -100 });
    //this.addPointLight('#fff000', { x: 100, y: 10, z: 0 });
    //this.addPointLight('#00ff00', { x: 20, y: 5, z: 20 });

    //this.addBgAnimation();

    this.animate();

    // we call a debounce function  before the onResize
    window.addEventListener(
      'resize',
      debounce(e => {
        this.onResize();
      }, 500)
    );
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.addEventListener(
      'touchmove',
      this.onTouchStartMove.bind(this),
      false
    );
    window.addEventListener(
      'touchstart',
      this.onTouchStartMove.bind(this),
      false
    );
    window.addEventListener('touchend', this.onTouchEnd.bind(this), false);

    // we call this to simulate the initial position of the mouse cursor
    this.onMouseMove({ clientX: 0, clientY: 0 });
  }

  onMouseMove({ clientX, clientY }) {
    this.mouse3D.x = (clientX / this.width) * 2 - 1;
    this.mouse3D.y = -(clientY / this.height) * 2 + 1;
  }

  onTouchStartMove(e) {
    this.mouse3D.x = (e.changedTouches[0].clientX / this.width) * 2 - 1;
    this.mouse3D.y = -(e.changedTouches[0].clientY / this.height) * 2 + 1;
  }

  onTouchEnd(e) {
    this.mouse3D.x = (0 / this.width) * 2 - 1;
    this.mouse3D.y = -(0 / this.height) * 2 + 1;
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.removeGrid();
    this.setGrid();
    this.createGrid();
  }

  animate() {
    this.draw();
    //this.renderer.render(this.scene, this.camera);
    this.composer.render();
    requestAnimationFrame(this.animate.bind(this));
  }
}
