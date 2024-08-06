<template>
   <div class="advisory">
      <div class="message">
         <span class="icon"></span>
         <span>Content Advisory</span>
      </div>
   </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.advisory {
   position: absolute;
   top:0;
   left:0;
   width:100%;
   height: 100%;
   background-color: rgba(10,10,10,0.6);
   -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
   .message {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translate(0, -50%);
      width: 100%;
      span.icon {
         display: block;
         width: 34px;
         height: 34px;
         color: white;
         background-image: url('@/assets/eye-slash-white.svg');
         background-repeat:no-repeat;
         background-position: center center;
      }
      span {
         font-family: "franklin-gothic-urw", arial, sans-serif;
         -webkit-font-smoothing: antialiased;
         -moz-osx-font-smoothing: grayscale;
         padding: 0;
         color: white;
         font-size: 17px;
         font-weight: 500;
         display: block;
         margin: 10px auto;
         text-align: center;
      }
   }
}
</style>
