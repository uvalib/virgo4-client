<template>
   <h2>Bound in</h2>
   <div class="items">
      <router-link class="card" v-for="boundItem in item.boundIn" :key="boundItem.itemID"
         :to="'/items/u' + boundItem.title_id">
         <p class="title">{{ boundItem.title }}</p>
         <p>{{ boundItem.author }}</p>
         <p>{{ boundItem.call_number }}</p>
      </router-link>
   </div>

   <h2>Bound with</h2>
   <div class="items">
      <router-link class="card" v-for="boundItem in item.boundWith" :key="boundItem.itemID"
         :to="'/items/u' + boundItem.title_id">
         <p class="title">{{ boundItem.title }}</p>
         <p>{{ boundItem.author }}</p>
         <p>{{ boundItem.call_number }}</p>
      </router-link>
   </div>
</template>

<script setup>
import { useItemStore } from "@/stores/item"
const item = useItemStore()
</script>

<style lang="scss" scoped>
p.group-header {
   text-align: left;
   margin: 10px;
   display: block;
}

.items {
   display: flex;
   flex-flow: row wrap;
   align-items: stretch;
   justify-content: flex-start;
   position: relative;
   gap: 2rem;

   .card {
      font-size: 1em;
      border: 1px solid $uva-grey-100;
      max-width: 350px;
      background: white;
      padding: 1rem;
      border-radius: 0.3rem;
      cursor: pointer !important;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: $uva-text-color-base;

      &:hover {
         transition: 0.25s ease-in-out;
         box-shadow: 0 0 10px 0 $uva-grey-100;
         z-index: 2;
         text-decoration: none;
         cursor: pointer !important;
      }

      .title {
         font-size: 1em;
         font-weight: bold;
         padding-bottom: 15px;
         border-bottom: 1px solid $uva-grey-100;
      }

      p {
         margin: 0;
      }
   }
}
</style>