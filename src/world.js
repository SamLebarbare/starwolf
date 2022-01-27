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
  return plane;
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

class BeaconLine {
  constructor() {
    this.lines = new THREE.Group();

    const geometry = new THREE.SphereGeometry(1, 3, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 2000; i += 100) {
      const aa = new THREE.Mesh(geometry, material);
      aa.position.x = -250;
      aa.position.z = i;

      const a = new THREE.Mesh(geometry, material);
      a.position.x = -120;
      a.position.z = i;
      const b = new THREE.Mesh(geometry, material);
      b.position.x = -35;
      b.position.z = i;
      const c = new THREE.Mesh(geometry, material);
      c.position.x = 35;
      c.position.z = i;

      const d = new THREE.Mesh(geometry, material);
      d.position.x = 120;
      d.position.z = i;

      const dd = new THREE.Mesh(geometry, material);
      dd.position.x = 250;
      dd.position.z = i;

      this.lines.add(aa);
      this.lines.add(a);
      this.lines.add(b);
      this.lines.add(c);
      this.lines.add(d);
      this.lines.add(dd);
    }

    return this;
  }

  update(cam, speed) {
    if (this.lines.position.z < -500) {
      this.lines.position.z = 0;
    }
    speed = MathUtils.clamp((cam.position.y / 10) * speed, 1, 3);
    this.lines.position.y = MathUtils.clamp(cam.position.y * 2, -300, -120);
    this.lines.position.z = this.lines.position.z - speed;
  }
}

class Arwing {
  constructor(object, cam) {
    this.obj = object;
    this.cam = cam;
    this.speed = 1;
    //direction
    //d->dive
    //c->climb
    //sl->straff left
    //sr->straff right
    this.dir = { d: false, c: false, sl: false, sr: false };
    //speeds
    this.cs = 1;
    this.ds = 1.3;
    this.ss = 1;
    this.acc = 0;
    this.turn = 0;
    this.climb = 0;
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
    return setTimeout(func.bind(this), 50);
  }

  onKeyUp(event) {
    if (this.abortMove) {
      clearTimeout(this.abortMove);
    }
    switch (event.code) {
      case "ArrowUp":
        this.abortMove = this.cutMove(() => {
          this.dir.d = false;
        });
        break;
      case "ArrowDown":
        this.abortMove = this.cutMove(() => {
          this.dir.c = false;
        });
        break;
      case "ArrowLeft":
        this.abortMove = this.cutMove(() => {
          this.dir.sl = false;
        });
        break;
      case "ArrowRight":
        this.abortMove = this.cutMove(() => {
          this.dir.sr = false;
        });
        break;
    }

    //console.dir(this.obj.position);
  }

  update(delta) {
    if (!this.dir.d && !this.dir.c && !this.dir.sl && !this.dir.sr) {
      const newAcc = this.acc - 0.005;
      this.acc = MathUtils.clamp(newAcc, 0, 2);
    } else {
      const newAcc = this.acc + 0.05;
      this.acc = MathUtils.clamp(newAcc, 0, 2);
    }

    this.obj.position.z = this.acc * -10;

    //Y AXIS: climb
    if (this.dir.d) {
      const newClimb = this.climb - this.diveSpeed;
      this.climb = MathUtils.clamp(newClimb, -1, 1);
    } else if (this.dir.c) {
      const newClimb = this.climb + this.climbSpeed;
      this.climb = MathUtils.clamp(newClimb, -1, 1);
    } else {
      if (this.climb < 0) {
        const newClimb = this.climb + 0.01;
        this.climb = MathUtils.clamp(newClimb, -1, 0);
      } else {
        const newClimb = this.climb - 0.01;
        this.climb = MathUtils.clamp(newClimb, 0, 1);
      }
    }

    const newY = this.obj.position.y + this.climb;
    this.obj.position.y = MathUtils.clamp(newY, -100, 133);
    const newY2 = this.cam.position.y + this.climb * -1;
    this.cam.position.y = MathUtils.clamp(newY2, -90, 90);

    //X AXIS: turn
    const myAxis = new THREE.Vector3(0, 0, 1);
    if (this.dir.sl) {
      const newTurn = this.turn + 0.1;
      this.turn = MathUtils.clamp(newTurn, -1, 1);
    } else if (this.dir.sr) {
      const newTurn = this.turn - 0.1;
      this.turn = MathUtils.clamp(newTurn, -1, 1);
    } else {
      if (this.turn < 0) {
        const newTurn = this.turn + 0.01;
        this.turn = MathUtils.clamp(newTurn, -1, 0);
      } else {
        const newTurn = this.turn - 0.01;
        this.turn = MathUtils.clamp(newTurn, 0, 1);
      }
    }

    const newX = this.obj.position.x + this.turn * this.straffSpeed;
    this.obj.position.x = MathUtils.clamp(newX, -200, 200);
    this.obj.lookAt(-this.obj.position.x, this.climb * 100, 1000);
    this.obj.rotateOnWorldAxis(myAxis, MathUtils.degToRad(this.turn * -45));
    this.cam.lookAt(0, 0, 0);
    this.cam.rotateOnWorldAxis(myAxis, MathUtils.degToRad(this.turn * 2));
  }
}
export { Arwing, BeaconLine, loadArwing, loadBackground };
