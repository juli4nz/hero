import RoundedBoxGeometry from '../vendor/roundedBox';
import * as THREE from 'three';

export default class Box {
	constructor() {
		this.geom = new RoundedBoxGeometry(0.5, 0.5, 0.5, 0.02, 0.2);
		this.rotationX = 0;
		this.rotationY = 0;
		this.rotationZ = 0;
	}
}
