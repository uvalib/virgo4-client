<template>
   <VirgoButton @click="showDialog=true" aria-label="view collection calendar" ref="trigger"
      label="Calendar" icon="fal fa-calendar-alt" iconPos="right" class="calendar"/>

   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Select a date" @hide="closeDialog">
      <vue-cal
         id="collection-date-picker"
         class="vuecal--date-picker"
         xsmall
         hide-view-selector
         click-to-navigate
         :time="false"
         :transitions="false"
         :selectedDate="picked"
         :minDate="collection.collectionStartDate"
         :maxDate="collection.collectionEndDate"
         :disableDays=collection.notPublishedDates
         active-view="month"
         :disable-views="['week', 'day']"
         @view-change="viewChanged($event)"
         @cell-focus="cellClicked($event)"
      />
      <div class="error">
         {{error}}
      </div>
   </Dialog>
</template>

<script setup>
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { ref } from 'vue'
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
const trigger = ref()
const picked = ref(props.date)
const error = ref("")
const currentCalView = ref("month")

const viewChanged = ((e) => {
   currentCalView.value = e.view
   error.value = ""
   let priorYear = picked.value.split("-")[0]
   let newYear = e.startDate.getFullYear()
   if (priorYear != newYear) {
      collection.setYear(newYear)
   }
})

const cellClicked = ( async (e) => {
   error.value = ""
   let priorYear = picked.value.split("-")[0]
   let y = e.getFullYear()
   let m = `${e.getMonth()+1}`
   m = m.padStart(2,0)
   let d = `${e.getDate()}`
   d = d.padStart(2,0)
   picked.value = `${y}-${m}-${d}`
   if (priorYear != y) {
      await collection.setYear(y)
   }
   if (currentCalView.value == "month") {
      navigateToDate()
   }
})

const navigateToDate = (() => {
   error.value = ""
   let pid = collection.getPidForDate(picked.value)
   if ( pid != "") {
      emit('picked', pid)
      closeDialog()
   } else {
      error.value = `No ${collection.itemLabel.toLowerCase()} was found for ${picked.value}`
   }
})

const closeDialog = (() => {
   error.value = ""
   showDialog.value = false
   trigger.value.$el.focus()
})
</script>

<style lang="scss" scoped>
#collection-date-picker {
   width: 100%;
   max-width: 300px;
   height: 300px;
   margin: 0 auto;
   outline: none;
   border: 1px solid var(--uvalib-grey-light);
   box-shadow: none;
   :deep(.vuecal__cell-content) {
      word-break: normal;
      border-radius:2px;
   }
   :deep(.vuecal__heading) {
      opacity: 1;
      border-bottom: 1px solid var(--uvalib-grey);
      border-top: 1px solid var(--uvalib-grey);
      background-color: var(--uvalib-grey-lightest);
   }
   :deep(.vuecal__cell-content) {
      font-weight: normal;
      color: var(--uvalib-text);
      font-size:1.15em;
   }
   :deep(.vuecal__cell--selected) {
      .vuecal__cell-content {
         background-color: var(--uvalib-brand-blue-lighter);
         color: white;
      }
   }
   :deep(.vuecal__cell--out-of-scope.vuecal__cell--selected) {
      .vuecal__cell-content {
         color: white;
      }
   }
   :deep(.vuecal__cell--out-of-scope) {
      .vuecal__cell-content {
         opacity: 1;
         color: var(--uvalib-text);
         font-size: 0.9em;
      }
   }
   :deep(.vuecal__cell--disabled) {
      .vuecal__cell-content {
         opacity: .3;
         font-weight: 100;
         pointer-events: none;
      }
   }
}
.label {
   margin-right: 5px;
   display: inline-block;
}
.error {
   text-align: center;
   margin: 10px 0 5px 0;
   font-size: 0.9em;;
}
button.calendar {
   margin: 0 !important;
}
</style>
