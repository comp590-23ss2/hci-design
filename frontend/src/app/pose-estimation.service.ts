import { Injectable } from '@angular/core';

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/hand-pose-detection'

import { BehaviorSubject, Observable, ReplaySubject, Subject, combineLatestWith, from, map, mergeMap, shareReplay } from 'rxjs';

const FRAMES_PER_SECOND_GOAL = 30;

const VIDEO_CONFIG: MediaStreamConstraints = {
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

@Injectable({
  providedIn: 'root'
})
export class PoseEstimationService {

  private video: Subject<HTMLVideoElement> = new ReplaySubject<HTMLVideoElement>();
  public video$: Observable<HTMLVideoElement> = this.video.asObservable();

  private poses: Subject<poseDetection.Hand[]> = new BehaviorSubject<poseDetection.Hand[]>([]);
  public hands$: Observable<poseDetection.Hand[]> = this.poses.asObservable();

  constructor() {
    this.initVideo();
    this.initDetector().pipe(
      combineLatestWith(this.video$)
    ).subscribe(([detector, video]) => {
      document.body.appendChild(video);
      video.addEventListener('play', () => this.runDetection(video, detector));
    });
  }

  private initVideo() {
    from(navigator.mediaDevices.getUserMedia(VIDEO_CONFIG))
      .subscribe((stream) => {
          let video = window.document.createElement('video') as HTMLVideoElement;
          video.autoplay = true;
          video.srcObject = stream;
          video.style.transform = "scaleX(-1)"
          this.video.next(video);
      });
  }

  initDetector(): Observable<poseDetection.HandDetector> {
    let tfReady = from(tf.ready());
    let createDetector = tfReady.pipe(mergeMap(() => from(poseDetection.createDetector(poseDetection.SupportedModels.MediaPipeHands, {runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands', modelType: 'full'}))));
    return createDetector;
  }

  runDetection(video: HTMLVideoElement, detector: poseDetection.HandDetector): void {
    window.setTimeout(() => {
      let poses = detector.estimateHands(video, {
        flipHorizontal: true 
      });
      from(poses).subscribe(poses => {
        let filteredPoses = poses.filter(pose => pose.score! > 0.85);
        this.poses.next(filteredPoses);
        this.runDetection(video, detector);
      });
    }, 1000 / FRAMES_PER_SECOND_GOAL);
  }

}