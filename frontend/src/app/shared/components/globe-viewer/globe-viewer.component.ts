import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  OnDestroy,
  OnInit,
  viewChild,
  effect
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GlobeData } from '../../models/globe-data.model';
import { GeoLoaderService } from '../../services/geo-loader.service';
import { ThemeService } from '../../services/theme.service';
import { CountryFeature, GeoLod } from '../../models/geo-feature.model';
import { buildCountryMesh, buildCountryOutline, CountryMeshUserData } from '../../utils/country-polygon.util';
import { CameraFeedItem } from '../../models/camera-feed.model';
import { EarthquakeItem } from '../../models/earthquake.model';
import { WildfireItem } from '../../models/wildfire.model';
import { StormItem } from '../../models/storm.model';
import { AircraftItem } from '../../models/aircraft.model';
import { IssPosition } from '../../models/iss.model';
import { GdeltEvent } from '../../models/gdelt.model';

interface MarkerUserData {
  isoCode: string;
  name: string;
  baseSize: number;
  baseColor: THREE.Color;
  baseOpacity: number;
}

const LOD_OPACITY: Record<GeoLod, { outline: number; fill: number }> = {
  '110m': { outline: 0.4, fill: 0 },
  '50m': { outline: 0.5, fill: 0.25 },
  '10m': { outline: 0.65, fill: 0.4 }
};

@Component({
  selector: 'app-globe-viewer',
  imports: [],
  template: '<div #canvasContainer class="globe-container"></div>',
  styles: [`
    .globe-container {
      width: 100%;
      height: 100%;
      cursor: grab;
    }
    .globe-container:active {
      cursor: grabbing;
    }
  `]
})
export class GlobeViewerComponent implements OnInit, OnDestroy {
  readonly coordinates = input<GlobeData[]>([]);
  readonly selectedIsoCode = input<string | null>(null);
  readonly countrySelect = output<{ isoCode: string; name: string }>();

  readonly cameras = input<readonly CameraFeedItem[]>([]);
  readonly camerasVisible = input(false);
  readonly cameraOpacity = input(1);
  readonly cameraSelect = output<CameraFeedItem>();

  readonly earthquakes = input<readonly EarthquakeItem[]>([]);
  readonly earthquakesVisible = input(false);
  readonly earthquakeOpacity = input(1);
  readonly earthquakeSelect = output<EarthquakeItem>();

  readonly wildfires = input<readonly WildfireItem[]>([]);
  readonly wildfiresVisible = input(false);
  readonly wildfireOpacity = input(1);
  readonly wildfireSelect = output<WildfireItem>();

  readonly storms = input<readonly StormItem[]>([]);
  readonly stormsVisible = input(false);
  readonly stormOpacity = input(1);
  readonly stormSelect = output<StormItem>();

  readonly aircraft = input<readonly AircraftItem[]>([]);
  readonly aircraftVisible = input(false);
  readonly aircraftOpacity = input(1);
  readonly aircraftSelect = output<AircraftItem>();

  readonly issPosition = input<IssPosition | null>(null);
  readonly issTrail = input<readonly { lat: number; lng: number }[]>([]);
  readonly issVisible = input(false);
  readonly issOpacity = input(1);
  readonly issSelect = output<IssPosition>();

  readonly gdeltEvents = input<readonly GdeltEvent[]>([]);
  readonly gdeltVisible = input(false);
  readonly gdeltOpacity = input(1);
  readonly gdeltSelect = output<GdeltEvent>();

  readonly canvasContainer = viewChild.required<ElementRef<HTMLDivElement>>('canvasContainer');

  private readonly geoLoader = inject(GeoLoaderService);
  private readonly themeService = inject(ThemeService);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private earth!: THREE.Mesh;
  private earthShader: THREE.ShaderMaterial | null = null;
  private atmosphere!: THREE.Mesh;
  private atmosphereShader: THREE.ShaderMaterial | null = null;
  private stars: THREE.Points | null = null;
  private isPaused = false;
  private visibilityHandler: (() => void) | null = null;
  private markerGroup!: THREE.Group;
  private countryPolygonGroup!: THREE.Group;
  private countryOutlineGroup!: THREE.Group;
  private cameraGroup!: THREE.Group;
  private earthquakeGroup!: THREE.Group;
  private wildfireGroup!: THREE.Group;
  private stormGroup!: THREE.Group;
  private aircraftGroup!: THREE.Group;
  private issGroup!: THREE.Group;
  private issTrailLine: THREE.Line | null = null;
  private gdeltGroup!: THREE.Group;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private animationId: number | null = null;
  private flyAnimationId: number | null = null;
  private activeLod: GeoLod | null = null;
  private lodSwapInflight: GeoLod | null = null;

