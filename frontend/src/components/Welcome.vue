<template>
   <div class="welcome">
      <h3>Welcome to the new Virgo discovery experience!</h3>
      <p>
         Virgo is being revamped, and you are viewing the newest public version.
      </p>
      <p>
         As of April 29, 2020, this interface replaces "Virgo Classic" as the location for Course Reserves.
      </p>
      <p>
         The <a href="http://search.lib.virginia.edu/" target="_blank">existing Virgo search interface remains available</a>, 
         and will be fully replaced by this new interface later in 2020. 
         We're currently working to ensure that the new release is easy to use, accessible, and inherently mobile-friendly. 
         Stay tuned! 
      </p>
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
     padding-bottom:25px;
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