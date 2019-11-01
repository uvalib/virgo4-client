<template>
   <main class="checkout">
      <h1>My Account</h1>
      <div class="checkout-content">
         <div class="working" v-if="lookingUp" >
            <div>Looking up checked-out item details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else class="details">
            <AccountActivities/>
            <table v-if="checkouts.length > 0">
               <tr><th>Title</th><th>Author</th><th>Due</th><th>Fine</th><th>Library</th><th>Call Number</th></tr>
               <tr v-for="(checkout,idx) in checkouts" :key="checkout.id" v-bind:class="{shade: idx%2}" >
                  <td>{{checkout.title}}</td>
                  <td>{{checkout.author}}</td>
                  <td class="nowrap" v-html="formatDueInfo(checkout)"></td>
                  <td class="nowrap">${{checkout.overdueFee}}</td>
                  <td class="nowrap">{{checkout.library}}</td>
                  <td>{{checkout.callNumber}}</td>
               </tr>
            </table>
            <div v-else class="none">
               You currently have no items checked out
            </div>
         </div>
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "checkouts",
   components: {
      AccountActivities
   },
   computed: {
      ...mapState({
         checkouts: state => state.user.checkouts,
         lookingUp: state => state.user.lookingUp,
      }),
   },
   methods: {
      formatDueInfo(checkout) {
         let out =  `<div>${checkout.due.split("T")[0]}</div>`
         if (checkout.overdue) {
            out += "<div class='overdue'>Overdue</div>"
         }
         if ( checkout.recallDate != "") {
             out += `<div class='recall'>Recalled ${checkout.recallDate}</div>`
         }
         return out
      }
   },
   created() {
      this.$store.commit('user/setLookingUp', true)
      this.$store.dispatch("user/getCheckouts")
   }
}
</script>
<style>
.details div.overdue {
   font-size: 0.85em;
   font-weight: bold;
   color: firebrick;
}
.details div.recall {
   font-size: 0.85em;
   font-weight: bold;
   color: var(--color-brand-orange);
}
</style>
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
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
.details {
   text-align: left;
}
.user-name {
   font-size: 1.1em;
   font-weight: bold;
}
table {
   width:100%;
}
table tr th, td.nowrap {
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

