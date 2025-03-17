import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Camera from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import WebView from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ScreenOrientation from 'expo-screen-orientation';

const ARAvatarScreen = ({ route, navigation }) => {
  const { arPoseUrl, therapyName } = route.params || {};
  console.log('[DEBUG] Route params received:', JSON.stringify(route.params, null, 2));

  // State variables
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isWebViewValid, setIsWebViewValid] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [webViewError, setWebViewError] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isWebViewBridgeReady, setIsWebViewBridgeReady] = useState(false); // Track bridge readiness
  const webViewRef = useRef(null);

  // Lock to landscape on mount, unlock on unmount
  useEffect(() => {
    console.log('[DEBUG] Component mounted');
    const lockOrientation = async () => {
      try {
        console.log('[DEBUG] Locking screen to landscape');
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        console.log('[DEBUG] Current orientation:', currentOrientation);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        console.log('[INFO] Screen locked to landscape');
      } catch (error) {
        console.error('[ERROR] Failed to lock orientation:', error.message);
      }
    };

    const unlockOrientation = async () => {
      try {
        console.log('[DEBUG] Unlocking screen orientation');
        await ScreenOrientation.unlockAsync();
        console.log('[INFO] Screen orientation unlocked');
      } catch (error) {
        console.error('[ERROR] Failed to unlock orientation:', error.message);
      }
    };

    lockOrientation();
    return () => {
      console.log('[DEBUG] Component unmounting');
      unlockOrientation();
    };
  }, []);

  // Validate components
  useEffect(() => {
    console.log('[DEBUG] Validating components');
    if (!Camera.CameraView) {
      console.error('[ERROR] CameraView unavailable');
      setCameraError('Camera component unavailable');
    }
    if (!WebView) {
      console.error('[ERROR] WebView unavailable');
      setIsWebViewValid(false);
    } else {
      console.log('[INFO] WebView component validated');
      setIsWebViewValid(true);
    }
    if (!navigation?.navigate) {
      console.error('[ERROR] Navigation prop invalid');
    }
  }, [navigation]);

  // Validate arPoseUrl
  useEffect(() => {
    console.log('[DEBUG] Validating arPoseUrl:', arPoseUrl);
    if (!arPoseUrl) {
      console.warn('[WARN] arPoseUrl missing');
      setWebViewError('arPoseUrl is missing');
    } else {
      try {
        new URL(arPoseUrl);
        console.log('[INFO] arPoseUrl valid');
      } catch (error) {
        console.error('[ERROR] Invalid arPoseUrl:', error.message);
        setWebViewError('Invalid arPoseUrl');
      }
    }
  }, [arPoseUrl]);

  // Handle camera permission
  useEffect(() => {
    if (!permission) {
      console.log('[DEBUG] Permission not initialized');
      return;
    }
    if (permission.status !== 'granted') {
      console.log('[DEBUG] Requesting camera permission');
      requestPermission();
    } else {
      console.log('[INFO] Camera permission granted');
    }
  }, [permission, requestPermission]);

  // Toggle animation with fallback
  const toggleAnimation = () => {
    if (!isModelLoaded) {
      console.log('[DEBUG] Animation toggle ignored: model not loaded');
      return;
    }
    setIsAnimating((prev) => {
      const newState = !prev;
      console.log('[DEBUG] Toggling animation to:', newState);
      if (isWebViewBridgeReady && webViewRef.current) {
        const message = newState ? 'start' : 'stop';
        console.log('[DEBUG] Attempting to send message to WebView:', message);
        try {
          webViewRef.current.postMessage(message);
          console.log('[INFO] Message sent successfully');
        } catch (error) {
          console.error('[ERROR] Failed to send message:', error.message);
        }
      } else {
        console.warn('[WARN] WebView bridge not ready or ref missing, animation state updated locally');
      }
      return newState;
    });
  };

  // navigates back
  const handleEndSession = async () => {
    console.log('[DEBUG] Ending session');
    try {
      if (webViewRef.current && isWebViewBridgeReady) {
        console.log('[DEBUG] Sending stop message before navigation');
        webViewRef.current.postMessage('stop'); // Stop animation in WebView
      }
      console.log('[DEBUG] Locking to portrait');
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); // Lock to portrait before leaving
      console.log('[INFO] Navigating back to previous screen');
      navigation.goBack();
    } catch (error) {
      console.error('[ERROR] Failed to end session:', error.message);
    }
  };

  // Permission loading state
  if (!permission) {
    console.log('[DEBUG] Waiting for permission');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BBD3" />
        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  // Permission denied state
  if (permission.status !== 'granted') {
    console.log('[DEBUG] Permission denied');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Camera permission required</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // WebView HTML with dynamic animation control
  const getWebViewHtml = () => `
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
          console.log('WebView script executing');
          document.addEventListener('DOMContentLoaded', () => {
            console.log('WebView DOM loaded');
            window.ReactNativeWebView.postMessage('bridge-ready');
            const entity = document.querySelector('a-entity');
            entity.addEventListener('model-loaded', () => {
              console.log('Model loaded');
              window.ReactNativeWebView.postMessage('model-loaded');
              if (${isAnimating}) {
                entity.setAttribute('animation-mixer', 'clip: *; loop: repeat;');
              }
            });
            entity.addEventListener('model-error', (event) => {
              console.error('Model error:', event.detail.src);
              window.ReactNativeWebView.postMessage('model-error: ' + event.detail.src);
            });
          });
          window.addEventListener('message', (event) => {
            const entity = document.querySelector('a-entity');
            console.log('Received message:', event.data);
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

  return (
    <View style={styles.container}>
      {/* Camera Feed */}
      {Camera.CameraView && !cameraError ? (
        <Camera.CameraView
          style={StyleSheet.absoluteFill}
          facing="front"
          onCameraReady={() => {
            console.log('[INFO] Camera ready');
            setIsCameraReady(true);
          }}
          onMountError={(error) => {
            console.error('[ERROR] Camera error:', error.message);
            setCameraError(error.message);
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{cameraError || 'Camera unavailable'}</Text>
        </View>
      )}

      {/* WebView for AR Avatar */}
      {isWebViewValid && arPoseUrl && !webViewError ? (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: getWebViewHtml() }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          style={{ backgroundColor: 'transparent' }}
          onLoadStart={() => console.log('[DEBUG] WebView loading started')}
          onLoadEnd={() => console.log('[INFO] WebView HTML loaded')}
          onError={(e) => {
            console.error('[ERROR] WebView error:', e.nativeEvent.description);
            setWebViewError(e.nativeEvent.description);
          }}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            console.log('[DEBUG] WebView message received:', data);
            if (data === 'bridge-ready') {
              console.log('[INFO] WebView bridge ready');
              setIsWebViewBridgeReady(true);
            } else if (data === 'model-loaded') {
              console.log('[INFO] Model fully loaded');
              setIsModelLoaded(true);
            } else if (data.startsWith('model-error:')) {
              console.error('[ERROR] Model load failed:', data);
              setWebViewError('Failed to load model');
            }
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{webViewError || 'WebView error'}</Text>
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
          {/* <Ionicons name="arrow-back" size={24} color="white" /> */}
        </TouchableOpacity>
        <Text style={styles.headerText}>AR Avatar Viewer</Text>
      </LinearGradient>

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
});

export default ARAvatarScreen;

// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
// } from 'react-native';
// import * as Camera from 'expo-camera';
// import { useCameraPermissions } from 'expo-camera';
// import WebView from 'react-native-webview';
// import { LinearGradient } from 'expo-linear-gradient';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import * as ScreenOrientation from 'expo-screen-orientation'; 
// // type ARAvatarScreenProps = {
// //   route: {
// //     params: {
// //       arPoseUrl: string;
// //       therapyName: string;
// //       poseLandmarks: { x: number; y: number; name: string }[];
// //     };
// //   };
// //   navigation: any;
// // };

// const ARAvatarScreen = ({ route, navigation }) => {
//   const { arPoseUrl, therapyName } = route.params || {};
//   console.log('[DEBUG] Route params received:', JSON.stringify(route.params, null, 2));

//   // State variables
//   const [permission, requestPermission] = useCameraPermissions();
//   const [isCameraReady, setIsCameraReady] = useState(false);
//   const [isWebViewValid, setIsWebViewValid] = useState(false);
// const [cameraError, setCameraError] = useState(null);
// const [webViewError, setWebViewError] = useState(null);
//  const [isModelLoaded, setIsModelLoaded] = useState(false);
// const [isAnimating, setIsAnimating] = useState(false);
// const [isWebViewBridgeReady, setIsWebViewBridgeReady] = useState(false);
//   // const [feedback, setFeedback] = useState<string>('');
//   // const [isPoseDetectionReady, setIsPoseDetectionReady] = useState(false);
//   const webViewRef = useRef(null);

//   // useEffect(() => {
//   //   console.log('[DEBUG] Validating poseLandmarks');
//   //   if (!poseLandmarks || poseLandmarks.length === 0) {
//   //     console.warn('[WARN] No pose landmarks provided');
//   //     setFeedback('No reference pose data available');
//   //   } else {
//   //     console.log('[INFO] Pose landmarks received:', JSON.stringify(poseLandmarks, null, 2));
//   //   }
//   // }, [poseLandmarks]);

//   // locking effect from original
//   useEffect(() => {
//     console.log('[DEBUG] Component mounted');
//     const lockOrientation = async () => {
//       try {
//         console.log('[DEBUG] Locking screen to landscape');
//         const currentOrientation = await ScreenOrientation.getOrientationAsync();
//         console.log('[DEBUG] Current orientation:', currentOrientation);
//         await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
//         console.log('[INFO] Screen locked to landscape');
//       } catch (error) {
//         console.error('[ERROR] Failed to lock orientation:', error.message);
//       }
//     };

//     const unlockOrientation = async () => {
//       try {
//         console.log('[DEBUG] Unlocking screen orientation');
//         await ScreenOrientation.unlockAsync();
//         console.log('[INFO] Screen orientation unlocked');
//       } catch (error) {
//         console.error('[ERROR] Failed to unlock orientation:', error.message);
//       }
//     };

//     lockOrientation();
//     return () => {
//       console.log('[DEBUG] Component unmounting');
//       unlockOrientation();
//     };
//   }, []);

//   // Validate components
//   useEffect(() => {
//     console.log('[DEBUG] Validating components');
//     if (!Camera.CameraView) {
//       console.error('[ERROR] CameraView unavailable');
//       setCameraError("Camera component unavailable");
//     }
//     if (!WebView) {
//       console.error('[ERROR] WebView unavailable');
//       setIsWebViewValid(false);
//     } else {
//       console.log('[INFO] WebView component validated');
//       setIsWebViewValid(true);
//     }
//     if (!navigation?.navigate) {
//       console.error('[ERROR] Navigation prop invalid');
//     }
//   }, [navigation]);

//   // arPoseUrl validation
//   useEffect(() => {
//     console.log('[DEBUG] Validating arPoseUrl:', arPoseUrl);
//     if (!arPoseUrl) {
//       console.warn('[WARN] arPoseUrl missing');
//       setWebViewError('arPoseUrl is missing');
//     } else {
//       try {
//         new URL(arPoseUrl);
//         console.log('[INFO] arPoseUrl valid');
//       } catch (error) {
//         console.error('[ERROR] Invalid arPoseUrl:', error.message);
//         setWebViewError('Invalid arPoseUrl');
//       }
//     }
//   }, [arPoseUrl]);

//   // Camera permission handling
//   useEffect(() => {
//     if (!permission) {
//       console.log('[DEBUG] Permission not initialized');
//       return;
//     }
//     if (permission.status !== 'granted') {
//       console.log('[DEBUG] Requesting camera permission');
//       requestPermission();
//     } else {
//       console.log('[INFO] Camera permission granted');
//     }
//   }, [permission, requestPermission]);

//   // Animation toggle function
//   const toggleAnimation = () => {
//     if (!isModelLoaded) {
//       console.log('[DEBUG] Animation toggle ignored: model not loaded');
//       return;
//     }
//     setIsAnimating((prev) => {
//       const newState = !prev;
//       console.log('[DEBUG] Toggling animation to:', newState);
//       if (isWebViewBridgeReady && webViewRef.current) {
//         const message = newState ? 'start' : 'stop';
//         console.log('[DEBUG] Sending message to WebView:', message);
//         try {
//           webViewRef.current.postMessage(message);
//           console.log('[INFO] Message sent successfully');
//         } catch (error) {
//           console.error('[ERROR] Failed to send message:', error.message);
//         }
//       } else {
//         console.warn('[WARN] WebView bridge not ready or ref missing');
//       }
//       return newState;
//     });
//   };

//   // End session function
//   const handleEndSession = async () => {
//     console.log('[DEBUG] Ending session');
//     try {
//       if (webViewRef.current && isWebViewBridgeReady) {
//         console.log('[DEBUG] Sending stop message before navigation');
//         webViewRef.current.postMessage('stop');
//       }
//       console.log('[DEBUG] Locking to portrait');
//       await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
//       console.log('[INFO] Navigating to TherapyDetails');
//       navigation.navigate('TherapyDetails', { therapyName });
//     } catch (error) {
//       console.error('[ERROR] Failed to end session:', error.message);
//     }
//   };

//   // Permission loading state
//   if (!permission) {
//     console.log('[DEBUG] Waiting for permission');
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#00BBD3" />
//         <Text style={styles.loadingText}>Checking camera permission...</Text>
//       </View>
//     );
//   }

//   // Permission denied state
//   if (permission.status !== 'granted') {
//     console.log('[DEBUG] Permission denied');
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={styles.errorText}>Camera permission required</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
//           <Text style={styles.retryButtonText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // WebView HTML with dynamic animation control
//  const getWebViewHtml = () => `
//     <html>
//       <head>
//         <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
//         <script src="https://unpkg.com/aframe-extras@7.4.0/dist/aframe-extras.min.js"></script>
//         <!-- <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466008/camera_utils.js" crossorigin="anonymous"></script> -->
//         <!-- <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js" crossorigin="anonymous"></script> -->
        
//         <style>
//           body { margin: 0; background: transparent; overflow: hidden; }
//           a-scene { background: transparent; }
//           /* a-scene { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent; } */
//           /* #videoElement { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; } */
//         </style>
//       </head>
      
//       <body>
//         <!-- <video id="videoElement" autoplay playsinline></video> -->
//         <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;">
//           <a-assets>
//             <a-asset-item id="model" src="${arPoseUrl}"></a-asset-item>
//           </a-assets>
          
//           <a-entity
//             gltf-model="#model"
//             scale="2 2 2"
//             position="0 0 -3"
//             rotation="0 0 0"
//           ></a-entity>
//           <a-camera position="0 1.6 0" look-controls="enabled: false"></a-camera>
//         </a-scene>
        
//         <script>
//           console.log('[DEBUG] WebView script executing');
//           console.log('[DEBUG] Reference pose loaded:', referencePose); -->

//           <!-- if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//             console.error('[ERROR] getUserMedia not supported');
//             window.ReactNativeWebView.postMessage('pose-detection-error: getUserMedia not supported');
//             return;
//           } -->

//           <!-- const pose = new Pose({
//             locateFile: (file) => {
//               console.log('[DEBUG] Loading MediaPipe file:', file);
//               return \`https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/\${file}\`;
//             },
//           }); -->
//           <!-- pose.setOptions({
//             modelComplexity: 1,
//             smoothLandmarks: true,
//             minDetectionConfidence: 0.5,
//             minTrackingConfidence: 0.5,
//           });
//           pose.onResults(onResults); -->

//           <!-- const videoElement = document.getElementById('videoElement');
//           const camera = new Camera(videoElement, {
//             onFrame: async () => {
//               await pose.send({ image: videoElement });
//             },
//             width: 640,
//             height: 480,
//           }); -->

//           <!-- navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
//             .then((stream) => {
//               videoElement.srcObject = stream;
//               videoElement.onloadedmetadata = () => {
//                 videoElement.play();
//                 camera.start().then(() => {
//                   console.log('[INFO] Camera started for pose detection');
//                   window.ReactNativeWebView.postMessage('pose-detection-ready');
//                 }).catch(err => {
//                   console.error('[ERROR] Camera start failed:', err);
//                   window.ReactNativeWebView.postMessage('pose-detection-error: ' + err.message);
//                 });
//               };
//             })
//             .catch(err => {
//               console.error('[ERROR] getUserMedia failed:', err);
//               window.ReactNativeWebView.postMessage('pose-detection-error: ' + err.message);
//             }); -->

//           <!-- function onResults(results) {
//             if (!results.poseLandmarks) {
//               console.log('[DEBUG] No pose landmarks detected');
//               window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'No pose detected' }));
//               return;
//             }

//             console.log('[DEBUG] Pose landmarks detected:', results.poseLandmarks);
//             const deviation = calculatePoseDeviation(results.poseLandmarks, referencePose);
//             console.log('[DEBUG] Calculated deviation:', deviation);
//             window.ReactNativeWebView.postMessage(JSON.stringify(deviation));
//           } -->

//           <!-- function calculatePoseDeviation(userLandmarks, referenceLandmarks) {
//             console.log('[DEBUG] Calculating pose deviation');
//             if (!referenceLandmarks || referenceLandmarks.length === 0) {
//               console.warn('[WARN] No reference landmarks available');
//               return { error: 'No reference pose' };
//             }

//             let totalDeviation = 0;
//             let feedback = '';

//             referenceLandmarks.forEach(refPoint => {
//               const userPoint = userLandmarks.find(p => p.name === refPoint.name);
//               if (!userPoint) {
//                 console.warn('[WARN] Missing user keypoint:', refPoint.name);
//                 return;
//               }

//               const distance = Math.sqrt(
//                 Math.pow(userPoint.x - refPoint.x, 2) +
//                 Math.pow(userPoint.y - refPoint.y, 2)
//               );
//               totalDeviation += distance;
//               console.log('[DEBUG] Distance for keypoint', refPoint.name, ':', distance);
//             });

//             totalDeviation /= referenceLandmarks.length;
//             console.log('[DEBUG] Average deviation:', totalDeviation);

//             if (totalDeviation < 0.1) {
//               feedback = 'Good posture!';
//             } else if (totalDeviation < 0.2) {
//               feedback = 'Slightly adjust your posture';
//             } else {
//               feedback = 'Straighten your back and adjust position';
//             }

//             return { deviation: totalDeviation, feedback };
//           } -->

//           document.addEventListener('DOMContentLoaded', () => {
//             console.log('[DEBUG] WebView DOM loaded');
//             window.ReactNativeWebView.postMessage('bridge-ready');
//             const entity = document.querySelector('a-entity');
//             entity.addEventListener('model-loaded', () => {
//               console.log('[INFO] Model loaded');
//               window.ReactNativeWebView.postMessage('model-loaded');
//               if (${isAnimating}) {
//                 entity.setAttribute('animation-mixer', 'clip: *; loop: repeat;');
//               }
//             });
//             entity.addEventListener('model-error', (event) => {
//               console.error('[ERROR] Model error:', event.detail.src);
//               window.ReactNativeWebView.postMessage('model-error: ' + event.detail.src);
//             });
//           });

//           window.addEventListener('message', (event) => {
//             const entity = document.querySelector('a-entity');
//             console.log('[DEBUG] Received message:', event.data);
//             if (event.data === 'start') {
//               entity.setAttribute('animation-mixer', 'clip: *; loop: repeat;');
//             } else if (event.data === 'stop') {
//               entity.setAttribute('animation-mixer', '');
//             }
//           });
//         </script>
//       </body>
//     </html>
//   `;

//   return (
//     <View style={styles.container}>
//       {/* Camera Feed */}
//       {Camera.CameraView && !cameraError ? (
//           <Camera.CameraView
//             style={StyleSheet.absoluteFill}
//             facing="front"
//             onCameraReady={() => {
//               console.log('[INFO] Camera ready');
//               setIsCameraReady(true);
//             }}
//             onMountError={(error) => {
//               console.error('[ERROR] Camera error:', error.message);
//               setCameraError(error.message);
//             }}
//           />
//         ) : (
//           <View style={styles.errorContainer}>
//             <Text style={styles.errorText}>{cameraError || 'Camera unavailable'}</Text>
//           </View>
//         )}

//       {/* WebView for AR Avatar */}
//       {isWebViewValid && arPoseUrl && !webViewError ? (
//         <WebView
//         ref={webViewRef}
//         style={StyleSheet.absoluteFill}
//         source={{ html: getWebViewHtml() }}
//         allowsInlineMediaPlayback={true}
//         mediaPlaybackRequiresUserAction={false}
//         style={{ backgroundColor: 'transparent' }}
//         onLoadStart={() => console.log('[DEBUG] WebView loading started')}
//         onLoadEnd={() => console.log('[INFO] WebView HTML loaded')}
//         onError={(e) => {
//           console.error('[ERROR] WebView error:', e.nativeEvent.description);
//           setWebViewError(e.nativeEvent.description);
//         }}
//         onMessage={(event) => {
//           const data = event.nativeEvent.data;
//           console.log('[DEBUG] WebView message received:', data);
//           if (data === 'bridge-ready') {
//             console.log('[INFO] WebView bridge ready');
//             setIsWebViewBridgeReady(true);
//           } else if (data === 'model-loaded') {
//             console.log('[INFO] Model fully loaded');
//             setIsModelLoaded(true);
//           } else if (data.startsWith('model-error:')) {
//             console.error('[ERROR] Model load failed:', data);
//             setWebViewError('Failed to load model');
//           }
//         }}
//       />

//         // <WebView
//         //   ref={webViewRef}
//         //   style={StyleSheet.absoluteFill}
//         //   source={{ html: getWebViewHtml() }}
//         //   allowsInlineMediaPlayback={true}
//         //   mediaPlaybackRequiresUserAction={false}
//         //   style={{ backgroundColor: 'transparent' }} /* Unchanged: Styling from original */
//         //   onLoadStart={() => console.log('[DEBUG] WebView loading started')}
//         //   onLoadEnd={() => console.log('[INFO] WebView HTML loaded')}
//         //   onError={(e) => {
//         //     console.error('[ERROR] WebView error:', e.nativeEvent.description);
//         //     setWebViewError(e.nativeEvent.description);
//         //   }}
//         //   onMessage={(event) => {
//         //     const data = event.nativeEvent.data;
//         //     console.log('[DEBUG] WebView message received:', data);
//         //     // Unchanged: Bridge and model-loaded handlers from original
//         //     if (data === 'bridge-ready') {
//         //       setIsWebViewBridgeReady(true);
//         //     } else if (data === 'model-loaded') {
//         //       setIsModelLoaded(true);
//         //     } 
//         //     // New: Pose detection and error handlers, not in original
//         //     else if (data === 'pose-detection-ready') {
//         //       setIsPoseDetectionReady(true);
//         //     } else if (data.startsWith('pose-detection-error:')) {
//         //       console.error('[ERROR] Pose detection failed:', data);
//         //       setFeedback('Pose detection failed: ' + data.split(': ')[1]);
//         //     } 
//         //     // Modified: Model error handler expanded from original
//         //     else if (data.startsWith('model-error:')) {
//         //       console.error('[ERROR] Model load failed:', data);
//         //       setWebViewError('Failed to load model');
//         //     } 
//         //     // New: Pose deviation parsing, not in original
//         //     else {
//         //       try {
//         //         const parsedData = JSON.parse(data);
//         //         if (parsedData.error) {
//         //           console.warn('[WARN] Pose detection error:', parsedData.error);
//         //           setFeedback(parsedData.error);
//         //         } else {
//         //           console.log('[DEBUG] Pose deviation data:', parsedData);
//         //           setFeedback(parsedData.feedback);
//         //         }
//         //       } catch (error) {
//         //         console.error('[ERROR] Failed to parse WebView message:', error.message);
//         //       }
//         //     }
//         //   }}
//         // />
//       ) : (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{webViewError || 'WebView error'}</Text>
//         </View>
//       )}

//       {/* Header */}
//       <LinearGradient
//         colors={['rgba(51, 228, 219, 0.8)', 'rgba(0, 187, 211, 0.8)']}
//         style={styles.header}
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => {
//             console.log('[DEBUG] Back button pressed');
//             navigation.goBack();
//           }}
//         >
//           <Ionicons name="arrow-back" size={24} color="white" />
//         </TouchableOpacity>
//         <Text style={styles.headerText}>AR Avatar Viewer</Text>
//       </LinearGradient>

//       {/* Loading Overlay */}
//       {!isModelLoaded && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="large" color="#00BBD3" />
//           <Text style={styles.loadingText}>Loading AR Avatar...</Text>
//         </View>
//       )}
      
//       {/* {(!isModelLoaded || !isPoseDetectionReady) && ( */}
//          {/* <View style={styles.loadingOverlay}> */}
//            {/* <ActivityIndicator size="large" color="#00BBD3" /> */}
//            {/* <Text style={styles.loadingText}> */}
//              {/* {isModelLoaded ? 'Starting pose detection...' : 'Loading AR Avatar...'} New: Dynamic text */}
//            {/* </Text> */}
//         {/* </View> */}
//       {/* )} */}

//       {/* {isModelLoaded && isPoseDetectionReady && feedback && ( */}
//         {/* <View style={styles.feedbackOverlay}> */}
//           {/* <Text style={styles.feedbackText}>{feedback}</Text> */}
//         {/* </View> */}
//       {/* )} */}

//       {/* Start/Pause button */}
//       <TouchableOpacity
//         style={[styles.fabPlay, !isModelLoaded && styles.fabDisabled]}
//         onPress={toggleAnimation}
//         disabled={!isModelLoaded}
//       >
//         <Ionicons
//           name={isAnimating ? 'pause' : 'play'}
//           size={24}
//           color="white"
//         />
//         <Text style={styles.fabText}>{isAnimating ? 'Pause' : 'Start'}</Text>
//       </TouchableOpacity>

//       {/* End button */}
//       <TouchableOpacity style={styles.fabEnd} onPress={handleEndSession}>
//         <Ionicons name="stop-circle-outline" size={24} color="white" />
//         <Text style={styles.fabText}>End</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   header: {
//     height: 60,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingTop: 10,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     top: 20,
//   },
//   headerText: {
//     fontSize: 20,
//     color: 'white',
//     fontWeight: '600',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     color: 'red',
//     textAlign: 'center',
//     fontSize: 16,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   loadingText: {
//     color: 'white',
//     marginTop: 10,
//     fontSize: 16,
//   },
//   // feedbackOverlay: {
//   //   position: 'absolute',
//   //   bottom: 100,
//   //   left: 0,
//   //   right: 0,
//   //   backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   //   padding: 10,
//   //   alignItems: 'center',
//   // },
//   // feedbackText: {
//   //   color: 'white',
//   //   fontSize: 18,
//   //   fontWeight: 'bold',
//   // },
//   fabPlay: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#00BBD3',
//     padding: 15,
//     borderRadius: 30,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//   },
//   fabEnd: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FF4D4F',
//     padding: 15,
//     borderRadius: 30,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//   },
//   fabText: {
//     color: 'white',
//     marginLeft: 10,
//     fontSize: 16,
//   },
//   fabDisabled: {
//     opacity: 0.5,
//   },
//   retryButton: {
//     marginTop: 20,
//     backgroundColor: '#00BBD3',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 25,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//   },
// });

// export default ARAvatarScreen;