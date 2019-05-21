<template>
   <div id="app">
      <VirgoHeader/>
      <router-view/>
      <LibraryFooter/>
   </div>
</template>

<script>
import LibraryFooter from "@/components/LibraryFooter"
import VirgoHeader from "@/components/VirgoHeader"
export default {
   components: {
      VirgoHeader,
      LibraryFooter
   }
};
</script>

<style>
html, body {
   margin: 0;
   padding: 0;
   background: white;
}

#app {
   font-family: "Avenir", Helvetica, Arial, sans-serif;
   -webkit-font-smoothing: antialiased;
   -moz-osx-font-smoothing: grayscale;
   text-align: center;
   color: #2c3e50;
   margin:0;
   padding:0;
}

#app a {
   color: cornflowerblue;
   font-weight: 500;
   text-decoration: none;
}
#app a:hover {
   text-decoration: underline;
}
</style>
