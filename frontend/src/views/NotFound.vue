<template>
   <div class="not-found">
      <div class="info">
         <p>
            It looks like there's a typo in this address or perhaps an outdated link led you to the wrong place.
            Don't worry - there are lots of places to go from here:
         </p>
         <ul>
            <li>Click "<router-link to="/">Search</router-link>" above to begin a new search in the Library's catalog.</li>
            <li>To access <router-link to="/account">account information</router-link>, click "Sign in" above. If you are already signed in, it will read "Signed in as..."" with your ID.</li>
            <li>
               Use the "Library Services" link above or visit the
               <a href="http://library.virginia.edu/" target="_blank" aria-describedby="new-window">Library home page</a>
               to see more options for Library services.
            </li>
            <li>You're always welcome to <a href="http://www.library.virginia.edu/askalibrarian/" target="_blank" aria-describedby="new-window">Ask a Librarian</a> for help!</li>
         </ul>
      </div>
   </div>
</template>

<script setup>
import analytics from '@/analytics'
analytics.trigger('Navigation', 'NOT_FOUND')
</script>

<style scoped lang="scss">
.not-found {
   min-height: 400px;
   position: relative;
   margin: 25px 0;
   .info {
      width:50%;
      margin: 35px auto 30px auto;
      text-align: left;
      font-size: 1.25em;
   }
   ul {
      font-size: 0.9em;
      text-align: left;
   }
}
@media only screen and (min-width: 768px) {
   .info  {
       width: 50%;
   }
}
@media only screen and (max-width: 768px) {
   .info  {
       width: 80%;
   }
}
</style>

