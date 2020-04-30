<template>
  <div class='place-hold'>
    <div v-if="items.length > 1" class="item-selector">
      <h3>Select the item you want:</h3>
      <V4Select style="height:2em;" :selections="items"
                v-model="selectedItem" v-bind:attached="false" />
    </div>
    <PickupLibrary />

    <V4Button mode="primary" class="request-button" @click="placeHold">Place Hold</V4Button>

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
        this.hold.itemLabel = newVal.label
        this.hold.itemBarcode = newVal.barcode
      }
  },
  computed: {
    ...mapFields({
      hold: 'requests.hold',
      holdOptions: 'requests.holdOptions',

    }),
    items() {
      let items = this.holdOptions.item_options
      for(let i in items) {
        items[i].id = items[i].barcode
        items[i].name = items[i].label
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
    placeHold() {
      this.$store.dispatch('requests/createHold')
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
