const radians = (degrees) => {
	return (degrees * Math.PI) / 180;
};

const distance = (x1, y1, x2, y2) => {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

const map = (value, start1, stop1, start2, stop2) => {
	return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

const hexToRgbTreeJs = (hex) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	return result
		? {
				r: parseInt(result[1], 16) / 255,
				g: parseInt(result[2], 16) / 255,
				b: parseInt(result[3], 16) / 255
		  }
		: null;
};

const visibleHeightAtZDepth = (depth, camera) => {
	// compensate for cameras not positioned at z=0
	const cameraOffset = camera.position.z;
	if (depth < cameraOffset) depth -= cameraOffset;
	else depth += cameraOffset;

	// vertical fov in radians
	const vFOV = (camera.fov * Math.PI) / 180;

	// Math.abs to ensure the result is always positive
	return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
};

const visibleWidthAtZDepth = (depth, camera) => {
	const height = visibleHeightAtZDepth(depth, camera);
	return height * camera.aspect;
};

export {
	radians,
	distance,
	map,
	hexToRgbTreeJs,
	visibleHeightAtZDepth,
	visibleWidthAtZDepth
};
