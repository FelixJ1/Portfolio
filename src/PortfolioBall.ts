import * as THREE from 'three';
import {
  buildEdgeNeighbors,
  buildFootballFaces,
  faceToGeometry,
  type FaceType,
  type FootballFace,
} from './truncatedIcosahedron';

const CAM_DIR = new THREE.Vector3(0, 0, 1);

const PANEL_COLORS: Record<FaceType, number> = {
  pentagon: 0x101012,
  hexagon: 0xf5f5f0,
};

export type FaceArrow = {
  edgeIndex: number;
  neighborId: number;
  x: number;
  y: number;
  angle: number;
};

export type ContentBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PortfolioBallCallbacks = {
  onFrontFaceChange?: (faceId: number) => void;
  onAnimatingChange?: (animating: boolean) => void;
  onIntroComplete?: () => void;
};

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function createGrassTexture(width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Mowing stripes
  const stripes = 10;
  const stripeW = width / stripes;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#0d3a0a' : '#114510';
    ctx.fillRect(i * stripeW, 0, stripeW + 1, height);
  }

  // Blades: short, slightly angled strokes in varied greens
  const greens = ['#0a2f08', '#155214', '#1a6018', '#0f3f0d'];
  ctx.lineCap = 'round';
  const bladeCount = Math.floor((width * height) / 90);
  for (let i = 0; i < bladeCount; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = 4 + Math.random() * 7;
    const lean = (Math.random() - 0.5) * 3;
    ctx.strokeStyle = greens[(Math.random() * greens.length) | 0];
    ctx.globalAlpha = 0.35 + Math.random() * 0.4;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + lean, y - len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Soft vignette so the ball stands out
  const g = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.25,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class PortfolioBall {
  private readonly container: HTMLDivElement;
  private readonly onFrontFaceChange?: (faceId: number) => void;
  private readonly onAnimatingChange?: (animating: boolean) => void;
  private readonly onIntroComplete?: () => void;
  private readonly radius = 3;

  private readonly faces: FootballFace[];
  private readonly edgeNeighbors: number[][];
  private readonly faceMeshes: THREE.Mesh[] = [];

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private ballGroup!: THREE.Group;
  private resizeHandler!: () => void;

  private disposeMaterial(
  material: THREE.Material | THREE.Material[],
): void {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
  } else {
    material.dispose();
  }
}

  private introAnim: {
    startZ: number;
    endZ: number;
    startTime: number;
    duration: number;
  } | null = null;

  private animation: {
    startQuat: THREE.Quaternion;
    endQuat: THREE.Quaternion;
    startTime: number;
    duration: number;
    targetFaceId: number;
  } | null = null;

  private disposed = false;
  private animationFrameId: number | null = null;

  public animating = false;
  private currentFaceId = 0;

  public constructor(
    container: HTMLDivElement,
    callbacks: PortfolioBallCallbacks = {},
  ) {
    this.container = container;
    this.onFrontFaceChange = callbacks.onFrontFaceChange;
    this.onAnimatingChange = callbacks.onAnimatingChange;
    this.onIntroComplete = callbacks.onIntroComplete;

    this.faces = buildFootballFaces(this.radius);
    this.edgeNeighbors = buildEdgeNeighbors(this.faces);

    this.initScene();
    this.buildBall();
    this.bindResize();
    this.startIntroZoom();

    this.tick = this.tick.bind(this);
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  private getBaseZ(): number {
    const DESKTOP_Z = 5.5;
    const MOBILE_Z = 4.5
    const aspect = this.container.clientWidth / this.container.clientHeight;
    // Landscape or square: keep the desktop distance.
    // Portrait: scale distance up as the screen gets narrower.
    return aspect >= 1 ? DESKTOP_Z : MOBILE_Z / aspect;
  }

  private initScene(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = createGrassTexture(width, height);

    this.camera = new THREE.PerspectiveCamera(
      35,
      width / height,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(5, 8, 10);
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
    fillLight.position.set(-6, -4, -8);
    this.scene.add(fillLight);

    this.ballGroup = new THREE.Group();
    this.scene.add(this.ballGroup);
  }

  private startIntroZoom(): void {
    this.introAnim = {
      startZ: this.getBaseZ() * 2.7,
      endZ: this.getBaseZ(),
      startTime: performance.now(),
      duration: 1600,
    };
  }

  private buildBall(): void {
    this.faces.forEach((face) => {
      const geometry = faceToGeometry(face);
      const material = new THREE.MeshStandardMaterial({
        color: PANEL_COLORS[face.type],
        roughness: 0.75,
        metalness: 0.02,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.faceId = face.id;
      this.ballGroup.add(mesh);
      this.faceMeshes.push(mesh);
    });

    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
      this.faces[0].normal.clone().normalize(),
      CAM_DIR,
    );

    this.ballGroup.quaternion.copy(targetQuaternion);
    this.currentFaceId = 0;
  }

  public getFrontFaceId(): number {
    return this.currentFaceId;
  }

  public getFaceType(faceId: number): FaceType {
    return this.faces[faceId].type;
  }

  private projectToScreen(worldPoint: THREE.Vector3): {
    x: number;
    y: number;
  } {
    const point = worldPoint.clone().applyQuaternion(this.ballGroup.quaternion);
    point.project(this.camera);

    return {
      x: (point.x + 1) / 2,
      y: (1 - point.y) / 2,
    };
  }

  public getFaceEdgeArrows(faceId: number): FaceArrow[] {
    const face = this.faces[faceId];
    const centroidScreen = this.projectToScreen(face.centroid);
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const arrows: FaceArrow[] = [];

    for (let i = 0; i < face.points.length; i += 1) {
      const neighborId = this.edgeNeighbors[faceId][i];
      if (neighborId < 0) continue;

      const a = face.points[i];
      const b = face.points[(i + 1) % face.points.length];
      const midpoint = a.clone().add(b).multiplyScalar(0.5);
      const midpointScreen = this.projectToScreen(midpoint);

      const dxPx = (midpointScreen.x - centroidScreen.x) * width;
      const dyPx = (midpointScreen.y - centroidScreen.y) * height;
      const angle = (Math.atan2(dyPx, dxPx) * 180) / Math.PI;
      const inset = 0.95;

      arrows.push({
        edgeIndex: i,
        neighborId,
        x: centroidScreen.x + (dxPx * inset) / width,
        y: centroidScreen.y + (dyPx * inset) / height,
        angle,
      });
    }

    return arrows;
  }

  public getFaceContentBox(faceId: number): ContentBox {
    const face = this.faces[faceId];
    const centroidScreen = this.projectToScreen(face.centroid);
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    let totalDistancePx = 0;

    for (let i = 0; i < face.points.length; i += 1) {
      const a = face.points[i];
      const b = face.points[(i + 1) % face.points.length];
      const midpoint = a.clone().add(b).multiplyScalar(0.5);
      const midpointScreen = this.projectToScreen(midpoint);

      const dxPx = (midpointScreen.x - centroidScreen.x) * width;
      const dyPx = (midpointScreen.y - centroidScreen.y) * height;
      totalDistancePx += Math.hypot(dxPx, dyPx);
    }

    const apothemPx = totalDistancePx / face.points.length;
    const sizePx = apothemPx * 2 * 0.6;

    const boxWidth = sizePx / width;
    const boxHeight = sizePx / height;

    return {
      left: centroidScreen.x - boxWidth / 2,
      top: centroidScreen.y - boxHeight / 2,
      width: boxWidth,
      height: boxHeight,
    };
  }

  public rotateToFace(targetFaceId: number): void {
    if (this.animating) return;

    if (targetFaceId === this.currentFaceId) {
      this.onFrontFaceChange?.(this.currentFaceId);
      return;
    }

    const targetFace = this.faces[targetFaceId];
    if (!targetFace) return;

    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
      targetFace.normal.clone().normalize(),
      CAM_DIR,
    );

    this.animation = {
      startQuat: this.ballGroup.quaternion.clone(),
      endQuat: targetQuaternion,
      startTime: performance.now(),
      duration: 900,
      targetFaceId,
    };

    this.animating = true;
    this.onAnimatingChange?.(true);
  }

  private tick(now: number): void {
    if (this.disposed) return;

    if (this.introAnim) {
      const elapsed = now - this.introAnim.startTime;
      const t = Math.min(1, elapsed / this.introAnim.duration);
      const eased = easeInOutCubic(t);

      this.camera.position.z = THREE.MathUtils.lerp(
        this.introAnim.startZ,
        this.introAnim.endZ,
        eased,
      );

      if (t >= 1) {
        this.introAnim = null;
        this.onIntroComplete?.();
      }
    }

    if (this.animation) {
      const elapsed = now - this.animation.startTime;
      const t = Math.min(1, elapsed / this.animation.duration);
      const eased = easeInOutCubic(t);

      this.ballGroup.quaternion.slerpQuaternions(
        this.animation.startQuat,
        this.animation.endQuat,
        eased,
      );

      if (t >= 1) {
        this.currentFaceId = this.animation.targetFaceId;
        this.animation = null;
        this.animating = false;
        this.onAnimatingChange?.(false);
        this.onFrontFaceChange?.(this.currentFaceId);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  private bindResize(): void {
    this.resizeHandler = () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('resize', this.resizeHandler);
  }

  public dispose(): void {
    this.disposed = true;

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.resizeHandler);

    this.faceMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      this.disposeMaterial(mesh.material);
    });

    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}