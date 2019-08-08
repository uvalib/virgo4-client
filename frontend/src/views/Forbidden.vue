<template>
   <main class="forbidden">
      <h1>Authentication Failed</h1>
      <div class="messages">
         <p><b>Sorry!</b></p>
         <p>
            Authentication for your account has failed.
         </p>
      </div>
      <p>
         <span @click="backClicked" class="pure-button pure-button-primary">Return to Virgo</span>
      </p>
   </main>
</template>

<script>
export default {
   name: "forbidden",
   methods: {
      backClicked() {
         this.$router.push("/")
      }
   }
}
</script>

<style scoped>
.forbidden {
   min-height: 400px;
   position: relative;
   margin-top: 4vw;
}
.messages {
   width:50%;
   margin: 5px auto 30px auto;
   color: #444;
   font-size: 1.1em;
}
p {
   margin: 5px 0;
}
</style>

