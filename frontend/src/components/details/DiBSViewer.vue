<template>
   <div class="dibs">
      <template v-if="activeIframe">
         <p class="reader-header">
            <VirgoButton @click="activeIframe = false" aria-label="Close Reader" link
               icon="pi pi-times-circle" label="Electronic Course Reserves" />
         </p>
         <iframe title="Digital reserves viewer"
               :src="systemStore.dibsURL + '/item/' + selectedItem"
               allowfullscreen
         ></iframe>
      </template>
      <template v-else>
         <p>This item is available online for use with electronic course reserves. You may be required to sign in.</p>
         <p>
            <b>Important:</b>
            Course materials delivered through the e-reserves system may not meet all accessibility requirements.
            For information about disability-related alternate course materials please contact the Student Disability Access Center at 434-243-5180
            or <a href="mailto:sdacAT@virginia.edu">sdacAT@virginia.edu</a>.
         </p>

         <div class="center-wrapper">
            <FormKit v-if="selectList.length > 1" type="select" label="Volume" v-model="selectedItem"
               placeholder="Select a volume" @input="(item)=>{selectedItem = item }" :options="selectList" validation="required"
            />
            <VirgoButton severity="secondary" @click="activeIframe = true" :disabled="!selectedItem" label="View this item online"/>
         </div>
      </template>
   </div>
</template>
<script setup>
import { useSystemStore } from "@/stores/system"
import { ref } from "vue"

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
   padding: 30px;
   box-shadow: $v4-box-shadow-light;
   iframe {
      width: 100%;
      height: 80vh;
      border: 1px solid var(--uvalib-grey);
      outline: none;
   }
   b {
      margin-right: 5px;
   }
   .reader-header {
      margin: 0;
      button {
         font-size: 1.15em;
         margin-bottom: 10px;
         color: var(--uvalib-text);
      }
   }

   .center-wrapper{
      display: flex;
      flex-direction: column;
      align-items: center;
   }
}
</style>