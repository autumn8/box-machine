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
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fillStyle = 'blue';
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
const canvas = document.querySelector('canvas');
canvas.width = videoWidth;
canvas.height = videoHeight;
const context = canvas.getContext('2d');

async function detectPoses() {
  const video = await loadVideo();

  const scaleFactor = 0.50;
  const flipHorizontal = true;
  const outputStride = 16;
  const net = await posenet.load();
  setInterval(async () => {
    const pose = await net.estimateSinglePose(video, scaleFactor, flipHorizontal, outputStride);
    console.log(pose);
    context.clearRect(0, 0, videoWidth, videoHeight);
    context.save();
    context.scale(-1, 1);
    context.translate(-videoWidth, 0);
    context.drawImage(video, 0, 0, videoWidth, videoHeight);    
    drawKeyPoints(pose.keypoints, 0.5, context);
    context.restore();
  }, 100)
}

detectPoses();

async function setupPhysicsWorld() {



  const engine = Engine.create();

  const render = Render.create({
    canvas: document.querySelector('canvas'),
    engine: engine
  });

  const boxA = Bodies.rectangle(400, 200, 80, 80);
  const boxB = Bodies.rectangle(450, 50, 80, 80);
  const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

  // add all of the bodies to the world
  World.add(engine.world, [boxA, boxB, ground]);

  let prevX = 0;
  let rotation = 0;

  Events.on(engine, 'beforeUpdate', () => {
    const newX = prevX + 10;
    Body.setVelocity(ground, { x: newX - ground.position.x, y: 0 });
    Body.setPosition(ground, { x: newX, y: ground.position.y });
    Body.rotate(ground, rotation += 0.0002)
    //Body.setAngularVelocity(ground, rotation);
    prevX = newX;
  });

  // run the engine
  Engine.run(engine);

  // run the renderer
  Render.run(render);
}

