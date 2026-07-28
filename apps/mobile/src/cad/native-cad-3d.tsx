import { Canvas, useThree } from "@react-three/fiber/native";
import type { Point2Mm } from "@obrametrik/domain";
import { Component, useEffect, useMemo, useRef, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { DoubleSide, Shape } from "three";
import { theme } from "../theme";
import type { MobileCadMarker } from "./model";
import { buildCadScene } from "./scene-model";

type Orbit = { yaw: number; pitch: number };

export function NativeCad3D({
  clearHeightMm,
  fallbackLabel,
  markers,
  onClearSelection,
  onOrbitChange,
  onSelect,
  onZoomChange,
  orbit,
  selectedId,
  vertices,
  zoom,
}: {
  clearHeightMm: number;
  fallbackLabel: string;
  markers: readonly MobileCadMarker[];
  onClearSelection: () => void;
  onOrbitChange: (orbit: Orbit) => void;
  onSelect: (id: string) => void;
  onZoomChange: (zoom: number) => void;
  orbit: Orbit;
  selectedId?: string;
  vertices: readonly Point2Mm[];
  zoom: number;
}) {
  const gesture = useRef<{ distance?: number; x: number; y: number } | undefined>(undefined);

  function captureTouches(event: GestureResponderEvent) {
    const [first, second] = event.nativeEvent.touches;
    if (!first) return;
    gesture.current = second
      ? {
          distance: Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY),
          x: (first.pageX + second.pageX) / 2,
          y: (first.pageY + second.pageY) / 2,
        }
      : { x: first.pageX, y: first.pageY };
  }

  function moveCamera(event: GestureResponderEvent) {
    const previous = gesture.current;
    const [first, second] = event.nativeEvent.touches;
    if (!previous || !first) return captureTouches(event);
    if (second) {
      const distance = Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
      if (previous.distance) {
        onZoomChange(Math.max(0.45, Math.min(3.5, zoom * distance / previous.distance)));
      }
    } else {
      onOrbitChange({
        yaw: orbit.yaw - (first.pageX - previous.x) * 0.35,
        pitch: Math.max(-15, Math.min(89, orbit.pitch + (first.pageY - previous.y) * 0.25)),
      });
    }
    captureTouches(event);
  }

  return (
    <Cad3DErrorBoundary fallbackLabel={fallbackLabel}>
    <View
      onTouchEnd={() => { gesture.current = undefined; }}
      onTouchMove={moveCamera}
      onTouchStart={captureTouches}
      style={styles.root}
    >
      <Canvas
        camera={{ far: 1000, fov: 42, near: 0.01, position: [6, 5, 6] }}
        gl={{ alpha: false, antialias: true }}
        onPointerMissed={onClearSelection}
      >
        <color args={["#E7ECE9"]} attach="background" />
        <ambientLight intensity={1.5} />
        <directionalLight castShadow intensity={2.2} position={[4, 8, 5]} />
        <CadScene
          clearHeightMm={clearHeightMm}
          markers={markers}
          onSelect={onSelect}
          orbit={orbit}
          selectedId={selectedId}
          vertices={vertices}
          zoom={zoom}
        />
      </Canvas>
    </View>
    </Cad3DErrorBoundary>
  );
}

