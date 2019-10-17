<template>
   <div class="reserve-detail">
      <p class="text-button">{{reserve.title}}</p>
      <div class="inset">
         <p>{{reserve.author}}</p>
         <p>{{reserve.callNumber}}</p>
         <p>At {{reserve.reserveDesk}}, 
            Available for: {{reserve.circulationRule}} checkout
            <span v-if="reserve.loanPeriod">for {{reserve.loanPeriod}}</span>
         </p>
         <p>Copies Available: {{reserve.copies}}</p>
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
   }
}
</script>

<style scoped>
.reserve-detail {
   margin: 0;
   border-left: 1px solid #ccc;
   padding: 4px 8px;
   border-bottom: 1px solid #ccc;
   border-right: 1px solid #ccc;
   font-weight: normal;
}
p {
   margin: 2px 0;
}
.inset {
   margin-left: 10px;
}
</style>