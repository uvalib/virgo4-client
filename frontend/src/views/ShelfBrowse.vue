<template>
   <div class="shelf-browse">
      <div class="working" v-if="shelfStore.lookingUp" >
         <V4Spinner message="Looking up items..."/>
      </div>
      <template v-else>
         <div class="info">
            <div class="line">
               <span class="label">Title Searched:</span>
               <router-link :to="backURL" class="to-item`">
                  <span class="item-title" v-html="origTitle"></span>
               </router-link>
            </div>
            <div class="line">
               <span class="label">Call Number:</span>
               <span class="item-call" v-html="origCallNumber"></span>
            </div>
         </div>
         <div class="browse-controls full">
            <VirgoButton :disabled="!shelfStore.hasPriorItem" @click="browsePrior()" aria-label="previous shelf" label="Previous" severity="info"/>
            <span class="range" aria-live="polite"><b>CATALOG RANGE:</b>{{firstCall}}&nbsp;-&nbsp;{{lastCall}}</span>
            <VirgoButton :disabled="!shelfStore.hasNextItem" @click="browseNext()" aria-label="next shelf" label="Next" severity="info"/>
         </div>
         <div class="view-mode">
            <Select v-model="currViewMode" :options="viewModes" optionLabel="label" optionValue="code">
                <template #value="slotProps">
                  <div class="viewoption">
                     <i :class="viewIcon"></i>
                     <div>{{ viewLabel }}</div>
                  </div>
               </template>
               <template #option="slotProps">
                  <div class="viewoption">
                     <i :class="slotProps.option.icon"></i>
                     <div>{{ slotProps.option.label }}</div>
                  </div>
               </template>
            </Select>
         </div>
         <div class="browse-detail" >
            <div class="browse-cards" :class="currViewMode">
               <BrowseCard  v-for="(b,idx) in shelfStore.browse" :current="isCurrent(idx)"
                  :pool="route.params.src" :data="b"  :key="`b${b.id}`" :mode="currViewMode" :index="idx+1"
               />
            </div>
         </div>
      </template>
   </div>
</template>

<script setup>
import BrowseCard from "@/components/details/BrowseCard.vue"
import Select from 'primevue/select'
import { ref, onMounted, computed } from 'vue'
import { useShelfStore } from "@/stores/shelf"
import { useRoute } from 'vue-router'
import analytics from '@/analytics'

const route = useRoute()
const shelfStore = useShelfStore()

const viewModes = [  {code: 'gallery', label: "View gallery", icon: "fas fa-grip-horizontal"},
                     {code: 'list', label: "View list", icon: "fal fa-list"} ]
const currViewMode = ref('gallery')
const origTitle = ref("")
const origCallNumber = ref("")
const origID = ref("")

const viewIcon = computed(() =>{
   var m = viewModes.find( vm => vm.code == currViewMode.value)
   return m.icon
})
const viewLabel = computed(() =>{
   var m = viewModes.find( vm => vm.code == currViewMode.value)
   return m.label
})

const backURL= computed(() =>{
   return `/sources/${route.params.src}/items/${route.params.id}`
})
const firstCall = computed(() =>{
   return shelfStore.browse[0].call_number
})
const lastCall = computed(() =>{
   return shelfStore.browse[shelfStore.browse.length-1].call_number
})
function isCurrent(idx) {
   let item = shelfStore.browse[idx]
   return item.id == origID.value
}
function browseNext() {
   shelfStore.browseNextPage()
   analytics.trigger('ShelfBrowse', 'BROWSE_NEXT_CLICKED')
}
function browsePrior() {
   shelfStore.browsePriorPage()
   analytics.trigger('ShelfBrowse', 'BROWSE_PREV_CLICKED')
}

onMounted( async ()=>{
   shelfStore.lookingUp = true
   shelfStore.browseRange = 10
   await shelfStore.getBrowseData(route.params.id )

   // once data is available, lookup title, call and ID or the
   // item that started the browse
   let origItem = shelfStore.browse.find(b=> b.id == route.params.id)
   origID.value = origItem.id
   origTitle.value = origItem.title
   origCallNumber.value = origItem.call_number
})

</script>

<style lang="scss" scoped>
.shelf-browse {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   margin-bottom: 10vh;
   color: var(--color-primary-text);
   width: 100%;
   margin: 0 auto;

   .info {
      font-size: 1.2em;
      font-weight: normal;
      .line {
         margin-bottom: 5px;
      }
      .label {
         margin-right: 5px;
      }
   }

   .browse-controls.full {
      margin: 25px 0 15px 0;
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-content: stretch;
      align-items: center;
      padding: 15px;
      box-sizing: border-box;
      .range {
         b {
            margin-right: 10px;
            font-weight: bolder;
         }
      }
   }

   .view-mode {
      text-align: right;
      margin-right: 15px;
   }

   .browse-detail {
      margin: 10px 30px 0 30px;
      padding-top: 5px;
   }

   .browse-cards {
      display: grid;
      grid-gap: 1.25rem;
      margin: 0 0 20px 0;
      padding: 0;
      box-sizing: border-box;
      justify-content: center;

      .browse-card {
         width: 100%;
         margin: 0 auto;
      }
      .browse-card.list {
         :deep(a.title) {
            margin: 0 0;
         }
      }
   }

   .working {
      text-align: center;
      font-size: 0.9em;
   }
   .working img {
      margin: 30px 0;
   }
}
@media only screen and (min-width: 768px) {
   div.info  {
      max-width: 75%;
      margin: 0 auto;
   }
   .browse-controls.full {
      background-color: var(--uvalib-grey-lightest);
   }
   .browse-cards {
      grid-template-columns: repeat(4, 200px);
   }
   .browse-cards.list {
      max-width:75%;
      margin: 0 auto;
      grid-template-columns: unset;
      grid-gap: unset;
      display: flex;
      flex-direction:  column;
      .browse-card {
         width: 100%;
      }
   }
}
@media only screen and (max-width: 768px) {
   div.info  {
      max-width: 90%;
      margin: 0 auto;
   }
   .browse-controls.full {
       background-color: white;
       button {
         width: 100%
      }
      .range {
         margin: 15px 0;
      }
    }
   .browse-cards {
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
   }
   .browse-cards.list {
      max-width:90%;
      grid-template-columns: unset;
      grid-gap: unset;
      display: flex;
      flex-direction:  column;
      margin: 0 auto;
      .browse-card {
         width: 100%;
      }
   }
}
</style>
