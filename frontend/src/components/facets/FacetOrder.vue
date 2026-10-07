<template>
   <VirgoButton severity="secondary" size="small" label="Change Filter Order" icon="fa-light fa-sliders" 
      @click="showDialog = true" @keydown.tab="tabKeyPressed" :id="props.id"/>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Change Filter Order"  @show="opened">
      <div class="help">Select a facet or facets and use the<br/>arrow buttons to change ordering.</div>
      <OrderList v-model="workingFacets" dataKey="id">
         <template #option="{ option }">
            <div>
               <span>{{ option.name }}</span>
            </div>
         </template>
      </OrderList>
      <div v-if="user.isSignedIn" class="signin">
         Changes to the filter order will be persisted with your account.
      </div>
      <div v-else class="signin">
         Changes to the filter order will only be persisted if you are <router-link to="/signin">signed in</router-link>.
      </div>
      <template #footer>
         <VirgoButton severity="secondary" @click="showDialog = false" label="Cancel"/>
         <VirgoButton @click="applyClicked" label="Apply"/>
      </template>
   </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import OrderList from 'primevue/orderlist'
import { ref } from 'vue'
import { useUserStore } from "@/stores/user"

const user = useUserStore()
const showDialog = ref(false)
const workingFacets = ref([])

const emit = defineEmits( ['apply', 'blur'])
const props = defineProps({
   facets: {
      type: Array,
      required: true
   },
   id: {
      type: String,
      required: true
   }
})

const tabKeyPressed = ((event) => {
   if (event.shiftKey == false ) {
      emit('blur', event)
   }
})

const applyClicked = (() => {
   emit('apply', workingFacets.value)
   showDialog.value = false
})

const opened = (() => {
   workingFacets.value = props.facets.map( f => ({id: f.id, name: f.name}) )
})


</script>

<style lang="scss" scoped>
.help {
   margin-bottom: 15px;
}
.signin {
   margin-top: 15px;
   max-width: 225px;
}
:deep(.p-listbox-list-container) {
   .p-listbox-option {
      color: $uva-grey-B;
      &:hover {
         background-color: $uva-blue-alt-400 !important;
      }
   }
   .p-listbox-option.p-listbox-option-selected {
      background-color: $uva-blue-alt-200 !important;
      color: $uva-grey-B !important;
   }
}
</style>
