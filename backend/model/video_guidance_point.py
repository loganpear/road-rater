import cv2
import numpy as np
import onnxruntime as ort

# ================= USER SETTINGS =================

VIDEO_PATH = "inference/videos/test2.mp4"
OUTPUT_PATH = "inference/output_guidance.mp4"
MODEL_PATH = "weights/yolop-640-640.onnx"

INPUT_W, INPUT_H = 640, 640

# Lookahead band geometry
BASE_LOOKAHEAD_CENTER = 0.75
LOOKAHEAD_HALF_HEIGHT = 0.08

LANE_THRESH = 0.5

# Minimum distance vehicle must be from any lane line to be "GOOD"
MIN_LINE_CLEARANCE_PX = 30

# ================================================


def prompt_vehicle_center_ratio():
    print("\nVehicle X calibration")
    print("0.50 = image center (default)")
    print("<0.50 = vehicle is right of image center")
    print(">0.50 = vehicle is left of image center")

    v = input("Vehicle center X ratio (Enter = 0.50): ").strip()
    if v == "":
        return 0.50
    try:
        v = float(v)
        if 0.0 <= v <= 1.0:
            return v
    except ValueError:
        pass
    print("Invalid input, using 0.50")
    return 0.50


def prompt_band_y_offset():
    print("\nBounding band Y offset (NOT camera)")
    print("0.00 = default")
    print("+ moves band DOWN")
    print("- moves band UP")

    v = input("Bounding band Y offset ratio (e.g. 0.03): ").strip()
    if v == "":
        return 0.0
    try:
        v = float(v)
        if -0.2 <= v <= 0.2:
            return v
    except ValueError:
        pass
    print("Invalid input, using 0.00")
    return 0.0


def preprocess(frame):
    img = cv2.resize(frame, (INPUT_W, INPUT_H))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype(np.float32) / 255.0
    img = img.transpose(2, 0, 1)
    return np.expand_dims(img, 0)


def main():
    vehicle_center_ratio = prompt_vehicle_center_ratio()
    band_y_offset = prompt_band_y_offset()

    cap = cv2.VideoCapture(VIDEO_PATH)
    assert cap.isOpened(), "Failed to open video"

    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    out = cv2.VideoWriter(
        OUTPUT_PATH,
        cv2.VideoWriter_fourcc(*"avc1"),
        fps,
        (w, h),
    )
    
    if not out.isOpened():
        print("Warning: avc1 codec failed, trying mp4v...")
        out = cv2.VideoWriter(
            OUTPUT_PATH,
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (w, h),
        )
    
    if not out.isOpened():
        print("ERROR: Could not open video writer!")
        return

    sess = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    input_name = sess.get_inputs()[0].name

    vehicle_x = int(w * vehicle_center_ratio)

    band_center = BASE_LOOKAHEAD_CENTER + band_y_offset
    band_center = np.clip(band_center, 0.2, 0.9)

    row_start = int(h * (band_center - LOOKAHEAD_HALF_HEIGHT))
    row_end   = int(h * (band_center + LOOKAHEAD_HALF_HEIGHT))

    print(f"\nVehicle X = {vehicle_x}px")
    print(f"Bounding band center = {band_center:.3f}")
    print("Processing video...\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        inp = preprocess(frame)
        outputs = sess.run(None, {input_name: inp})

        # Lane lines: outputs[2] - find boundaries closest to vehicle
        ll_seg = outputs[2][0]
        ll_class = np.argmax(ll_seg, axis=0)
        lane_mask = cv2.resize(ll_class.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
        lane_mask = lane_mask == 1

        # Visualize lane line detections
        for y in range(row_start, row_end, 4):
            xs = np.where(lane_mask[y])[0]
            for x in xs[::5]:
                cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

        # Check distance from vehicle to nearest lane line
        min_distances = []

        for y in range(row_start, row_end, 4):
            xs = np.where(lane_mask[y])[0]
            if len(xs) == 0:
                continue
            
            # Find distance to closest lane line at this row
            distances = np.abs(xs - vehicle_x)
            min_distances.append(np.min(distances))

        if min_distances:
            # Use MINIMUM distance - if any row has vehicle on line, it's bad
            clearance = int(np.min(min_distances))
            
            # Check if vehicle is too close to any line
            on_line = clearance < MIN_LINE_CLEARANCE_PX
            status = "BAD - ON LINE" if on_line else "GOOD"
            color = (0, 0, 255) if on_line else (0, 255, 0)

            text = f"Clearance: {clearance}px | {status}"
        else:
            text = "NO LANE"
            color = (0, 0, 255)

        # Vehicle center (red)
        cv2.line(frame, (vehicle_x, 0), (vehicle_x, h), (0, 0, 255), 2)

        # Bounding band (white)
        cv2.rectangle(
            frame,
            (0, row_start),
            (w, row_end),
            (255, 255, 255),
            1,
        )

        cv2.putText(
            frame,
            text,
            (30, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            color,
            2,
        )

        out.write(frame)
        cv2.imshow("YOLOP Lane Guidance (Band Offset)", frame)
        if cv2.waitKey(1) == 27:
            break

    cap.release()
    out.release()
    cv2.destroyAllWindows()
    print(f"\nSaved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
