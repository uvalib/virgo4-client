<template>
   <section class="dibs" aria-live="polite">
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <h3>Access online</h3>
            <template v-if="activeIframe">
               <div class="reader-header">
                  <VirgoButton @click="activeIframe = false" aria-label="Close Reader" severity="info"
                     size="small" label="Close electronic course reserves" />
               </div>
               <iframe title="Digital reserves viewer" :src="system.dibsURL + '/item/' + selectedItem"
                  allowfullscreen></iframe>
            </template>
            <template v-else>
               <div class="message">
                  This item is available online for use with a class, through electronic course reserves. You may be
                  required to sign in.
                  Important: Course materials delivered through the e-reserves system may not meet all accessibility
                  requirements.
                  For information about disability-related alternate course materials please contact the Student
                  Disability Access Center at
                  <template v-if="system.isKiosk">
                     434-243-5180 or sdacAT@virginia.edu.
                  </template>
                  <template v-else>
                     <a href="tel:4342435180" target="_blank">434-243-5180</a> or <a href="mailto:sdacAT@virginia.edu"
                        target="_blank">sdacAT@virginia.edu</a>.
                  </template>
                  This item may have a time limit, or a limited number of concurrent users.
               </div>
               <VirgoButton @click="activeIframe = true" :disabled="!selectedItem"
                  label="Click to see if this item is currently available for loan" />
            </template>
         </div>
      </div>
   </section>
</template>

<script setup>
import { useSystemStore } from "@/stores/system"
import { ref } from "vue"

const system = useSystemStore()

const props = defineProps({
   // Expected as {barcode: "", label: ""}
   items: {
      type: Array,
      required: true,
   }
})

const activeIframe = ref(false)
const selectedItem = ref()
const selectList = props.items.map((i) => {
   return { value: i.barcode, label: i.call_number }
})

if (selectList.length == 1) {
   selectedItem.value = selectList[0].value
}

</script>
<style lang="scss" scoped>
.dibs {
   text-align: left;

   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border: 1px solid var(--uvalib-grey-light);
      border-radius: 0 5px 5px 0;
      gap: 20px;

      .gutter {
         flex: 0 0 17px;
         background-color:#E6F2F7;
      }

      .content {
         flex: 1;
         padding: 0 20px 25px 0;

         .reader-header {
            padding-bottom: 15px;
         }
         iframe {
            width: 100%;
            height: 80vh;
            border: 1px solid var(--uvalib-grey);
            outline: none;
         }

         h3 {
            font-size: 1.15em;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--uvalib-grey-light);
         }

         .message {
            padding: 0 0 15px 0;
            border-bottom: 1px solid var(--uvalib-grey-light);
            margin-bottom: 25px;
         }
      }
   }
}


</style>