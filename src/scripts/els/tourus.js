import { radians } from '../helpers';
import * as THREE from 'three';

export default class Tourus {
	constructor() {
		this.geom = new THREE.TorusBufferGeometry(0.3, 0.12, 30, 200);
		this.rotationX = radians(90);
		this.rotationY = 0;
		this.rotationZ = 0;
	}
}
