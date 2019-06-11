<template>
   <div class="debug-options">
      <span v-if="debugEnabled" @click="toggleDebug" class="debug pure-button pure-button-primary">{{debugLabel}}</span>
      <span v-if="warnEnabled" @click="toggleWarn" class="debug pure-button pure-button-primary">{{warnLabel}}</span>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         debugEnabled: state => state.diagnostics.debugEnabled,
         warnEnabled: state => state.diagnostics.warnEnabled,
         showDebug: state => state.diagnostics.showDebug,
         showWarn: state => state.diagnostics.showWarn,
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
         this.$store.commit("diagnostics/toggleDebug")
      },
      toggleWarn() {
         this.$store.commit("diagnostics/toggleWarn") 
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
