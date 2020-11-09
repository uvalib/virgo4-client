<template>
   <div class="not-found">
      <h1>Page Not Found</h1>
      <div class="info">
         <p>We're sorry, but we can't find that page.</p>
      </div>
   </div>
</template>

<script>
export default {
   name: "not_found",
   mounted() {
      this.$analytics.trigger('Navigation', 'NOT_FOUND')
   }
}
</script>

<style scoped lang="scss">
.not-found {
   min-height: 400px;
   position: relative;
   margin: 25px 0;
   .info {
      width:50%;
      margin: 35px auto 30px auto;
      text-align: center;
      font-size: 1.4em;
   }
}
@media only screen and (min-width: $breakpoint-mobile) {
   .info  {
       width: 50%;
   }
}
@media only screen and (max-width: $breakpoint-mobile) {
   .info  {
       width: 80%;
   }
}
</style>

