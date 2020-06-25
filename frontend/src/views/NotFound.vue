<template>
   <div class="not-found">
      <h1>Sorry, no results found.</h1>
      <div class="info">
         <p>You may want to try&hellip;
         <ul>
            <li>Broadening your search by tweaking keywords or other filters*.</li>
            <li>Searching <a href="https://guides.lib.virginia.edu/az.php">databases</a> or <a href="https://guides.lib.virginia.edu/?b=s">guides</a>, which cover a broad range of topics.</li>
            <li>Contacting <a href="https://www.library.virginia.edu/askalibrarian">Ask a Librarian</a> for web chat, or a <a href="https://guides.lib.virginia.edu/subjectlibrarians">Subject Liaison</a> for research assistance.</li>
         </ul>
         <p class="sub-note">*Very small segments of the collection have not yet been migrated into the updated Virgo interface, as the migration is still in progress. It is possible that <a href="http://v3.lib.virginia.edu/">searching the old interface</a> will yield the item(s) you’re looking for.</p>
      </div>
   </div>
</template>

<script>
export default {
}
</script>

<style scoped lang="scss">
.not-found {
   min-height: 400px;
   position: relative;
   margin: 25px 0;
}
.info {
   width:50%;
   margin: 5px auto 30px auto;
   text-align: left;
   font-size: 1.1em;
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
.sub-note {
   font-size: 0.85em;
}
p {
   margin: 5px;
}
</style>

