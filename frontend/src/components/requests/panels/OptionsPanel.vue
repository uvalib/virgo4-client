<template>
   <div class="options">
      <div class="option" v-for="option in requests.requestOptions" :key="option.type">
         <V4Button
            mode="tertiary"
            class="option-button"
            @click="setActive(option)"
         >{{option.button_label}}</V4Button>
         <p class="desc" v-if="option.description" v-html="option.description"></p>
      </div>
   </div>
</template>
<script>
import { mapFields } from "vuex-map-fields";
import { mapGetters } from "vuex";

export default {
   computed: {
      ...mapFields(["requests"]),
      ...mapGetters({
         findOption: "requests/findOption",
         isSignedIn: "user/isSignedIn"
      })
   },
   methods: {
      setActive(option) {
         let newActive = this.requests.optionMap[option.type];
         let optionSettings = this.findOption(newActive);
         if (optionSettings.sign_in_required && !this.isSignedIn) {
            this.$store.commit('restore/setActiveRequest', newActive)
            this.requests.activePanel = "signInPanel";
         } else {
            this.requests.activePanel = newActive;
            this.requests.activeOption = optionSettings;
         }
      }
   }
};
</script>
<style lang="scss" scoped>
.options {
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
   align-items: flex-start;

   .option {
      max-width: 175px;
      margin: 10px;
      text-align: left;

      .desc {
         padding: 0;
         margin: 10px 0;
         font-size: 0.95em;
         font-weight: normal;
      }
   }
}
</style>