import React, { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFBX } from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";

const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export function Avatar(props) {
  const { playAudio, script } = useControls({
    playAudio: true,
    script: {
      value: "greeting",
      options: ["greeting", "encouragement"],
    },
  });
  const audio = useMemo(() => {
    const newAudio = new Audio(`/audios/${script}.ogg`);
    return newAudio;
  }, [script]);

  const jsonFile = useLoader(THREE.FileLoader, `/audios/${script}.json`);
  const lipsync = JSON.parse(jsonFile);

  const group = useRef();
  const { nodes, materials } = useGLTF("/models/66de6b33bb9d79984d437c2f.glb");

  // Check if nodes are loaded properly
  if (!nodes || !materials) {
    console.error("Model nodes or materials are not loaded.");
    return null; // Prevent rendering if model is not loaded
  }

  const { animations: standardAnimations } = useFBX("/animations/Standard Idle.fbx");
  const { animations: talkingAnimations } = useFBX("/animations/Talking.fbx");
  const { animations: wavingAnimations } = useFBX("/animations/Waving.fbx");

  if (standardAnimations.length > 0) {
    standardAnimations[0].name = "Standard";
  }
  if (talkingAnimations.length > 0) {
    talkingAnimations[0].name = "Talking";
  }
  if (wavingAnimations.length > 0) {
    wavingAnimations[0].name = "Waving";
  }

  const [animation, setAnimation] = useState("Standard");

  const { actions } = useAnimations(
    [...talkingAnimations, ...wavingAnimations, ...standardAnimations],
    group
  );

  useEffect(() => {
    if (actions && actions[animation]) {
      actions[animation].reset().fadeIn(0.0).play();
      
      return () => {
        if (actions[animation]) {
          actions[animation].fadeOut(0.5);
        }
      };
    }
  }, [animation, actions]);

  useFrame((state, delta) => {
    const currentAudioTime = audio.currentTime;

    // Ensure nodes exist before accessing morphTargetInfluences
    if (nodes.Wolf3D_Head && nodes.Wolf3D_Teeth) {
      Object.values(corresponding).forEach((value) => {
        if (nodes.Wolf3D_Head.morphTargetDictionary[value] !== undefined) {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[value]
          ] = 0;
        }
        if (nodes.Wolf3D_Teeth.morphTargetDictionary[value] !== undefined) {
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[value]
          ] = 0;
        }
      });

      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCues = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCues.start && currentAudioTime <= mouthCues.end) {
          if (nodes.Wolf3D_Head.morphTargetDictionary[corresponding[mouthCues.value]] !== undefined) {
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[
                corresponding[mouthCues.value]
              ]
            ] = 0.5;
          }
          if (nodes.Wolf3D_Teeth.morphTargetDictionary[corresponding[mouthCues.value]] !== undefined) {
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[
                corresponding[mouthCues.value]
              ]
            ] = 0.5;
          }
          break;
        }
      }
    }

    if (audio.paused || audio.ended) {
      setAnimation("Standard");
    }
  });

  useEffect(() => {
    const playGreeting = () => {
      if (script === "greeting" && playAudio) {
        audio.play()
          .then(() => {
            setAnimation("Talking");
          })
          .catch((err) => console.error("Audio playback failed", err));
      }
    };

    // Play greeting immediately when component mounts
    playGreeting();

    // Set up interval to play greeting every 15 minutes
    const intervalId = setInterval(playGreeting, 15 * 60 * 1000); // Changed to 15 minutes

    return () => {
      clearInterval(intervalId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [playAudio, audio, script]);

  useEffect(() => {
    const handleCanPlayThrough = () => {
      if (playAudio && script !== "greeting") {
        audio
          .play()
          .then(() => {
            setAnimation("Talking");
          })
          .catch((err) => console.error("Audio playback failed", err));
      } else if (!playAudio) {
        setAnimation("Standard");
      }
    };

    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [playAudio, audio, script]);

  return (
    <group
      ref={group}
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
      {...props}
      dispose={null}
    >
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Glasses.geometry}
        material={materials.Wolf3D_Glasses}
        skeleton={nodes.Wolf3D_Glasses.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
    </group>
  );
}

useGLTF.preload("/models/66de6b33bb9d79984d437c2f.glb");