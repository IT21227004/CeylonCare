import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Camera from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import WebView from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ARAvatarScreen = ({ route, navigation }) => {
  const { arPoseUrl } = route.params || {};
  console.log('[DEBUG] Route params received:', route.params);

  // State variables
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isWebViewValid, setIsWebViewValid] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [webViewError, setWebViewError] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Validate components on mount
  useEffect(() => {
    console.log('[DEBUG] Component mounted, starting initialization');
    console.log('[DEBUG] Platform:', Platform.OS, 'Version:', Platform.Version);
    console.log('[DEBUG] Expo Camera module:', Camera);

    // Validate CameraView component
    console.log('[DEBUG] Checking Camera.CameraView:', Camera.CameraView);
    if (!Camera.CameraView || typeof Camera.CameraView !== 'function') {
      const errorMsg = '[ERROR] CameraView component is invalid or not a function';
      console.error(errorMsg, Camera);
      setCameraError(errorMsg);
    } else {
      console.log('[INFO] CameraView component validated successfully');
    }

    // Validate WebView component
    console.log('[DEBUG] Checking WebView module:', WebView);
    if (!WebView || typeof WebView !== 'object') {
      console.error('[ERROR] WebView component is invalid:', WebView);
      setIsWebViewValid(false);
    } else {
      console.log('[INFO] WebView component validated successfully');
      setIsWebViewValid(true);
    }
  }, []);

  // Debug and validate arPoseUrl on change
  useEffect(() => {
    console.log('[DEBUG] arPoseUrl received:', arPoseUrl);
    if (!arPoseUrl) {
      console.warn('[WARN] arPoseUrl is undefined or empty');
      setWebViewError('arPoseUrl is missing');
    } else if (typeof arPoseUrl !== 'string') {
      console.error('[ERROR] arPoseUrl is not a string:', arPoseUrl);
      setWebViewError('arPoseUrl is not a string');
    } else {
      console.log('[INFO] arPoseUrl is a valid string');
      try {
        new URL(arPoseUrl);
        console.log('[INFO] arPoseUrl is a valid URL');
      } catch (error) {
        console.error('[ERROR] arPoseUrl is not a valid URL:', error);
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
          console.log('[DEBUG] Permission request response:', response);
          if (response.status === 'granted') {
            console.log('[INFO] Camera permission granted');
          } else {
            console.warn('[WARN] Camera permission denied or undetermined:', response.status);
            setCameraError('Camera permission denied');
          }
        })
        .catch((error) => {
          console.error('[ERROR] Failed to request camera permission:', error);
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
      {/* Header */}
      <LinearGradient colors={["#33E4DB", "#00BBD3"]} style={styles.header}>
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

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Align your camera to view the AR avatar in your environment.
        </Text>
      </View>

      {/* Camera and WebView Overlay */}
      <View style={styles.arContainer}>
        {Camera.CameraView && permission.status === 'granted' && !cameraError ? (
          <Camera.CameraView
            style={StyleSheet.absoluteFill}
            facing="front"
            onCameraReady={() => {
              console.log('[INFO] Camera is ready');
              setIsCameraReady(true);
            }}
            onMountError={(error) => {
              console.error('[ERROR] Camera mount error:', error);
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

        {/* WebView for AR Avatar */}
        {isWebViewValid && arPoseUrl && !webViewError ? (
          <WebView
            style={StyleSheet.absoluteFill}
            source={{
              html: `
                <html>
                  <head>
                    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
                    <script src="https://unpkg.com/aframe-extras@7.0.0/dist/aframe-extras.min.js"></script>
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
                        scale="1.5 1.5 1.5"
                        position="0 0 -2"
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
              setIsModelLoaded(false);
            }}
            onLoadEnd={() => {
              console.log('[INFO] WebView load ended');
              setIsModelLoaded(true);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[ERROR] WebView error:', nativeEvent);
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

        {/* Loading Indicator for WebView */}
        {!isModelLoaded && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00BBD3" />
            <Text style={styles.loadingText}>Loading AR Avatar...</Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleAnimation}
        >
          <Ionicons
            name={isAnimating ? "pause" : "play"}
            size={24}
            color="white"
          />
          <Text style={styles.controlButtonText}>
            {isAnimating ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 40,
  },
  headerText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
  },
  instructionsContainer: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  instructionsText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  arContainer: {
    flex: 1,
    position: 'relative',
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
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BBD3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  controlButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
});

export default ARAvatarScreen;