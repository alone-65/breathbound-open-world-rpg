
"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 2, 7]} />
        <meshStandardMaterial color="#59402c" />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[1.1, 2.5, 7]} />
        <meshStandardMaterial color="#244d38" />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <coneGeometry args={[0.8, 2, 7]} />
        <meshStandardMaterial color="#326346" />
      </mesh>
    </group>
  );
}

function Forest() {
  const trees = [];
  for (let x = -12; x <= 12; x += 4) {
    for (let z = -15; z <= 12; z += 4) {
      if (Math.abs(x) < 3 && z > -7 && z < 5) continue;
      trees.push(
        <Tree
          key={`${x}-${z}`}
          position={[x, 0, z]}
          scale={0.8 + ((x + z + 40) % 4) * 0.12}
        />
      );
    }
  }

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#536b45" />
      </mesh>
      {trees}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[5, 0.12, 45]} />
        <meshStandardMaterial color="#827357" />
      </mesh>
      <fog attach="fog" args={["#b9c7ad", 15, 55]} />
    </>
  );
}

function Player({ input, attack }) {
  const player = useRef();
  const sword = useRef();
  const attackStart = useRef(0);
  const cameraOffset = new THREE.Vector3(0, 5, 8);
  const direction = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!player.current) return;

    const p = player.current;
    const speed = 5;

    direction.set(
      Number(input.current.right) - Number(input.current.left),
      0,
      Number(input.current.backward) - Number(input.current.forward)
    );

    if (direction.lengthSq() > 0) {
      direction.normalize();
      p.position.addScaledVector(direction, speed * delta);
      p.rotation.y = Math.atan2(direction.x, direction.z);
    }

    p.position.x = THREE.MathUtils.clamp(p.position.x, -20, 20);
    p.position.z = THREE.MathUtils.clamp(p.position.z, -20, 20);

    const target = p.position.clone().add(cameraOffset);
    state.camera.position.lerp(target, 1 - Math.pow(0.001, delta));
    state.camera.lookAt(p.position.x, p.position.y + 1, p.position.z);

    if (attack.current && !attackStart.current) {
      attackStart.current = state.clock.elapsedTime;
    }

    if (attackStart.current && sword.current) {
      const t = state.clock.elapsedTime - attackStart.current;
      sword.current.rotation.x = Math.sin(Math.min(t / 0.35, 1) * Math.PI) * 2;
      if (t > 0.4) {
        sword.current.rotation.x = 0;
        attackStart.current = 0;
        attack.current = false;
      }
    }
  });

  return (
    <group ref={player} position={[0, 0, 3]}>
      {/* Legs */}
      <mesh position={[-0.2, 0.45, 0]}>
        <boxGeometry args={[0.22, 0.9, 0.3]} />
        <meshStandardMaterial color="#262b38" />
      </mesh>
      <mesh position={[0.2, 0.45, 0]}>
        <boxGeometry args={[0.22, 0.9, 0.3]} />
        <meshStandardMaterial color="#262b38" />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.85, 0.9, 0.45]} />
        <meshStandardMaterial color="#245d45" />
      </mesh>

      {/* Haori pattern */}
      <mesh position={[0, 1.25, 0.24]}>
        <boxGeometry args={[0.3, 0.9, 0.04]} />
        <meshStandardMaterial color="#202d38" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshStandardMaterial color="#e6b38b" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 2.23, -0.02]}>
        <sphereGeometry args={[0.34, 12, 10]} />
        <meshStandardMaterial color="#291d1a" />
      </mesh>

      {/* Sword arm */}
      <group position={[0.48, 1.55, 0]} ref={sword}>
        <mesh rotation={[0, 0, -0.5]} position={[0.1, -0.15, 0]}>
          <boxGeometry args={[0.18, 0.65, 0.18]} />
          <meshStandardMaterial color="#e6b38b" />
        </mesh>
        <mesh position={[0.2, -0.65, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.1, 1.25, 0.055]} />
          <meshStandardMaterial metalness={0.8} roughness={0.2} color="#d9e5ed" />
        </mesh>
        <mesh position={[0.2, -0.05, 0]}>
          <boxGeometry args={[0.38, 0.08, 0.1]} />
          <meshStandardMaterial color="#d6a13c" />
        </mesh>
      </group>
    </group>
  );
}

