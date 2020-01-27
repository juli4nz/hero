import { ExtrudeBufferGeometry } from "three";
import Letters from "./letters";
import { radians } from "../helpers";

export default class D {
  constructor() {
    const letters = new Letters();
    const letters_shapes = letters.getShapes();
    const letter = letters_shapes[4];
    const extrudeSettings = {
      depth: 20,
      bevelEnabled: false
    };
    this.geom = new ExtrudeBufferGeometry(letter, extrudeSettings);
    this.geom.translate(0, 0, 0);
    this.geom.scale(0.5, 0.5, 0.5);
    this.rotationX = radians(90);
    this.rotationY = 0;
    this.rotationZ = 0;
  }
}
