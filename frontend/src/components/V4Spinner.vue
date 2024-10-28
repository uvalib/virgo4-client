<template>
   <div v-if="props.overlay" class="v4-spinner-overlay">
      <div class="v4-spinner"  :class="{border: props.dots}">
         <template v-if="props.dots">
            <h3 v-if="props.message">{{props.message}}</h3>
            <div class="spinner-animation">
               <div class="bounce1" :style="{backgroundColor: props.color}"></div>
               <div class="bounce2" :style="{backgroundColor: props.color}"></div>
               <div class="bounce3" :style="{backgroundColor: props.color}"></div>
            </div>
         </template>
         <template v-else>
            <div class="book">
               <div class="book-page"></div>
               <div class="book-page"></div>
               <div class="book-page"></div>
               <p>Searching...</p>
            </div>
         </template>
      </div>
   </div>
   <div v-else class="v4-spinner embed">
      <h3 v-if="props.message">{{props.message}}</h3>
      <div class="spinner-animation">
         <div class="bounce1" :style="{backgroundColor: props.color, height: props.size, width: props.size}"></div>
         <div class="bounce2" :style="{backgroundColor: props.color, height: props.size, width: props.size}"></div>
         <div class="bounce3" :style="{backgroundColor: props.color, height: props.size, width: props.size}"></div>
      </div>
   </div>
</template>

<script setup>
const props = defineProps({
   message: {
      type: String,
      default: ""
   },
   overlay: {
      type: Boolean,
      default: false
   },
   dots: {
      type: Boolean,
      default: true
   },
   color: {
      type: String,
      default: "#E57200"
   },
   size: {
      type: String,
      default: "18px"
   },
})
</script>

<style lang="scss" scoped>
div.v4-spinner-overlay {
   position: fixed;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   z-index: 1000;
   background: rgba(0, 0, 0, 0.1);
}
div.v4-spinner {
   background: white;
   margin: 12vw auto;
   text-align: center;
   padding: 10px 150px 25px 150px;
   display: inline-block;
   font-weight: bold;
   box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}
div.v4-spinner.embed {
   box-shadow: none;
   padding: 0;
   margin: 0;
   background: transparent;
}
@media only screen and (min-width: 768px) {
   div.v4-spinner {
      padding: 40px 90px;
   }
}
@media only screen and (max-width: 768px) {
   div.v4-spinner {
      width: 95%;
      padding: 40px 0;
      margin-top: 30%;
   }
}
div.v4-spinner h1 {
  border: none;
}
.spinner-animation {
  margin: 0 auto;
  width: 80px;
  text-align: center;
}
.spinner-animation > div {
  width: 18px;
  height: 18px;
  border-radius: 100%;
  display: inline-block;
  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  margin: 0 2px;
}
.spinner-animation .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.spinner-animation .bounce2 {
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

/**  PAGE FLIP ANIMATION **/
.book {
   top: 50%;
   transform: translateY(-4%);
   position: relative;
   margin: 0 auto;
   border: 5px solid $uva-brand-orange;
   width: 140px;
   height: 80px;
   display: flex;
   flex-direction: row;
   flex-wrap: nowrap;
   justify-content: center;
   align-content: stretch;
   align-items: center;
}
.book-page {
   position: absolute;
   left: 50%;
   top: -5px;
   margin: 0 auto;
   border-top: 5px solid $uva-brand-orange;
   border-bottom: 5px solid $uva-brand-orange;
   border-right: 5px solid $uva-brand-orange;
   background: #fff;
   width: 70px;
   height: 80px;
   transform-origin: 0% 50%;
   animation: flip 1.2s infinite linear;
   animation-fill-mode: forwards;
}
.book-page:nth-child(1) {
   z-index: -1;
   animation-delay: 0s;
}
.book-page:nth-child(2) {
   z-index: -2;
   animation-delay: 0.5s;
}
.book-page:nth-child(3) {
   z-index: -3;
   animation-delay: 1s;
}
div.v4-spinner .book p {
   border: none;
   font-size: 1.25em;
   margin: 0 0 10px 0;
}
@keyframes flip {
   0% {
      transform: perspective(600px) rotateY(0deg);
   }
   20% {
      background: #e6e6e6;
   }
   29.9% {
      background: #e6e6e6;
   }
   30% {
      transform: perspective(200px) rotateY(-90deg);
      background: #fff;
   }
   54.999% {
      opacity: 1;
   }
   55% {
      opacity: 0;
   }
   60% {
      transform: perspective(200px) rotateY(-180deg);
      background: #fff;
   }
   100% {
      transform: perspective(200px) rotateY(-180deg);
      background: #fff;
   }
}
</style>
