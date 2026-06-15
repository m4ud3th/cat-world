import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type GeoJsonPosition = [number, number];

type GeoJsonFeature = {
  type?: string;
  properties?: Record<string, unknown> | null;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  } | null;
};

type GeoJsonFeatureCollection = {
  type?: string;
  features?: GeoJsonFeature[];
};

type GlobeProps = {
  dataUrl: string;
};

const GLOBE_RADIUS = 1.7;
const COUNTRY_LINE_COLOR = 0x4d4ab3;

const countryCodeKeys = ['A3', 'ISO_A3', 'iso_a3', 'ISO3', 'iso3', 'adm0_a3', 'ADM0_A3'];

function generatePastelColor() {
  const hue = Math.random();
  const saturation = 0.4 + Math.random() * 0.2; // 40-60%
  const lightness = 0.75 + Math.random() * 0.1; // 75-85%
  return new THREE.Color().setHSL(hue, saturation, lightness);
}

function toVector3([longitude, latitude]: GeoJsonPosition, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function isPositionTuple(value: unknown): value is GeoJsonPosition {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function extractCountryCode(properties: Record<string, unknown> | null | undefined) {
  if (!properties) {
    return null;
  }

  for (const key of countryCodeKeys) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim().toUpperCase();
    }
  }

  return null;
}

function extractCountryName(properties: Record<string, unknown> | null | undefined) {
  if (!properties) {
    return null;
  }

  // Priority order: NAME, NAME_LONG, ADMIN
  const nameKeys = ['NAME', 'NAME_LONG', 'ADMIN'];
  
  for (const key of nameKeys) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function collectRings(coordinates: unknown): GeoJsonPosition[][] {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (coordinates.length === 0) {
    return [];
  }

  if (isPositionTuple(coordinates[0])) {
    return [coordinates as GeoJsonPosition[]];
  }

  return coordinates.flatMap((item) => collectRings(item));
}

function getPolygons(geometry: NonNullable<GeoJsonFeature['geometry']>): GeoJsonPosition[][][] {
  if (!geometry.coordinates) {
    return [];
  }

  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    return [geometry.coordinates as GeoJsonPosition[][]];
  }

  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates as GeoJsonPosition[][][];
  }

  return [];
}

function unwrapRingLongitudes(ring: GeoJsonPosition[]) {
  if (ring.length === 0) {
    return ring;
  }

  const unwrapped: GeoJsonPosition[] = [];
  let previousLongitude = ring[0][0];
  unwrapped.push([previousLongitude, ring[0][1]]);

  for (let index = 1; index < ring.length; index += 1) {
    const [longitude, latitude] = ring[index];
    let adjustedLongitude = longitude;

    while (adjustedLongitude - previousLongitude > 180) {
      adjustedLongitude -= 360;
    }

    while (adjustedLongitude - previousLongitude < -180) {
      adjustedLongitude += 360;
    }

    unwrapped.push([adjustedLongitude, latitude]);
    previousLongitude = adjustedLongitude;
  }

  return unwrapped;
}

function collectPositions(coordinates: unknown): GeoJsonPosition[] {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (coordinates.length === 0) {
    return [];
  }

  if (isPositionTuple(coordinates[0])) {
    return coordinates as GeoJsonPosition[];
  }

  return coordinates.flatMap((item) => collectPositions(item));
}

function getLabelPosition(
  geometry: NonNullable<GeoJsonFeature['geometry']>,
  properties: Record<string, unknown> | null | undefined
) {
  // First, try to use the curated LABEL_X and LABEL_Y coordinates from the GeoJSON
  if (properties) {
    const labelX = properties['LABEL_X'];
    const labelY = properties['LABEL_Y'];
    
    if (typeof labelX === 'number' && typeof labelY === 'number') {
      return toVector3([labelX, labelY], GLOBE_RADIUS + 0.09);
    }
  }

  // Fallback: calculate centroid from all positions
  const positions = collectPositions(geometry.coordinates);

  if (positions.length === 0) {
    return null;
  }

  const average = positions.reduce(
    (accumulator, [longitude, latitude]) => {
      const vector = toVector3([longitude, latitude], 1);
      accumulator.x += vector.x;
      accumulator.y += vector.y;
      accumulator.z += vector.z;
      return accumulator;
    },
    new THREE.Vector3()
  );

  if (average.lengthSq() === 0) {
    return null;
  }

  return average.normalize().multiplyScalar(GLOBE_RADIUS + 0.09);
}

