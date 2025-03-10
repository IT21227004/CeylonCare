import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";

type RootStackParamList = {
  ARAvatarScreen: { arPoseUrl: string };
};

type ARAvatarScreenProps = {
  route: RouteProp<RootStackParamList, "ARAvatarScreen">;
};

const ARAvatarScreen: React.FC<ARAvatarScreenProps> = ({ route }) => {
  const { arPoseUrl } = route.params;
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log(`[INFO] ARAvatarScreen loaded with arPoseUrl: ${arPoseUrl}`);
    if (!arPoseUrl) {
      console.warn(`[WARN] No arPoseUrl provided in route params`);
    }
  }, [arPoseUrl]);

  if (!arPoseUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No AR pose URL provided.</Text>
      </View>
    );
  }

  const html = `
    <html>
      <head>
        <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
        <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.min.js"></script>
        <style>
          body { margin: 0; overflow: hidden; }
          #info { position: absolute; top: 10px; left: 10px; color: white; z-index: 1; font-size: 16px; background: rgba(0, 0, 0, 0.5); padding: 5px; }
        </style>
      </head>
      <body>
        <div id="info">Loading AR scene...</div>
        <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;" vr-mode-ui="enabled: false">
          <a-assets>
            <a-asset-item id="avatarModel" src="${arPoseUrl}"
              onload="window.ReactNativeWebView.postMessage('[INFO] Avatar model loaded into assets')"
              onerror="window.ReactNativeWebView.postMessage('[ERROR] Failed to load avatar model: ' + JSON.stringify(event))">
            </a-asset-item>
          </a-assets>
          <a-entity id="avatar" gltf-model="#avatarModel" position="0 0 -5" scale="0.5 0.5 0.5" rotation="0 0 0">
            <a-animation attribute="scale" to="0.52 0.52 0.52" dur="2000" direction="alternate" repeat="indefinite"></a-animation>
          </a-entity>
          <a-entity camera></a-entity>
        </a-scene>

        <script>
          console.log = function (message) {
            window.ReactNativeWebView.postMessage(message);
          };

          console.log('[DEBUG] AR scene initialization started');

          const avatar = document.getElementById('avatar');
          avatar.addEventListener('model-loaded', () => {
            console.log('[INFO] Avatar model fully loaded into scene');
            const model = avatar.getObject3D('mesh');
            if (model) {
              console.log('[DEBUG] Model mesh found');
              const animations = model.animations || [];
              if (animations.length > 0) {
                console.log('[INFO] Animation clips found: ' + JSON.stringify(animations.map(a => a.name)));
                const mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(animations[0]); // Play the first animation
                action.play();
                document.getElementById('info').innerText = 'Playing yoga pose animation.';
                // Update mixer each frame
                function update() {
                  requestAnimationFrame(update);
                  mixer.update(0.016); // ~60 FPS
                }
                update();
              } else {
                console.warn('[WARN] No animation clips detected, displaying static pose');
                document.getElementById('info').innerText = 'Displaying static yoga pose.';
              }
            } else {
              console.error('[ERROR] Model mesh not found');
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AR Avatar - Yoga Pose</Text>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={(e) => console.log(`[WEBVIEW] ${e.nativeEvent.data}`)}
        onError={(e) => console.error(`[ERROR] WebView error: ${JSON.stringify(e.nativeEvent)}`)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", margin: 20, color: "#00BBD3" },
  webview: { flex: 1 },
  errorText: { fontSize: 16, textAlign: "center", color: "red" },
});

export default ARAvatarScreen;