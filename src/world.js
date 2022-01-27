import * as THREE from "three";
import { Vector3, MathUtils } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
const loadBackground = (scene) => {
  const texture = new THREE.TextureLoader().load("textures/corneria.png");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 1);

  const material = new THREE.MeshStandardMaterial({ map: texture });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(5120, 512), material);
  plane.material.side = THREE.DoubleSide;
  plane.position.set(0, 0, 400);
  scene.add(plane);
};

const loadArwing = (scene, mixer) =>
  new Promise((done) => {
    console.log("loading arwing...");
    const loader = new FBXLoader();
    loader.load("models/Starfox.fbx", function (object) {
      mixer = new THREE.AnimationMixer(object);

      const action = mixer.clipAction(object.animations[0]);
      action.play();

      object.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      object.receiveShadow = true;
      object.scale.set(0.2, 0.2, 0.2);
      scene.add(object);
      console.log("loaded arwing!");
      done(object);
    });
  });

class Arwing {
  constructor(object) {
    this.obj = object;
    this.speed = 1;
    //direction
    //d->dive
    //c->climb
    //sl->straff left
    //sr->straff right
    this.dir = { d: false, c: false, sl: false, sr: false };
    //speeds
    this.cs = 1.2;
    this.ds = 1.5;
    this.ss = 1.0;
    this.acc = 0;
  }

  get climbSpeed() {
    return this.cs * this.acc;
  }

  get diveSpeed() {
    return this.ds * this.acc;
  }

  get straffSpeed() {
    return this.ss * this.acc;
  }

  onKeyDown(event) {
    //console.log(event.code);
    switch (event.code) {
      case "ArrowUp":
        this.dir.d = true;
        break;
      case "ArrowDown":
        this.dir.c = true;
        break;
      case "ArrowLeft":
        this.dir.sl = true;
        break;
      case "ArrowRight":
        this.dir.sr = true;
        break;
    }
  }

  cutMove(func) {
    setTimeout(func.bind(this), 60);
  }

  onKeyUp(event) {
    switch (event.code) {
      case "ArrowUp":
        this.cutMove(() => {
          this.dir.d = false;
        });
        break;
      case "ArrowDown":
        this.cutMove(() => {
          this.dir.c = false;
        });
        break;
      case "ArrowLeft":
        this.cutMove(() => {
          this.dir.sl = false;
        });
        break;
      case "ArrowRight":
        this.cutMove(() => {
          this.dir.sr = false;
        });
        break;
    }

    //console.dir(this.obj.position);
  }

  update(delta) {
    if (!this.dir.d && !this.dir.c && !this.dir.sl && !this.dir.sr) {
      const newAcc = this.acc - 0.1;
      this.acc = MathUtils.clamp(newAcc, 0, 1);
      this.obj.lookAt(-this.obj.position.x, this.acc, 1000);
    } else {
      const newAcc = this.acc + 0.05;
      this.acc = MathUtils.clamp(newAcc, 0, 2);
    }
    if (this.dir.d) {
      const newY = this.obj.position.y - this.diveSpeed;
      this.obj.position.y = MathUtils.clamp(newY, -110, 133);
      this.obj.lookAt(-this.obj.position.x, -100 * this.acc, 1000);
    }
    if (this.dir.c) {
      const newY = this.obj.position.y + this.climbSpeed;
      this.obj.position.y = MathUtils.clamp(newY, -110, 133);
      this.obj.lookAt(-this.obj.position.x, 100 * this.acc, 1000);
    }
    const myAxis = new THREE.Vector3(0, 0, 1);
    if (this.dir.sl) {
      const newX = this.obj.position.x + this.straffSpeed;
      this.obj.position.x = MathUtils.clamp(newX, -270, 270);

      this.obj.lookAt(0, this.acc, 1000);
      this.obj.rotateOnWorldAxis(myAxis, MathUtils.degToRad(-25 * this.acc));
    }
    if (this.dir.sr) {
      const newX = this.obj.position.x - this.straffSpeed;
      this.obj.position.x = MathUtils.clamp(newX, -270, 270);
      this.obj.lookAt(0, this.acc, 1000);
      this.obj.rotateOnWorldAxis(myAxis, MathUtils.degToRad(25 * this.acc));
    }
  }
}
export { Arwing, loadArwing, loadBackground };
