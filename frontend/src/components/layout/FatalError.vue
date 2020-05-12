<template>
   <div class="fatal-overlay">
      <div class="fatal">
         <p>Virgo is experiencing techincal difficulties. Please check back later.</p>
         <h2>{{fatal}}</h2>
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

<style lang="scss" scoped>
div.fatal-overlay {
   position: absolute;
   left:0;
   right:0;
   top:0;
   bottom:0;
   z-index: 2000;

   .fatal {
      background: white;
      width: 50%;
      margin: 50px auto;
      text-align: center;
      padding: 50px;
      border: 5px solid var(--color-error);
      border-radius: 5px;
      box-shadow: $v4-box-shadow;
      color: #644;
   }  
}
</style>
