import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

import { Engine, Events, Body, Render, World, Bodies } from 'matter-js';
import * as posenet from '@tensorflow-models/posenet';


async function setupCamera() {
  const videoWidth = 600;
  const videoHeight = 500;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      width: videoWidth,
      height: videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

function drawKeyPoints(keypoints, minConfidence, context) {
  keypoints.forEach(keypoint => {
    if (keypoint.score > minConfidence) {
      const { x, y } = keypoint.position;
      context.beginPath();
      context.arc(x, y, 10, 0, 2 * Math.PI);
      context.fillStyle = 'cyan';
      context.fill();
    }
  });
}


async function loadVideo() {
  const video = await setupCamera();
  video.play();
  return video;
}

const videoWidth = 600;
const videoHeight = 500;
const canvas = document.getElementById('poses-canvas');
canvas.width = videoWidth;
canvas.height = videoHeight;
const context = canvas.getContext('2d');

async function detectPoses() {
  const video = await loadVideo();

  const scaleFactor = 0.50;
  const flipHorizontal = false;
  const outputStride = 16;
  const net = await posenet.load();
  setInterval(async () => {
    const pose = await net.estimateSinglePose(video, scaleFactor, flipHorizontal, outputStride);
    //console.log(pose);
    context.clearRect(0, 0, videoWidth, videoHeight);
    //context.save();
    //context.scale(-1, 1);
    //context.translate(-videoWidth, 0);
    context.drawImage(video, 0, 0, videoWidth, videoHeight);    
    drawKeyPoints(pose.keypoints, 0.5, context);
    drawRightUpperArm(pose.keypoints)
    drawRightForeArm(pose.keypoints);
    //context.restore();
  }, 100)
}

detectPoses();

const engine = Engine.create();

  const render = Render.create({
    canvas: document.getElementById('matter-canvas'),
    engine: engine,
    background: 'transparent',
    wireframeBackground: 'transparent',
    options: {
      width: 600,
      height: 500,
      wireframes: false
    }    
  });

  const boxA = Bodies.rectangle(400, 200, 80, 80);
  const boxB = Bodies.rectangle(450, 50, 80, 80);
  const ground = Bodies.rectangle(300, 495, 580, 10, { isStatic: true });
  const rightUpperArm = Bodies.rectangle(50, 50, 100, 30, {isStatic:true});
  const rightForeArm = Bodies.rectangle(50, 50, 100, 30, {isStatic:true});


  setInterval(()=> {
    const box = Bodies.rectangle(Math.random() * 600, 0, 20, 20);
    World.add(engine.world, box);
  },200);
  

  // add all of the bodies to the world
  World.add(engine.world, [boxA, boxB, ground, rightUpperArm, rightForeArm]);

  let prevX = 0;
  //let rotation = 0;

  Events.on(engine, 'beforeUpdate', () => {
    const newX = prevX;// + 10;
    //Body.setVelocity(ground, { x: newX - ground.position.x, y: 0 });
    //Body.setPosition(ground, { x: newX, y: ground.position.y });
    //Body.rotate(ground, rotation += 0.0002)
    //Body.setAngularVelocity(ground, 0.0002);
    prevX = newX;
  });

  // run the engine
  Engine.run(engine);

  // run the renderer
  Render.run(render);

  let prevRightUpperArmLength = 100;

  function drawRightUpperArm(keypoints) {  
    const shoulder = keypoints[6];
    const elbow = keypoints[8];
    if (shoulder.score > 0.2 && elbow.score > 0.2) { 
      const xDiff = shoulder.position.x - elbow.position.x;
      const yDiff =  shoulder.position.y - elbow.position.y;      
      const limbLength = Math.hypot(xDiff, yDiff);
      const limbScale = limbLength / prevRightUpperArmLength;
      prevRightUpperArmLength = limbLength;
      console.log(limbScale);
      const rotation = Math.atan2( yDiff, xDiff);
      const centerX = shoulder.position.x - (xDiff * 0.5);
      const centerY = shoulder.position.y - (yDiff * 0.5);
      //console.log(arm);
      Body.setPosition(rightUpperArm, { x: centerX, y: centerY });
      //sneaky angle reset to prevent skewing of object vertices;
      Body.setAngle(rightUpperArm, 0)
      Body.scale(rightUpperArm, limbScale, 1);
      Body.setAngle(rightUpperArm, rotation)
      
      //console.log({limbLength, rotation, centerX, centerY, limbScaleX});
    }
  }

  let prevRightForeArmLength = 100;

  function drawRightForeArm(keypoints) {
    const shoulder = keypoints[8];
    const elbow = keypoints[10];
    if (shoulder.score > 0.2 && elbow.score > 0.2) { 
      const xDiff = shoulder.position.x - elbow.position.x;
      const yDiff =  shoulder.position.y - elbow.position.y;      
      const limbLength = Math.hypot(xDiff, yDiff);
      const limbScale = limbLength / prevRightForeArmLength;
      prevRightForeArmLength = limbLength;
      console.log(limbScale);
      const rotation = Math.atan2( yDiff, xDiff);
      const centerX = shoulder.position.x - (xDiff * 0.5);
      const centerY = shoulder.position.y - (yDiff * 0.5);
      //console.log(arm);
      Body.setPosition(rightForeArm, { x: centerX, y: centerY });
      //sneaky angle reset to prevent skewing of object vertices;
      Body.setAngle(rightForeArm, 0)
      Body.scale(rightForeArm, limbScale, 1);
      Body.setAngle(rightForeArm, rotation)
      
      //console.log({limbLength, rotation, centerX, centerY, limbScaleX});
    }
  }