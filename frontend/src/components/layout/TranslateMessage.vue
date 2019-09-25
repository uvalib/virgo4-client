<template>
   <div class="translate-msg">
      <h2>{{message}}</h2>
      <div class="controls">
         <span @click="ackMessage" class="pure-button pure-button-primary">OK</span>  
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         message: state => state.system.translateMessage,
      }),
   },
   methods: {
      ackMessage() {
         this.$store.commit("system/closeTraslateMessage")
      }
   }
}
</script>

<style scoped>
div.translate-msg {
   background: white;
   position: fixed;
   width: 40%;
   left: 50%;
   transform: translate(-50%, 0%);
   height: auto;
   top: 15%;
   z-index: 2000;
   text-align: center;
   padding: 50px;
   border: 5px solid var(--color-primary-orange);
   border-radius: 5px;
   box-shadow: 2px 2px 8px black;
   color: #644;
}
</style>
