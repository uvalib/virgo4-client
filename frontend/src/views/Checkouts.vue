<template>
   <main class="checkout">
      <h1>Checked-Out Items</h1>
      <div class="checkout-content">
         <div class="working" v-if="lookingUp" >
            <div>Looking up checked-out item details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else class="details">
            Not yet implemented
         </div>
         <BackToVirgo />
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
export default {
   name: "checkouts",
   components: {
      BackToVirgo
   },
   data: function() {
      return {
         lookingUp: true,
      };
   },
   computed: {
      ...mapState({
         // info: state => state.user.checkoutInfo,
      }),
      ...mapGetters({
      //   hasAccountInfo: 'user/hasAccountInfo',
      }),
   },
   created() {
      this.$store.dispatch("user/getCheckouts").then(_response => {
         this.lookingUp = false
      })
   }
}
</script>

<style scoped>
.checkout {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.checkout-content {
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.checkout-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.checkout-content  {
       width: 80%;
   }
}
.details {
   text-align: left;
}
.user-name {
   font-size: 1.1em;
   font-weight: bold;
}
</style>

