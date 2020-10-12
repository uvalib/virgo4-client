<template>
   <transition name="fade">
      <div class="summary-dimmer">
         <div role="dialog" tabindex="0" aria-labeledby="renew-summary-title" id="renew-summary">
            <div tabindex="-1" id="renew-summary-title">Renew Summary</div>
             <div class="renew-content">
                <div v-if="summary.renewed > 0"><strong>{{summary.renewed}}</strong> items successfully renewed.</div>
                <div v-if="summary.failed > 0" class="fails">
                   <div><strong>{{summary.failed}}</strong> items failed renewal: </div>
                   <ul>
                     <li v-for="(f,idx) in summary.failures" :key="`fail-${idx}`">
                        <strong class="bc">{{f.barcode}}:</strong><span>&nbsp;{{f.message}}</span>
                     </li>
                   </ul>
                </div>
             </div>
             <div class="renew-controls">
               <V4Button mode="tertiary" id="close-summary" class="close"
                  :focusNextOverride="true" @tabnext="lastFocusTabbed"
                  :focusBackOverride="true" @tabback="lastFocusTabbed"
                  @click="closeSummary">
                  OK
               </V4Button>
             </div>
         </div>
      </div>
   </transition>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         summary: state => state.user.renewSummary
      })
   },
   methods: {
      closeSummary() {
         this.$store.commit("user/clearRenewSummary")
      },
      lastFocusTabbed() {
         let ele = document.getElementById("close-summary")
         ele.focus()
      }
   },
   created() {
      setTimeout(()=>{
         let ele = document.getElementById("renew-summary")
         if (ele ) {
            ele.focus()
         }
      }, 250)
   },
}
</script>

<style lang="scss" scoped>
.summary-dimmer {
   position: fixed;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   z-index: 1000;
   background: rgba(0, 0, 0, 0.2);
   #renew-summary {
      color: var(--uvalib-text);
      position: fixed;
      height: auto;
      z-index: 8000;
      background: white;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: $v4-box-shadow;
      border-radius: 5px;
      min-width: 300px;
      margin:0;
      &:focus {
         @include be-accessible();
      }
      div.renew-content {
         padding: 20px;
         text-align: left;
         font-weight: normal;
         .fails {
            margin-top: 10px;
         }
         ul {
            list-style: none;
            padding: 0 0 0 25px;
            margin: 10px 0 0 0;
         }
         li {
            margin: 5px 0;
         }
         strong.bc {
            margin-right: 5px;
         }
      }
      #renew-summary-title {
         background:  var(--uvalib-blue-alt-light);
         font-size: 1.1em;
         color: var(--uvalib-text-dark);
         font-weight: 500;
         padding: 10px;
         border-radius: 5px 5px 0 0;
         border-bottom: 2px solid  var(--uvalib-blue-alt);
         text-align: left;
      }
      .renew-controls {
         text-align: right;
         margin: 5px 10px 5px 5px;
      }
   }
}

@media only screen and (min-width: 768px) {
   #renew-summary {
      max-width: 40%;
   }
}
@media only screen and (max-width: 768px) {
   #renew-summary {
      width: 95%;
   }
}
</style>
