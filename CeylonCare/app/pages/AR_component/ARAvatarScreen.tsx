import React, { useEffect } from "react";
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

  useEffect(() => {
    console.log(`[INFO] ARAvatarScreen loaded with arPoseUrl: ${arPoseUrl}`);
  }, [arPoseUrl]);

  if (!arPoseUrl) {
    console.warn(`[WARN] No arPoseUrl provided in route params`);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No AR pose URL provided.</Text>
      </View>
    );
  }

  // A-Frame HTML to render the AR model
  const html = `
    <html>
      <head>
        <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
        <script src="https://unpkg.com/aframe-extras@7.0.0/dist/aframe-extras.min.js"></script>
        <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.min.js"></script>
      </head>
      <body>
        <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;">
          <a-assets>
            <a-asset-item id="model" src="${arPoseUrl}"></a-asset-item>
          </a-assets>
          <a-entity gltf-model="#model" position="0 0 -5" scale="0.5 0.5 0.5"></a-entity>
          <a-entity camera></a-entity>
        </a-scene>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AR Avatar - Warrior II</Text>
      <WebView
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(e) => {
          console.error(`[ERROR] WebView error: ${JSON.stringify(e.nativeEvent, null, 2)}`);
        }}
        onLoadStart={() => console.log(`[DEBUG] WebView load started`)}
        onLoadEnd={() => console.log(`[DEBUG] WebView load ended`)}
        onMessage={(e) => console.log(`[DEBUG] WebView message: ${e.nativeEvent.data}`)}
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