<template>
   <h2>Bound in</h2>
   <div class="items">
      <router-link class="card" v-for="boundItem in item.boundIn" :key="boundItem.itemID"
         :to="'/items/u' + boundItem.title_id">
         <p class="title">{{ boundItem.title }}</p>
         <p>{{ boundItem.author }}</p>
         <p>{{ boundItem.call_number }}</p>
         <p v-if="'u' + boundItem.title_id != item.identifier">(Click for availability)</p>
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
   gap: 15px;

   .card {
      font-size: 0.9em;
      border: 1px solid var(--uvalib-grey-light);
      max-width: 350px;
      background: white;
      padding: 15px;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 15px;
      color: var(--uvalib-text);

      &:hover {
         top: -2px;
         box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0,1);
         text-decoration: none;
      }

      .title {
         font-size: 1em;
         font-weight: bold;
         padding-bottom: 15px;
         border-bottom: 1px solid var(--uvalib-grey-light);
      }

      p {
         margin: 0;
      }
   }
}
</style>