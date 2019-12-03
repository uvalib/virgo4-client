<template>
   <div class="header">
      <div class="site-link">
         <router-link to="/">
            <span class="site-name">Virgo4</span>
         </router-link>
      </div>
      <div class="library-link">
         <img v-if="isKiosk" alt="University of Virgina Library" class="uva-library" src="../../assets/uvalogo.png"/>
         <a v-else target="_blank" href="https://library.virginia.edu">
            <img alt="University of Virgina Library" class="uva-library" src="../../assets/uvalogo.png"/>
         </a>
      </div>
      <div style="clear:both"></div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapGetters({
         isKiosk: "system/isKiosk",
      }),
   },
}
</script>

<style scoped>
div.header {
   background-color: var(--color-dark-blue);
   color: white;
   padding:10px;
   text-align: left;
   position: relative;
   box-sizing: border-box;
}
#app div.header div.site-link a {
  color: white;
  text-decoration: none;
}
div.header span.site-name {
   margin: 0;
   font-family: 'Cinzel', serif;
   font-size: 2.5em;
   position: relative;
}
div.site-link {
   float:left;
}
img.uva-library {
  max-height: 50px;
}
div.library-link {
   float:right;
}
.subtitle {
   display: inline-block;
   margin: 5px 0 0 15px;
}
</style>
