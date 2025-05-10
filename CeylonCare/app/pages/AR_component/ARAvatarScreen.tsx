import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
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
  reference_video?: string;
};

// Define Pose Landmark Type
type PoseLandmark = {
  name: string;
  x: number;
  y: number;
  z?: number;
};

const ARAvatarScreen = ({ route, navigation }) => {
  const params = useMemo(() => route.params || {}, [route.params]);
  const recommendations = useMemo(
    () => [{ name: params.therapyName, ar_pose: params.arPoseUrl, reference_video: params.referenceVideo }],
    [params.therapyName, params.arPoseUrl, params.referenceVideo]
  );
  console.log('[DEBUG] Route params:', JSON.stringify(params, null, 2));

  const [isWebViewValid, setIsWebViewValid] = useState(false);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isWebViewBridgeReady, setIsWebViewBridgeReady] = useState(false);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseRecommendations, setPoseRecommendations] = useState<Recommendation[]>(recommendations);
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [feedback, setFeedback] = useState<string>('Please stand 2-3 meters back to ensure your full body is visible.');
  const [poseDetectionError, setPoseDetectionError] = useState<string | null>(null);
  const [isPoseWebViewInitialized, setIsPoseWebViewInitialized] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationLandmarks, setCalibrationLandmarks] = useState<PoseLandmark[]>([]);
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const webViewRef = useRef<WebView>(null);
  const poseWebViewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log('[DEBUG] Mounting ARAvatarScreen');
    return () => console.log('[DEBUG] Unmount reason: component cleanup');
  }, []);

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'This app uses the camera for pose detection.',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            }
          );
          setHasCameraPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
          console.log('[INFO] Android camera permission:', granted);
        } else {
          setHasCameraPermission(true);
          console.log('[INFO] iOS camera permission: assumed granted');
        }
      } catch (error) {
        console.error('[ERROR] Permission request failed:', error.message);
        setHasCameraPermission(false);
      }
    };
    requestCameraPermission();
  }, []);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        console.log('[INFO] Locked to landscape');
      } catch (error) {
        console.error('[ERROR] Lock orientation failed:', error.message);
      }
    };
    lockOrientation();
    return () => ScreenOrientation.unlockAsync().catch((error) => console.error('[ERROR] Unlock orientation failed:', error.message));
  }, []);

  useEffect(() => {
    console.log('[DEBUG] Validating components');
    setIsWebViewValid(!!WebView);
    if (!navigation?.navigate) console.error('[ERROR] Invalid navigation prop');
  }, [navigation]);

  const fetchTherapyDetails = useCallback(async () => {
    try {
      const updatedRecommendations = await Promise.all(
        recommendations.map(async (therapy) => {
          try {
            const response = await axios.get(
              `http://192.168.8.134:5000/therapy_details/${encodeURIComponent(therapy.name)}`,
              { timeout: 10000 }
            );
            console.log('[DEBUG] Therapy details:', JSON.stringify(response.data, null, 2));
            return {
              ...therapy,
              ar_pose: response.data.ar_pose || therapy.ar_pose,
              correct_pose_landmarks: response.data.correct_pose_landmarks || [],
              reference_video: response.data.reference_video || therapy.referenceVideo,
            };
          } catch (error) {
            console.error('[ERROR] Fetch therapy failed:', therapy.name, error.message);
            return therapy;
          }
        })
      );
      setPoseRecommendations(updatedRecommendations);
    } catch (error) {
      console.error('[ERROR] Fetch therapy details failed:', error.message);
    }
  }, [recommendations]);

  useEffect(() => {
    if (recommendations.length > 0) fetchTherapyDetails();
  }, [fetchTherapyDetails]);

  useEffect(() => {
    if (!landmarks.length && !poseDetectionError && isPoseWebViewInitialized && !isCalibrated) {
      const timeout = setTimeout(() => {
        setPoseDetectionError(
          'No landmarks detected. Ensure good lighting, stand 2-3 meters away, wear fitted clothing.'
        );
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [landmarks, poseDetectionError, isPoseWebViewInitialized, isCalibrated]);

  const toggleAnimation = () => {
    if (!isModelLoaded) return;
    setIsAnimating((prev) => {
      const newState = !prev;
      if (isWebViewBridgeReady && webViewRef.current) {
        webViewRef.current.postMessage(newState ? 'start' : 'stop');
        console.log('[INFO] Animation toggled:', newState);
      }
      return newState;
    });
  };

  const switchPose = (index: number) => {
    if (index < 0 || index >= poseRecommendations.length) return;
    setCurrentPoseIndex(index);
    setIsModelLoaded(false);
    setLandmarks([]);
    setFeedback('Please stand 2-3 meters back to ensure your full body is visible.');
    setPoseDetectionError(null);
    setIsCalibrated(false);
    setCalibrationLandmarks([]);
    if (webViewRef.current && isWebViewBridgeReady) webViewRef.current.postMessage('stop');
    console.log('[INFO] Switched to pose:', poseRecommendations[index].name);
  };

  const calibratePose = () => {
    if (landmarks.length) {
      setCalibrationLandmarks(landmarks);
      setIsCalibrated(true);
      setFeedback(language === 'en' ? 'Calibration complete. Try the pose now.' : 'කැලිබ්‍රේෂන් සම්පූර්ණයි.');
      console.log('[INFO] Calibration set:', JSON.stringify(landmarks, null, 2));
    } else {
      setFeedback(language === 'en' ? 'No landmarks detected for calibration.' : 'කැලිබ්‍රේෂන් සඳහා බිම් සලකුණු නැත.');
    }
  };

  const retryPoseDetection = () => {
    setPoseDetectionError(null);
    setLandmarks([]);
    setIsPoseWebViewInitialized(false);
    if (poseWebViewRef.current) poseWebViewRef.current.reload();
    console.log('[INFO] Retrying pose detection');
  };

  useEffect(() => {
    const comparePoses = () => {
      const currentPose = poseRecommendations[currentPoseIndex];
      if (!currentPose || !currentPose.correct_pose_landmarks?.length) {
        setFeedback(language === 'en' ? 'Error: No reference pose data.' : 'දෝෂය: යොමු ඉරියව් දත්ත නැත.');
        return;
      }
      if (!landmarks.length) {
        setFeedback(language === 'en' ? 'No pose detected.' : 'ඉරියව්ව හඳුනාගත නොහැක.');
        return;
      }

      let feedbackMessage = '';
      const normalizedLandmarks = isCalibrated
        ? landmarks.map((lm) => {
            const calib = calibrationLandmarks.find((c) => c.name === lm.name);
            return calib
              ? { ...lm, x: lm.x - calib.x + 0.5, y: lm.y - calib.y + 0.5 }
              : lm;
          })
        : landmarks;

      currentPose.correct_pose_landmarks.forEach((correct) => {
        const detected = normalizedLandmarks.find((l) => l.name === correct.name);
        if (detected) {
          const xDiff = Math.abs(detected.x - correct.x);
          const yDiff = Math.abs(detected.y - correct.y);
          if (xDiff > 0.15 || yDiff > 0.15) {
            feedbackMessage += language === 'en'
              ? `Adjust ${correct.name} position\n`
              : `${correct.name} ස්ථානය සකස් කරන්න\n`;
          }
        } else {
          feedbackMessage += language === 'en'
            ? `Cannot detect ${correct.name}\n`
            : `${correct.name} හඳුනාගත නොහැක\n`;
        }
      });

      setFeedback(feedbackMessage || (language === 'en' ? 'Pose looks good!' : 'ඉරියව්ව හොඳයි!'));
      console.log('[INFO] Feedback:', feedbackMessage || 'Pose looks good!');
    };
    comparePoses();
  }, [landmarks, currentPoseIndex, poseRecommendations, isCalibrated, language]);

  const handleEndSession = async () => {
    if (webViewRef.current && isWebViewBridgeReady) webViewRef.current.postMessage('stop');
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    navigation.goBack();
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'si' : 'en');

  if (hasCameraPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BBD3" />
        <Text style={styles.loadingText}>{language === 'en' ? 'Checking camera permission...' : 'කැමරා අවසරය පරීක්ෂා කරමින්...'}</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{language === 'en' ? 'Camera permission required.' : 'කැමරා අවසරය අවශ්‍යයි.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={async () => {
          if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
            setHasCameraPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
          }
        }}>
          <Text style={styles.retryButtonText}>{language === 'en' ? 'Retry' : 'නැවත උත්සාහ කරන්න'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPose = poseRecommendations[currentPoseIndex];
  const arPoseUrl = currentPose?.ar_pose;

  const getARWebViewHtml = () => {
    if (!arPoseUrl) return '<html><body><p>No AR pose URL available</p></body></html>';
    return `
      <html>
        <head>
          <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
          <script src="https://unpkg.com/aframe-extras@7.4.0/dist/aframe-extras.min.js"></script>
          <style>body { margin: 0; background: transparent; } a-scene { background: transparent; }</style>
        </head>
        <body>
          <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;">
            <a-assets><a-asset-item id="model" src="${arPoseUrl}"></a-asset-item></a-assets>
            <a-entity gltf-model="#model" scale="2 2 2" position="0 0 -3" rotation="0 0 0"></a-entity>
            <a-camera position="0 1.6 0" look-controls="enabled: false"></a-camera>
          </a-scene>
          <script>
            console.log('[DEBUG] AR WebView initializing');
            document.addEventListener('DOMContentLoaded', () => {
              console.log('[INFO] AR WebView DOM loaded');
              window.ReactNativeWebView.postMessage('bridge-ready');
              const entity = document.querySelector('a-entity');
              entity.addEventListener('model-loaded', () => {
                console.log('[INFO] AR model loaded');
                window.ReactNativeWebView.postMessage('model-loaded');
                if (${isAnimating}) entity.setAttribute('animation-mixer', 'clip: *; loop: repeat;');
              });
              entity.addEventListener('model-error', (event) => {
                console.error('[ERROR] Model load error:', event.detail.src);
                window.ReactNativeWebView.postMessage('model-error: ' + event.detail.src);
              });
            });
            window.addEventListener('message', (event) => {
              console.log('[DEBUG] AR WebView received message:', event.data);
              const entity = document.querySelector('a-entity');
              if (event.data === 'start') entity.setAttribute('animation-mixer', 'clip: *; loop: repeat;');
              else if (event.data === 'stop') entity.setAttribute('animation-mixer', '');
            });
          </script>
        </body>
      </html>
    `;
  };

  const getPoseEstimationHtml = () => {
    return `
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js" crossorigin="anonymous"></script>
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
            console.log('[DEBUG] Pose Estimation WebView initializing');
            window.onerror = function(message, source, lineno, colno, error) {
              console.error('[ERROR] JavaScript error:', message, 'at', source, ':', lineno);
              window.ReactNativeWebView.postMessage('Error: ' + message + ' at ' + source + ':' + lineno);
            };
            if (typeof Pose === 'undefined') {
              console.error('[ERROR] MediaPipe Pose library failed to load');
              window.ReactNativeWebView.postMessage('Error: MediaPipe Pose library failed to load');
              return;
            }
            console.log('[INFO] MediaPipe Pose library loaded');
            window.ReactNativeWebView.postMessage('Pose library initialized');

            const videoElement = document.getElementById('video');
            const canvasElement = document.getElementById('output_canvas');
            const canvasCtx = canvasElement.getContext('2d');
            if (!videoElement || !canvasElement || !canvasCtx) {
              console.error('[ERROR] Failed to initialize video or canvas elements');
              window.ReactNativeWebView.postMessage('Error: Failed to initialize video or canvas elements');
              return;
            }
            console.log('[INFO] Video and canvas elements initialized');

            function resizeCanvas() {
              canvasElement.width = window.innerWidth;
              canvasElement.height = window.innerHeight;
              videoElement.width = window.innerWidth;
              videoElement.height = window.innerHeight;
            }
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            const pose = new Pose({
              locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/\${file}\`
            });
            pose.setOptions({
              modelComplexity: 1,
              smoothLandmarks: true,
              enableSegmentation: false,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5
            });
            console.log('[INFO] Pose instance created');

            const landmarkNames = {
              11: 'left_shoulder', 12: 'right_shoulder', 13: 'left_elbow', 14: 'right_elbow',
              15: 'left_wrist', 16: 'right_wrist', 23: 'left_hip', 24: 'right_hip',
              25: 'left_knee', 26: 'right_knee', 27: 'left_ankle', 28: 'right_ankle'
            };
            const connections = [
              ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
              ['left_hip', 'right_hip'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
              ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'], ['left_hip', 'left_knee'],
              ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
            ];

            pose.onResults((results) => {
              console.log('[DEBUG] Pose results received');
              canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
              if (results.poseLandmarks) {
                console.log('[DEBUG] Detected landmarks:', results.poseLandmarks.length);
                const landmarks = results.poseLandmarks.map((lm, index) => ({
                  name: landmarkNames[index] || 'landmark_' + index,
                  x: lm.x * canvasElement.width,
                  y: lm.y * canvasElement.height,
                  z: lm.z
                }));

                canvasCtx.strokeStyle = 'green';
                canvasCtx.lineWidth = 2;
                canvasCtx.fillStyle = 'red';
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
                landmarks.forEach(lm => {
                  canvasCtx.beginPath();
                  canvasCtx.arc(lm.x, lm.y, 5, 0, 2 * Math.PI);
                  canvasCtx.fill();
                });

                const filteredLandmarks = landmarks.filter(lm =>
                  ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
                   'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'].includes(lm.name)
                ).map(lm => ({
                  name: lm.name,
                  x: lm.x / canvasElement.width,
                  y: lm.y / canvasElement.height,
                  z: lm.z
                }));
                window.ReactNativeWebView.postMessage(JSON.stringify(filteredLandmarks));
                console.log('[INFO] Sent landmarks:', JSON.stringify(filteredLandmarks, null, 2));
              } else {
                console.log('[DEBUG] No landmarks detected');
                window.ReactNativeWebView.postMessage('No landmarks detected');
              }
            });

            function tryCameraAccess(attempt = 1, maxAttempts = 10) {
              console.log('[DEBUG] Attempting camera access, attempt:', attempt);
              navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
              }).then((stream) => {
                console.log('[INFO] Camera stream accessed');
                videoElement.srcObject = stream;
                videoElement.play().then(() => {
                  console.log('[INFO] Video playback started');
                  function processFrame() {
                    if (videoElement.readyState >= 2) pose.send({ image: videoElement });
                    else console.log('[DEBUG] Video not ready, state:', videoElement.readyState);
                    requestAnimationFrame(processFrame);
                  }
                  processFrame();
                }).catch((error) => {
                  console.error('[ERROR] Failed to play video:', error.message);
                  window.ReactNativeWebView.postMessage('Error: Failed to play video: ' + error.message);
                });
              }).catch((error) => {
                console.error('[ERROR] Camera access failed:', error.message);
                if (attempt < maxAttempts) {
                  console.log('[DEBUG] Retrying camera access, attempt:', attempt + 1);
                  setTimeout(() => tryCameraAccess(attempt + 1, maxAttempts), 6000);
                } else {
                  window.ReactNativeWebView.postMessage('Error: Camera access denied after ' + maxAttempts + ' attempts: ' + error.message);
                }
              });
            }

            setTimeout(() => tryCameraAccess(), 10000); // Increased to 10 seconds for Android 14
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {isWebViewValid && arPoseUrl && !webViewError ? (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: getARWebViewHtml() }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          style={{ backgroundColor: 'transparent' }}
          onError={(e) => {
            setWebViewError(e.nativeEvent.description);
            console.error('[ERROR] AR WebView error:', e.nativeEvent.description);
          }}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            console.log('[DEBUG] AR WebView message:', data);
            if (data === 'bridge-ready') setIsWebViewBridgeReady(true);
            else if (data === 'model-loaded') setIsModelLoaded(true);
            else if (data.startsWith('model-error:')) setWebViewError('Failed to load AR model');
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{webViewError || (language === 'en' ? 'AR WebView error' : 'AR WebView දෝෂය')}</Text>
        </View>
      )}

      {isWebViewValid && hasCameraPermission && (
        <WebView
          ref={poseWebViewRef}
          style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'transparent' }}
          source={{ html: getPoseEstimationHtml() }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          allow="camera; microphone"
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            console.log('[DEBUG] Pose WebView message:', data);
            try {
              if (data === 'Pose library initialized') setIsPoseWebViewInitialized(true);
              else if (data.startsWith('Error:')) setPoseDetectionError(data);
              else if (data === 'No landmarks detected') setLandmarks([]);
              else {
                const parsedLandmarks = JSON.parse(data);
                setLandmarks(parsedLandmarks);
                setPoseDetectionError(null);
              }
            } catch (error) {
              setPoseDetectionError('Failed to parse pose data');
              console.error('[ERROR] Parse error:', error.message);
            }
          }}
          onError={(e) => {
            setPoseDetectionError('Pose WebView failed to load: ' + e.nativeEvent.description);
            console.error('[ERROR] Pose WebView error:', e.nativeEvent.description);
          }}
        />
      )}

      {(feedback || poseDetectionError) && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{poseDetectionError || feedback}</Text>
          {poseDetectionError && (
            <TouchableOpacity style={styles.retryButton} onPress={retryPoseDetection}>
              <Text style={styles.retryButtonText}>{language === 'en' ? 'Retry Detection' : 'නැවත හඳුනාගැනීම'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <LinearGradient colors={['rgba(51, 228, 219, 0.8)', 'rgba(0, 187, 211, 0.8)']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{language === 'en' ? 'AR Yoga Trainer' : 'AR යෝග ගුරු'}</Text>
      </LinearGradient>

      <ScrollView horizontal style={styles.poseSwitchContainer}>
        {poseRecommendations.map((therapy, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.poseButton, currentPoseIndex === index && styles.activePoseButton]}
            onPress={() => switchPose(index)}
          >
            <Text style={styles.poseButtonText}>{therapy.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.calibrateButton, isCalibrated && styles.calibrateButtonDisabled]}
        onPress={calibratePose}
        disabled={isCalibrated}
      >
        <Text style={styles.calibrateButtonText}>{language === 'en' ? 'Calibrate' : 'කැලිබ්‍රේට්'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
        <Text style={styles.languageButtonText}>{language === 'en' ? 'සිංහල' : 'English'}</Text>
      </TouchableOpacity>

      {!isModelLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00BBD3" />
          <Text style={styles.loadingText}>{language === 'en' ? 'Loading AR Avatar...' : 'AR අවතාරය පූරණය වෙමින්...'}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.fabPlay, !isModelLoaded && styles.fabDisabled]}
        onPress={toggleAnimation}
        disabled={!isModelLoaded}
      >
        <Ionicons name={isAnimating ? 'pause' : 'play'} size={24} color="white" />
        <Text style={styles.fabText}>{language === 'en' ? (isAnimating ? 'Pause' : 'Start') : (isAnimating ? 'විරාමය' : 'ආරම්භ')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fabEnd} onPress={handleEndSession}>
        <Ionicons name="stop-circle-outline" size={24} color="white" />
        <Text style={styles.fabText}>{language === 'en' ? 'End' : 'අවසන්'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  backButton: { position: 'absolute', left: 15, top: 20 },
  headerText: { fontSize: 20, color: 'white', fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16 },
  fabPlay: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#00BBD3', padding: 15, borderRadius: 30, elevation: 5 },
  fabEnd: { position: 'absolute', bottom: 20, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF4D4F', padding: 15, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', marginLeft: 10, fontSize: 16 },
  fabDisabled: { opacity: 0.5 },
  retryButton: { marginTop: 20, backgroundColor: '#00BBD3', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  retryButtonText: { color: 'white', fontSize: 16 },
  poseSwitchContainer: { position: 'absolute', bottom: 100, flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 5 },
  poseButton: { padding: 10, margin: 5, backgroundColor: '#00BBD3', borderRadius: 5 },
  activePoseButton: { backgroundColor: '#33E4DB' },
  poseButtonText: { color: 'white', fontSize: 14 },
  feedbackContainer: { position: 'absolute', top: 100, backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: 15, borderRadius: 5, alignSelf: 'center', maxWidth: '80%' },
  feedbackText: { color: 'white', fontSize: 16, textAlign: 'center' },
  calibrateButton: { position: 'absolute', top: 70, right: 20, backgroundColor: '#00BBD3', padding: 10, borderRadius: 5 },
  calibrateButtonDisabled: { opacity: 0.5 },
  calibrateButtonText: { color: 'white', fontSize: 14 },
  languageButton: { position: 'absolute', top: 70, left: 20, backgroundColor: '#00BBD3', padding: 10, borderRadius: 5 },
  languageButtonText: { color: 'white', fontSize: 14 },
});

export default ARAvatarScreen;