<template>
  <div class='request-aeon'>
    <h2>Special Collections Request</h2>
    <div v-if="items.length > 1" class="item-selector">
      <h3>Select the item you want:</h3>
      <V4Select style="height:2em;" :selections="items"
                v-model="selectedItem" v-bind:attached="false" />

    </div>
    <p class="error" v-if="errors.barcode">{{errors.barcode}}</p>

    <label class="special-instructions-input">
      <p>Add additional instructions if necessary:</p>
      <textarea v-model="aeon.specialRequest" placeholder="250 character limit" maxlength="250" rows="5"/>
    </label>

    <p>Click "Request" to proceed to the Special Collections request system, where you will be asked to select a visit date.</p>

    <V4Button mode="primary" class="request-button" @click="submitAeon" :disabled="buttonDisabled">Request</V4Button>

    <p class="notice"><b>PLEASE NOTE:</b> These items must be used within the Special Collections reading room.</p>

    <p>Questions? Please contact the Special Collections Library <br>
      at <a href="mailto:scpubserv@virginia.edu">scpubserv@virginia.edu</a> or <a href="tel:434-924-0896">434-924-0896</a>.
    </p>

  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields';

export default {
  data: ()=> {
    return {selectedItem: {}}
  },
  watch: {
      selectedItem (newVal, _oldVal) {
        this.aeon.callNumber = newVal.label
        this.aeon.barcode = newVal.barcode
        this.aeon.notes = newVal.notes
        this.aeon.location = newVal.location
      }
  },
  computed: {
    ...mapFields({
      itemOptions: 'requests.activeOption.item_options',
      aeon: 'requests.aeon',
      errors: 'requests.errors',
      buttonDisabled: 'requests.buttonDisabled',

    }),
    items() {
      let items = this.itemOptions
      // id and name are required in V4Select
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
    submitAeon() {
      this.$store.dispatch('requests/submitAeon')
    }
  }
}

</script>
<style lang="scss" scoped>
div.request-aeon {
   display: flex;
   flex-flow: column wrap ;
   justify-content: space-around;
   align-items: center;
   align-content: space-around;

  h2 {
    margin-top: 2em;
    padding-bottom: 1em
  }

  h2, label, .request-button  {
    border-bottom: 1px solid gray;
  }
}
.item-selector {
  padding-bottom: 20px;
}
.special-instructions-input {
  padding: 2em 0;
  width: 75%;
  textarea {
    width: 100%;
  }
}
.request-button {
  padding: 10px;
}
.notice {
  color: var(--uvalib-red);
}
</style>
