<template>
   <div v-show="searching" class="searching-overlay">
      <div class="searching-box">
         <p>{{message}}</p>
         <img src="../../assets/searching.gif">
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   props: {
      message: {
         type: String,
         required:  true
      }
   },
   computed: {
      ...mapState({
         searching: state => state.searching,
      })
   }
}
</script>

<style scoped>
.searching-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
}
div.searching-box {
  background: white;
  display: inline-block;
  padding: 20px 90px;
  border: 5px solid var(--color-primary-orange);
  z-index: 1005;
  font-weight: bold;
  margin: 10vw auto;
  box-shadow: 2px 2px 10px #333;
}
@media only screen and (min-width: 768px) {
   div.searching-box {
    padding: 20px 90px;
   }
}
@media only screen and (max-width: 768px) {
   div.searching-box {
       width: 95%;
       padding: 20px 0;
       margin-top:30%;
   }
   div.tips-container {
     display: none;
   }
}
div.searching-box p {
  color: var(--color-primary-text);
  border: none;
  font-size: 1.25em;
  margin: 0 0 10px 0;
}
</style>