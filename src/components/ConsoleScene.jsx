import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";

/**
 * Low-poly retro console: base, raised screen, two joysticks, four buttons.
 * Built from Three.js primitives — zero external assets.
 * TODO: swap primitives for a GLB when a CC0 model is in `/public/models/`.
 */
function Console({ reduceMotion }) {
  const group = useRef(null);
  const screenGlow = useRef(null);

  useFrame((state) => {
    if (!group.current) return;
    if (!reduceMotion) {
      // Slow idle sway so it feels alive without demanding attention
      const t = state.clock.elapsedTime;
      group.current.rotation.y = Math.sin(t * 0.4) * 0.25;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.05 - 0.1;
    }
    // Screen glow pulse (even for reduced motion — subtle colour, not motion)
    if (screenGlow.current) {
      const p = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      screenGlow.current.intensity = p;
    }
  });

  const accent = "#0071e3";
  const bodyColor = "#1a1a1c";
  const bodyDark = "#0f0f10";
  const stickColor = "#2a2a2c";

  return (
    <group ref={group} position={[0, -0.3, 0]}>
      {/* Base body — flat chunky slab */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.5, 2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Base bottom bevel */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[3.4, 0.1, 2.2]} />
        <meshStandardMaterial color={bodyDark} roughness={0.8} />
      </mesh>

      {/* Screen housing — tilted back block on top */}
      <group position={[0, 0.55, -0.35]} rotation={[-0.35, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 1.4, 0.3]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Screen bezel (recessed black frame) */}
        <mesh position={[0, 0.05, 0.16]}>
          <boxGeometry args={[2.1, 1.15, 0.05]} />
          <meshStandardMaterial color="#050506" roughness={0.3} />
        </mesh>
        {/* Glowing screen face */}
        <mesh position={[0, 0.05, 0.19]}>
          <planeGeometry args={[1.95, 1.0]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Point light inside screen for cast glow */}
      <pointLight
        ref={screenGlow}
        position={[0, 0.7, 0.2]}
        color={accent}
        intensity={0.55}
        distance={5}
      />

      {/* Left joystick */}
      <JoyStick position={[-0.9, 0.3, 0.5]} stickColor={stickColor} accent={accent} />
      {/* Right joystick */}
      <JoyStick position={[0.9, 0.3, 0.5]} stickColor={stickColor} accent={accent} />

      {/* Four small buttons — centre of base */}
      <Button position={[-0.25, 0.26, 0.75]} color="#ff4d4d" />
      <Button position={[0, 0.26, 0.75]} color="#f5c518" />
      <Button position={[0.25, 0.26, 0.75]} color="#30c764" />
      <Button position={[0, 0.26, 0.5]} color={accent} />
    </group>
  );
}

function JoyStick({ position, stickColor, accent }) {
  return (
    <group position={position}>
      {/* Mount base disc */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
        <meshStandardMaterial color="#232325" roughness={0.6} />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial color={stickColor} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Ball top */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Button({ position, color }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} toneMapped={false} />
    </mesh>
  );
}

export default function ConsoleScene() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2.5, 2.5, 4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#000"]} />
        {/* Soft ambient + key + rim */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 5, 3]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4a9eff" />

        <Suspense fallback={null}>
          <Float
            speed={reduceMotion ? 0 : 1.1}
            rotationIntensity={reduceMotion ? 0 : 0.15}
            floatIntensity={reduceMotion ? 0 : 0.4}
          >
            <Console reduceMotion={reduceMotion} />
          </Float>
          <ContactShadows
            position={[0, -0.75, 0]}
            opacity={0.55}
            scale={6}
            blur={2.4}
            far={2.5}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
