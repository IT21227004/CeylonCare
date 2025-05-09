import cv2
import mediapipe as mp
import json
import os

print("[INFO] Initializing MediaPipe Pose...")
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

# Update video path for Warrior II pose
video_path = "../../CeylonCare/CeylonCare/assets/videos/warrior_ii.mp4"  # Relative path
output_image_path = "warrior_ii/warrior_ii.jpg"
output_json_path = "warrior_ii/warrior_ii_landmarks.json"

# Create output directories if they don't exist
os.makedirs(os.path.dirname(output_image_path), exist_ok=True)
os.makedirs(os.path.dirname(output_json_path), exist_ok=True)

if not os.path.exists(video_path):
    print(f"[ERROR] Video file not found at: {video_path}")
    print("[INFO] Ensure the video is in ../../CeylonCare/CeylonCare/assets/videos/")
    exit()

print("[INFO] Loading video...")
cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("[ERROR] Could not open video.")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"[DEBUG] Video FPS: {fps}, Total Frames: {total_frames}")

# Adjust target time based on when the Warrior II pose is held in the video
target_time = 5  # Adjust this based on your video
target_frame = int(fps * target_time) if int(fps * target_time) < total_frames else total_frames - 1
print(f"[DEBUG] Targeting frame {target_frame} at {target_time} seconds")
cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)

success, frame = cap.read()
if not success:
    print("[ERROR] Failed to read frame.")
    cap.release()
    exit()

print("[INFO] Processing frame for pose detection...")
rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
results = pose.process(rgb_frame)

if not results.pose_landmarks:
    print("[ERROR] No pose detected.")
    cv2.imwrite(output_image_path, frame)
    print(f"[DEBUG] Frame saved as {output_image_path}")
    cap.release()
    exit()

mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
cv2.imwrite(output_image_path, frame)
print(f"[INFO] Frame saved as {output_image_path}")

# Extract landmarks
landmarks = results.pose_landmarks.landmark
correct_pose = [
    {"name": "left_shoulder", "x": landmarks[11].x, "y": landmarks[11].y},
    {"name": "right_shoulder", "x": landmarks[12].x, "y": landmarks[12].y},
    {"name": "left_elbow", "x": landmarks[13].x, "y": landmarks[13].y},
    {"name": "right_elbow", "x": landmarks[14].x, "y": landmarks[14].y},
    {"name": "left_hip", "x": landmarks[23].x, "y": landmarks[23].y},
    {"name": "right_hip", "x": landmarks[24].x, "y": landmarks[24].y},
    {"name": "left_knee", "x": landmarks[25].x, "y": landmarks[25].y},
    {"name": "right_knee", "x": landmarks[26].x, "y": landmarks[26].y}
]
print("[DEBUG] Extracted landmarks:")
for landmark in correct_pose:
    print(f"[DEBUG] {landmark['name']}: x={landmark['x']:.3f}, y={landmark['y']:.3f}")

with open(output_json_path, 'w') as f:
    json.dump(correct_pose, f, indent=2)
print(f"[INFO] Landmarks saved to {output_json_path}")

cap.release()
pose.close()
print("[INFO] Script completed!")