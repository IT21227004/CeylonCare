import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Camera from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import WebView from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ScreenOrientation from 'expo-screen-orientation';
import axios from 'axios';

// Define Recommendation Type
type Recommendation = {
  name: string;
  ar_pose?: string;
  correct_pose_landmarks?: PoseLandmark[];
};

// Define Pose Landmark Type
type PoseLandmark = {
  name: string;
  x: number;
  y: number;
  z?: number;
};

const ARAvatarScreen = ({ route, navigation }) => {
  const { recommendations = [{ name: route.params?.therapyName, ar_pose: route.params?.arPoseUrl }] } = route.params || {};
  console.log('[DEBUG] Route params received:', JSON.stringify(route.params, null, 2));

  // State variables
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isWebViewValid, setIsWebViewValid] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isWebViewBridgeReady, setIsWebViewBridgeReady] = useState(false);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseRecommendations, setPoseRecommendations] = useState<Recommendation[]>(recommendations);
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [feedback, setFeedback] = useState<string>('Please ensure your full body is visible in the camera frame.');
  const [poseDetectionError, setPoseDetectionError] = useState<string | null>(null);
  const [isPoseWebViewInitialized, setIsPoseWebViewInitialized] = useState(false);
  const [useCameraView, setUseCameraView] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const poseWebViewRef = useRef<WebView>(null);

  // Lock to landscape on mount, unlock on unmount
  useEffect(() => {
    console.log('[DEBUG] ARAvatarScreen component mounted');
    const lockOrientation = async () => {
      try {
        console.log('[DEBUG] Attempting to lock screen to landscape');
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        console.log('[DEBUG] Current orientation:', currentOrientation);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        console.log('[INFO] Screen successfully locked to landscape');
      } catch (error) {
        console.error('[ERROR] Failed to lock orientation:', error.message);
      }
    };

    const unlockOrientation = async () => {
      try {
        console.log('[DEBUG] Attempting to unlock screen orientation');
        await ScreenOrientation.unlockAsync();
        console.log('[INFO] Screen orientation successfully unlocked');
      } catch (error) {
        console.error('[ERROR] Failed to unlock orientation:', error.message);
      }
    };

    lockOrientation();
    return () => {
      console.log('[DEBUG] ARAvatarScreen component unmounting');
      unlockOrientation();
    };
  }, []);

  // Validate components
  useEffect(() => {
    console.log('[DEBUG] Validating essential components');
    if (!Camera.CameraView) {
      console.error('[ERROR] CameraView component unavailable');
      setCameraError('Camera component unavailable');
    } else {
      console.log('[INFO] CameraView component validated');
    }
    if (!WebView) {
      console.error('[ERROR] WebView component unavailable');
      setIsWebViewValid(false);
    } else {
      console.log('[INFO] WebView component validated');
      setIsWebViewValid(true);
    }
    if (!navigation?.navigate) {
      console.error('[ERROR] Navigation prop is invalid');
    } else {
      console.log('[INFO] Navigation prop validated');
    }
  }, [navigation]);

  // Fetch therapy details from backend API
  useEffect(() => {
    const fetchTherapyDetails = async () => {
      console.log('[DEBUG] Fetching therapy details for recommendations');
      try {
        const updatedRecommendations = await Promise.all(
          recommendations.map(async (therapy: Recommendation) => {
            console.log('[DEBUG] Fetching details for therapy:', therapy.name);
            try {
              const response = await axios.get(`http://172.20.10.14:5000/therapy_details/${encodeURIComponent(therapy.name)}`, {
                timeout: 10000,
              });
              console.log('[DEBUG] API response for therapy details:', JSON.stringify(response.data, null, 2));
              const data = response.data;
              if (!data.ar_pose) {
                console.warn('[WARN] No ar_pose provided for:', therapy.name);
              }
              if (!data.correct_pose_landmarks || !data.correct_pose_landmarks.length) {
                console.warn('[WARN] No correct_pose_landmarks provided for:', therapy.name);
              }
              return {
                ...therapy,
                ar_pose: data.ar_pose || therapy.ar_pose,
                correct_pose_landmarks: data.correct_pose_landmarks || [],
              };
            } catch (error) {
              console.error('[ERROR] Failed to fetch details for therapy:', therapy.name, error.message);
              return therapy;
            }
          })
        );
        setPoseRecommendations(updatedRecommendations);
        console.log('[INFO] Updated recommendations with therapy details:', JSON.stringify(updatedRecommendations, null, 2));
      } catch (error) {
        console.error('[ERROR] Failed to fetch therapy details:', error.message);
      }
    };

    if (recommendations.length > 0) {
      console.log('[DEBUG] Recommendations length > 0, initiating fetch');
      fetchTherapyDetails();
    } else {
      console.warn('[WARN] No recommendations provided');
    }
  }, [recommendations]);

  // Handle camera permission
  useEffect(() => {
    if (!permission) {
      console.log('[DEBUG] Camera permission not yet initialized');
      return;
    }
    if (permission.status !== 'granted') {
      console.log('[DEBUG] Camera permission not granted, requesting...');
      requestPermission();
    } else {
      console.log('[INFO] Camera permission already granted');
    }
  }, [permission, requestPermission]);

  // Monitor pose detection
  useEffect(() => {
    console.log('[DEBUG] Monitoring pose detection, landmarks length:', landmarks.length);
    const timeout = setTimeout(() => {
      if (!landmarks.length && !poseDetectionError && isPoseWebViewInitialized) {
        console.warn('[WARN] No pose landmarks detected after 10 seconds');
        setPoseDetectionError('Pose detection failed: No landmarks detected. Ensure your full body is visible or try disabling camera feed.');
        setUseCameraView(false); // Disable CameraView to test Pose WebView
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [landmarks, poseDetectionError, isPoseWebViewInitialized]);

  // Toggle animation with WebView communication
  const toggleAnimation = () => {
    if (!isModelLoaded) {
      console.log('[DEBUG] Animation toggle ignored: model not loaded');
      return;
    }
    setIsAnimating((prev) => {
      const newState = !prev;
      console.log('[DEBUG] Toggling animation state to:', newState);
      if (isWebViewBridgeReady && webViewRef.current) {
        const message = newState ? 'start' : 'stop';
        console.log('[DEBUG] Sending message to AR WebView:', message);
        try {
          webViewRef.current.postMessage(message);
          console.log('[INFO] Message sent to AR WebView successfully');
        } catch (error) {
          console.error('[ERROR] Failed to send message to AR WebView:', error.message);
        }
      } else {
        console.warn('[WARN] AR WebView bridge not ready or ref missing');
      }
      return newState;
    });
  };

  // Switch to a different pose
  const switchPose = (index: number) => {
    console.log('[DEBUG] Attempting to switch pose to index:', index);
    if (index < 0 || index >= poseRecommendations.length) {
      console.warn('[WARN] Invalid pose index:', index);
      return;
    }
    setCurrentPoseIndex(index);
    setIsModelLoaded(false);
    setLandmarks([]);
    setFeedback('Please ensure your full body is visible in the camera frame.');
    setPoseDetectionError(null);
    if (webViewRef.current && isWebViewBridgeReady) {
      console.log('[DEBUG] Stopping current animation before switching');
      webViewRef.current.postMessage('stop');
    }
    console.log('[INFO] Switched to pose:', poseRecommendations[index].name);
  };

  // Compare user pose with correct pose and provide feedback
  useEffect(() => {
    const comparePoses = () => {
      const currentPose = poseRecommendations[currentPoseIndex];
      console.log('[DEBUG] Comparing poses for:', currentPose?.name);
      if (!currentPose) {
        console.log('[DEBUG] Skipping comparison: currentPose is undefined');
        setFeedback('Error: No pose selected');
        return;
      }
      if (!landmarks.length) {
        console.log('[DEBUG] Skipping comparison: No detected landmarks');
        setFeedback('No pose detected. Please step back to ensure your full body is visible in the camera.');
        return;
      }
      if (!currentPose.correct_pose_landmarks || !currentPose.correct_pose_landmarks.length) {
        console.log('[DEBUG] Skipping comparison: No correct pose landmarks');
        setFeedback('Error: No reference pose data available. Please contact support.');
        return;
      }

      console.log('[DEBUG] Detected landmarks:', JSON.stringify(landmarks, null, 2));
      console.log('[DEBUG] Correct pose landmarks:', JSON.stringify(currentPose.correct_pose_landmarks, null, 2));

      let feedbackMessage = '';
      currentPose.correct_pose_landmarks.forEach((correct: PoseLandmark) => {
        const detected = landmarks.find((l: PoseLandmark) => l.name === correct.name);
        if (detected) {
          const xDiff = Math.abs(detected.x - correct.x);
          const yDiff = Math.abs(detected.y - correct.y);
          console.log(`[DEBUG] Comparing ${correct.name}: xDiff=${xDiff}, yDiff=${yDiff}`);
          if (xDiff > 0.1 || yDiff > 0.1) {
            feedbackMessage += `Adjust ${correct.name} position\n`;
          }
        } else {
          console.warn(`[WARN] Landmark ${correct.name} not detected in landmarks`);
          feedbackMessage += `Cannot detect ${correct.name}\n`;
        }
      });

      const finalFeedback = feedbackMessage || 'Pose looks good!';
      setFeedback(finalFeedback);
      console.log('[INFO] Feedback set to:', finalFeedback);
    };

    comparePoses();
  }, [landmarks, currentPoseIndex, poseRecommendations]);

  // End session and navigate back
  const handleEndSession = async () => {
    console.log('[DEBUG] Initiating end session');
    try {
      if (webViewRef.current && isWebViewBridgeReady) {
        console.log('[DEBUG] Sending stop message to AR WebView');
        webViewRef.current.postMessage('stop');
      }
      console.log('[DEBUG] Locking orientation to portrait');
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      console.log('[INFO] Orientation locked to portrait, navigating back');
      navigation.goBack();
    } catch (error) {
      console.error('[ERROR] Failed to end session:', error.message);
    }
  };

  // Permission loading state
  if (!permission) {
    console.log('[DEBUG] Waiting for camera permission initialization');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BBD3" />
        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  // Permission denied state
  if (permission.status !== 'granted') {
    console.log('[DEBUG] Camera permission denied');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Camera permission required</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPose = poseRecommendations[currentPoseIndex];
  const arPoseUrl = currentPose?.ar_pose;
  console.log('[DEBUG] Current AR pose URL:', arPoseUrl);

  // AR WebView HTML
  const getARWebViewHtml = () => {
    if (!arPoseUrl) {
      console.warn('[WARN] No AR pose URL available');
      return '<html><body><p>No AR pose URL available</p></body></html>';
    }
    console.log('[DEBUG] Generating AR WebView HTML with URL:', arPoseUrl);
    return `
      <html>
        <head>
          <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
          <script src="https://unpkg.com/aframe-extras@7.4.0/dist/aframe-extras.min.js"></script>
          <style>
            body { margin: 0; background: transparent; }
            a-scene { background: transparent; }
          </style>
        </head>
        <body>
          <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;">
            <a-assets>
              <a-asset-item id="model" src="${arPoseUrl}"></a-asset-item>
            </a-assets>
            <a-entity
              gltf-model="#model"
              scale="2 2 2"
              position="0 0 -3"
              rotation="0 0 0"
            ></a-entity>
            <a-camera position="0 1.6 0" look-controls="enabled: false"></a-camera>
          </a-scene>
          <script>
            console.log('[DEBUG] AR WebView script executing');
            document.addEventListener('DOMContentLoaded', () => {
              console.log('[INFO] AR WebView DOM loaded');
              window.ReactNativeWebView.postMessage('bridge-ready');
              const entity = document.querySelector('a-entity');
              entity.addEventListener('model-loaded', () => {
                console.log('[INFO] AR model loaded');
                window.ReactNativeWebView.postMessage('model-loaded');
                if (${isAnimating}) {
                  entity.setAttribute('animation-mixer', 'clip: *; loop: repeat;');
                }
              });
              entity.addEventListener('model-error', (event) => {
                console.error('[ERROR] Model load error:', event.detail.src);
                window.ReactNativeWebView.postMessage('model-error: ' + event.detail.src);
              });
            });
            window.addEventListener('message', (event) => {
              const entity = document.querySelector('a-entity');
              console.log('[DEBUG] AR WebView received message:', event.data);
              if (event.data === 'start') {
                entity.setAttribute('animation-mixer', 'clip: *; loop: repeat;');
              } else if (event.data === 'stop') {
                entity.setAttribute('animation-mixer', '');
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  // Pose Estimation WebView HTML with Canvas Overlay
  const getPoseEstimationHtml = () => {
    console.log('[DEBUG] Generating Pose Estimation WebView HTML');
    return `
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/pose.js"></script>
          <style>
            body { margin: 0; background: transparent; }
            #output_canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
            #video { width: 100%; height: 100%; display: none; }
          </style>
        </head>
        <body>
          <video id="video" autoplay playsinline style="display: none;"></video>
          <canvas id="output_canvas"></canvas>
          <script>
            console.log('[DEBUG] Pose Estimation script executing');
            function sendError(message) {
              console.error('[ERROR] ' + message);
              window.ReactNativeWebView.postMessage('Error: ' + message);
            }

            // Verify MediaPipe script loaded
            if (typeof Pose === 'undefined') {
              sendError('MediaPipe Pose library failed to load');
              return;
            }
            console.log('[INFO] MediaPipe Pose library loaded');
            window.ReactNativeWebView.postMessage('Pose library initialized');

            const videoElement = document.getElementById('video');
            const canvasElement = document.getElementById('output_canvas');
            const canvasCtx = canvasElement.getContext('2d');
            if (!videoElement || !canvasElement || !canvasCtx) {
              sendError('Failed to initialize video or canvas elements');
              return;
            }
            console.log('[INFO] Video and canvas elements initialized');

            // Adjust canvas size to match video
            function resizeCanvas() {
              canvasElement.width = window.innerWidth;
              canvasElement.height = window.innerHeight;
            }
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            const pose = new Pose({
              locateFile: (file) => {
                console.log('[DEBUG] Loading MediaPipe file:', file);
                return \`https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/\${file}\`;
              }
            });
            pose.setOptions({
              modelComplexity: 1,
              smoothLandmarks: true,
              enableSegmentation: false,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5
            });
            console.log('[INFO] Pose instance created with options');

            // Map MediaPipe landmark indices to custom names
            const landmarkNames = {
              11: 'left_shoulder',
              12: 'right_shoulder',
              13: 'left_elbow',
              14: 'right_elbow',
              15: 'left_wrist',
              16: 'right_wrist',
              23: 'left_hip',
              24: 'right_hip',
              25: 'left_knee',
              26: 'right_knee',
              27: 'left_ankle',
              28: 'right_ankle'
            };

            // Define connections between landmarks for drawing lines
            const connections = [
              // Torso
              ['left_shoulder', 'right_shoulder'],
              ['left_shoulder', 'left_hip'],
              ['right_shoulder', 'right_hip'],
              ['left_hip', 'right_hip'],
              // Left arm
              ['left_shoulder', 'left_elbow'],
              ['left_elbow', 'left_wrist'],
              // Right arm
              ['right_shoulder', 'right_elbow'],
              ['right_elbow', 'right_wrist'],
              // Left leg
              ['left_hip', 'left_knee'],
              ['left_knee', 'left_ankle'],
              // Right leg
              ['right_hip', 'right_knee'],
              ['right_knee', 'right_ankle']
            ];

            pose.onResults((results) => {
              console.log('[DEBUG] Pose results received');
              canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
              if (results.poseLandmarks) {
                const landmarks = results.poseLandmarks.map((lm, index) => ({
                  name: landmarkNames[index] || 'landmark_' + index,
                  x: lm.x * canvasElement.width,
                  y: lm.y * canvasElement.height,
                  z: lm.z
                }));

                // Draw lines and dots
                canvasCtx.strokeStyle = 'green';
                canvasCtx.lineWidth = 2;
                canvasCtx.fillStyle = 'red';

                // Draw lines between connected landmarks
                connections.forEach(([startName, endName]) => {
                  const start = landmarks.find(lm => lm.name === startName);
                  const end = landmarks.find(lm => lm.name === endName);
                  if (start && end) {
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(start.x, start.y);
                    canvasCtx.lineTo(end.x, end.y);
                    canvasCtx.stroke();
                  }
                });

                // Draw dots at landmark positions
                landmarks.forEach(lm => {
                  canvasCtx.beginPath();
                  canvasCtx.arc(lm.x, lm.y, 5, 0, 2 * Math.PI);
                  canvasCtx.fill();
                });

                // Filter landmarks to only include those in correct_pose_landmarks
                const filteredLandmarks = landmarks.filter(lm =>
                  ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow'].includes(lm.name)
                ).map(lm => ({
                  name: lm.name,
                  x: lm.x / canvasElement.width, // Normalize back to 0-1
                  y: lm.y / canvasElement.height,
                  z: lm.z
                }));

                window.ReactNativeWebView.postMessage(JSON.stringify(filteredLandmarks));
                console.log('[INFO] Sent landmarks:', JSON.stringify(filteredLandmarks));
              } else {
                console.log('[DEBUG] No pose landmarks detected, possibly due to partial body visibility');
                window.ReactNativeWebView.postMessage('No landmarks detected');
              }
            });

            function tryCameraAccess(attempt = 1, maxAttempts = 5) {
              console.log('[DEBUG] Attempting camera access, attempt:', attempt);
              navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then((stream) => {
                  console.log('[INFO] Camera stream accessed');
                  videoElement.srcObject = stream;
                  videoElement.play().then(() => {
                    console.log('[INFO] Video playback started');
                    function processFrame() {
                      if (videoElement.readyState >= 2) {
                        pose.send({ image: videoElement });
                      }
                      requestAnimationFrame(processFrame);
                    }
                    processFrame();
                  }).catch((error) => {
                    sendError('Failed to play video: ' + error.message);
                  });
                })
                .catch((error) => {
                  console.error('[ERROR] Camera access attempt ' + attempt + ' failed:', error.message);
                  if (attempt < maxAttempts) {
                    console.log('[DEBUG] Retrying camera access, attempt ' + (attempt + 1));
                    setTimeout(() => tryCameraAccess(attempt + 1, maxAttempts), 2000);
                  } else {
                    sendError('Camera access denied after ' + maxAttempts + ' attempts: ' + error.message);
                  }
                });
            }

            setTimeout(() => tryCameraAccess(), 1500); // Increased delay to avoid camera conflict
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {/* Camera Feed */}
      {useCameraView && Camera.CameraView && !cameraError ? (
        <Camera.CameraView
          style={StyleSheet.absoluteFill}
          facing="front"
          onCameraReady={() => {
            console.log('[INFO] Camera is ready');
            setIsCameraReady(true);
          }}
          onMountError={(error) => {
            console.error('[ERROR] Camera mount error:', error.message);
            setCameraError(error.message);
          }}
        />
      ) : useCameraView ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{cameraError || 'Camera unavailable'}</Text>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Camera feed disabled to attempt pose detection</Text>
        </View>
      )}

      {/* AR WebView */}
      {isWebViewValid && arPoseUrl && !webViewError ? (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: getARWebViewHtml() }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          style={{ backgroundColor: 'transparent' }}
          onLoadStart={() => console.log('[DEBUG] AR WebView loading started')}
          onLoadEnd={() => console.log('[INFO] AR WebView HTML fully loaded')}
          onError={(e) => {
            console.error('[ERROR] AR WebView load error:', e.nativeEvent.description);
            setWebViewError(e.nativeEvent.description);
          }}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            console.log('[DEBUG] AR WebView message:', data);
            if (data === 'bridge-ready') {
              setIsWebViewBridgeReady(true);
              console.log('[INFO] AR WebView bridge is ready');
            } else if (data === 'model-loaded') {
              setIsModelLoaded(true);
              console.log('[INFO] AR model fully loaded');
            } else if (data.startsWith('model-error:')) {
              console.error('[ERROR] AR model load failed:', data);
              setWebViewError('Failed to load AR model');
            }
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{webViewError || 'AR WebView error'}</Text>
        </View>
      )}

      {/* Pose Estimation WebView with Canvas Overlay */}
      {isCameraReady && (
        <WebView
          ref={poseWebViewRef}
          style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'transparent' }}
          source={{ html: getPoseEstimationHtml() }}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            console.log('[DEBUG] Pose WebView message received:', data);
            try {
              if (data === 'Pose library initialized') {
                setIsPoseWebViewInitialized(true);
                console.log('[INFO] Pose WebView initialized');
                return;
              }
              if (data.startsWith('Error:')) {
                console.error('[ERROR] Pose detection error:', data);
                setPoseDetectionError(data);
                return;
              }
              if (data === 'No landmarks detected') {
                console.log('[DEBUG] No landmarks detected by MediaPipe');
                setLandmarks([]);
                return;
              }
              const detectedLandmarks = JSON.parse(data);
              console.log('[INFO] Detected landmarks:', JSON.stringify(detectedLandmarks, null, 2));
              setLandmarks(detectedLandmarks);
              setPoseDetectionError(null);
            } catch (error) {
              console.error('[ERROR] Failed to parse pose landmarks:', error.message);
              setPoseDetectionError('Failed to parse pose data');
            }
          }}
          onError={(e) => {
            console.error('[ERROR] Pose WebView error:', e.nativeEvent.description);
            setPoseDetectionError('Pose WebView failed to load');
          }}
          onLoadStart={() => console.log('[DEBUG] Pose WebView loading started')}
          onLoadEnd={() => console.log('[INFO] Pose WebView HTML loaded')}
        />
      )}

      {/* Feedback and Error Display */}
      {(feedback || poseDetectionError) && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>
            {poseDetectionError || feedback}
          </Text>
        </View>
      )}

      {/* Header */}
      <LinearGradient
        colors={['rgba(51, 228, 219, 0.8)', 'rgba(0, 187, 211, 0.8)']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[DEBUG] Back button pressed');
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>AR Avatar Viewer</Text>
      </LinearGradient>

      {/* Pose Switching UI */}
      <ScrollView horizontal style={styles.poseSwitchContainer}>
        {poseRecommendations.map((therapy, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.poseButton,
              currentPoseIndex === index && styles.activePoseButton,
            ]}
            onPress={() => switchPose(index)}
          >
            <Text style={styles.poseButtonText}>{therapy.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading Overlay */}
      {!isModelLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00BBD3" />
          <Text style={styles.loadingText}>Loading AR Avatar...</Text>
        </View>
      )}

      {/* Start/Pause Button */}
      <TouchableOpacity
        style={[styles.fabPlay, !isModelLoaded && styles.fabDisabled]}
        onPress={toggleAnimation}
        disabled={!isModelLoaded}
      >
        <Ionicons
          name={isAnimating ? 'pause' : 'play'}
          size={24}
          color="white"
        />
        <Text style={styles.fabText}>{isAnimating ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>

      {/* End Button */}
      <TouchableOpacity style={styles.fabEnd} onPress={handleEndSession}>
        <Ionicons name="stop-circle-outline" size={24} color="white" />
        <Text style={styles.fabText}>End</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 20,
  },
  headerText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  fabPlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BBD3',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabEnd: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4D4F',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#00BBD3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  poseSwitchContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
  },
  poseButton: {
    padding: 10,
    margin: 5,
    backgroundColor: '#00BBD3',
    borderRadius: 5,
  },
  activePoseButton: {
    backgroundColor: '#33E4DB',
  },
  poseButtonText: {
    color: 'white',
    fontSize: 14,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  feedbackText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ARAvatarScreen;