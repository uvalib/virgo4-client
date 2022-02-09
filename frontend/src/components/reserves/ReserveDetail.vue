<template>
   <div class="reserve-detail">
      <router-link :to="detailsLink(reserve.id)">
         <p>{{reserve.title}}</p>
      </router-link>
      <div class="inset">
         <p>{{reserve.author}}</p>
         <p>{{reserve.callNumber}}</p>
      </div>
   </div>
</template>

<script>
export default {
   props: {
      reserve: {
         type: Object,
         required:  true
      }
   },
   methods: {
      detailsLink(catalogKey) {
         return `/sources/uva_library/items/${catalogKey}`
      },
   }
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
