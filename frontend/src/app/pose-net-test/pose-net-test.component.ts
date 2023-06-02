import { Component } from '@angular/core';

import { PoseEstimationService } from '../pose-estimation.service';

import * as poseDetection from '@tensorflow-models/hand-pose-detection'
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pose-net-test',
  templateUrl: './pose-net-test.component.html',
  styleUrls: ['./pose-net-test.component.css']
})
export class PoseNetTestComponent {

  hands$: Observable<poseDetection.Hand[]>;

  constructor(private poseEstimation: PoseEstimationService) {
    this.hands$ = poseEstimation.poses$;
  }

}
