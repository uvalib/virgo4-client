<template>
   <main class="signedout">
      <h1>Signed Out</h1>
      <div class="messages">
         <p>You have successfully ended your Virgo session.</p>
         <p v-if="sessionType=='netbadge'">
            To prevent unauthorized access to your 
            <a href="http://its.virginia.edu/netbadge/" target="_blank">NetBadge account</a> 
            you may 
            <a href="https://netbadge.virginia.edu/logout.cgi" rel="nofollow">
               click here to turn in your NetBadge.
            </a> 
         </p>
         <BackToVirgo />
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
export default {
   name: "signedout",
   components: {
      BackToVirgo
   },
   computed: {
      ...mapState({
         sessionType: state => state.user.sessionType,
      }),
   }
}
</script>

<style scoped>
.signedout {
   min-height: 400px;
   position: relative;
   margin-top: 25px;
}
.messages {
   width:40%;
   margin: 5px auto 30px auto;
   color: #444;
   font-size: 1.1em;
}
</style>

