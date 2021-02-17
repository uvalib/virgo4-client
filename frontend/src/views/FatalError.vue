<template>
   <div class="fatal-error">
      <div class="message">
         <h3>Virgo is experiencing technical difficulties. Please check back later.</h3>
         <h4>{{fatal}}</h4>
         <p>If this problem persists, <a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a></p>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   name: "fatal_error",
   computed: {
      ...mapState({
         fatal: state => state.system.fatal,
      }),
   }
}
</script>

<style scoped lang="scss">
.fatal-error {
   min-height: 400px;
   position: relative;
   margin: 25px auto;
   .message {
      text-align: center;
   }
}
@media only screen and (min-width: $breakpoint-mobile) {
   .fatal-error  {
       width: 50%;
   }
}
@media only screen and (max-width: $breakpoint-mobile) {
   .fatal-error {
       width: 80%;
   }
}
</style>

