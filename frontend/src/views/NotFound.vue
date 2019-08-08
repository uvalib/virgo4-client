<template>
   <main class="not-found">
      <h1>Page Not Found</h1>
      <div class="messages">
         <p><b>Sorry!</b></p>
         <p>
            The page you requested cannot be found.
         </p>
      </div>
      <div class="info">
         <div class="subhead">Where Else Can I Find Research Materials?</div>
         <div class="details">
            <div class=note>
               <b>Not looking for the Library catalog?</b><br/>You can also explore the resources listed below to find research materials. 
               The Library's departmental guides, comprehensive database list, and journal finder tools can help you find 
               on-topic articles, datasets, and more.
            </div>
            <div class="break">Resources</div>
            <div class="links">
               <p><a href="https://library.virginia.edu/research" target="_blank">Subject Guides</a></p>
               <p><a href="https://guides.lib.virginia.edu/journalfinder" target="_blank">Journal Finders</a></p>
               <p><a href="https://guides.lib.virginia.edu/az.php" target="_blank">Databases A–Z</a></p>
            </div>
         </div>
      </div>
      <p>
         <span @click="backClicked" class="pure-button pure-button-primary">Return to Virgo</span>
      </p>
   </main>
</template>

<script>
export default {
   name: "notfound",
   methods: {
      backClicked() {
         this.$router.push("/")
      }
   }
}
</script>

<style scoped>
.not-found {
   min-height: 400px;
   position: relative;
   margin: 4vw 0;
}
.messages, .info {
   width:40%;
   margin: 5px auto 30px auto;
   color: #444;
   font-size: 1.1em;
}
.details {
   padding : 10px;
   font-size: 0.85em;
   color: #555;
}
.break {
   margin: 5px 0;
   font-weight: bold;
   border-bottom: 1px solid #ccc;
   border-top: 1px solid #ccc;
   padding: 3px;
}
p {
   margin: 5px;
}
.links, .note {
   padding: 5px;
   font-weight: 100;
}
div.subhead {
   background: var(--color-primary-orange);
   color: white;
   margin: 8px 0 0 0;
   padding: 5px;
   font-weight: bold;
   position: relative;
}
</style>