  constructor() {
    effect(() => {
      const coords = this.coordinates();
      if (coords.length > 0 && this.markerGroup) {
        this.addMarkers(coords);
        this.updateLod();
      }
    });
    effect(() => {
      const code = this.selectedIsoCode();
      if (code && this.markerGroup) {
        this.highlightCountry(code);
      } else if (this.markerGroup) {
        this.clearHighlight();
      }
    });
    effect(() => {
      const list = this.cameras();
      if (this.cameraGroup) this.rebuildCameras(list);
    });
    effect(() => {
      const visible = this.camerasVisible();
      if (this.cameraGroup) this.cameraGroup.visible = visible;
    });
    effect(() => {
      const opacity = this.cameraOpacity();
      if (this.cameraGroup) this.applyCameraOpacity(opacity);
    });
    effect(() => {
      const list = this.earthquakes();
      if (this.earthquakeGroup) this.rebuildEarthquakes(list);
    });
    effect(() => {
      const visible = this.earthquakesVisible();
      if (this.earthquakeGroup) this.earthquakeGroup.visible = visible;
    });
    effect(() => {
      const opacity = this.earthquakeOpacity();
      if (this.earthquakeGroup) this.applyEarthquakeOpacity(opacity);
    });
    effect(() => {
      const list = this.wildfires();
      if (this.wildfireGroup) this.rebuildWildfires(list);
    });
    effect(() => {
      const visible = this.wildfiresVisible();
      if (this.wildfireGroup) this.wildfireGroup.visible = visible;
    });
    effect(() => {
      const opacity = this.wildfireOpacity();
      if (this.wildfireGroup) this.applyWildfireOpacity(opacity);
    });
    effect(() => {
      const list = this.storms();
      if (this.stormGroup) this.rebuildStorms(list);
    });
    effect(() => {
      const visible = this.stormsVisible();
      if (this.stormGroup) this.stormGroup.visible = visible;
    });
    effect(() => {
      const opacity = this.stormOpacity();
      if (this.stormGroup) this.applyStormOpacity(opacity);
    });
    effect(() => {
      const list = this.aircraft();
      if (this.aircraftGroup) this.rebuildAircraft(list);
    });
    effect(() => {
      const visible = this.aircraftVisible();
      if (this.aircraftGroup) this.aircraftGroup.visible = visible;
    });
    effect(() => {
      const opacity = this.aircraftOpacity();
      if (this.aircraftGroup) this.applyAircraftOpacity(opacity);
    });
    effect(() => {
      const pos = this.issPosition();
      const trail = this.issTrail();
      if (this.issGroup) this.rebuildIss(pos, trail);
    });
    effect(() => {
      const visible = this.issVisible();
      if (this.issGroup) this.issGroup.visible = visible;
    });
    effect(() => {
      const opacity = this.issOpacity();
      if (this.issGroup) this.applyIssOpacity(opacity);
    });
    effect(() => {
      const list = this.gdeltEvents();
      if (this.gdeltGroup) this.rebuildGdelt(list);
    });
    effect(() => {
      const visible = this.gdeltVisible();
      if (this.gdeltGroup) this.gdeltGroup.visible = visible;
    });
    effect(() => {
      const opacity = this.gdeltOpacity();
      if (this.gdeltGroup) this.applyGdeltOpacity(opacity);
    });
    effect(() => {
      const theme = this.themeService.theme();
      this.applyThemeToScene(theme);
    });
  }

  ngOnInit(): void {
    this.initScene();
    this.createStars();
    this.createEarth();
    this.createAtmosphere();
    void this.applyLod('110m');
    this.animate();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    if (this.flyAnimationId !== null) cancelAnimationFrame(this.flyAnimationId);
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.renderer?.dispose();
  }

  flyTo(lat: number, lng: number, distance = 2.0): void {
    if (!this.camera || !this.controls) return;

    this.controls.autoRotate = false;
    const targetPosition = this.latLngToVector3(lat, lng, distance);

    if (this.flyAnimationId !== null) cancelAnimationFrame(this.flyAnimationId);

    const startPosition = this.camera.position.clone();
    const startTime = performance.now();
    const duration = 900;

    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      this.controls.update();
      if (t < 1) {
        this.flyAnimationId = requestAnimationFrame(step);
      } else {
        this.flyAnimationId = null;
      }
    };

