import { ExtrudeBufferGeometry } from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { radians } from "../helpers";

export default class Letter {
  constructor(id, size, depth) {
    this.markup = document.querySelector(id).outerHTML;
    this.size = !isNaN(size) ? size : 0.005;
    this.depth = !isNaN(depth) ? depth : 50;
    this.extArgs = {
      depth: this.depth,
      steps: 2,
      bevelEnabled: true
    };
    this.rotationX = radians(90);
    this.rotationY = 0;
    this.rotationZ = 0;

    this.geom = this.getGeom();
  }

  getGeom() {
    const loader = new SVGLoader();
    this.data = loader.parse(this.markup);
    const paths = this.data.paths;
    let geometry = null;

    if (paths.length > 1) {
      console.log("SVG file has multiple paths!");
      /* TODO: Fix it
      this.geometries = [];
      for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        let shapes = path.toShapes(true);

        for (let j = 0; j < shapes.length; j++) {
          let shape = shapes[j];
          const geometry = new ExtrudeBufferGeometry(shape, this.extArgs);
          geometry.scale(0.01, 0.01, 0.01);
          geometry.center();
          this.geometries.push(geometry);
        }
	  }
	  */
    } else {
      let path = paths[0];
      let shapes = path.toShapes(true);
      let shape = shapes[0];
      geometry = new ExtrudeBufferGeometry(shape, this.extArgs);
      geometry.scale(this.size, this.size, this.size);
      geometry.center();
    }

    return geometry;
  }
}
