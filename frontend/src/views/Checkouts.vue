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
               <tr v-for="(checkout,idx) in checkouts" :key="checkout.id" v-bind:class="{shade: idx%2}" >
                  <td>{{checkout.title}}</td>
                  <td>{{checkout.author}}</td>
                  <td class="date">{{formatDate(checkout.due)}}</td>
                  <td>{{checkout.library}}</td>
                  <td>{{checkout.callNumber}}</td>
               </tr>
            </table>
         </div>
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
export default {
   name: "checkouts",
   computed: {
      ...mapState({
         checkouts: state => state.user.checkouts,
         lookingUp: state => state.user.lookingUp,
      }),
   },
   methods: {
      formatDate(dateStr) {
         return dateStr.split("T")[0]
      }
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
   width: 80%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.checkout-content  {
       width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.checkout-content  {
       width: 95%;
   }
}
.details {
   text-align: left;
}
.user-name {
   font-size: 1.1em;
   font-weight: bold;
}
table tr th, td.date {
   white-space: nowrap;
}
table tr th {
   background-color: #e5e5e5;
   padding: 4px 8px;
   color: #444;
   border-top: 1px solid #ccc;
   border-bottom: 1px solid #ccc;
}
table td {
   padding: 2px 8px;
   border-bottom: 1px solid #ccc;
}
tr.shade td {
   background-color: #fafafa;
}

</style>

