import {
  Environment,
  OrbitControls,
  //useTexture,
  ContactShadows,
  Text,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((loadingText) => {
          if (loadingText.length > 2) {
            return ".";
          }
          return loadingText + ".";
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);
  if (!loading) return null;
  return (
    <group {...props}>
      <Text fontSize={0.14} ochorX={"left"} anchorY={"bottom"}>
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  //const texture = useTexture("textures/123.jpg");
  const viewport = useThree((state) => state.viewport);
  //const { cameraZoomed } = useChat();

  return (
    <>
      <OrbitControls />
      <Environment preset="sunset" />
      {/* Wrapping Dots into Suspense to prevent Blink when Troika/Font is loaded */}
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      <Suspense fallback={null}>
        <Avatar position={[0, -2.8, 5]} scale={2} />
      </Suspense>
      <ContactShadows opacity={0.7} />
    </>
  );
};
