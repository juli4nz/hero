import './styles.css';

function component() {
	const element = document.createElement('div');

	element.innerHTML = 'Hello Hero';
	element.classList.add('hello');

	return element;
}

document.body.appendChild(component());
