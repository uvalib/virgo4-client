<template>
   <div class="not-found">
      <h1>Page Not Found</h1>
      <div class="info">
         <p>We're sorry, but we can't find that page.</p>
         <p>You may wish to search Virgo or consult our other resources for finding research materials listed below.</p>
      </div>
      <div class="info">
         <div class="subhead">Where Else Can I Find Research Materials?</div>
         <div class="details">
            <div class=note>
               You can also explore the resources listed below to find research materials.
               The Library's departmental guides, comprehensive database list, and journal finder tools can help you find
               on-topic articles, datasets, and more.
            </div>
            <div class="break">Resources</div>
            <ul class="links">
               <li><a href="https://library.virginia.edu/research" target="_blank">Subject Guides</a></li>
               <li><a href="https://guides.lib.virginia.edu/journalfinder" target="_blank">Journal Finders</a></li>
               <li><a href="https://guides.lib.virginia.edu/az.php" target="_blank">Databases A–Z</a></li>
            </ul>
         </div>
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
      margin: 5px auto 30px auto;
      text-align: left;
      font-size: 1.1em;
   }
   .break {
      margin: 15px 0;
      font-weight: bold;
      border-bottom: 1px solid #ccc;
      border-top: 1px solid #ccc;
      padding: 3px;
   }
   .subhead {
      margin: 0 0 10px 0;
      font-weight: bold;
   }
   ul {
      list-style: none;
      padding-left: 0;
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

