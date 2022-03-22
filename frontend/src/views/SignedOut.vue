<template>
   <div class="signedout">
      <div class="messages">
         <p>You have successfully ended your Virgo session.</p>
      </div>
   </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'

const route = useRoute()
const router = useRouter()

onMounted( () => {
   setTimeout( ()=>{
      if ( route.name == "signedout" ) {
         router.push("/")
      }
   }, 5000)
})
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

