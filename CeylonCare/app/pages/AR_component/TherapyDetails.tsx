import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import axios from "axios";
import { WebView } from "react-native-webview";

// Define Navigation Params Type
type RootStackParamList = {
  TherapyDetails: { therapyName: string };
};

// Define Props Type
type TherapyDetailsScreenProps = {
  route: RouteProp<RootStackParamList, "TherapyDetails">;
};

// Define Therapy Details Response Type
type TherapyDetailsResponse = {
  name: string;
  description: string;
  ar_pose: string;
  reference_video?: string;
  steps: string[];
  benefits: string[];
  duration?: string;
};

const TherapyDetails: React.FC<TherapyDetailsScreenProps> = ({ route }) => {
  const { therapyName } = route.params || { therapyName: "Default Therapy" };
  const [therapyDetails, setTherapyDetails] = useState<TherapyDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  useEffect(() => {
    fetchTherapyDetails();
  }, [therapyName]);

  // Fetch therapy details from API
  const fetchTherapyDetails = async () => {
    setIsLoading(true);
    setError(null);
    console.log(`[INFO] Starting fetch for therapy: ${therapyName}`);

    try {
      const normalizedTherapyName = therapyName.trim().replace(/%20/g, " ").replace(/-/g, " ");
      console.log(`[DEBUG] Normalized therapy name: ${normalizedTherapyName}`);
      const requestUrl = `http://192.168.200.18:5000/therapy_details/${encodeURIComponent(normalizedTherapyName)}`;
      console.log(`[DEBUG] Request URL: ${requestUrl}`);

      const response = await axios.get(requestUrl, { timeout: 10000 });
      console.log(`[DEBUG] API Response Status: ${response.status}`);
      console.log(`[DEBUG] API Response Data: ${JSON.stringify(response.data, null, 2)}`);

      if (!response.data) throw new Error("Empty API response");
      const data = response.data as TherapyDetailsResponse;
      if (!data.name || !data.description || !data.steps) throw new Error("Incomplete therapy data");

      console.log(`[DEBUG] Validated therapy data: ${JSON.stringify(data, null, 2)}`);
      setTherapyDetails(data);

      if (data.reference_video) {
        console.log(`[INFO] Found reference video URL: ${data.reference_video}`);
        await resolveVideoUri(data.reference_video);
      } else {
        console.log(`[WARN] No reference video provided in therapy data`);
      }
    } catch (err) {
      console.error(`[ERROR] Fetch failed: ${err.message}`);
      console.log(`[DEBUG] Error details: ${JSON.stringify({ message: err.message, code: err.code, stack: err.stack }, null, 2)}`);
      setError(err.response?.status === 404 ? `Therapy "${therapyName}" not found.` : "Failed to load therapy details.");
      Alert.alert("Error", error || "Failed to load therapy details.");
    } finally {
      setIsLoading(false);
      console.log(`[INFO] Fetch completed, isLoading: ${isLoading}`);
    }
  };

  // Resolve and validate video URI
  const resolveVideoUri = async (referenceVideo: string) => {
    console.log(`[INFO] Resolving video URI: ${referenceVideo}`);
    try {
      if (!referenceVideo.startsWith("http")) {
        throw new Error("Video URI must be a remote HTTP/HTTPS URL");
      }

      console.log(`[DEBUG] Checking URL accessibility: ${referenceVideo}`);
      const response = await fetch(referenceVideo, { method: "HEAD", timeout: 5000 });
      console.log(`[DEBUG] HTTP Status: ${response.status}`);
      if (response.status !== 200) throw new Error(`URL returned status ${response.status}`);

      const contentType = response.headers.get("content-type");
      console.log(`[DEBUG] Content-Type received: ${contentType}`);
      if (!contentType?.includes("video")) {
        console.warn(`[WARN] Invalid Content-Type: ${contentType}. Expected video/*`);
        throw new Error("URL does not serve a video file");
      }

      console.log(`[DEBUG] Response headers: ${JSON.stringify([...response.headers], null, 2)}`);
      setVideoUri(referenceVideo);
      console.log(`[INFO] Video URI validated and set: ${referenceVideo}`);
    } catch (err) {
      console.error(`[ERROR] URI resolution failed: ${err.message}`);
      console.log(`[DEBUG] URI error details: ${JSON.stringify({ message: err.message, stack: err.stack }, null, 2)}`);
      setError(`Video URI error: ${err.message}`);
      Alert.alert("Video Error", `Cannot load video: ${err.message}`);
    }
  };

  // Generate HTML for WebView with enhanced debugging
  const getVideoHtml = (uri: string) => {
    console.log(`[DEBUG] Generating WebView HTML for URI: ${uri}`);
    return `
      <html>
        <body style="margin:0; background-color:#000;">
          <video 
            id="videoPlayer"
            style="width:100%; height:100%;"
            controls
            playsinline
            src="${uri}"
            onplay="console.log('Video playing'); window.ReactNativeWebView.postMessage('Video playing')"
            onerror="console.log('Video error: ' + (this.error ? this.error.message : 'Unknown')); window.ReactNativeWebView.postMessage('Video error: ' + (this.error ? this.error.message : 'Unknown'))"
          >
            Video not supported.
          </video>
          <script>
            const video = document.getElementById('videoPlayer');
            video.addEventListener('error', (e) => {
              window.ReactNativeWebView.postMessage('Video error: ' + (video.error ? video.error.message : 'Unknown'));
            });
            video.addEventListener('play', () => window.ReactNativeWebView.postMessage('Video playing'));
            video.addEventListener('loadedmetadata', () => window.ReactNativeWebView.postMessage('Metadata loaded: ' + video.duration));
            video.addEventListener('loadstart', () => window.ReactNativeWebView.postMessage('Load started'));
            video.addEventListener('loadeddata', () => window.ReactNativeWebView.postMessage('Data loaded'));
            video.addEventListener('playing', () => window.ReactNativeWebView.postMessage('Video actively playing'));
            video.addEventListener('pause', () => window.ReactNativeWebView.postMessage('Video paused'));
            video.addEventListener('ended', () => window.ReactNativeWebView.postMessage('Video ended'));
          </script>
        </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BBD3" />
        {/* <Text style={styles.debugText}>[DEBUG] Loading therapy details...</Text> */}
      </View>
    );
  }

  const videoSource = videoUri ? { html: getVideoHtml(videoUri) } : null;
  console.log(`[DEBUG] Final video source: ${JSON.stringify(videoSource, null, 2)}`);
  console.log(`[DEBUG] Platform: ${Platform.OS}, Device API: ${Platform.Version}`);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {therapyDetails ? (
        <>
          <Text style={styles.title}>{therapyDetails.name}</Text>
          <Text style={styles.description}>{therapyDetails.description}</Text>
          {therapyDetails.duration && <Text style={styles.duration}>Duration: {therapyDetails.duration}</Text>}

          {videoSource && (
            <View style={styles.videoContainer}>
              <Text style={styles.videoTitle}>Reference Video</Text>
              <WebView
                source={videoSource}
                style={styles.video}
                javaScriptEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                onError={(e) => {
                  console.error(`[ERROR] WebView error: ${JSON.stringify(e.nativeEvent, null, 2)}`);
                  setError("WebView failed to load video.");
                  Alert.alert("WebView Error", "Check logs for details.");
                }}
                onLoadStart={() => console.log(`[DEBUG] WebView load started`)}
                onLoad={(s) => console.log(`[DEBUG] WebView load event: ${JSON.stringify(s.nativeEvent, null, 2)}`)}
                onLoadEnd={() => console.log(`[DEBUG] WebView load ended`)}
                onMessage={(e) => console.log(`[DEBUG] WebView message: ${e.nativeEvent.data}`)}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          )}

          <Text style={styles.stepsTitle}>Steps to Follow:</Text>
          {therapyDetails.steps.map((step, i) => (
            <Text key={i} style={styles.stepItem}>{step}</Text>
          ))}

          <Text style={styles.benefitsTitle}>Benefits:</Text>
          {therapyDetails.benefits.map((benefit, i) => (
            <Text key={i} style={styles.benefitItem}>{benefit}</Text>
          ))}

          {therapyDetails.ar_pose && <Text style={styles.arPose}>AR Pose: {therapyDetails.ar_pose}</Text>}
        </>
      ) : (
        <Text style={styles.errorText}>{error || "Therapy details not found."}</Text>
      )}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: "#00BBD3" },
  description: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 10 },
  duration: { fontSize: 16, textAlign: "center", fontWeight: "bold", marginBottom: 15, color: "#333" },
  stepsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#00BBD3" },
  stepItem: { fontSize: 16, marginBottom: 5, color: "#333" },
  benefitsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#00BBD3" },
  benefitItem: { fontSize: 16, marginBottom: 5, color: "#333" },
  arPose: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 10 },
  videoContainer: { marginVertical: 15 },
  videoTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#00BBD3", textAlign: "center" },
  video: { width: "100%", height: 200, borderRadius: 10 },
  errorText: { fontSize: 16, textAlign: "center", color: "red" },
  debugText: { fontSize: 14, color: "blue", textAlign: "center", marginBottom: 5 },
});

export default TherapyDetails;