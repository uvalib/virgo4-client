<template>
   <div class="welcome">
      <h3>Welcome to the new Virgo discovery experience!</h3>
      <p>
      Virgo is being revamped this spring.  
      The existing Virgo search interface is available at 
      <a href="https://search.lib.virginia.edu" target="_blank">https://search.lib.virginia.edu</a>
      but will be replaced by this service to support:
      </p>
      <ul>
         <li>Improved searching (coming soon)
            <ul>
               <li>more sources</li>
               <li>better relevance</li>
            </ul>
         </li>
         <li>Personalization
            <ul>
               <li>bookmarks that can be saved, managed, and shared</li>
               <li>full control over what sources to search</li>
               <li>powerful account features</li>
            </ul>
         </li>
      </ul>
   </div>
</template>

<script>
export default {
}
</script>

<style scoped>
@media only screen and (min-width: 768px) {
  .welcome {
     width: 60%;
  }
}
@media only screen and (max-width: 768px) {
  .welcome {
     width: 90%;
  }
}
h3 {
   border-bottom: 1px solid var(--uvalib-grey-light);
   border-top: 1px solid var(--uvalib-grey-light);
   margin: 0;
   padding: 5px 0;
}
.welcome {
   margin: 10px auto 50px auto;
   text-align: left;
   color: var(  --uvalib-text);
}
</style>