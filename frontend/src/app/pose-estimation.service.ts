import { Injectable } from '@angular/core';

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/hand-pose-detection'

import { BehaviorSubject, Observable, Subject, combineLatestWith, from, map, mergeMap } from 'rxjs';

const FRAMES_PER_SECOND_GOAL = 30;

const VIDEO_CONFIG = {
  'audio': false,
  'video': {
    facingMode: 'user',
    width: 640,
    height: 480,
    frameRate: {
      ideal: FRAMES_PER_SECOND_GOAL
    }
  }
};

// const DETECTION_CONFIG: poseDetection.me = {
//   // inputResolution: { width: 640, height: 480 },
//   // architecture: 'MobileNetV1',
//   // quantBytes: 4,
//   // outputStride: 16
// };

@Injectable({
  providedIn: 'root'
})
export class PoseEstimationService {

  public video?: HTMLVideoElement;
  public detector?: poseDetection.HandDetector;

  private poses: Subject<poseDetection.Hand[]> = new BehaviorSubject<poseDetection.Hand[]>([]);
  public poses$: Observable<poseDetection.Hand[]> = this.poses.asObservable();

  constructor() {
    this.initDetector().pipe(
      combineLatestWith(this.initVideo())
    ).subscribe(([detector, video]) => {
      this.detector = detector;
      this.video = video;
      document.body.appendChild(video);
      video.addEventListener('play', () => this.runDetection());
    });
  }

  private initVideo(): Observable<HTMLVideoElement> {
    return from(navigator.mediaDevices.getUserMedia(VIDEO_CONFIG))
      .pipe(
        map((stream) => {
          let video = window.document.createElement('video') as HTMLVideoElement;
          video.width = 640;
          video.height = 480;
          video.autoplay = true;
          video.srcObject = stream;
          video.style.position = "fixed";
          video.style.top = "20px";
          video.style.right = "0";
          // video.style.visibility = 'hidden';
          return video;
        })
      );
  }

  initDetector(): Observable<poseDetection.HandDetector> {
    let tfReady = from(tf.ready());
    let createDetector = tfReady.pipe(mergeMap(() => from(poseDetection.createDetector(poseDetection.SupportedModels.MediaPipeHands, {runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands', modelType: 'full'}))));
    return createDetector;
  }

  runDetection(): void {
    window.setTimeout(() => {
      let poses = this.detector!.estimateHands(this.video!, {
        flipHorizontal: false
      });
      from(poses).subscribe(poses => {
        let filteredPoses = poses.filter(pose => pose.score! > 0.65);
        this.poses.next(filteredPoses);
        this.runDetection();
      });
    }, 1000 / FRAMES_PER_SECOND_GOAL);
  }

}