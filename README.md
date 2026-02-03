# road-rater
Spartahack 11 hackathon project

## Objective

Analyze dashcam video frame-by-frame to detect solid lane boundary violations made by the ego vehicle, then emit structured events used to compute a driver safety score.

This repository is responsible only for:
- Lane detection
- Lane crossing detection
- Violation event generation

Scoring, UI, and insurance logic are handled downstream.

---

## Model Credit

This project uses the [YOLOP](https://github.com/hustvl/YOLOP) (You Only Look Once for Panoptic driving perception) model for lane boundary and road marking detection.

Original authors: [HUST Vision and Learning Lab](https://github.com/hustvl)

Paper: [YOLOP: You Only Look Once for Panoptic Driving Perception](https://arxiv.org/abs/2108.11250)

---

## Core Approach

This is a lane-based ego-vehicle analysis problem, not object detection.

The system:
- Detects lane lines using a neural network
- Estimates the vehicle’s position relative to those lanes
- Flags sustained crossings of solid lane boundaries
- Outputs time-indexed violation events

---

## Architecture Overview

Video processing flow:

1. MP4 video input  
2. Frame extraction using OpenCV  
3. Lane detection model inference (PyTorch)  
4. Lane geometry processing  
5. Ego vehicle reference tracking  
6. Solid lane crossing detection  
7. Violation event output (JSON)

---

### Lane Detection

Recommended model:
- UltraFast Lane Detection (UFLD), PyTorch implementation

Reasons:
- Real-time capable
- Simple output format
- Well-suited for hackathon timelines

Model output per frame:

[
  [(x1, y1), (x2, y2), ...],
  [(x1, y1), (x2, y2), ...]
]

Left lane polyline followed by right lane polyline.

---

## Ego Vehicle Modeling

Because the ego vehicle is always the recording vehicle:
- No vehicle detection is needed
- A fixed reference point is used in image space

Example reference point:

ego_point = (image_width * 0.5, image_height * 0.9)

This approximates the front-center of the vehicle.

---

## Lane Crossing Logic

### Boundary Representation

- Lanes are represented as polylines
- Polylines are treated as continuous curves
- Signed distance is computed from the ego point to each lane

### Violation Condition

A violation is flagged when:
- The ego point crosses a solid lane boundary
- The crossing persists for N consecutive frames
- Motion direction confirms a true departure rather than jitter

Example logic:

if prev_signed_distance > 0 and curr_signed_distance < 0:
    potential_violation += 1

Temporal smoothing is applied to reduce false positives.

---

## Solid vs Dashed Lane Handling

The TuSimple dataset does not explicitly label solid versus dashed lanes.

For the hackathon MVP:
- Road-edge lanes are assumed to be solid
- Continuity heuristics may be used to infer solidity
- Manual overrides are supported in the frontend

This tradeoff is intentional for speed and clarity.

---

## Output Format

Each detected violation is emitted as a structured JSON event:

{
  "type": "solid_lane_cross",
  "lane": "left",
  "start_time": 12.4,
  "end_time": 13.1,
  "frame_start": 372,
  "frame_end": 393,
  "confidence": 0.87
}

These events are consumed by:
- Driver scoring logic
- Frontend timeline markers
- User review and correction tools

---

## Tech Stack

- Python 3.9 or newer
- PyTorch
- OpenCV
- NumPy
- AWS EC2 (GPU optional)

---

## Running Inference

Example command:

python inference/process_video.py \
  --input path/to/dashcam.mp4 \
  --output outputs/violations.json

---

## Demo Video

Tested using the following dashcam footage:  
https://www.youtube.com/watch?v=UVHiE_g-IAc

(Video downloaded and processed locally.)

