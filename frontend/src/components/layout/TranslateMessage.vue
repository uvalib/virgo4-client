<template>
   <div class="translate-msg">
      <h2>{{message}}</h2>
      <div class="controls">
         <V4Button mode="primary" @click="ackMessage">OK</V4Button>
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

<style lang="scss" scoped>
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
   box-shadow: $v4-box-shadow;
   color: #644;
}
</style>
