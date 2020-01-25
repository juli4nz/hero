function component() {
  const element = document.createElement("div");

  element.innerHTML = "Hello Hero";

  return element;
}

document.body.appendChild(component());
