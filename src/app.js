import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {} from "./utils.js";
import { Arwing, BeaconLine, loadArwing, loadBackground } from "./world.js";

let canvas,
  camera,
  raycaster,
  mouse,
  clock,
  controls,
  scene,
  arwing,
  beaconLines,
  mixer,
  renderer;

async function main() {
  //Ammo = await AmmoInit();
  await init();
  update();
}
main();

async function init() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(
    20,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );

  camera.position.set(12, 35, -650);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x67bae0);
  //scene.fog = new THREE.FogExp2(0xffffff, 0.5);
  scene.add(camera);

  // light
  const hemiLight = new THREE.HemisphereLight(0x555555, 0x444444, 0.6);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-100, 1000, -800);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // load models
  loadBackground(scene);
  const obj = await loadArwing(scene, mixer);
  arwing = new Arwing(obj, camera);

  beaconLines = new BeaconLine();
  scene.add(beaconLines.lines);

  // renderer
  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = true;
  renderer.shadowMap.type = renderer.setPixelRatio(window.devicePixelRatio); //THREE.BasicShadowMap; //THREE.VSMShadowMap; //THREE.BasicShadowMap; //THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 10, 0);

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  canvas = renderer.domElement;
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", onMouseClick);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick(event) {
  console.dir(camera);
  doAction = true;
}

async function update() {
  const delta = clock.getDelta();
  controls.update();

  beaconLines.update(camera, 2);

  arwing.update();
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  if (mixer) {
    mixer.update(delta);
  }
  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    const intersected = intersects[intersects.length - 1].object;
  }

  renderer.render(scene, camera);
  renderer.shadowMap.needsUpdate = false;
  requestAnimationFrame(update);
}

function onKeyDown(event) {
  arwing.onKeyDown(event);
}

function onKeyUp(event) {
  arwing.onKeyUp(event);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
