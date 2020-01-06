<template>
   <div class="signedout">
      <h1>Signed Out</h1>
      <div class="messages">
         <p>You have successfully ended your Virgo session.</p>
      </div>
   </div>
</template>

<script>
export default {
   name: "signedout",
   created() {
      setTimeout( ()=>{
         if ( this.$route.name == "signedout" ) {
            this.$router.push("/")
         }
      }, 5000)
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

