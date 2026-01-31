import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';
import { run, get } from '../db/index.js';
import { logger } from '../config/logger.js';

export const router = Router();

const upload = multer({ dest: 'backend/data/uploads/' });

router.post('/analyze', upload.single('video'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }

  const videoFile = req.file;
  const videoFilePath = videoFile.path;

  try {
    // 1. Create a record in the 'videos' table
    const videoInsertResult = await run(
      'INSERT INTO videos (user_id, filename, filepath) VALUES (?, ?, ?)',
      [1, videoFile.originalname, videoFilePath] // Using default user_id 1
    );
    const videoId = videoInsertResult.lastID;

    // 2. Create a directory to store the frames for this video
    const framesDir = path.join('backend/data/frames', String(videoId));
    fs.mkdirSync(framesDir, { recursive: true });


    // Respond to the client immediately
    res.status(202).json({
      message: 'Video upload accepted. Processing in the background.',
      videoId: videoId,
    });

    // 3. Use ffmpeg to extract frames in the background
    ffmpeg(videoFilePath)
      .on('filenames', function (filenames) {
        logger.info('Will generate ' + filenames.join(', '));
      })
      .on('end', async () => {
        logger.info(`Finished processing video ID: ${videoId}`);
        const frameFiles = fs.readdirSync(framesDir);
        for (const [i, frameFile] of frameFiles.entries()) {
          const framePath = path.join(framesDir, frameFile);
          const frameNumber = i + 1;
          const timestamp = frameNumber; // Assumes 1 frame per second
          await run(
            'INSERT INTO frames (video_id, frame_number, filepath, timestamp_in_video) VALUES (?, ?, ?, ?)',
            [videoId, frameNumber, framePath, timestamp]
          );
        }
        logger.info(`Successfully saved ${frameFiles.length} frames for video ID: ${videoId}`);
      })
      .on('error', (err) => {
        logger.error(`Error processing video ID ${videoId}:`, err);
        // Here you might want to update the video's status in the DB to 'failed'
      })
      .screenshots({
        // Takes 1 frame per second
        fps: 1,
        folder: framesDir,
        filename: 'frame-%03d.png', // e.g., frame-001.png
      });

  } catch (error) {
    logger.error('Error in /analyze route:', error);
    next(error);
  }
});
