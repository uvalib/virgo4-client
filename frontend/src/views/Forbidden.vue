<template>
   <div class="forbidden">
      <h1>Authentication Failed</h1>
      <div class="messages">
         <p><b>Sorry!</b></p>
         <p>
            Authentication for your account has failed.
         </p>
      </div>
   </div>
</template>

<script>
export default {
   name: "forbidden",
}
</script>

<style scoped>
.forbidden {
   min-height: 400px;
   position: relative;
   margin-top: 25px;
}
.messages {
   width:50%;
   margin: 5px auto 30px auto;
   color: #444;
   font-size: 1.1em;
}
@media only screen and (min-width: 768px) {
   div.messages  {
       width: 50%;
   }
}
@media only screen and (max-width: 768px) {
   div.messages  {
       width: 70%;
   }
}
p {
   margin: 5px 0;
}
</style>

