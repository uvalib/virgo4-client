<template>
   <div class="authorize-overlay">
      <div class="authorize">
         <h3>Authorizing...</h3>
         <img src="../../assets/spinner2.gif">
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         fatal: state => state.fatal,
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
   border-radius: 5px;
   display: inline-block;
   -webkit-box-shadow: 2px 2px 8px black;
   box-shadow: 2px 2px 8px black;
}
div.authorize h1 {
  color: #666;
  border: none;
}
</style>
