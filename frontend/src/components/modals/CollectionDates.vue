<template>
   <VirgoButton @click="showDialog=true" aria-label="view collection calendar" ref="trigger"
      label="Calendar" icon="fal fa-calendar-alt" iconPos="right" class="calendar"/>

   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Select a date" @hide="closeDialog" @show="opened">
      <Calendar v-model="picked"  inline dateFormat="yy-mm-dd" :disabledDates="collection.notPublishedDates"
         :minDate="minDate" :maxDate="maxDate" @year-change="yearChanged" @update:model-value="datePicked"/>
      <div class="error">
         {{error}}
      </div>
   </Dialog>
</template>

<script setup>
import Calendar from 'primevue/calendar'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
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
const trigger = ref()
const picked = ref()
const error = ref("")
dayjs.extend(customParseFormat)

const opened = (() => {
   picked.value = dayjs(props.date, "YYYY-MM-DD").toDate()
})

const minDate = computed(() => {
   return dayjs(collection.startDate, "YYYY-MM-DD").toDate()
})
const maxDate = computed(() => {
   return dayjs(collection.endDate, "YYYY-MM-DD").toDate()
})

const yearChanged = ((e) => {
   collection.setYear(""+e.year)
})

const datePicked = (() => {
   let pickStr = dayjs(picked.value).format("YYYY-MM-DD")
   console.log(pickStr)
   error.value = ""
   let pid = collection.getPidForDate( pickStr )
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
:deep(.p-disabled) {
   opacity: 0.2;
}

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
