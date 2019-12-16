<template>
   <div v-show="searching" class="searching-overlay">
      <div class="searching-box">
         <div class="book">
            <div class="book-page"></div>
            <div class="book-page"></div>
            <div class="book-page"></div>
            <p>{{message}}</p>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex";
export default {
   props: {
      message: {
         type: String,
         required: true
      }
   },
   computed: {
      ...mapState({
         searching: state => state.searching
      })
   }
};
</script>

<style scoped>
.searching-overlay {
   position: fixed;
   left: 0;
   right: 0;
   top: 0;
   bottom: 0;
   z-index: 1000;
}
div.searching-box {
   background: white;
   display: inline-block;
   z-index: 1005;
   font-weight: bold;
   margin: 10vw auto;
   box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
   position: relative;
}
@media only screen and (min-width: 768px) {
   div.searching-box {
      padding: 40px 90px;
   }
}
@media only screen and (max-width: 768px) {
   div.searching-box {
      width: 95%;
      padding: 40px 0;
      margin-top: 30%;
   }
   div.tips-container {
      display: none;
   }
}
.book {
   top: 50%;
   transform: translateY(-4%);
   position: relative;
   margin: 0 auto;
   border: 5px solid var(--uvalib-brand-orange);
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
   border-top: 5px solid var(--uvalib-brand-orange);
   border-bottom: 5px solid var(--uvalib-brand-orange);
   border-right: 5px solid var(--uvalib-brand-orange);
   background: #fff;
   width: 70px;
   height: 80px;
   transform-origin: 0% 50%;
   animation: flip 1.2s infinite linear;
   animation-fill-mode: forwards;
}
.book-page:nth-child(1) {
   z-index: -1;
   animation-delay: 1.4s;
}
.book-page:nth-child(2) {
   z-index: -2;
   animation-delay: 2.8s;
}
.book-page:nth-child(3) {
   z-index: -3;
   animation-delay: 4.2s;
}
div.searching-box .book p {
   color: var(--color-primary-text);
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
