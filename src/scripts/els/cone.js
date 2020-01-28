import { radians } from '../helpers';
import { ConeBufferGeometry } from 'three';

export default class Cone {
	constructor() {
		this.geom = new ConeBufferGeometry(0.3, 0.5, 32);
		this.rotationX = 0;
		this.rotationY = 0;
		this.rotationZ = radians(-180);
	}
}
