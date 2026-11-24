
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense
} from "react";

import { Canvas, useFrame } from "@react-three/fiber";

import {
  PerspectiveCamera,
  useGLTF
} from "@react-three/drei";

import * as THREE from "three";

// ==========================================
// FOREST ENVIRONMENT
// ==========================================

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
      if (Math.abs(x) < 3 && z > -7 && z < 5) {
        continue;
      }

      trees.push(
        <Tree
          key={`${x}-${z}`}
          position={[x, 0, z]}
          scale={0.9}
        />
      );
    }
  }

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, 0]}
      >
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

// ==========================================
// TANJIRO 3D MODEL
// ==========================================

function TanjiroModel() {
  const { scene } = useGLTF(
    "/models/kamado_tanjiro.glb"
  );

  const model = useMemo(() => {
    const clone = scene.clone(true);

    // Reset original transforms.
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);

    // Temporary orientation correction.
    clone.rotation.set(0, 0, -Math.PI / 2);

    clone.updateMatrixWorld(true);

    // Calculate bounds after rotation.
    const box = new THREE.Box3().setFromObject(clone);

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    // Set approximate character height.
    const scale = size.y > 0 ? 2.2 / size.y : 1;

    clone.scale.multiplyScalar(scale);

    // Center the model and place it on the ground.
    clone.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale
    );

    clone.updateMatrixWorld(true);

    return clone;
  }, [scene]);

  return <primitive object={model} />;
}

useGLTF.preload("/models/kamado_tanjiro.glb");

// ==========================================
// PLAYER
// ==========================================

function Player({
  input,
  playerPosition,
  attackVisual
}) {
  const player = useRef();
  const modelPivot = useRef();

  const swingTime = useRef(0);

  useFrame((state, delta) => {
    if (!player.current) return;

    const p = player.current;

    const direction = new THREE.Vector3(
      Number(input.current.right) -
        Number(input.current.left),

      0,

      Number(input.current.backward) -
        Number(input.current.forward)
    );

    if (direction.lengthSq() > 0) {
      direction.normalize();

      p.position.addScaledVector(
        direction,
        5 * delta
      );

      p.rotation.y = Math.atan2(
        direction.x,
        direction.z
      );
    }

    p.position.x = THREE.MathUtils.clamp(
      p.position.x,
      -20,
      20
    );

    p.position.z = THREE.MathUtils.clamp(
      p.position.z,
      -20,
      20
    );

    playerPosition.current.copy(p.position);

    // Camera follows player.
    const cameraTarget = p.position.clone().add(
      new THREE.Vector3(0, 5, 8)
    );

    state.camera.position.lerp(
      cameraTarget,
      1 - Math.pow(0.001, delta)
    );

    state.camera.lookAt(
      p.position.x,
      p.position.y + 1,
      p.position.z
    );

    // Attack visual.
    if (attackVisual.current) {
      swingTime.current = 0.35;
      attackVisual.current = false;
    }

    if (swingTime.current > 0) {
      swingTime.current -= delta;

      if (modelPivot.current) {
        const progress =
          1 - Math.max(0, swingTime.current) / 0.35;

        modelPivot.current.rotation.z =
          -Math.sin(progress * Math.PI) * 0.15;
      }
    } else if (modelPivot.current) {
      modelPivot.current.rotation.z = 0;
    }
  });

  return (
    <group ref={player} position={[0, 0, 3]}>
      <group ref={modelPivot}>
        <TanjiroModel />
      </group>
    </group>
  );
}

// ==========================================
// ENEMY
// ==========================================

function Enemy({
  playerPosition,
  attackSignal,
  enemyHealth,
  playerHealth,
  onStats
}) {
  const enemy = useRef();

  const attackCooldown = useRef(0);
  const damageCooldown = useRef(0);
  const updateTimer = useRef(0);

  useFrame((state, delta) => {
    if (!enemy.current) return;

    const p = enemy.current.position;
    const player = playerPosition.current;

    attackCooldown.current -= delta;
    damageCooldown.current -= delta;
    updateTimer.current += delta;

    const distance = Math.hypot(
      player.x - p.x,
      player.z - p.z
    );

    if (enemyHealth.current > 0) {
      if (attackSignal.current) {
        attackSignal.current = false;

        if (distance < 2.8) {
          enemyHealth.current = Math.max(
            0,
            enemyHealth.current - 25
          );
        }
      }

      if (distance > 1.4 && distance < 25) {
        const direction = new THREE.Vector3(
          player.x - p.x,
          0,
          player.z - p.z
        ).normalize();

        p.addScaledVector(direction, 1.8 * delta);

        enemy.current.rotation.y = Math.atan2(
          direction.x,
          direction.z
        );
      }

      if (
        distance < 1.5 &&
        damageCooldown.current <= 0
      ) {
        playerHealth.current = Math.max(
          0,
          playerHealth.current - 10
        );

        damageCooldown.current = 1.2;
      }
    }

    if (updateTimer.current >= 0.2) {
      updateTimer.current = 0;

      onStats({
        enemy: enemyHealth.current,
        player: playerHealth.current
      });
    }

    enemy.current.visible =
      enemyHealth.current > 0;
  });

  return (
    <group ref={enemy} position={[2, 0, -5]}>
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

// ==========================================
// GAME SCENE
// ==========================================

function GameScene(props) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 5, 8]}
        fov={60}
      />

      <ambientLight intensity={1.2} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={2}
      />

      <Forest />

      <Suspense fallback={null}>
        <Player
          input={props.input}
          playerPosition={props.playerPosition}
          attackVisual={props.attackVisual}
        />
      </Suspense>

      <Enemy
        playerPosition={props.playerPosition}
        attackSignal={props.attackSignal}
        enemyHealth={props.enemyHealth}
        playerHealth={props.playerHealth}
        onStats={props.onStats}
      />
    </>
  );
}

