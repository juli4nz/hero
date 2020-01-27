import "../styles/index.scss";
import * as THREE from "three";
import Letters from "./els/letters.js";
import { TweenMax, Expo } from "gsap/all";
import { radians, map, distance } from "./helpers";

export default class App {
  createScene() {
    this.group = new THREE.Group();

    this.scene = new THREE.Scene();

    this.ratio = window.innerWidth / window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(100, this.ratio, 0.01, 1000);
    this.camera.position.z = 300;

    // Resize and update camera
    window.addEventListener("resize", this.onResize.bind(this));
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  axesHelper() {
    // Axes helper
    const axesHelper = new THREE.AxesHelper(500);
    this.scene.add(axesHelper);
  }

  letters() {
    let lts = new Letters();
    this.group = lts.getGroup();
    this.scene.add(this.group);
  }

  animate() {
    this.renderer.render(this.scene, this.camera);
    // Rotate out group
    //this.svgGroup.rotation.y += 0.005;
    requestAnimationFrame(this.animate.bind(this));
  }

  init() {
    this.createScene();
    this.createCamera();
    //this.axesHelper();
    this.letters();
    this.animate();
  }
}
