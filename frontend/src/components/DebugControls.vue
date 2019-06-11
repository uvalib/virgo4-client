<template>
   <div class="debug-options">
      <span v-if="isDebugEnabled" @click="toggleDebug" class="debug pure-button pure-button-primary">{{debugLabel}}</span>
      <span v-if="areWarningsEnabled" @click="toggleWarn" class="debug pure-button pure-button-primary">{{warnLabel}}</span>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
         showDebug: state => state.showDebug,
         showWarn: state => state.showWarn,
      }),
      ...mapGetters({
        isDebugEnabled: 'isDebugEnabled',
        areWarningsEnabled: 'areWarningsEnabled'
      }),
      debugLabel() {
        if (this.showDebug) {
          return "Hide Debug"
        }
        return "Show Debug"
      },
      warnLabel() {
        if (this.showWarn) {
          return "Hide Warnings"
        }
        return "Show Warnings"
      }
   },
   methods: {
      toggleDebug() {
         this.$store.commit("toggleDebug")
      },
      toggleWarn() {
         this.$store.commit("toggleWarn") 
      }
   }
};
</script>

<style scoped>
.debug-options {
   text-align: right;
   padding: 3px 5px;
}
.debug.pure-button.pure-button-primary {
  font-size: 0.75em;
  padding: 2px 12px;
  margin-left: 5px;
  opacity: 0.7;
  border-radius: 5px;
  background: green;
}
.debug.pure-button.pure-button-primary:hover {
   opacity:1;
}
</style>