function createTextSprite(text: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  const deviceScale = 1.5;
  canvas.width = 256 * deviceScale;
  canvas.height = 64 * deviceScale;
  context.scale(deviceScale, deviceScale);

  context.font = '600 14px Inter, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.shadowColor = 'rgba(20, 25, 75, 0.5)';
  context.shadowBlur = 8;
  context.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    opacity: 0.9
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.7, 0.18, 1);
  sprite.userData.baseScale = sprite.scale.clone();

  return sprite;
}

function buildCountryLabels(featureCollection: GeoJsonFeatureCollection) {
  const group = new THREE.Group();
  const features = featureCollection.features ?? [];

  for (const feature of features) {
    const name = extractCountryName(feature.properties);
    const geometry = feature.geometry;

    if (!name || !geometry?.type || !geometry.coordinates) {
      continue;
    }

    const position = getLabelPosition(geometry, feature.properties);

    if (!position) {
      continue;
    }

    const label = createTextSprite(name);

    if (!label) {
      continue;
    }

    label.position.copy(position);
    group.add(label);
  }

  return group;
}

function buildCountryLines(featureCollection: GeoJsonFeatureCollection) {
  const group = new THREE.Group();
  const features = featureCollection.features ?? [];

  // Sample rate: only process every Nth coordinate to reduce vertices
  const SAMPLE_RATE = 1;

  // Shared material for all lines to reduce memory
  const material = new THREE.LineBasicMaterial({
    color: COUNTRY_LINE_COLOR,
    transparent: true,
    opacity: 0.9,
    linewidth: 1
  });

  for (const feature of features) {
    const geometry = feature.geometry;

    if (!geometry?.type || !geometry.coordinates) {
      continue;
    }

    const rings =
      geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
        ? collectRings(geometry.coordinates)
        : [];

    for (const ring of rings) {
      if (ring.length < 3) {
        continue;
      }

      // Sample points to reduce vertex count
      const sampledRing = ring.filter((_, index) => index % SAMPLE_RATE === 0);
      if (sampledRing.length < 2) {
        continue;
      }

      const points = sampledRing.map((position) => toVector3(position, GLOBE_RADIUS + 0.03));
      points.push(points[0].clone());

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, material);
      group.add(line);
    }
  }

  // Store material reference for cleanup
  (group as any).sharedMaterial = material;

  return group;
}

function buildCountryMeshes(featureCollection: GeoJsonFeatureCollection) {
  const group = new THREE.Group();
  const features = featureCollection.features ?? [];

  const canvas = document.createElement('canvas');
  const width = 2048;
  const height = 1024;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return group;
  }

  context.clearRect(0, 0, width, height);
  context.lineJoin = 'round';
  context.lineCap = 'round';

  const wrapShifts = [-360, 0, 360];

  for (const feature of features) {
    const geometry = feature.geometry;

    if (!geometry?.type || !geometry.coordinates) {
      continue;
    }

    const polygons = getPolygons(geometry);
    const pastelColor = generatePastelColor().getStyle();

    context.beginPath();

    for (const polygon of polygons) {
      for (const ring of polygon) {
        if (ring.length < 3) {
          continue;
        }

        const unwrappedRing = unwrapRingLongitudes(ring);

        for (const shift of wrapShifts) {
          for (let index = 0; index < unwrappedRing.length; index += 1) {
            const [longitude, latitude] = unwrappedRing[index];
            const x = ((longitude + shift + 180) / 360) * width;
            const y = ((90 - latitude) / 180) * height;

            if (index === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }
          context.closePath();
        }
      }
    }

    context.fillStyle = pastelColor;
    context.fill('evenodd');
  }

  context.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  context.lineWidth = 0.9;

  for (const feature of features) {
    const geometry = feature.geometry;

    if (!geometry?.type || !geometry.coordinates) {
      continue;
    }

    const polygons = getPolygons(geometry);

    context.beginPath();

    for (const polygon of polygons) {
      for (const ring of polygon) {
        if (ring.length < 2) {
          continue;
        }

        const unwrappedRing = unwrapRingLongitudes(ring);

        for (const shift of wrapShifts) {
          for (let index = 0; index < unwrappedRing.length; index += 1) {
            const [longitude, latitude] = unwrappedRing[index];
            const x = ((longitude + shift + 180) / 360) * width;
            const y = ((90 - latitude) / 180) * height;

            if (index === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }
          context.closePath();
        }
      }
    }

    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: true
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS + 0.012, 64, 64), material);
  group.add(mesh);

  return group;
}

