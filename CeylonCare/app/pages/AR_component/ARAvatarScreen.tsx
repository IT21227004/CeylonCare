import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ScreenOrientation from 'expo-screen-orientation';
import axios from 'axios';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Mesh } from 'three';
import * as THREE from 'three';

const Avatar: React.FC<{ isAnimating: boolean; url: string | null }> = ({ isAnimating, url }) => {
  // Define a dummy texture loader to bypass texture loading
  const dummyTextureLoader = {
    load: (url: string, onLoad: (texture: THREE.Texture) => void) => {
      onLoad(new THREE.Texture()); // Return a blank texture immediately
    },
    setCrossOrigin: () => {},
  };

  const gltf = useGLTF(
    url || '',
    true,
    true,
    (loader: any) => {
      loader.textureLoader = dummyTextureLoader;
    }
  );

  const meshRef = useRef<Mesh>(null!);
  const { actions, mixer } = useAnimations(gltf.animations, gltf.scene);

  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green
        }
      });
    }
  }, [gltf]);

  useEffect(() => {
    console.log('[DEBUG] GLTF model loaded with URL:', url, 'GLTF object:', gltf);
    if (!gltf.scene) {
      console.error('[ERROR] GLTF scene is null or undefined for URL:', url);
      // Avoid triggering Alert here to prevent UI display
    }
  }, [gltf, url]);

  useEffect(() => {
    if (isAnimating && mixer && actions) {
      const action = actions['WarriorII'] || actions[Object.keys(actions)[0]];
      if (action) {
        console.log('[DEBUG] Starting animation');
        action.reset().play();
      } else {
        console.warn('[WARN] No valid animation action found');
      }
    } else if (!isAnimating && mixer) {
      console.log('[DEBUG] Stopping animation');
      mixer.stopAllAction();
    }
  }, [isAnimating, actions, mixer]);

  useFrame((state, delta) => {
    if (meshRef.current && gltf.scene && isAnimating && mixer) {
      mixer.update(delta);
    }
  });

  return gltf.scene ? (
    <primitive ref={meshRef} object={gltf.scene} position={[0, -1, -2]} scale={2.5} />
  ) : (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
};

const ARAvatarScreen: React.FC<{
  route: { params?: { arPoseUrl?: string; therapyName?: string } };
  navigation: { goBack: () => void };
}> = ({ route, navigation }) => {
  const { arPoseUrl = 'https://res.cloudinary.com/dmwaockgw/image/upload/v1741590782/warrior_II_lp2hfq.glb', therapyName = 'Warrior II' } = route.params || {};

  const [feedback, setFeedback] = useState<string>('Please stand 2-3 meters back.');
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [modelUri, setModelUri] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Custom error logging to capture but not display specific errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes("THREE.GLTFLoader: Couldn't load texture")) {
        // Log the error to console for debugging but do not trigger UI feedback
        originalError('[SUPPRESSED FROM UI] THREE.GLTFLoader: Couldn’t load texture', ...args.slice(1));
      } else {
        originalError(...args); // Pass through other errors normally
      }
    };
    return () => {
      console.error = originalError; // Restore original function on cleanup
    };
  }, []);

  useEffect(() => {
    const loadAsset = async () => {
      if (arPoseUrl && arPoseUrl.startsWith('http')) {
        setModelUri(arPoseUrl);
      } else {
        setModelUri(null);
      }
    };
    loadAsset();
  }, [arPoseUrl]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    if (isCameraReady && cameraRef.current) {
      intervalRef.current = setInterval(captureFrame, 2000);
    }
  }, [isCameraReady]);

  const captureFrame = async () => {
    if (!cameraRef.current || !permission?.granted) {
      setFeedback('Camera not ready or permission denied.');
      return;
    }

    try {
      await retryAsync(async () => {
        if (!cameraRef.current) {
          throw new Error('Camera is not available.');
        }
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
        const response = await axios.post('http://192.168.8.134:5000/process_frame', { frame: photo.base64 }, { timeout: 5000 });
        const landmarks = response.data.landmarks;
        setFeedback(landmarks?.length > 0 ? 'Pose detected successfully!' : 'No pose detected.');
      }, 3, 1000);
    } catch (error) {
      console.error('[ERROR] Frame capture error:', error);
      setFeedback('Error capturing frame.');
    }
  };

  const retryAsync = async (fn: () => Promise<void>, retries: number, delay: number) => {
    try {
      await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        await retryAsync(fn, retries - 1, delay * 2);
      } else {
        throw error;
      }
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" onCameraReady={() => setIsCameraReady(true)} />
      <Canvas style={styles.canvas} camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 1, 1]} intensity={0.5} />
        <Avatar isAnimating={isAnimating} url={modelUri} />
      </Canvas>
      <Text style={styles.feedback}>{feedback}</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsAnimating((prev) => !prev)} style={[styles.startButton, isAnimating ? styles.startButtonActive : null]}>
        <Text style={styles.buttonText}>{isAnimating ? 'Stop Animation' : 'Start Animation'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' },
  camera: { position: 'absolute', top: 0, left: 0, width: '100%', height: '70%', zIndex: 0 },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
  feedback: { position: 'absolute', bottom: 150, width: '100%', textAlign: 'center', color: 'white', fontSize: 18, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, zIndex: 2 },
  message: { textAlign: 'center', paddingBottom: 10, color: 'white', fontSize: 16 },
  button: { padding: 10, backgroundColor: '#00BBD3', borderRadius: 5, alignSelf: 'center', zIndex: 2 },
  buttonText: { color: 'white', fontSize: 16 },
  backButton: { position: 'absolute', bottom: 10, left: 10, padding: 15, backgroundColor: '#00BBD3', borderRadius: 25, zIndex: 2 },
  startButton: { position: 'absolute', bottom: 70, alignSelf: 'center', padding: 15, backgroundColor: '#00BBD3', borderRadius: 25, zIndex: 2 },
  startButtonActive: { backgroundColor: '#FF4444' },
});

export default ARAvatarScreen;