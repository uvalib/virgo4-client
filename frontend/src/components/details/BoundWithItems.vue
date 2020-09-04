<template>
<div class="bound-with">

  <p class="group-header">Bound in:</p>
  <div class="items">
    <router-link class="card" v-for="item in boundIn" :key="item.itemID" :to="'/items/u'+item.title_id">
      <p class="title">{{item.title}}</p>
      <p>{{item.author}}</p>
      <p>{{item.call_number}}</p>
      <p v-if="'u'+item.title_id != identifier">(Click for availability)</p>
    </router-link>
  </div>

  <p class="group-header">Bound with these items:</p>
  <div class="items">
    <a class="card" v-for="item in boundWith" :key="item.title_id" :href="'/items/u'+item.title_id">
      <p class="title">{{item.title}}</p>
      <p>{{item.author}}</p>
      <p>{{item.call_number}}</p>
    </a>

  </div>
</div>
</template>
<script>
import { mapGetters } from "vuex"
export default {
  computed: {
      ...mapGetters({
        boundIn: 'item/boundIn',
        boundWith: 'item/boundWith',
        identifier: 'item/identifier'
      }),
  },

}
</script>
<style lang="scss" scoped>
.bound-with {
  border: 1px solid var(--uvalib-grey-light);
  margin-bottom: 2rem;

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
    padding: 10px 15px;

    .card {
      text-align: left;
      padding: 10px;
      font-size: 0.8em;
      border: 1px solid #ccc;
      margin: 5px;
      display: inline-block;
      max-width: 275px;
      background: white;
      flex-grow: 1;
      border: 1px solid var(--uvalib-grey-light);
      .title {
        font-size:1.1em;
        font-weight: bold;
        margin: inherit;
      }
      p {
        margin: 5px 0 10px 10px;
      }
    }
  }
}

</style>