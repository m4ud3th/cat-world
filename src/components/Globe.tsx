import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAT_LOCATIONS, type CatLocation, type CatLocationCategory } from '../data/catLocations';

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
  onMarkerSelect?: (location: CatLocation | null) => void;
  isLocked?: boolean;
  markerFilters?: CatLocationCategory[];
};

type MarkerPalette = {
  fillColor: string;
  glowColor: string;
};

const GLOBE_RADIUS = 1.7;
const COUNTRY_LINE_COLOR = 0x4d4ab3;

const MARKER_PALETTES: Record<CatLocationCategory, MarkerPalette> = {
  real: {
    fillColor: '#8fc2ff',
    glowColor: 'rgba(120, 183, 255, 1)'
  },
  fictional: {
    fillColor: '#ff8fd1',
    glowColor: 'rgba(255, 120, 205, 1)'
  },
  breed: {
    fillColor: '#7ff5d7',
    glowColor: 'rgba(77, 245, 210, 1)'
  }
};

function categoryPreviewLabel(category: CatLocationCategory) {
  if (category === 'real') {
    return 'Famous cat';
  }

  if (category === 'fictional') {
    return 'Fictional cat';
  }

  return 'Cat breed';
}

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

function createStyledMarkerTexture(
  image: CanvasImageSource,
  fillColor: string,
  glowColor: string
) {
  const imageWidth = 'width' in image && typeof image.width === 'number' ? image.width : 512;
  const imageHeight = 'height' in image && typeof image.height === 'number' ? image.height : 512;
  const padding = Math.ceil(Math.max(imageWidth, imageHeight) * 0.18);

  const tintedCanvas = document.createElement('canvas');
  tintedCanvas.width = imageWidth;
  tintedCanvas.height = imageHeight;

  const tintedContext = tintedCanvas.getContext('2d');
  if (!tintedContext) {
    return null;
  }

  tintedContext.drawImage(image, 0, 0, imageWidth, imageHeight);
  tintedContext.globalCompositeOperation = 'source-in';
  tintedContext.fillStyle = fillColor;
  tintedContext.fillRect(0, 0, imageWidth, imageHeight);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = imageWidth + padding * 2;
  finalCanvas.height = imageHeight + padding * 2;

  const finalContext = finalCanvas.getContext('2d');
  if (!finalContext) {
    return null;
  }

  finalContext.shadowColor = glowColor;
  finalContext.shadowBlur = Math.max(imageWidth, imageHeight) * 0.08;
  finalContext.drawImage(tintedCanvas, padding, padding, imageWidth, imageHeight);
  finalContext.shadowColor = 'transparent';
  finalContext.shadowBlur = 0;
  finalContext.drawImage(tintedCanvas, padding, padding, imageWidth, imageHeight);

  const texture = new THREE.CanvasTexture(finalCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function buildLocationMarkers(locations: CatLocation[]) {
  const group = new THREE.Group();
  const textureLoader = new THREE.TextureLoader();
  const markerHeight = 0.16;

  for (const location of locations) {
    const palette = MARKER_PALETTES[location.category];
    const iconSprite = new THREE.Sprite();
    const markerPosition = toVector3(
      [location.longitude, location.latitude],
      GLOBE_RADIUS + 0.12
    );
    iconSprite.position.copy(markerPosition);
    iconSprite.center.set(0.5, 0);
    iconSprite.scale.set(markerHeight, markerHeight, 1);
    iconSprite.userData.location = location;
    group.add(iconSprite);

    const iconMaterial = new THREE.SpriteMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true
    });
    iconSprite.material = iconMaterial;

    textureLoader.load(location.iconUrl, (loadedTexture) => {
      const loadedImage = loadedTexture.image as { width?: number; height?: number } | undefined;
      const width = loadedImage?.width ?? 1;
      const height = loadedImage?.height ?? 1;
      const aspectRatio = width / height;
      const styledTexture = createStyledMarkerTexture(
        loadedTexture.image as CanvasImageSource,
        palette.fillColor,
        palette.glowColor
      );

      iconSprite.scale.set(markerHeight * aspectRatio, markerHeight, 1);
      if (styledTexture) {
        iconMaterial.map = styledTexture;
        iconMaterial.needsUpdate = true;
      }

      loadedTexture.dispose();
    });
  }

  return group;
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

export function Globe({ dataUrl, onMarkerSelect, isLocked = false, markerFilters }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onMarkerSelectRef = useRef<typeof onMarkerSelect>(onMarkerSelect);
  const [featureCollection, setFeatureCollection] = useState<GeoJsonFeatureCollection | null>(null);

  useEffect(() => {
    onMarkerSelectRef.current = onMarkerSelect;
  }, [onMarkerSelect]);

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

  const filteredLocations = useMemo(() => {
    if (!markerFilters) {
      return CAT_LOCATIONS;
    }

    if (markerFilters.length === 0) {
      return [];
    }

    const activeFilterSet = new Set(markerFilters);
    return CAT_LOCATIONS.filter((location) => activeFilterSet.has(location.category));
  }, [markerFilters]);

  const locationMarkers = useMemo(() => buildLocationMarkers(filteredLocations), [filteredLocations]);

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
      locationMarkers.traverse((object) => {
        if (object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          if (object.material instanceof THREE.SpriteMaterial) {
            object.material.map?.dispose();
            object.material.dispose();
          }
        }
      });
    };
  }, [countryMeshes, countryLabels, locationMarkers]);

  useEffect(() => {
    const controls = controlsRef.current;
    const canvas = canvasRef.current;

    if (controls) {
      controls.enabled = !isLocked;
    }

    if (canvas) {
      canvas.style.pointerEvents = isLocked ? 'none' : 'auto';
    }
  }, [isLocked]);

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
    controlsRef.current = controls;
    canvasRef.current = renderer.domElement;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;
    controls.enabled = !isLocked;
    renderer.domElement.style.pointerEvents = isLocked ? 'none' : 'auto';

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

    globeGroup.add(locationMarkers);

    const markerSprites: THREE.Sprite[] = [];
    locationMarkers.traverse((object) => {
      if (object instanceof THREE.Sprite) {
        markerSprites.push(object);
      }
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const markerWorldPosition = new THREE.Vector3();
    const globeWorldCenter = new THREE.Vector3();
    const markerNormal = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    const hoverPointer = { x: 0, y: 0 };

    const hoverTooltip = document.createElement('div');
    hoverTooltip.style.position = 'fixed';
    hoverTooltip.style.zIndex = '40';
    hoverTooltip.style.pointerEvents = 'none';
    hoverTooltip.style.padding = '0.35rem 0.5rem';
    hoverTooltip.style.borderRadius = '0.5rem';
    hoverTooltip.style.border = '1px solid rgba(175, 194, 255, 0.3)';
    hoverTooltip.style.background = 'rgba(8, 20, 43, 0.94)';
    hoverTooltip.style.color = 'rgba(236, 242, 255, 0.98)';
    hoverTooltip.style.font = '600 0.74rem Inter, sans-serif';
    hoverTooltip.style.letterSpacing = '0.01em';
    hoverTooltip.style.boxShadow = '0 8px 22px rgba(4, 8, 20, 0.38)';
    hoverTooltip.style.backdropFilter = 'blur(6px)';
    hoverTooltip.style.transform = 'translate(-50%, calc(-100% - 10px))';
    hoverTooltip.style.display = 'none';
    document.body.appendChild(hoverTooltip);

    let hoverDelayTimeout: number | null = null;
    let hoverCandidate: THREE.Sprite | null = null;

    const hideHoverPreview = () => {
      if (hoverDelayTimeout !== null) {
        window.clearTimeout(hoverDelayTimeout);
        hoverDelayTimeout = null;
      }

      hoverCandidate = null;
      hoverTooltip.style.display = 'none';
      hoverTooltip.textContent = '';
    };

    const placeHoverPreview = () => {
      hoverTooltip.style.left = `${hoverPointer.x}px`;
      hoverTooltip.style.top = `${hoverPointer.y}px`;
    };

    const showHoverPreview = (marker: THREE.Sprite) => {
      const location = marker.userData.location as CatLocation | undefined;

      if (!location) {
        return;
      }

        hoverTooltip.textContent = location.name;
      placeHoverPreview();
      hoverTooltip.style.display = 'block';
    };

    const isMarkerVisibleFromCamera = (marker: THREE.Sprite) => {
      marker.getWorldPosition(markerWorldPosition);
      globeGroup.getWorldPosition(globeWorldCenter);

      markerNormal.copy(markerWorldPosition).sub(globeWorldCenter).normalize();
      cameraDirection.copy(camera.position).sub(globeWorldCenter).normalize();

      return markerNormal.dot(cameraDirection) > 0;
    };

    const handleMarkerClick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(markerSprites, false);
      const firstVisibleMatch = intersections.find(({ object }) => {
        if (!(object instanceof THREE.Sprite)) {
          return false;
        }

        return isMarkerVisibleFromCamera(object);
      });
      const firstMatch = firstVisibleMatch?.object as THREE.Sprite | undefined;
      const location = firstMatch?.userData.location as CatLocation | undefined;

      if (location) {
        onMarkerSelectRef.current?.(location);
        return;
      }

      onMarkerSelectRef.current?.(null);
    };

    const getFirstVisibleHoveredMarker = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(markerSprites, false);

      const firstVisibleMatch = intersections.find(({ object }) => {
        if (!(object instanceof THREE.Sprite)) {
          return false;
        }

        return isMarkerVisibleFromCamera(object);
      });

      return firstVisibleMatch?.object instanceof THREE.Sprite ? firstVisibleMatch.object : null;
    };

    const handleMarkerHover = (event: PointerEvent) => {
      hoverPointer.x = event.clientX;
      hoverPointer.y = event.clientY;

      if (hoverTooltip.style.display === 'block') {
        placeHoverPreview();
      }

      const hoveredMarker = getFirstVisibleHoveredMarker(event);

      if (!hoveredMarker) {
        hideHoverPreview();
        return;
      }

      if (hoverCandidate === hoveredMarker && hoverTooltip.style.display === 'block') {
        return;
      }

      if (hoverCandidate === hoveredMarker) {
        return;
      }

      if (hoverDelayTimeout !== null) {
        window.clearTimeout(hoverDelayTimeout);
      }

      hoverCandidate = hoveredMarker;
      hoverTooltip.style.display = 'none';
      hoverDelayTimeout = window.setTimeout(() => {
        if (hoverCandidate === hoveredMarker) {
          showHoverPreview(hoveredMarker);
        }
      }, 450);
    };

    const handleMarkerHoverLeave = () => {
      hideHoverPreview();
    };

    renderer.domElement.addEventListener('pointerdown', handleMarkerClick);
    renderer.domElement.addEventListener('pointermove', handleMarkerHover);
    renderer.domElement.addEventListener('pointerleave', handleMarkerHoverLeave);

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
      hideHoverPreview();
      controlsRef.current = null;
      canvasRef.current = null;
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', handleMarkerClick);
      renderer.domElement.removeEventListener('pointermove', handleMarkerHover);
      renderer.domElement.removeEventListener('pointerleave', handleMarkerHoverLeave);
      mount.removeChild(renderer.domElement);
      hoverTooltip.remove();
      scene.clear();
      renderer.dispose();
    };
  }, [countryMeshes, countryLabels, locationMarkers]);

  return <div ref={mountRef} className="globe-canvas" aria-label="3D globe" />;
}