import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

export default class Letters {
	constructor() {
		// Get SVG markup from DOM
		const svgMarkup = document.querySelector('svg').outerHTML;

		// SVG Loader is not a part of the main three.js bundle
		// we need to load it by hand from:
		// https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/SVGLoader.js
		const loader = new SVGLoader();
		this.svgData = loader.parse(svgMarkup);

		// Group we'll use for all SVG paths
		//this.svgGroup = new THREE.Group();

		// When importing SVGs paths are inverted on Y axis
		// it happens in the process of mapping from 2d to 3d coordinate system
		//this.svgGroup.scale.y *= -1;

		this.geometries = [];

		//this.material = new THREE.MeshNormalMaterial();

		this.geoDepth = 40;
	}

	getGeometries() {
		// Loop through all of the parsed paths
		this.svgData.paths.forEach((path, i) => {
			const shapes = path.toShapes(true);

			// Each path has array of shapes
			shapes.forEach((shape, j) => {
				// Finally we can take each shape and extrude it
				const geometry = new THREE.ExtrudeGeometry(shape, {
					depth: this.geoDepth,
					bevelEnabled: false
				});

				// Create a mesh and add it to the group
				//const mesh = new THREE.Mesh(geometry, this.material);

				//this.svgGroup.add(mesh);

				//this.svgGroup.add(geometry);
				this.geometries.push(geometry);
			});
		});

		return this.geometries;
	}

	foo() {
		// Meshes we got are all relative to themselves
		// meaning they have position set to (0, 0, 0)
		// which makes centering them in the group easy

		// Get group's size
		const box = new THREE.Box3().setFromObject(this.svgGroup);
		const size = new THREE.Vector3();
		box.getSize(size);

		const yOffset = size.y / -2;
		const xOffset = size.x / -2;

		// Offset all of group's elements, to center them
		this.svgGroup.children.forEach((item) => {
			item.position.x = xOffset;
			item.position.y = yOffset;
		});

		// Finally we add svg group to the scene
		scene.add(svgGroup);
	}
}
