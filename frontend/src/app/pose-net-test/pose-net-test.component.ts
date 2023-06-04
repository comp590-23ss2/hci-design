import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

import { PoseEstimationService } from '../pose-estimation.service';

import * as poseDetection from '@tensorflow-models/hand-pose-detection'
import { Observable, Subscription } from 'rxjs';

/* Helper Classes & Interfaces. */

/* This interface type can be used on the model's points, which contain additional properties, as well as ours. */
interface PointLike {
  x: number;
  y: number;
}

/* A simple Point implementation. You will represent a "pinch" as a point. */
class Point implements PointLike {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

/* A simple Line implementation. You will represent a "drag" as a line. */
class Line {
  start: PointLike;
  end: PointLike;

  constructor(start: PointLike, end: PointLike) {
    this.start = start;
    this.end = end;
  }
}

/* Constants of point indices in detected hands used for our purposes. */
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_FINGER_TIP = 8;

/* The component definition is the logic behind the user interface for the prototype screen. */
@Component({
  selector: 'app-pose-net-test',
  templateUrl: './pose-net-test.component.html',
  styleUrls: ['./pose-net-test.component.css']
})
export class PoseNetTestComponent implements AfterViewInit, OnDestroy {

  /* Instance variables that are arrays _you_ should push new values to. */
  pinches: Point[] = [];
  drags: Line[] = [];

  /* Instance Variables used to receive events from the machine learning model. */
  hands$: Observable<poseDetection.Hand[]>;
  private handsSubscription?: Subscription;

  /* Instance Variables used in the HTML visualization. */
  @ViewChild('videoContainer') videoContainer!: ElementRef;
  handsPresent: boolean = false;
  hands: poseDetection.Hand[] = [];


  /* Constructor of this component subscribes to events from the machine learning model. You should not need to modify
  this unless you choose to add instance variables which need some kind of special initialization logic. */
  constructor(private poseEstimation: PoseEstimationService) {
    this.hands$ = poseEstimation.hands$;
    this.handsSubscription = this.hands$.subscribe((hands) => { this.onHandsDetected(hands); });
  }

  /**
   * Your focus -- your "main" method -- is this event handler!
   * 
   * The following method is the event handler receiving updates each time the hand detection model runs. This
   * model attempts to run 30 times per second, so this method is called very frequently.
   * 
   * @param hands MediaPipe's representation of an array of hands where each hand has an array of keypoints per location
   */
  private onHandsDetected(hands: poseDetection.Hand[]): void {
    this.hands = hands;
    if (hands.length > 0) {
      this.handsPresent = true;

      let indexFingerTip: PointLike = hands[0].keypoints[INDEX_FINGER_TIP];
      let thumbTip: PointLike = hands[0].keypoints[THUMB_TIP];
      let wrist: PointLike = hands[0].keypoints[WRIST];

      // TODO: Your work begins here.
      // When a pinch is detected, push a new Point object onto the this.pinches array. You will see a transparent white dot
      // show up in the visualization whenever you push a point onto this.pinches. When a drag is detected, push a new Line
      // object onto the this.drags array. In the visualization, you should see a simple line show up.
      // For an additional challenge, try to get this working with all hands in frame, not just hand[0].
      // You are free to add additional instance variables to the class, as well as additional methods, or even classes, as you
      // see fit in designing the solution to this problem.

    } else {
      this.handsPresent = false;
    }
  }

  /* There's some special initilization and, frankly, hackery involved in pulling the video feed into the correct
  element on our web page such that our visualization shapes draw over the top of the video feed. You can ignore
  these implementation and _accidental_ details. */
  ngAfterViewInit(): void {
    let subscription = this.poseEstimation.video$.subscribe((video) => {
      video.addEventListener('play', () => {
        let container = this.videoContainer.nativeElement as HTMLDivElement;
        container.appendChild(video);
        subscription.unsubscribe();
      });
    });
  }

  /* When this screen gets destroyed, we should unsubscribe from the machine learning model events. */
  ngOnDestroy(): void {
    this.handsSubscription?.unsubscribe();
  }

}