function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const starCount = 600;
  const positions = new Float32Array(starCount * 3);

  for (let index = 0; index < starCount; index += 1) {
    const radius = 55 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0x99a9ff,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
    })
  );
}

export function Globe({ dataUrl }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [featureCollection, setFeatureCollection] = useState<GeoJsonFeatureCollection | null>(null);

  useEffect(() => {
    let alive = true;

    fetch(dataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON from ${dataUrl}`);
        }

        return response.json() as Promise<GeoJsonFeatureCollection>;
      })
      .then((json) => {
        if (alive) {
          setFeatureCollection(json);
        }
      })
      .catch(() => {
        if (alive) {
          setFeatureCollection({ type: 'FeatureCollection', features: [] });
        }
      });

    return () => {
      alive = false;
    };
  }, [dataUrl]);

  const countryMeshes = useMemo(() => {
    if (!featureCollection) {
      return null;
    }

    return buildCountryMeshes(featureCollection);
  }, [featureCollection]);

  const countryLabels = useMemo(() => {
    if (!featureCollection) {
      return null;
    }

    return buildCountryLabels(featureCollection);
  }, [featureCollection]);

  // Dispose old geometries when data changes
  useEffect(() => {
    return () => {
      if (countryMeshes) {
        countryMeshes.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
            object.geometry?.dispose();
            if (object.material instanceof THREE.Material) {
              const materialWithMap = object.material as THREE.Material & {
                map?: THREE.Texture | null;
              };
              materialWithMap.map?.dispose();
              object.material.dispose();
            }
          }
        });
      }
      if (countryLabels) {
        countryLabels.traverse((object) => {
          if (object instanceof THREE.Sprite) {
            object.geometry?.dispose();
            if (object.material instanceof THREE.SpriteMaterial) {
              object.material.map?.dispose();
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [countryMeshes, countryLabels]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xB8D8F2, 12, 32);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.y = -0.65;
    scene.add(globeGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x8e97ff,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
      })
    );

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0xB8D8F2,
        roughness: 0.92,
        metalness: 0.04,
        flatShading: false
      })
    );

    const ambient = new THREE.AmbientLight(0xffffff, 1.65);
    const sunlight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunlight.position.set(6, 4, 8);

    const rimLight = new THREE.DirectionalLight(0x98a3ff, 0.9);
    rimLight.position.set(-6, 2, -4);

    globeGroup.add(atmosphere, globe, ambient, sunlight, rimLight, createStarField());

    if (countryMeshes) {
      globeGroup.add(countryMeshes);
    }

    if (countryLabels) {
      globeGroup.add(countryLabels);
    }

    const labelSprites: THREE.Sprite[] = [];
    if (countryLabels) {
      countryLabels.traverse((object) => {
        if (object instanceof THREE.Sprite) {
          labelSprites.push(object);
        }
      });
    }

    const minDistance = controls.minDistance;
    const defaultLabelDistance = camera.position.length();
    const minLabelScaleFactor = 0.26;

    let frameId = 0;

    const render = () => {
      frameId = window.requestAnimationFrame(render);
      controls.update();

      const zoomDistance = controls.getDistance();
      const shrinkProgress = THREE.MathUtils.clamp(
        (zoomDistance - minDistance) / (defaultLabelDistance - minDistance),
        0,
        1
      );
      const labelScaleFactor =
        zoomDistance >= defaultLabelDistance
          ? 1
          : THREE.MathUtils.lerp(minLabelScaleFactor, 1, shrinkProgress);

      for (const sprite of labelSprites) {
        const baseScale = sprite.userData.baseScale as THREE.Vector3 | undefined;
        if (!baseScale) {
          continue;
        }

        sprite.scale.set(
          baseScale.x * labelScaleFactor,
          baseScale.y * labelScaleFactor,
          baseScale.z
        );
      }

      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    render();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      controls.dispose();
      mount.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
    };
  }, [countryMeshes, countryLabels]);

  return <div ref={mountRef} className="globe-canvas" aria-label="3D globe" />;
}