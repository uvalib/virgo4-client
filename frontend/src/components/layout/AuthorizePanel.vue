<template>
   <div class="authorize-overlay">
      <div class="authorize">
         <h3>Authorizing...</h3>
         <div class="spinner">
           <div class="bounce1"></div>
           <div class="bounce2"></div>
           <div class="bounce3"></div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         fatal: state => state.system.fatal,
      }),
   }
}
</script>

<style scoped>
div.authorize-overlay {
   position: absolute;
   left:0;
   right:0;
   top:0;
   bottom:0;
   z-index: 2000;
}
div.authorize {
   background: white;
   margin: 5vw auto;
   text-align: center;
   padding: 10px 150px 25px 150px;
   display: inline-block;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
}
div.authorize h1 {
  color: var(--uvalib-text);
  border: none;
}
.spinner {
  margin: 0 auto;
  width: 80px;
  text-align: center;
}
.spinner > div {
  width: 18px;
  height: 18px;
  background-color: var(--uvalib-brand-orange);
  border-radius: 100%;
  display: inline-block;
  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  margin: 0 2px;
}
.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
@-webkit-keyframes sk-bouncedelay {
  0%, 80%, 100% { -webkit-transform: scale(0) }
  40% { -webkit-transform: scale(1.0) }
}
@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  } 40% {
    -webkit-transform: scale(1.0);
    transform: scale(1.0);
  }
}
</style>
