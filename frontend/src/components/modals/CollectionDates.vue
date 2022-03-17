<template>
   <V4Modal :id="id" title="Select a date" ref="calendardlg"
      :firstFocusID="`${id}-okbtn`" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`"
   >
      <template v-slot:button>
         <V4Button class="calendar" mode="primary"
            @click="$refs.calendardlg.show()" :id="`${id}-open`"
            :aria-label="`view collection calendar`">
            <span class="label">Calendar</span>
            <i class="fal fa-calendar-alt"></i>
         </V4Button>
      </template>

      <template v-slot:content>
         <vue-cal
            id="collection-date-picker"
            class="vuecal--date-picker"
            xsmall
            hide-view-selector
            click-to-navigate
            :time="false"
            :transitions="false"
            :selectedDate="picked"
            :minDate="collectionStartDate"
            :maxDate="collectionEndDate"
            :disableDays=notPublishedDates
            active-view="month"
            :disable-views="['week', 'day']"
            @view-change="viewChanged($event)"
            @cell-focus="cellClicked($event)"
         >
         </vue-cal>
         <div class="error">
             {{error}}
          </div>
       </template>
       <template v-slot:controls>
          <V4Button mode="primary" :id="`${id}-cancelbtn`" @click="cancelClicked">
            Close
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { mapGetters, mapState } from "vuex"
export default {
   name: "collection-dates",
   emits: ['picked' ],
   components: {
      VueCal
   },
   props: {
      id: {
         type: String,
         required: true
      },
      date: {
         type: String,
         required: true
      }
   },
   data: function() {
      return {
         picked: this.date,
         error: "",
         currentCalView: "month"
      }
   },
   computed: {
      ...mapState({
         collectionStartDate : state => state.collection.startDate,
         collectionEndDate : state => state.collection.endDate,
         currentYear: state => state.collection.currentYear,
         itemLabel: state => state.collection.itemLabel,
         notPublishedDates : state => state.collection.notPublishedDates,
      }),
      ...mapGetters({
         pidByDate: 'collection/getPidForDate',
         publicationYears: 'collection/publicationYears'
      }),
   },
   methods: {
      viewChanged(e) {
         this.currentCalView = e.view
         this.error = ""
         let priorYear = this.picked.split("-")[0]
         let newYear = e.startDate.getFullYear()
         if (priorYear != newYear) {
            this.$store.dispatch("collection/setYear", newYear)
         }
      },
      async cellClicked(e) {
         this.error = ""
         let priorYear = this.picked.split("-")[0]
         let y = e.getFullYear()
         let m = `${e.getMonth()+1}`
         m = m.padStart(2,0)
         let d = `${e.getDate()}`
         d = d.padStart(2,0)
         this.picked = `${y}-${m}-${d}`
         if (priorYear != y) {
            await this.$store.dispatch("collection/setYear", y)
         }
         if (this.currentCalView == "month") {
            this.navigateToDate()
         }
      },
      nextTabOK() {
         this.$refs.calendardlg.lastFocusTabbed()
      },
      navigateToDate() {
         this.error = ""
         let pid = this.pidByDate(this.picked)
         if ( pid != "") {
            this.$emit('picked', pid)
            this.$refs.calendardlg.hide()
         } else {
            this.error = `No ${this.itemLabel.toLowerCase()} was found for ${this.picked}`
         }
      },
      cancelClicked() {
         this.error = ""
         this.$refs.calendardlg.hide()
      },
   }
}
</script>

<style lang="scss" scoped>
#collection-date-picker {
   width: 300px;
   height: 300px;
   margin: -10px -10px 5px -10px;
   outline: none;
   border: none;
   border-bottom: 1px solid var(--uvalib-grey);
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
.v4-button.calendar {
   margin: 0 !important;
}
</style>
