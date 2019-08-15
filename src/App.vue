<template>
  <div id="app">
    <video ref='video' id='video' ></video>
    <canvas id='poses-canvas' ref='poses-canvas'></canvas>  
    <canvas id='matter-canvas' ref='matter-canvas'></canvas>    
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
