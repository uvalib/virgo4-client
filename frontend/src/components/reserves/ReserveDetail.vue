<template>
   <div class="reserve-detail">
      <router-link :to="detailsLink(props.reserve.id)">
         <p>{{props.reserve.title}}</p>
      </router-link>
      <div class="inset">
         <p>{{props.reserve.author}}</p>
         <p>{{props.reserve.callNumber}}</p>
      </div>
   </div>
</template>

<script setup>
const props = defineProps({
   reserve: {
      type: Object,
      required:  true
   }
})
function detailsLink(catalogKey) {
   return `/sources/uva_library/items/${catalogKey}`
}
</script>

<style scoped>
.reserve-detail {
   margin: 0 0 10px 0;
   padding: 4px 8px;
   font-weight: normal;
}
p {
   margin: 2px 0;
}
.inset {
   margin-left: 0px;
}
.available {
  margin-top: 10px;
}
</style>