class Cad3DErrorBoundary extends Component<
  { children: ReactNode; fallbackLabel: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The 2D editor remains available; no geometry or user data is logged here.
  }

  render() {
    if (this.state.failed) {
      return (
        <View accessibilityRole="alert" style={styles.fallback}>
          <Text style={styles.fallbackText}>{this.props.fallbackLabel}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function CadScene({
  clearHeightMm,
  markers,
  onSelect,
  orbit,
  selectedId,
  vertices,
  zoom,
}: {
  clearHeightMm: number;
  markers: readonly MobileCadMarker[];
  onSelect: (id: string) => void;
  orbit: Orbit;
  selectedId?: string;
  vertices: readonly Point2Mm[];
  zoom: number;
}) {
  const scene = useMemo(
    () => buildCadScene(vertices, clearHeightMm, markers),
    [clearHeightMm, markers, vertices],
  );
  const floorShape = useMemo(() => {
    const shape = new Shape();
    vertices.forEach((point, index) => {
      const x = (point.x - scene.centerMm.x) / 1000;
      const y = (point.y - scene.centerMm.y) / 1000;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    return shape;
  }, [scene.centerMm, vertices]);

  return (
    <>
      <CameraRig
        clearHeightMm={clearHeightMm}
        extentMm={scene.extentMm}
        orbit={orbit}
        zoom={zoom}
      />
      <gridHelper args={[40, 80, "#B8C8C3", "#D8E1DC"]} position={[0, -0.015, 0]} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[floorShape]} />
        <meshStandardMaterial color="#F9F8F4" side={DoubleSide} />
      </mesh>
      {scene.wallSegments.map((segment, index) => (
        <mesh
          castShadow
          key={`${segment.wallIndex}-${segment.role}-${index}`}
          position={[
            (segment.centerMm.x - scene.centerMm.x) / 1000,
            segment.centerMm.z / 1000,
            (segment.centerMm.y - scene.centerMm.y) / 1000,
          ]}
          receiveShadow
          rotation={[0, -segment.angleRad, 0]}
        >
          <boxGeometry args={[segment.lengthMm / 1000, segment.heightMm / 1000, 0.12]} />
          <meshStandardMaterial color="#F4F1E9" roughness={0.82} />
        </mesh>
      ))}
      {markers.map((marker) => (
        <CadEntity
          centerMm={scene.centerMm}
          key={marker.id}
          marker={marker}
          onSelect={onSelect}
          selected={selectedId === marker.id}
          vertices={vertices}
        />
      ))}
    </>
  );
}

function CameraRig({
  clearHeightMm,
  extentMm,
  orbit,
  zoom,
}: {
  clearHeightMm: number;
  extentMm: number;
  orbit: Orbit;
  zoom: number;
}) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const yaw = orbit.yaw * Math.PI / 180;
    const pitch = orbit.pitch * Math.PI / 180;
    const targetY = clearHeightMm / 2000;
    const distance = Math.max(3.5, extentMm / 1000 * 1.85) / zoom;
    const horizontal = Math.cos(pitch) * distance;
    camera.position.set(
      Math.sin(yaw) * horizontal,
      targetY + Math.sin(pitch) * distance,
      Math.cos(yaw) * horizontal,
    );
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, clearHeightMm, extentMm, invalidate, orbit, zoom]);
  return null;
}

function CadEntity({
  centerMm,
  marker,
  onSelect,
  selected,
  vertices,
}: {
  centerMm: Point2Mm;
  marker: MobileCadMarker;
  onSelect: (id: string) => void;
  selected: boolean;
  vertices: readonly Point2Mm[];
}) {
  const start = vertices[marker.wallIndex]!;
  const end = vertices[(marker.wallIndex + 1) % vertices.length]!;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const color =
    selected ? theme.colors.accent
    : marker.kind === "cold_water" ? "#3277B5"
    : marker.kind === "hot_water" ? "#D86045"
    : marker.kind === "drain" ? "#667678"
    : marker.kind === "window" ? "#9FD4E3"
    : marker.kind === "door" ? "#B98B5F"
    : theme.colors.brand;
  const position = [
    (marker.point.x - centerMm.x) / 1000,
    (marker.elevationMm + marker.heightMm / 2) / 1000,
    (marker.point.y - centerMm.y) / 1000,
  ] as const;

  if (marker.kind === "light") {
    return (
      <mesh onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); onSelect(marker.id); }} position={position}>
        <sphereGeometry args={[selected ? 0.13 : 0.1, 20, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    );
  }

  if (marker.kind === "door") {
    const swing = marker.swing ?? "left_in";
    const hingeLeft = swing.startsWith("left");
    const opensIn = swing.endsWith("_in");
    const width = Math.max(marker.widthMm / 1000, 0.08);
    const height = Math.max(marker.heightMm / 1000, 0.08);
    const selectDoor = (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      onSelect(marker.id);
    };
    if (marker.variant === "sliding" || marker.variant === "pocket") {
      return (
        <group position={position} rotation={[0, -angle, 0]}>
          <mesh onClick={selectDoor} position={[-width * 0.22, 0, -0.025]}>
            <boxGeometry args={[width * 0.56, height, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh onClick={selectDoor} position={[width * (marker.variant === "pocket" ? 0.5 : 0.22), 0, 0.025]}>
            <boxGeometry args={[width * 0.56, height, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      );
    }
    if (marker.variant === "folding") {
      return (
        <group position={position} rotation={[0, -angle, 0]}>
          <mesh onClick={selectDoor} position={[-width * 0.2, 0, -width * 0.1]} rotation={[0, 0.48, 0]}>
            <boxGeometry args={[width * 0.52, height, 0.045]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh onClick={selectDoor} position={[width * 0.2, 0, -width * 0.1]} rotation={[0, -0.48, 0]}>
            <boxGeometry args={[width * 0.52, height, 0.045]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      );
    }
    if (marker.variant === "double_hinged") {
      const direction = opensIn ? 1 : -1;
      return (
        <group position={position} rotation={[0, -angle, 0]}>
          <group position={[-width / 2, 0, 0]} rotation={[0, -direction * 1.02, 0]}>
            <mesh onClick={selectDoor} position={[width / 4, 0, 0]}>
              <boxGeometry args={[width / 2, height, 0.055]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
          </group>
          <group position={[width / 2, 0, 0]} rotation={[0, direction * 1.02, 0]}>
            <mesh onClick={selectDoor} position={[-width / 4, 0, 0]}>
              <boxGeometry args={[width / 2, height, 0.055]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
          </group>
        </group>
      );
    }
    const swingAngle = (hingeLeft ? -1 : 1) * (opensIn ? Math.PI / 2.8 : -Math.PI / 2.8);
    return (
      <group position={position} rotation={[0, -angle, 0]}>
        <group position={[hingeLeft ? -width / 2 : width / 2, 0, 0]} rotation={[0, swingAngle, 0]}>
          <mesh
            onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); onSelect(marker.id); }}
            position={[hingeLeft ? width / 2 : -width / 2, 0, 0]}
          >
            <boxGeometry args={[width, height, 0.055]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <mesh
      onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); onSelect(marker.id); }}
      position={position}
      rotation={[0, -angle, 0]}
    >
      <boxGeometry
        args={[
          Math.max(marker.widthMm / 1000, 0.08),
          Math.max(marker.heightMm / 1000, 0.08),
          marker.kind === "window" ? 0.035 : 0.09,
        ]}
      />
      <meshStandardMaterial
        color={color}
        metalness={marker.kind === "window" ? 0.12 : 0}
        opacity={marker.kind === "window" ? 0.48 : 1}
        roughness={marker.kind === "window" ? 0.18 : 0.7}
        transparent={marker.kind === "window"}
      />
    </mesh>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", backgroundColor: "#E7ECE9", flex: 1, justifyContent: "center", padding: 24 },
  fallbackText: { color: theme.colors.danger, fontSize: 14, fontWeight: "700", textAlign: "center" },
  root: { flex: 1, width: "100%" },
});
