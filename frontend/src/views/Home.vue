<template>
   <div class="home">
     <p class="fatal">{{fatal}}</p>
      <h4>Welcome to Virgo4</h4>
      <p>API: {{searchAPI}}</p>
   </div>
</template>

<script>
import { mapState } from "vuex";
export default {
   name: "home",
   components: {},
   data: function() {
      return {};
   },
   computed: {
      ...mapState({
         searchAPI: state => state.searchAPI,
         fatal: state => state.fatal
      })
   },
   created: function() {
      this.$store.dispatch("getConfig");
   }
};
</script>

 <style scoped>
 p.fatal {
   font-weight: bold;
   color: firebrick;
 }
 </style>
