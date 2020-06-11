<template>
  <div class='request-aeon'>
    <div v-if="items.length > 1" class="item-selector">
      <h3>Select the item you want:</h3>
      <V4Select style="height:2em;" :selections="items"
                v-model="selectedItem" v-bind:attached="false" />
    </div>
    <PickupLibrary />

    <V4Button mode="primary" class="request-button" @click="submitAeon">Request</V4Button>

  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields';
import PickupLibrary from "@/components/preferences/PickupLibrary"
import V4Select from "@/components/V4Select"

export default {
  components: {
      PickupLibrary, V4Select
   },
  data: ()=> {
    return {selectedItem: {}}
  },
  watch: {
      selectedItem (newVal, _oldVal) {
        // Change to Aeon
        this.hold.itemLabel = newVal.label
        this.hold.itemBarcode = newVal.barcode
      }
  },
  computed: {
    ...mapFields({
      itemOptions: 'requests.activeOption.item_options',

    }),
    items() {
      let items = this.itemOptions
      for(let i in items) {
        items[i].id = items[i].barcode
        items[i].name = items[i].label
        items[i].sc_location = items[i].special_collections_locaction
      }
      return items
    },
  },
  created() {
    if (this.items.length == 1){
      this.selectedItem = this.items[0]
    }
  },
  methods: {
    submitAeon() {
      this.$store.dispatch('requests/submitAeon')
    }
  }
}

</script>
<style>
div.place-hold {
   display: flex;
   flex-flow: column wrap ;
   justify-content: space-around;
   align-items: center;
   align-content: space-around;
}
.place-hold > * {
  border-bottom: 1px solid gray;
  margin-bottom: 20px;
  min-height: 2em;
}
.item-selector {
  padding-bottom: 20px;
}
.request-button {
  padding: 10px;
}
</style>
