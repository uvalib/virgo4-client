<template>
   <VirgoButton @click="openClicked" aria-label="calendar" icon="fal fa-calendar-alt" text rounded size="large"/>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Select a date" @hide="showDialog=false" :draggable="false">
      <div>{{ props.date }}</div>
      <DatePicker v-model="picked"  inline dateFormat="yy-mm-dd" :disabledDates="collection.notPublishedDates"
         :minDate="minDate" :maxDate="maxDate" @year-change="yearChanged" @month-change="monthChanged" @update:model-value="datePicked"
         :pt="{
            day: {
               'role': 'button'
            }
         }"
      />
      <div class="error">
         {{error}}
      </div>
   </Dialog>
</template>

<script setup>
import DatePicker from 'primevue/datepicker'
import { useDateFormat } from '@vueuse/core'
import { ref,computed } from 'vue'
import { useCollectionStore } from "@/stores/collection"
import Dialog from 'primevue/dialog'

const emit = defineEmits( ['picked' ] )
const props = defineProps({
   id: {
      type: String,
      required: true
   },
   date: {
      type: String,
      required: true
   }
})

const collection = useCollectionStore()
const showDialog = ref(false)
const picked = ref()
const error = ref("")

const openClicked = (() => {
   picked.value = new Date(`${props.date}T12:00:00Z`)
   showDialog.value = true
   error.value = ""
})

const minDate = computed(() => {
   return new Date(`${collection.startDate}T12:00:00Z`)
})
const maxDate = computed(() => {
   return new Date(`${collection.endDate}T12:00:00Z`)
})

const monthChanged = ( (e) => {
   if ( collection.currentYear != e.year) {
      collection.setYear(""+e.year)
   }
})

const yearChanged = ((e) => {
   collection.setYear(""+e.year)
})

const datePicked = (() => {
   let pickStr = useDateFormat(picked.value,"YYYY-MM-DD").value
   error.value = ""
   let pid = collection.getPidForDate( pickStr )
   if ( pid != "") {
      emit('picked', pid)
      closeDialog()
   } else {
      error.value = `No ${collection.itemLabel.toLowerCase()} was found for ${picked.value}`
   }
})
</script>

<style lang="scss" scoped>
#collection-date-picker {
   width: 100%;
   max-width: 300px;
   height: 300px;
   margin: 0 auto;
   outline: none;
}
.label {
   margin-right: 5px;
   display: inline-block;
}
.error {
   text-align: center;
   margin: 10px 0 5px 0;
   font-size: 1em;;
}
</style>
