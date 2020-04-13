<template>
  <div>
    <div class="option" v-for="option in requests.requestOptions" :key="option.type">
      <div class="pure-button" @click="setActive(option)">{{option.button_label}}</div>
    </div>

  </div>
</template>
<script>
  import { mapFields } from 'vuex-map-fields'

  export default {
    computed: {
      ...mapFields(['requests']),
    },
    methods: {
      setActive(option) {
        let newActive = this.requests.optionMap[option.type]
        this.requests.activePanel = newActive
      }
    }
  }
</script>
<style scoped>

</style>