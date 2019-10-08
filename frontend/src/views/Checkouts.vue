<template>
   <main class="checkout">
      <h1>Checked-Out Items</h1>
      <div class="checkout-content">
         <div class="working" v-if="lookingUp" >
            <div>Looking up checked-out item details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else class="details">
            <table>
               <tr><th>Title</th><th>Author</th><th>Due</th><th>Library</th><th>Call Number</th></tr>
               <tr v-for="checkout in checkouts" :key="checkout.id">
                  <td>{{checkout.title}}</td>
                  <td>{{checkout.author}}</td>
                  <td>{{checkout.due}}</td>
                  <td>{{checkout.library}}</td>
                  <td>{{checkout.callNumber}}</td>
               </tr>
            </table>
         </div>
         <BackToVirgo />
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
export default {
   name: "checkouts",
   components: {
      BackToVirgo
   },
   computed: {
      ...mapState({
         checkouts: state => state.user.checkouts,
         lookingUp: state => state.user.lookingUp,
      }),
   },
   created() {
      this.$store.dispatch("user/getCheckouts")
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

