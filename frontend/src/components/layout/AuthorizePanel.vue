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
</style>
