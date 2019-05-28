<template>
   <div class="pools-overlay">
      <div class="pools-container">
         <h4>Available Search Pools<i class="action close fas fa-times-circle" @click="closeClicked"></i></h4>
         <div class="pools-list">
            <div class="pool" v-for="p in pools" :key="p.id">
               <p>{{p.name}}</p>
               <p>{{p.url}}</p>
               <p>{{p.description}}</p>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   components: {
   },
   computed: {
      ...mapState({
         pools: state => state.pools,
      })
   },
   methods: {
      closeClicked() {
        this.$store.commit("showPoolsOverlay", false)
      }
   }
}
</script>

<style scoped>
.pools-overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 25%;
  z-index: 1000;
}
.pools-container {
   background: white;
   display: inline-block;
   box-shadow: 2px 2px 10px #ccc;
   border-radius: 5px;
   z-index: 1005;
}
.pools-container h4 {
   padding: 5px 40px;
   margin: 0;
   text-align: center;
   font-size: 0.8em;
   background: #0078e7;
   color: white;
   border-radius: 5px 5px 0 0;
   position: relative;
}
.pools-list {
   margin: 5px 10px;
   font-size: 0.9em;
}
.pool {
   margin:10px 0;
   text-align: left;
   border: 1px solid #ccc;
   padding:4px 8px;
}
.pool p {
   margin: 0;
}
i.close {
  opacity: 0.8;
  font-size: 1.1em;
  position: absolute;
  top: 7px;
  right: 7px;
}
i.close:hover {
   opacity: 1;
   cursor: pointer;
}
</style>
