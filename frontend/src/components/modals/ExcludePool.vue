<template>
   <label class="exclude">
      <Checkbox  v-model="showDialog" :binary="true" @update:modelValue="excludeResults()"/>
      Exclude results from {{ selectedResults.pool.name }}
   </label>
   <Dialog v-model:visible="showDialog" :modal="true" style="max-width: 420px"
      position="top" :header="`Exclude ${selectedResults.pool.name}`" @hide="showDialog=false">
      <div class="content" v-if="preferences.isPoolExcluded(selectedResults.pool.id)">
         <p>
            You've turned off <b>{{ selectedResults.pool.name }}</b> searching. 
            This can be changed in your <router-link to="/preferences">account search preferences</router-link>.
         </p>
         <p>The currrent search will be re-run when this dialog is closed.</p>
      </div>
      <div class="content" v-else>
         <p>Do you want to turn off <b>{{ selectedResults.pool.name }}</b> from this and all future searches?</p>
         <p>This and other search options can be managed in your <router-link to="/preferences">account search preferences</router-link>.</p>
      </div>
      <template #footer>
         <template v-if="preferences.isPoolExcluded(selectedResults.pool.id)">
            <VirgoButton severity="secondary" label="OK" @click="rerunSearch"/>
         </template>
         <template v-else>
            <VirgoButton severity="secondary" label="Cancel" @click="showDialog=false"/>
            <VirgoButton label="Exclude" @click="confirmExclude(selectedResults.pool.id)"/>
         </template>
      </template>
   </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import { useResultStore } from "@/stores/result"
import { usePreferencesStore } from "@/stores/preferences"
import { useQueryStore } from "@/stores/query"
import { ref, computed } from 'vue'
import { useRouteUtils } from '@/composables/routeutils'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const routeUtils = useRouteUtils(router, route)

const resultStore = useResultStore()
const preferences = usePreferencesStore()
const queryStore = useQueryStore()

const showDialog = ref(false)

const selectedResults = computed(()=>{
   return resultStore.selectedResults
})

const excludeResults = (() =>{
   showDialog.value = true
})

const confirmExclude = ((poolID)=>{
   preferences.toggleSearchExclusion(poolID)
})

const rerunSearch = (() => {
   // a pool that is to be excluded will always be teh targetPool
   // reset this to the catalog, widen scope to all and rerun the search
   console.log("pool excluded; rerun search with scope=all and target pool=catalog")
   queryStore.userSearched = true
   queryStore.searchSources = "all"
   resultStore.selectPoolResults(0) // catalog is always 0
   queryStore.targetPool = resultStore.results[0].pool.id
   routeUtils.poolChanged()
})
</script>

<style lang="scss" scoped>
label.exclude {
   display: flex;
   flex-flow: row nowrap;
   gap: 10px;
   align-items: center;
}
.content {
   a {
      text-decoration: underline;
   }
}
</style>