function Enemy() {
  return (
    <group position={[2, 0, -5]}>
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.42, 1, 6, 10]} />
        <meshStandardMaterial color="#682f38" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.38, 12, 12]} />
        <meshStandardMaterial color="#8f4949" />
      </mesh>
      <mesh position={[0.14, 2.05, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ff3333" />
      </mesh>
    </group>
  );
}

function GameScene({ input, attack }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 8]} fov={60} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
      <Forest />
      <Player input={input} attack={attack} />
      <Enemy />
    </>
  );
}

export default function Home() {
  const input = useRef({});
  const attack = useRef(false);

  useEffect(() => {
    const down = (e) => {
      const keys = {
        w: "forward",
        ArrowUp: "forward",
        s: "backward",
        ArrowDown: "backward",
        a: "left",
        ArrowLeft: "left",
        d: "right",
        ArrowRight: "right"
      };
      if (keys[e.key]) input.current[keys[e.key]] = true;
    };

    const up = (e) => {
      const keys = {
        w: "forward", ArrowUp: "forward",
        s: "backward", ArrowDown: "backward",
        a: "left", ArrowLeft: "left",
        d: "right", ArrowRight: "right"
      };
      if (keys[e.key]) input.current[keys[e.key]] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const control = (name, active) => {
    input.current[name] = active;
  };

  const buttonStyle = {
    background: "rgba(25,35,35,0.8)",
    color: "white",
    border: "1px solid #b5c9b2",
    borderRadius: "14px",
    width: "58px",
    height: "52px",
    fontSize: "22px",
    touchAction: "none"
  };

  return (
    <main style={{
      position: "fixed",
      inset: 0,
      background: "#18251c",
      color: "white",
      fontFamily: "Arial, sans-serif"
    }}>
      <Canvas shadows dpr={[1, 1.5]}>
        <GameScene input={input} attack={attack} />
      </Canvas>

      <div style={{
        position: "absolute",
        top: 15,
        left: 15,
        pointerEvents: "none"
      }}>
        <div style={{fontSize: 20, fontWeight: "bold"}}>
          BREATHBOUND
        </div>
        <div style={{fontSize: 12, color: "#d2e4ce"}}>
          DEMON HUNTER • PROTOTYPE
        </div>
        <div style={{
          marginTop: 12,
          background: "#222",
          padding: 8,
          borderRadius: 8,
          fontSize: 13
        }}>
          HP: 100 / 100
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: 25,
        left: 20,
        display: "grid",
        gridTemplateColumns: "repeat(3,58px)",
        gap: 5
      }}>
        <div />
        <button style={buttonStyle}
          onPointerDown={() => control("forward", true)}
          onPointerUp={() => control("forward", false)}
          onPointerLeave={() => control("forward", false)}>↑</button>
        <div />
        <button style={buttonStyle}
          onPointerDown={() => control("left", true)}
          onPointerUp={() => control("left", false)}
          onPointerLeave={() => control("left", false)}>←</button>
        <button style={buttonStyle}
          onPointerDown={() => control("backward", true)}
          onPointerUp={() => control("backward", false)}
          onPointerLeave={() => control("backward", false)}>↓</button>
        <button style={buttonStyle}
          onPointerDown={() => control("right", true)}
          onPointerUp={() => control("right", false)}
          onPointerLeave={() => control("right", false)}>→</button>
      </div>

      <button
        onClick={() => attack.current = true}
        style={{
          ...buttonStyle,
          position: "absolute",
          bottom: 42,
          right: 25,
          width: 85,
          height: 85,
          borderRadius: "50%",
          background: "#8b302e",
          fontSize: 17,
          fontWeight: "bold"
        }}
      >
        ATTACK
      </button>

      <div style={{
        position: "absolute",
        top: 15,
        right: 15,
        fontSize: 11,
        background: "#222a",
        padding: 8,
        borderRadius: 8
      }}>
        WASD / ARROWS
      </div>
    </main>
  );
    }
        