    this.flyAnimationId = requestAnimationFrame(step);
  }

  private initScene(): void {
    const container = this.canvasContainer().nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 3.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    // Cap pixel ratio at 2 — Retina/4K still look crisp, fragment cost stays sane.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(this.themeService.isDark() ? 0x050510 : 0xeaf1f8);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 1.3;
    this.controls.maxDistance = 8;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.enablePan = false;
    this.controls.addEventListener('change', () => this.updateLod());

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x4466ff, 0.3);
    backLight.position.set(-3, -1, -5);
    this.scene.add(backLight);

    this.markerGroup = new THREE.Group();
    this.countryPolygonGroup = new THREE.Group();
    this.countryOutlineGroup = new THREE.Group();
    this.cameraGroup = new THREE.Group();
    this.cameraGroup.visible = this.camerasVisible();
    this.earthquakeGroup = new THREE.Group();
    this.earthquakeGroup.visible = this.earthquakesVisible();
    this.wildfireGroup = new THREE.Group();
    this.wildfireGroup.visible = this.wildfiresVisible();
    this.stormGroup = new THREE.Group();
    this.stormGroup.visible = this.stormsVisible();
    this.aircraftGroup = new THREE.Group();
    this.aircraftGroup.visible = this.aircraftVisible();
    this.issGroup = new THREE.Group();
    this.issGroup.visible = this.issVisible();
    this.gdeltGroup = new THREE.Group();
    this.gdeltGroup.visible = this.gdeltVisible();
    this.scene.add(this.markerGroup);
    this.scene.add(this.countryPolygonGroup);
    this.scene.add(this.countryOutlineGroup);
    this.scene.add(this.cameraGroup);
    this.scene.add(this.earthquakeGroup);
    this.scene.add(this.wildfireGroup);
    this.scene.add(this.stormGroup);
    this.scene.add(this.aircraftGroup);
    this.scene.add(this.issGroup);
    this.scene.add(this.gdeltGroup);
  }

  private createStars(): void {
    const geometry = new THREE.BufferGeometry();
    const count = 6000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 200;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8
    });
    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  /**
   * Apply theme-driven changes to the renderer + scene without rebuilding meshes.
   * Called from a constructor effect() so any setTheme() flip propagates instantly.
   */
  private applyThemeToScene(theme: 'dark' | 'light'): void {
    const isDark = theme === 'dark';
    if (this.renderer) {
      this.renderer.setClearColor(isDark ? 0x050510 : 0xeaf1f8);
    }
    if (this.stars) {
      this.stars.visible = isDark;
    }
    if (this.earthShader) {
      this.earthShader.uniforms['themeMode'].value = isDark ? 1.0 : 0.0;
      this.earthShader.uniforms['bumpScale'].value = isDark ? 0.0 : 0.005;
      this.earthShader.uniformsNeedUpdate = true;
    }
    if (this.atmosphereShader) {
      const c = this.atmosphereShader.uniforms['glowColor'].value as THREE.Color;
      if (isDark) c.setRGB(0.3, 0.6, 1.0);
      else        c.setRGB(0.55, 0.78, 1.0);
    }
  }

  private createEarth(): void {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const fallbackMaterial = new THREE.MeshPhongMaterial({
      color: 0x1e5f8a,
      emissive: 0x0a2030,
      specular: 0x223344,
      shininess: 8
    });

    this.earth = new THREE.Mesh(geometry, fallbackMaterial);
    this.scene.add(this.earth);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'textures/earth-day.jpg',
      (dayTexture) => {
        textureLoader.load(
          'textures/earth-night.jpg',
          (nightTexture) => {
            const bumpTexture = dayTexture.clone();
            this.applyEarthShader(dayTexture, nightTexture, bumpTexture);
          },
          undefined,
          () => this.applyEarthShader(dayTexture, dayTexture, dayTexture)
        );
      },
      undefined,
      () => { /* fallback material already applied */ }
    );
  }

  private applyEarthShader(
    dayTexture: THREE.Texture,
    nightTexture: THREE.Texture,
    bumpTexture: THREE.Texture
  ): void {
    const isDark = this.themeService.isDark();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        bumpTexture: { value: bumpTexture },
        // Topographic relief is deliberately flat: we never want fake mountains
        // popping out of the sphere. Light mode keeps a token 0.005 for the
        // gentlest specular hint; dark mode is pure-flat for the satellite look.
        bumpScale: { value: isDark ? 0.0 : 0.005 },
        sunDirection: { value: new THREE.Vector3(1, 0.5, 0.5).normalize() },
        // 0 = day/night cycle (light), 1 = always-night satellite view (dark)
        themeMode: { value: isDark ? 1.0 : 0.0 }
      },
      vertexShader: `
        uniform sampler2D bumpTexture;
        uniform float bumpScale;
        varying vec2 vUv;
        varying vec3 vNormal;

        float getBump(vec2 uv) {
          if (bumpScale <= 0.0001) return 0.0;
          vec2 step = vec2(1.0 / 512.0, 0.0);
          float h = texture2D(bumpTexture, uv).r;
          float hx = texture2D(bumpTexture, uv + step).r;
          float hy = texture2D(bumpTexture, uv + step.yx).r;
          return (hx - h) * bumpScale * 10.0 + (hy - h) * bumpScale * 10.0;
        }

        void main() {
          vUv = uv;
          vec3 newPos = position + normal * getBump(uv);
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        uniform float themeMode;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec3 nightLightColor = vec3(1.0, 0.85, 0.6);

          if (themeMode > 0.5) {
            // Dark theme — uniform satellite-night view with city lights.
            // We render the night texture directly and boost city-light hotspots
            // so the cities glow regardless of the sun-facing hemisphere.
            float cityLight = max(nightColor.r, max(nightColor.g, nightColor.b));
            vec3 finalColor = nightColor.rgb * 0.65 + cityLight * nightLightColor * 0.7;
            gl_FragColor = vec4(finalColor, 1.0);
          } else {
            // Light theme — classic day/night terminator.
            vec3 normal = normalize(vNormal);
            float sunAngle = max(dot(normal, sunDirection), 0.0);
            vec3 litColor = mix(nightColor.rgb, dayColor.rgb, sunAngle);
            vec3 darkNight = mix(nightColor.rgb, dayColor.rgb * 0.05, smoothstep(0.0, 0.1, sunAngle));
            float nightBlend = smoothstep(0.0, 0.3, sunAngle);
            vec3 finalColor = mix(darkNight, litColor, nightBlend);
            float nightGlow = nightColor.r * 0.5;
            finalColor += nightGlow * nightLightColor * (1.0 - sunAngle) * 0.6;
            gl_FragColor = vec4(finalColor, 1.0);
          }
        }
      `
    });

    if (this.earth.material instanceof THREE.Material) {
      (this.earth.material as THREE.Material).dispose();
    }
    this.earth.material = material;
    this.earthShader = material;
  }

  private createAtmosphere(): void {
    const geometry = new THREE.SphereGeometry(1.02, 64, 64);
    const isDark = this.themeService.isDark();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: isDark ? new THREE.Color(0.3, 0.6, 1.0) : new THREE.Color(0.55, 0.78, 1.0) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    this.atmosphere = new THREE.Mesh(geometry, material);
    this.atmosphereShader = material;
    this.scene.add(this.atmosphere);
  }

  private async applyLod(lod: GeoLod): Promise<void> {
    if (this.activeLod === lod || this.lodSwapInflight === lod) return;
    this.lodSwapInflight = lod;
    try {
      const collection = await this.geoLoader.loadLod(lod);
      if (this.lodSwapInflight !== lod) return;
      this.swapCountryLayer(lod, collection.features);
      this.activeLod = lod;
    } catch {
      // network error — leave previous LOD in place
    } finally {
      if (this.lodSwapInflight === lod) this.lodSwapInflight = null;
    }
  }

  private swapCountryLayer(lod: GeoLod, features: CountryFeature[]): void {
    disposeGroup(this.countryPolygonGroup);
    disposeGroup(this.countryOutlineGroup);

    const lodOpacity = LOD_OPACITY[lod];
    const includeFill = lodOpacity.fill > 0;

    for (const feature of features) {
      const outline = buildCountryOutline(feature, {
        opacity: lodOpacity.outline,
        color: 0x66ccff
      });
      if (outline) this.countryOutlineGroup.add(outline);

      if (includeFill) {
        const mesh = buildCountryMesh(feature, {
          opacity: lodOpacity.fill,
          color: 0x2f7fb8
        });
        if (mesh) this.countryPolygonGroup.add(mesh);
      }
    }

    this.countryPolygonGroup.rotation.y = this.earth.rotation.y;
    this.countryOutlineGroup.rotation.y = this.earth.rotation.y;

    const selected = this.selectedIsoCode();
    if (selected) this.highlightCountry(selected);
  }

  private addMarkers(coords: GlobeData[]): void {
    while (this.markerGroup.children.length > 0) {
      const child = this.markerGroup.children[0];
      this.markerGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    coords.forEach(c => {
      if (c.latitude == null || c.longitude == null) return;

      const pos = this.latLngToVector3(c.latitude, c.longitude, 1.012);
      const baseSize = Math.max(0.012, Math.min(0.045, (c.population || 0) / 4000000000));
      const lightIntensity = c.cityLightsDensity || Math.min(1, (c.population || 0) / 100000000);
      const baseColor = new THREE.Color().setHSL(0.55 - lightIntensity * 0.15, 0.8, 0.5 + lightIntensity * 0.4);
      const baseOpacity = 0.7 + lightIntensity * 0.3;

      const geometry = new THREE.CircleGeometry(baseSize, 12);
      const material = new THREE.MeshBasicMaterial({
        color: baseColor.clone(),
        transparent: true,
        opacity: baseOpacity,
        depthTest: true
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(pos);
      marker.lookAt(new THREE.Vector3(0, 0, 0));
      marker.userData = {
        isoCode: c.isoCode,
        name: c.name,
        baseSize,
        baseColor,
        baseOpacity
      } satisfies MarkerUserData;
      this.markerGroup.add(marker);
    });
  }

  private highlightCountry(isoCode: string): void {
    const upper = isoCode.toUpperCase();

    this.markerGroup.children.forEach(child => {
      const mesh = child as THREE.Mesh;
      const data = mesh.userData as MarkerUserData;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (data?.isoCode === isoCode) {
        mesh.scale.set(2.2, 2.2, 2.2);
        mat.color.setHex(0x00d4ff);
        mat.opacity = 1;
      } else {
        mesh.scale.set(1, 1, 1);
        mat.color.copy(data.baseColor);
        mat.opacity = data.baseOpacity;
      }
    });

    this.countryPolygonGroup.children.forEach(child => {
      const mesh = child as THREE.Mesh;
      const data = mesh.userData as CountryMeshUserData;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (data.iso?.toUpperCase() === upper) {
        mat.emissive = new THREE.Color(0x00d4ff);
        mat.emissiveIntensity = 0.55;
        mat.opacity = Math.min(0.6, mat.opacity * 2.6);
      } else {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
        mat.opacity = LOD_OPACITY[this.activeLod ?? '50m'].fill;
      }
    });

    this.countryOutlineGroup.children.forEach(child => {
      const line = child as THREE.LineSegments;
      const mat = line.material as THREE.LineBasicMaterial;
      const data = line.userData as { iso: string };
      if (data.iso?.toUpperCase() === upper) {
        mat.color.setHex(0x00d4ff);
        mat.opacity = 1.0;
      } else {
        mat.color.setHex(0x66ccff);
        mat.opacity = LOD_OPACITY[this.activeLod ?? '50m'].outline;
      }
    });
  }

  private clearHighlight(): void {
    this.markerGroup.children.forEach(child => {
      const mesh = child as THREE.Mesh;
      const data = mesh.userData as MarkerUserData;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mesh.scale.set(1, 1, 1);
      mat.color.copy(data.baseColor);
      mat.opacity = data.baseOpacity;
    });

    const lodKey = this.activeLod ?? '50m';
    this.countryPolygonGroup.children.forEach(child => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0;
      mat.opacity = LOD_OPACITY[lodKey].fill;
    });

    this.countryOutlineGroup.children.forEach(child => {
      const line = child as THREE.LineSegments;
      const mat = line.material as THREE.LineBasicMaterial;
      mat.color.setHex(0x66ccff);
      mat.opacity = LOD_OPACITY[lodKey].outline;
    });
  }

  private updateLod(): void {
    if (!this.camera) return;
    const distance = this.camera.position.length();

    const desiredLod = this.geoLoader.selectLodForDistance(distance);
    if (desiredLod !== this.activeLod && desiredLod !== this.lodSwapInflight) {
      void this.applyLod(desiredLod);
    }

    const markerScaleFactor = THREE.MathUtils.clamp(distance / 2.8, 0.85, 2.4);
    const selected = this.selectedIsoCode();

    this.markerGroup.children.forEach(child => {
      const mesh = child as THREE.Mesh;
      const data = mesh.userData as MarkerUserData;
      if (!data?.baseSize) return;

      const isSelected = data.isoCode === selected;
      const sizeScale = isSelected ? 2.2 : markerScaleFactor;
      const radius = data.baseSize * sizeScale;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.CircleGeometry(radius, 12);
    });
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lng + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (this.isPaused) return; // tab hidden — skip the work
    this.controls.update();
    this.earth.rotation.y += 0.0001;
    this.atmosphere.rotation.y = this.earth.rotation.y;
    this.countryPolygonGroup.rotation.y = this.earth.rotation.y;
    this.countryOutlineGroup.rotation.y = this.earth.rotation.y;
    this.markerGroup.rotation.y = this.earth.rotation.y;
    this.cameraGroup.rotation.y = this.earth.rotation.y;
    this.earthquakeGroup.rotation.y = this.earth.rotation.y;
    this.wildfireGroup.rotation.y = this.earth.rotation.y;
    this.stormGroup.rotation.y = this.earth.rotation.y;
    this.aircraftGroup.rotation.y = this.earth.rotation.y;
    this.issGroup.rotation.y = this.earth.rotation.y;
    this.gdeltGroup.rotation.y = this.earth.rotation.y;
    this.animateCameraPulse();
    this.animateEarthquakePulse();
    this.animateWildfirePulse();
    this.animateStormPulse();
    this.animateIssPulse();
    this.animateGdeltPulse();
    this.renderer.render(this.scene, this.camera);
  }

  private rebuildCameras(items: readonly CameraFeedItem[]): void {
    while (this.cameraGroup.children.length > 0) {
      const child = this.cameraGroup.children[0];
      this.cameraGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    const opacity = this.cameraOpacity();
    const baseColor = new THREE.Color(0xff5fa2);

    for (const cam of items) {
      if (typeof cam.lat !== 'number' || typeof cam.lng !== 'number') continue;
      const pos = this.latLngToVector3(cam.lat, cam.lng, 1.014);
      const geometry = new THREE.SphereGeometry(0.012, 12, 12);
      const material = new THREE.MeshBasicMaterial({
        color: baseColor.clone(),
        transparent: true,
        opacity: 0.55 * opacity,
        depthWrite: false
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(pos);
      marker.userData = { cameraId: cam.id, kind: 'camera', basePulse: Math.random() * Math.PI * 2 };
      this.cameraGroup.add(marker);
    }
  }

  private applyCameraOpacity(opacity: number): void {
    for (const child of this.cameraGroup.children) {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.55 * opacity;
      }
    }
  }

  private rebuildEarthquakes(items: readonly EarthquakeItem[]): void {
    while (this.earthquakeGroup.children.length > 0) {
      const child = this.earthquakeGroup.children[0];
      this.earthquakeGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    const opacity = this.earthquakeOpacity();

    for (const eq of items) {
      const pos = this.latLngToVector3(eq.lat, eq.lng, 1.018);
      const radius = magnitudeRadius(eq.magnitude);
      const color = magnitudeColor(eq.magnitude);

      const geometry = new THREE.SphereGeometry(radius, 12, 12);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7 * opacity,
        depthWrite: false
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(pos);
      marker.userData = {
        kind: 'earthquake',
        earthquakeId: eq.id,
        baseRadius: radius,
        baseOpacity: 0.7,
        baseColor: color.clone(),
        pulseOffset: Math.random() * Math.PI * 2
      };
      this.earthquakeGroup.add(marker);
    }
  }

  private applyEarthquakeOpacity(opacity: number): void {
    for (const child of this.earthquakeGroup.children) {
      if (child instanceof THREE.Mesh) {
        const data = child.userData as { baseOpacity?: number };
        const base = data.baseOpacity ?? 0.7;
        (child.material as THREE.MeshBasicMaterial).opacity = base * opacity;
      }
    }
  }

  private animateEarthquakePulse(): void {
    if (!this.earthquakeGroup.visible) return;
    const t = performance.now() / 1000;
    const opacity = this.earthquakeOpacity();
    for (const child of this.earthquakeGroup.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const data = child.userData as { baseOpacity?: number; pulseOffset?: number };
      const phase = data.pulseOffset ?? 0;
      const base = data.baseOpacity ?? 0.7;
      const pulse = 0.7 + Math.sin(t * 3 + phase) * 0.3;
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.opacity = base * opacity * pulse;
      child.scale.setScalar(1 + (pulse - 1) * 0.6);
    }
  }

  private rebuildAircraft(items: readonly AircraftItem[]): void {
    while (this.aircraftGroup.children.length > 0) {
      const child = this.aircraftGroup.children[0];
      this.aircraftGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    const opacity = this.aircraftOpacity();
    const baseColor = new THREE.Color(0x4fc3f7);
    const geometry = new THREE.ConeGeometry(0.0055, 0.014, 5);

    for (const ac of items) {
      const altitude = 1.022 + Math.min(0.012, (ac.altitudeM ?? 0) / 1e6);
      const pos = this.latLngToVector3(ac.lat, ac.lng, altitude);
      const material = new THREE.MeshBasicMaterial({
        color: baseColor.clone(),
        transparent: true,
        opacity: 0.85 * opacity,
        depthWrite: false
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(pos);
      const up = pos.clone().normalize();
      marker.up.copy(up);
      marker.lookAt(new THREE.Vector3(0, 0, 0));
      if (ac.headingDeg != null) {
        marker.rotateOnAxis(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(-ac.headingDeg));
      }
      marker.userData = { kind: 'aircraft', aircraftId: ac.icao24, baseOpacity: 0.85 };
      this.aircraftGroup.add(marker);
    }
  }

  private applyAircraftOpacity(opacity: number): void {
    for (const child of this.aircraftGroup.children) {
      if (child instanceof THREE.Mesh) {
        const data = child.userData as { baseOpacity?: number };
        (child.material as THREE.MeshBasicMaterial).opacity = (data.baseOpacity ?? 0.85) * opacity;
      }
    }
  }

  private rebuildIss(pos: IssPosition | null, trail: readonly { lat: number; lng: number }[]): void {
    while (this.issGroup.children.length > 0) {
      const child = this.issGroup.children[0];
      this.issGroup.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    }
    this.issTrailLine = null;
    if (!pos) return;

    const opacity = this.issOpacity();

    if (trail.length >= 2) {
      const positions: number[] = [];
      for (const pt of trail) {
        const v = this.latLngToVector3(pt.lat, pt.lng, 1.04);
        positions.push(v.x, v.y, v.z);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.5 * opacity
      });
      const line = new THREE.Line(geometry, lineMat);
      line.userData = { kind: 'iss-trail', baseOpacity: 0.5 };
      this.issTrailLine = line;
      this.issGroup.add(line);
    }

    const issPos = this.latLngToVector3(pos.lat, pos.lng, 1.045);
    const geom = new THREE.SphereGeometry(0.022, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.95 * opacity,
      depthWrite: false
    });
    const issMarker = new THREE.Mesh(geom, mat);
    issMarker.position.copy(issPos);
    issMarker.userData = { kind: 'iss', baseOpacity: 0.95, pulseOffset: 0 };
    this.issGroup.add(issMarker);

    // Glow halo
    const haloGeom = new THREE.SphereGeometry(0.04, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.25 * opacity,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.position.copy(issPos);
    halo.userData = { kind: 'iss-halo', baseOpacity: 0.25 };
    this.issGroup.add(halo);
  }

  private applyIssOpacity(opacity: number): void {
    for (const child of this.issGroup.children) {
      const data = child.userData as { baseOpacity?: number };
      const base = data.baseOpacity ?? 0.9;
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity = base * opacity;
      } else if (child instanceof THREE.Line) {
        (child.material as THREE.LineBasicMaterial).opacity = base * opacity;
      }
    }
  }

  private animateIssPulse(): void {
    if (!this.issGroup.visible) return;
    const t = performance.now() / 1000;
    const opacity = this.issOpacity();
    for (const child of this.issGroup.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const data = child.userData as { baseOpacity?: number; kind?: string };
      if (data.kind === 'iss-halo') {
        const pulse = 0.4 + Math.sin(t * 1.4) * 0.3;
        (child.material as THREE.MeshBasicMaterial).opacity = (data.baseOpacity ?? 0.25) * opacity * pulse;
        const s = 1 + Math.sin(t * 1.4) * 0.12;
        child.scale.setScalar(s);
      }
    }
  }

  private rebuildGdelt(items: readonly GdeltEvent[]): void {
    while (this.gdeltGroup.children.length > 0) {
      const child = this.gdeltGroup.children[0];
      this.gdeltGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    const opacity = this.gdeltOpacity();

    for (const ev of items) {
      const pos = this.latLngToVector3(ev.lat, ev.lng, 1.013);
      const geometry = new THREE.SphereGeometry(0.007, 8, 8);
      const color = gdeltToneColor(ev.tone);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7 * opacity,
        depthWrite: false
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(pos);
      marker.userData = {
        kind: 'gdelt',
        gdeltId: ev.id,
        baseOpacity: 0.7,
        pulseOffset: Math.random() * Math.PI * 2
      };
      this.gdeltGroup.add(marker);
    }
  }

  private applyGdeltOpacity(opacity: number): void {
    for (const child of this.gdeltGroup.children) {
      if (child instanceof THREE.Mesh) {
        const data = child.userData as { baseOpacity?: number };
        (child.material as THREE.MeshBasicMaterial).opacity = (data.baseOpacity ?? 0.7) * opacity;
      }
    }
  }

  private animateGdeltPulse(): void {
    if (!this.gdeltGroup.visible) return;
    const t = performance.now() / 1000;
    const opacity = this.gdeltOpacity();
    for (const child of this.gdeltGroup.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const data = child.userData as { baseOpacity?: number; pulseOffset?: number };
      const phase = data.pulseOffset ?? 0;
      const base = data.baseOpacity ?? 0.7;
      const pulse = 0.85 + Math.sin(t * 2 + phase) * 0.15;
      (child.material as THREE.MeshBasicMaterial).opacity = base * opacity * pulse;
    }
  }

  private rebuildStorms(items: readonly StormItem[]): void {
    while (this.stormGroup.children.length > 0) {
      const child = this.stormGroup.children[0];
      this.stormGroup.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    }

    const opacity = this.stormOpacity();

    for (const storm of items) {
      // Track polyline
      if (storm.track.length >= 2) {
        const positions: number[] = [];
        for (const pt of storm.track) {
          const v = this.latLngToVector3(pt.lat, pt.lng, 1.016);
          positions.push(v.x, v.y, v.z);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x7c4dff,
          transparent: true,
          opacity: 0.5 * opacity
        });
        const line = new THREE.Line(geometry, lineMat);
        line.userData = { kind: 'storm-track', stormId: storm.id, baseOpacity: 0.5 };
        this.stormGroup.add(line);
      }

      // Storm "eye" marker
      const eyePos = this.latLngToVector3(storm.lat, storm.lng, 1.02);
      const eyeGeom = new THREE.SphereGeometry(0.016, 14, 14);
      const eyeMat = new THREE.MeshBasicMaterial({
        color: 0x9c7dff,
        transparent: true,
        opacity: 0.85 * opacity,
        depthWrite: false
      });
      const eye = new THREE.Mesh(eyeGeom, eyeMat);
      eye.position.copy(eyePos);
      eye.userData = {
        kind: 'storm',
        stormId: storm.id,
        baseOpacity: 0.85,
        pulseOffset: Math.random() * Math.PI * 2
      };
      this.stormGroup.add(eye);
    }
  }

  private applyStormOpacity(opacity: number): void {
    for (const child of this.stormGroup.children) {
      const data = child.userData as { baseOpacity?: number };
      const base = data.baseOpacity ?? 0.7;
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity = base * opacity;
      } else if (child instanceof THREE.Line) {
        (child.material as THREE.LineBasicMaterial).opacity = base * opacity;
      }
    }
  }

  private animateStormPulse(): void {
    if (!this.stormGroup.visible) return;
    const t = performance.now() / 1000;
    const opacity = this.stormOpacity();
    for (const child of this.stormGroup.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const data = child.userData as { baseOpacity?: number; pulseOffset?: number; kind?: string };
      if (data.kind !== 'storm') continue;
      const phase = data.pulseOffset ?? 0;
      const base = data.baseOpacity ?? 0.85;
      const pulse = 0.7 + Math.sin(t * 1.6 + phase) * 0.3;
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.opacity = base * opacity * pulse;
      child.rotation.y = t * 0.6;
    }
  }

  private rebuildWildfires(items: readonly WildfireItem[]): void {
    while (this.wildfireGroup.children.length > 0) {
      const child = this.wildfireGroup.children[0];
      this.wildfireGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    const opacity = this.wildfireOpacity();
    const baseColor = new THREE.Color(0xffb300);

    for (const fire of items) {
      const pos = this.latLngToVector3(fire.lat, fire.lng, 1.017);
      const geometry = new THREE.SphereGeometry(0.011, 10, 10);
      const material = new THREE.MeshBasicMaterial({
        color: baseColor.clone(),
        transparent: true,
        opacity: 0.7 * opacity,
        depthWrite: false
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(pos);
      marker.userData = {
        kind: 'wildfire',
        wildfireId: fire.id,
        baseOpacity: 0.7,
        pulseOffset: Math.random() * Math.PI * 2
      };
      this.wildfireGroup.add(marker);
    }
  }

  private applyWildfireOpacity(opacity: number): void {
    for (const child of this.wildfireGroup.children) {
      if (child instanceof THREE.Mesh) {
        const data = child.userData as { baseOpacity?: number };
        const base = data.baseOpacity ?? 0.7;
        (child.material as THREE.MeshBasicMaterial).opacity = base * opacity;
      }
    }
  }

  private animateWildfirePulse(): void {
    if (!this.wildfireGroup.visible) return;
    const t = performance.now() / 1000;
    const opacity = this.wildfireOpacity();
    for (const child of this.wildfireGroup.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const data = child.userData as { baseOpacity?: number; pulseOffset?: number };
      const phase = data.pulseOffset ?? 0;
      const base = data.baseOpacity ?? 0.7;
      const pulse = 0.7 + Math.sin(t * 4 + phase) * 0.3;
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.opacity = base * opacity * pulse;
      child.scale.setScalar(1 + (pulse - 1) * 0.5);
    }
  }

  private animateCameraPulse(): void {
    if (!this.cameraGroup.visible) return;
    const t = performance.now() / 1000;
    const opacity = this.cameraOpacity();
    for (const child of this.cameraGroup.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const data = child.userData as { basePulse?: number };
      const phase = data.basePulse ?? 0;
      const pulse = 0.85 + Math.sin(t * 2.4 + phase) * 0.15;
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 * opacity * pulse;
      child.scale.setScalar(1 + (pulse - 1) * 0.5);
    }
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', (event) => this.onClick(event));
    window.addEventListener('resize', () => this.onResize());
    // Pause the render loop when the tab is hidden — saves laptop battery and
    // keeps GPU temps reasonable. We just skip the work inside animate(); the
    // RAF chain itself stays alive so resuming is instant.
    this.visibilityHandler = () => { this.isPaused = document.hidden; };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.cameraGroup.visible) {
      const cameraHits = this.raycaster.intersectObjects(this.cameraGroup.children);
      if (cameraHits.length > 0) {
        const data = cameraHits[0].object.userData as { cameraId?: string };
        if (data?.cameraId) {
          const cam = this.cameras().find(c => c.id === data.cameraId);
          if (cam) {
            this.cameraSelect.emit(cam);
            return;
          }
        }
      }
    }

    if (this.earthquakeGroup.visible) {
      const eqHits = this.raycaster.intersectObjects(this.earthquakeGroup.children);
      if (eqHits.length > 0) {
        const data = eqHits[0].object.userData as { earthquakeId?: string };
        if (data?.earthquakeId) {
          const eq = this.earthquakes().find(e => e.id === data.earthquakeId);
          if (eq) {
            this.earthquakeSelect.emit(eq);
            return;
          }
        }
      }
    }

    if (this.wildfireGroup.visible) {
      const fireHits = this.raycaster.intersectObjects(this.wildfireGroup.children);
      if (fireHits.length > 0) {
        const data = fireHits[0].object.userData as { wildfireId?: string };
        if (data?.wildfireId) {
          const fire = this.wildfires().find(f => f.id === data.wildfireId);
          if (fire) {
            this.wildfireSelect.emit(fire);
            return;
          }
        }
      }
    }

    if (this.stormGroup.visible) {
      const stormHits = this.raycaster.intersectObjects(this.stormGroup.children.filter(c => c instanceof THREE.Mesh));
      if (stormHits.length > 0) {
        const data = stormHits[0].object.userData as { stormId?: string; kind?: string };
        if (data?.stormId && data?.kind === 'storm') {
          const storm = this.storms().find(s => s.id === data.stormId);
          if (storm) {
            this.stormSelect.emit(storm);
            return;
          }
        }
      }
    }

    if (this.aircraftGroup.visible) {
      const acHits = this.raycaster.intersectObjects(this.aircraftGroup.children);
      if (acHits.length > 0) {
        const data = acHits[0].object.userData as { aircraftId?: string };
        if (data?.aircraftId) {
          const ac = this.aircraft().find(a => a.icao24 === data.aircraftId);
          if (ac) {
            this.aircraftSelect.emit(ac);
            return;
          }
        }
      }
    }

    if (this.issGroup.visible) {
      const issHits = this.raycaster.intersectObjects(
        this.issGroup.children.filter(c => c instanceof THREE.Mesh && (c.userData as { kind?: string }).kind === 'iss')
      );
      if (issHits.length > 0) {
        const pos = this.issPosition();
        if (pos) {
          this.issSelect.emit(pos);
          return;
        }
      }
    }

    if (this.gdeltGroup.visible) {
      const gHits = this.raycaster.intersectObjects(this.gdeltGroup.children);
      if (gHits.length > 0) {
        const data = gHits[0].object.userData as { gdeltId?: string };
        if (data?.gdeltId) {
          const ev = this.gdeltEvents().find(e => e.id === data.gdeltId);
          if (ev) {
            this.gdeltSelect.emit(ev);
            return;
          }
        }
      }
    }

    const markerHits = this.raycaster.intersectObjects(this.markerGroup.children);
    if (markerHits.length > 0) {
      const data = markerHits[0].object.userData as MarkerUserData;
      if (data?.isoCode) {
        this.countrySelect.emit({ isoCode: data.isoCode, name: data.name });
        return;
      }
    }

    const polygonHits = this.raycaster.intersectObjects(this.countryPolygonGroup.children);
    if (polygonHits.length > 0) {
      const data = polygonHits[0].object.userData as CountryMeshUserData;
      if (data?.iso) {
        this.countrySelect.emit({ isoCode: data.iso, name: data.name });
      }
    }
  }

  private onResize(): void {
    const container = this.canvasContainer().nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

function magnitudeRadius(mag: number): number {
  const m = Math.max(0, mag);
  return THREE.MathUtils.clamp(0.006 + Math.pow(m, 1.7) * 0.0028, 0.006, 0.06);
}

function gdeltToneColor(tone: number): THREE.Color {
  // GDELT tone: -100 (negative) → 100 (positive). Most articles fall in [-10, 10].
  const t = THREE.MathUtils.clamp((tone + 10) / 20, 0, 1);
  // Red → gray → green ramp via HSL hue interpolation.
  const hue = THREE.MathUtils.lerp(0, 0.33, t);
  const sat = Math.max(0.25, 1 - Math.abs(0.5 - t));
  return new THREE.Color().setHSL(hue, sat, 0.55);
}

function magnitudeColor(mag: number): THREE.Color {
  const t = THREE.MathUtils.clamp((mag - 1.5) / (7.5 - 1.5), 0, 1);
  const hue = THREE.MathUtils.lerp(0.62, 0.02, t);
  const sat = 0.85;
  const light = THREE.MathUtils.lerp(0.55, 0.6, t);
  return new THREE.Color().setHSL(hue, sat, light);
}

function disposeGroup(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Line) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) material.forEach(m => m.dispose());
      else material.dispose();
    }
  }
}
