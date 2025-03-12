import React, { useState, useEffect } from 'react';
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

  // Force landscape orientation on component mount
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        console.log('[DEBUG] Locking screen to landscape');
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        console.log('[DEBUG] Current orientation before locking:', currentOrientation);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        const newOrientation = await ScreenOrientation.getOrientationAsync();
        console.log('[INFO] Screen locked to landscape, new orientation:', newOrientation);
      } catch (error) {
        console.error('[ERROR] Failed to lock screen orientation:', error.message);
        console.log('[DEBUG] Orientation lock error details:', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
      }
    };

    const unlockOrientation = async () => {
      try {
        console.log('[DEBUG] Unlocking screen orientation on unmount');
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        console.log('[DEBUG] Current orientation before unlocking:', currentOrientation);
        await ScreenOrientation.unlockAsync();
        const newOrientation = await ScreenOrientation.getOrientationAsync();
        console.log('[INFO] Screen orientation unlocked, new orientation:', newOrientation);
      } catch (error) {
        console.error('[ERROR] Failed to unlock screen orientation:', error.message);
        console.log('[DEBUG] Orientation unlock error details:', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
      }
    };

    lockOrientation();

    return () => {
      unlockOrientation();
    };
  }, []);

  // Validate components on mount
  useEffect(() => {
    console.log('[DEBUG] Component mounted, starting initialization');
    console.log('[DEBUG] Platform:', Platform.OS, 'Version:', Platform.Version);
    console.log('[DEBUG] Expo Camera module:', Camera);
    console.log('[DEBUG] Navigation prop:', navigation);

    // Validate CameraView component
    console.log('[DEBUG] Checking Camera.CameraView:', Camera.CameraView);
    if (!Camera.CameraView || typeof Camera.CameraView !== 'function') {
      const errorMsg = '[ERROR] CameraView component is invalid or not a function';
      console.error(errorMsg, Camera);
      console.log('[DEBUG] Camera validation error details:', JSON.stringify(Camera, null, 2));
      setCameraError(errorMsg);
    } else {
      console.log('[INFO] CameraView component validated successfully');
    }

    // Validate WebView component
    console.log('[DEBUG] Checking WebView module:', WebView);
    if (!WebView || typeof WebView !== 'object') {
      console.error('[ERROR] WebView component is invalid:', WebView);
      console.log('[DEBUG] WebView validation error details:', JSON.stringify(WebView, null, 2));
      setIsWebViewValid(false);
    } else {
      console.log('[INFO] WebView component validated successfully');
      setIsWebViewValid(true);
    }

    // Validate navigation prop
    if (!navigation || typeof navigation.navigate !== 'function') {
      console.error('[ERROR] Navigation prop is invalid or navigate function is missing');
      console.log('[DEBUG] Navigation validation error details:', JSON.stringify(navigation, null, 2));
    } else {
      console.log('[INFO] Navigation prop validated successfully');
    }

    // Validate therapyName in route params
    console.log('[DEBUG] Checking therapyName in route params:', therapyName);
    if (!therapyName) {
      console.warn('[WARN] therapyName is undefined or missing in route params');
      console.log('[DEBUG] Missing therapyName details:', JSON.stringify(route.params, null, 2));
    } else {
      console.log('[INFO] therapyName is present:', therapyName);
    }
  }, [navigation, therapyName]);

  // Debug and validate arPoseUrl on change
  useEffect(() => {
    console.log('[DEBUG] arPoseUrl received:', arPoseUrl);
    if (!arPoseUrl) {
      console.warn('[WARN] arPoseUrl is undefined or empty');
      console.log('[DEBUG] Missing arPoseUrl details:', JSON.stringify(route.params, null, 2));
      setWebViewError('arPoseUrl is missing');
    } else if (typeof arPoseUrl !== 'string') {
      console.error('[ERROR] arPoseUrl is not a string:', arPoseUrl);
      console.log('[DEBUG] Invalid arPoseUrl type details:', JSON.stringify({ arPoseUrl, type: typeof arPoseUrl }, null, 2));
      setWebViewError('arPoseUrl is not a string');
    } else {
      console.log('[INFO] arPoseUrl is a valid string');
      try {
        new URL(arPoseUrl);
        console.log('[INFO] arPoseUrl is a valid URL');
      } catch (error) {
        console.error('[ERROR] arPoseUrl is not a valid URL:', error.message);
        console.log('[DEBUG] URL validation error details:', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
        setWebViewError('Invalid arPoseUrl format');
      }
    }
  }, [arPoseUrl]);

  // Handle camera permission
  useEffect(() => {
    console.log('[DEBUG] Permission state:', permission);
    if (!permission) {
      console.log('[DEBUG] Permission hook not yet initialized');
      return;
    }

    if (permission.status === 'granted') {
      console.log('[INFO] Camera permission already granted');
    } else if (permission.status === 'denied' || permission.status === 'undetermined') {
      console.log('[DEBUG] Starting camera permission request');
      requestPermission()
        .then((response) => {
          console.log('[DEBUG] Permission request response:', JSON.stringify(response, null, 2));
          if (response.status === 'granted') {
            console.log('[INFO] Camera permission granted');
          } else {
            console.warn('[WARN] Camera permission denied or undetermined:', response.status);
            console.log('[DEBUG] Permission denied details:', JSON.stringify(response, null, 2));
            setCameraError('Camera permission denied');
          }
        })
        .catch((error) => {
          console.error('[ERROR] Failed to request camera permission:', error.message);
          console.log('[DEBUG] Permission request error details:', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
          setCameraError('Permission request failed');
        });
    }
  }, [permission, requestPermission]);

  // Toggle animation
  const toggleAnimation = () => {
    setIsAnimating((prev) => {
      console.log('[DEBUG] Animation toggled:', !prev);
      return !prev;
    });
  };

  // Navigate to TherapyDetail page and set orientation to portrait
  const handleEndSession = async () => {
    console.log('[DEBUG] End button pressed');
    try {
      // Check for therapyName
      if (!therapyName) {
        console.error('[ERROR] therapyName is missing, cannot navigate to TherapyDetail');
        console.log('[DEBUG] Missing therapyName details:', JSON.stringify(route.params, null, 2));
        return;
      }

      // Validate navigation prop
      if (!navigation || typeof navigation.navigate !== 'function') {
        console.error('[ERROR] Navigation prop is undefined or navigate function is missing');
        console.log('[DEBUG] Navigation validation error details:', JSON.stringify(navigation, null, 2));
        return;
      }

      // Set orientation to portrait before navigating
      console.log('[DEBUG] Setting orientation to portrait before navigation');
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      console.log('[DEBUG] Current orientation before changing:', currentOrientation);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      const newOrientation = await ScreenOrientation.getOrientationAsync();
      console.log('[INFO] Orientation set to portrait, new orientation:', newOrientation);

      // Navigate to TherapyDetail
      console.log('[DEBUG] Navigating to TherapyDetail with therapyName:', therapyName);
      navigation.navigate('TherapyDetails', {
        therapyName: therapyName,
      });
      console.log('[INFO] Successfully navigated to TherapyDetail');
    } catch (error) {
      console.error('[ERROR] Failed to handle end session:', error.message);
      console.log('[DEBUG] End session error details:', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
    }
  };

  // Loading state while permissions are being checked
  if (!permission) {
    console.log('[DEBUG] Waiting for permission hook to initialize');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BBD3" />
        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  // Permission denied case
  if (permission.status !== 'granted') {
    console.log('[DEBUG] Rendering permission denied message');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No access to camera. Please grant permission.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  console.log('[DEBUG] Rendering main view');
  console.log('[DEBUG] isCameraReady:', isCameraReady);
  console.log('[DEBUG] isWebViewValid:', isWebViewValid);
  console.log('[DEBUG] cameraError:', cameraError);
  console.log('[DEBUG] webViewError:', webViewError);
  console.log('[DEBUG] isAnimating:', isAnimating);

  return (
    <View style={styles.container}>
      {/* Camera Feed (Full Screen) */}
      {Camera.CameraView && permission.status === 'granted' && !cameraError ? (
        <Camera.CameraView
          style={StyleSheet.absoluteFill}
          facing="front"
          onCameraReady={() => {
            console.log('[INFO] Camera is ready');
            setIsCameraReady(true);
          }}
          onMountError={(error) => {
            console.error('[ERROR] Camera mount error:', error.message);
            console.log('[DEBUG] Camera mount error details:', JSON.stringify({ message: error.message, nativeEvent: error }, null, 2));
            setCameraError(error.message);
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {cameraError || 'Error: Camera unavailable or permission denied'}
          </Text>
        </View>
      )}

      {/* WebView for AR Avatar (Centered Overlay) */}
      {isWebViewValid && arPoseUrl && !webViewError ? (
        <WebView
          style={StyleSheet.absoluteFill}
          source={{
            html: `
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
                      animation-mixer="${isAnimating ? 'clip: *; loop: repeat;' : ''}"
                      scale="2 2 2"
                      position="0 0 -3"
                      rotation="0 0 0"
                    ></a-entity>
                    <a-camera position="0 1.6 0" look-controls="enabled: false"></a-camera>
                  </a-scene>
                </body>
              </html>
            `,
          }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          style={{ backgroundColor: 'transparent' }}
          onLoadStart={() => {
            console.log('[DEBUG] WebView loading started');
          }}
          onLoadEnd={() => {
            console.log('[INFO] WebView load ended');
            setIsModelLoaded(true);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('[ERROR] WebView error:', nativeEvent.description);
            console.log('[DEBUG] WebView error details:', JSON.stringify(nativeEvent, null, 2));
            setWebViewError(`WebView failed: ${nativeEvent.description}`);
          }}
          onMessage={(event) => {
            console.log('[DEBUG] WebView message:', event.nativeEvent.data);
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {webViewError || 'Error: WebView unavailable or invalid arPoseUrl'}
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
          {/* <Ionicons name="arrow-back" size={24} color="white" /> */}
        </TouchableOpacity>
        <Text style={styles.headerText}>AR Avatar Viewer</Text>
      </LinearGradient>

      {/* Instructions (Top Banner) */}
      {/* <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Align your camera to view the AR avatar in your environment.
        </Text>
      </View> */}

      {/* Loading Indicator for WebView */}
      {!isModelLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00BBD3" />
          <Text style={styles.loadingText}>Loading AR Avatar...</Text>
        </View>
      )}

      {/* Floating Action Button for Animation Control (Bottom-Right) */}
      <TouchableOpacity
        style={styles.fabPlay}
        onPress={toggleAnimation}
      >
        <Ionicons
          name={isAnimating ? 'pause' : 'play'}
          size={24}
          color="white"
        />
        <Text style={styles.fabText}>
          {isAnimating ? 'Pause' : 'Start'}
        </Text>
      </TouchableOpacity>

      {/* Floating Action Button for End Session (Bottom-Left) */}
      <TouchableOpacity
        style={styles.fabEnd}
        onPress={handleEndSession}
      >
        <Ionicons
          name="stop-circle-outline"
          size={24}
          color="white"
        />
        <Text style={styles.fabText}>End</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fallback background if camera fails
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
  instructionsContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionsText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
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
    backgroundColor: '#FF4D4F', // Red color to indicate "End"
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