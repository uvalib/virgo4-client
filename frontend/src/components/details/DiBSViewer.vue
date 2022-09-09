<template>
   <div class="dibs">
      <template v-if="activeIframe">
         <p class="reader-header">
            <V4Button mode="icon" @click="activeIframe = false" aria-label="Close Reader">
               <i class="close-icon fal fa-window-close"></i>
            </V4Button>
            Electronic Course Reserves
         </p>
         <iframe title="Digital reserves viewer"
               :src="systemStore.dibsURL + '/item/' + selectedItem"
               allowfullscreen
         ></iframe>
      </template>
      <div v-else>
         <p>This item is available online for use with electronic course reserves. You may be required to sign in.</p>
         <p>
            <b>Important:</b>
            Course materials delivered through the e-reserves system may not meet all accessibility requirements.
            For information about disability-related alternate course materials please contact the Student Disability Access Center at 434-243-5180
            or <a href="mailto:sdacAT@virginia.edu">sdacAT@virginia.edu</a>.
         </p>

         <div class="center-wrapper">
            <FormKit v-if="selectList.length > 1" type="select" label="Volume" v-model="selectedItem"
            placeholder="Select a volume" @input="(item)=>{selectedItem = item }"
            :options="selectList" validation="required"
            />
            <V4Button mode="tertiaty" @click="activeIframe = true" :disabled="!selectedItem" >View this item online</V4Button>
         </div>
      </div>
   </div>
</template>
<script setup>
import { useSystemStore } from "@/stores/system"
import { ref } from "vue"
import V4Button from "../V4Button.vue";

const systemStore = useSystemStore()

const props = defineProps({
   // Expected as {barcode: "", label: ""}
   items: {
      type: Array,
      required: true,
   }
})
const activeIframe = ref(false)
const selectedItem = ref()
const selectList = props.items.map( (i)=>{
    return {value: i.barcode, label: i.call_number}
   })
if(selectList.length == 1){
   selectedItem.value = selectList[0].value
}

</script>
<style lang="scss" scoped>
.dibs {
   border: 1px solid var(--uvalib-grey-light);
   padding: 5px;
   iframe {
      width: 100%;
      height: 80vh;
   }
   b {
      margin-right: 5px;
   }
   .reader-header {
      margin: 0;
   }

   .center-wrapper{
      display: flex;
      flex-direction: column;
      align-items: center;
      *{margin: 20px 0};
   }
}
</style>