// ==========================================
// MAIN GAME
// ==========================================

export default function Home() {
  const input = useRef({});

  const playerPosition = useRef(
    new THREE.Vector3(0, 0, 3)
  );

  const attackSignal = useRef(false);
  const attackVisual = useRef(false);

  const enemyHealth = useRef(100);
  const playerHealth = useRef(100);

  const [stats, setStats] = useState({
    enemy: 100,
    player: 100
  });

  // Keyboard controls.
  useEffect(() => {
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

    const down = (e) => {
      if (keys[e.key]) {
        e.preventDefault();
        input.current[keys[e.key]] = true;
      }
    };

    const up = (e) => {
      if (keys[e.key]) {
        input.current[keys[e.key]] = false;
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Mobile movement.
  const move = (name, active) => {
    input.current[name] = active;
  };

  // Attack.
  const attack = () => {
    if (
      playerHealth.current <= 0 ||
      enemyHealth.current <= 0
    ) {
      return;
    }

    attackSignal.current = true;
    attackVisual.current = true;
  };

  const buttonStyle = {
    background: "rgba(25,35,35,0.85)",
    color: "white",
    border: "1px solid #b5c9b2",
    borderRadius: 14,
    width: 55,
    height: 50,
    fontSize: 22,
    touchAction: "none"
  };

  const moveButton = (name, symbol) => (
    <button
      key={name}
      style={buttonStyle}
      onPointerDown={(e) => {
        e.preventDefault();

        e.currentTarget.setPointerCapture(
          e.pointerId
        );

        move(name, true);
      }}
      onPointerUp={() => move(name, false)}
      onPointerCancel={() => move(name, false)}
      onLostPointerCapture={() => move(name, false)}
    >
      {symbol}
    </button>
  );

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        background: "#18251c",
        color: "white",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <Canvas dpr={[1, 1.5]}>
        <GameScene
          input={input}
          playerPosition={playerPosition}
          attackSignal={attackSignal}
          attackVisual={attackVisual}
          enemyHealth={enemyHealth}
          playerHealth={playerHealth}
          onStats={setStats}
        />
      </Canvas>

      {/* GAME INFORMATION */}

      <div
        style={{
          position: "absolute",
          top: 15,
          left: 15,
          pointerEvents: "none"
        }}
      >
        <div
          style={{
            fontSize: 21,
            fontWeight: "bold"
          }}
        >
          BREATHBOUND
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#d2e4ce"
          }}
        >
          DEMON HUNTER
        </div>

        <div style={{ marginTop: 12, fontSize: 12 }}>
          PLAYER HP
        </div>

        <div
          style={{
            width: 130,
            height: 9,
            background: "#444",
            borderRadius: 8
          }}
        >
          <div
            style={{
              width: `${stats.player}%`,
              height: "100%",
              background: "#42bd70",
              borderRadius: 8
            }}
          />
        </div>

        <div style={{ fontSize: 12, marginTop: 10 }}>
          DEMON HP
        </div>

        <div
          style={{
            width: 130,
            height: 9,
            background: "#444",
            borderRadius: 8
          }}
        >
          <div
            style={{
              width: `${stats.enemy}%`,
              height: "100%",
              background: "#dc4545",
              borderRadius: 8
            }}
          />
        </div>
      </div>

      {/* MISSION INFORMATION */}

      <div
        style={{
          position: "absolute",
          top: 15,
          right: 15,
          background: "#222b",
          padding: 9,
          borderRadius: 8,
          fontSize: 11
        }}
      >
        SURVIVE THE ENCOUNTER
      </div>

      {/* MOVEMENT CONTROLS */}

      <div
        style={{
          position: "absolute",
          bottom: 25,
          left: 15,
          display: "grid",
          gridTemplateColumns: "repeat(3,55px)",
          gap: 5
        }}
      >
        <div />

        {moveButton("forward", "↑")}

        <div />

        {moveButton("left", "←")}

        {moveButton("backward", "↓")}

        {moveButton("right", "→")}
      </div>

      {/* ATTACK BUTTON */}

      <button
        onClick={attack}
        disabled={
          stats.enemy <= 0 ||
          stats.player <= 0
        }
        style={{
          ...buttonStyle,
          position: "absolute",
          bottom: 40,
          right: 20,
          width: 85,
          height: 85,
          borderRadius: "50%",
          background: "#922e32",
          fontWeight: "bold",
          fontSize: 15
        }}
      >
        ATTACK
      </button>

      {/* VICTORY SCREEN */}

      {stats.enemy <= 0 && (
        <div
          style={{
            position: "absolute",
            top: "43%",
            width: "100%",
            textAlign: "center",
            fontSize: 25,
            fontWeight: "bold",
            color: "#ffe4a2"
          }}
        >
          DEMON DEFEATED!
        </div>
      )}

      {/* DEFEAT SCREEN */}

      {stats.player <= 0 && (
        <div
          style={{
            position: "absolute",
            top: "43%",
            width: "100%",
            textAlign: "center",
            fontSize: 25,
            fontWeight: "bold",
            color: "#ff7777"
          }}
        >
          YOU WERE DEFEATED
        </div>
      )}
    </main>
  );
    }
    
