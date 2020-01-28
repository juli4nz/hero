import { ExtrudeBufferGeometry } from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { radians } from '../helpers';

export default class Letter {
	constructor(id) {
		this.markup = document.querySelector(id).outerHTML;
		this.extArgs = {
			depth: 20,
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

		if (paths.length > 1) {
			this.geometry = [];
			for (let i = 0; i < paths.length; i++) {
				let path = paths[i];
				let shapes = path.toShapes(true);

				for (let j = 0; j < shapes.length; j++) {
					let shape = shapes[j];
					this.geometry.push(new ExtrudeBufferGeometry(shape, this.extArgs));
				}
			}
		} else {
			let path = paths[0];
			let shapes = path.toShapes(true);
			let shape = shapes[0];
			this.geometry = new ExtrudeBufferGeometry(shape, this.extArgs);
		}

		return this.geometry;
	}
}
