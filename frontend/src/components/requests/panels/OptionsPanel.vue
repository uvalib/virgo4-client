<template>
  <div>
    <div class="option" v-for="option in requests.requestOptions" :key="option.type">
      <div class="pure-button" @click="setActive(option)">{{option.button_label}}</div>
    </div>

  </div>
</template>
<script>
  import { mapFields } from 'vuex-map-fields'
  import { mapGetters } from "vuex";


  export default {
    computed: {
      ...mapFields(['requests']),
      ...mapGetters({findOption: 'requests/findOption', isSignedIn: 'user/isSignedIn'})
    },
    methods: {
      setActive(option) {
        let newActive = this.requests.optionMap[option.type]
        if(this.findOption(newActive).sign_in_required && !this.isSignedIn ){
          this.requests.nextPanel = newActive
          this.requests.activePanel = 'signInPanel'
        } else {
          this.requests.activePanel = newActive

        }

      }
    }
  }
</script>
<style scoped>

</style>