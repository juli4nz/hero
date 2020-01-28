import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

export default class Letters {
	constructor() {
		this.setup();
		this.isolatePaths();
		this.centerGroup();
	}

	setup() {
		// Get SVG markup from DOM
		const svgMarkup = document.querySelector('svg#dima').outerHTML;

		// Get SVG Data
		const loader = new SVGLoader();
		this.svgData = loader.parse(svgMarkup);

		// Create Group
		this.svgGroup = new THREE.Group();

		// When importing SVGs paths are inverted on Y axis
		// it happens in the process of mapping from 2d to 3d coordinate system
		this.svgGroup.scale.y *= -1;

		// Create Material
		this.material = new THREE.MeshNormalMaterial();

		// Geometries
		this.geometries = [];
		this.shapes = [];
	}

	isolatePaths() {
		// Loop through all of the parsed paths
		this.svgData.paths.forEach((path, i) => {
			const shapes = path.toShapes(true);

			// Each path has array of shapes
			shapes.forEach((shape, j) => {
				// Extrude shape
				const geometry = new THREE.ExtrudeBufferGeometry(shape, {
					depth: 20,
					steps: 2,
					bevelEnabled: true
				});

				this.geometries.push(geometry);
				this.shapes.push(shape);

				// Create a mesh and add it to the group
				const mesh = new THREE.Mesh(geometry, this.material);

				this.svgGroup.add(mesh);
			});
		});
	}

	centerGroup() {
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
	}

	getGroup() {
		return this.svgGroup;
	}

	getGeometries() {
		return this.geometries;
	}

	getShapes() {
		return this.shapes;
	}
}
