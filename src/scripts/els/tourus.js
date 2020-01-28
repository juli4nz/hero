import { radians } from '../helpers';
import { TorusBufferGeometry } from 'three';

export default class Tourus {
	constructor() {
		this.geom = new TorusBufferGeometry(0.3, 0.12, 30, 200);
		this.rotationX = radians(90);
		this.rotationY = 0;
		this.rotationZ = 0;
	}
}
