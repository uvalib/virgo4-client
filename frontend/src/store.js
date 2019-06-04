import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

// Plugin to listen for error messages being set. After a delay, clear them
const errorPlugin = store => {
  store.subscribe((mutation) => {
    if (mutation.type === "setError") {
      if ( mutation.payload != null && mutation.payload != "" ) { 
        setTimeout( ()=>{ store.commit('setError', null)}, 10000)
      }   
    }   
  })  
}

export default new Vuex.Store({
  state: {
    searchAPI: "",
    pools: [],
    showResultsPicker: false,
    fatal: "",
    error: "",
    searching: false,
    searchSummary: "",
    currPoolIdx: -1,
    results: [],
    total: -1,
    pageSize: 25,
    query: {
      keyword: "",
      author: "",
      title: "",
      subject: "",
    },
    preferences: {
      targetPoolURL: "",
      excludePoolURLs: []
    }
  },

  getters: {
    getField,
    hasResults: state => {
      return state.total >= 0
    },
    currPool: state => {
      if (state.currPoolIdx == -1 || state.currPoolIdx > state.results.length-1 ) {
        return {url:"", page: 0, total: 0, name: ""}
      } else {
        let info = state.results[state.currPoolIdx]
        return info
      }
    },
    getPagination: state=>{ 
      if (state.currPoolIdx == -1 || state.currPoolIdx > state.results.length-1 ) {
        return {start: 0, rows: state.pageSize}
      } else {
        let info = state.results[state.currPoolIdx]
        return {start: info.page * state.pageSize, rows: state.pageSize}
      }
    },
    isTargetPool: state => poolURL => {
      return state.preferences.targetPoolURL == poolURL
    },
    isPoolExcluded: state => pooURL => {
      let excluded = false 
      state.preferences.excludePoolURLs.forEach( function(url) {
        if ( url == pooURL) {
          excluded = true
        }
      })
      return excluded
    }
  },

  mutations: {
    updateField,
    setPools(state, data) {
      state.pools = data
      if (state.pools.length == 0 ) {
        state.fatal = "No search pools configured"
      }
    },
    includeAll(state) {
      state.preferences.excludePoolURLs = []
    },
    excludeAll(state) {
      state.preferences.excludePoolURLs = []
      state.pools.forEach( function(p) {
        state.preferences.excludePoolURLs.push(p.url)
      })
    },
    toggleExcludePool(state,poolURL) {
      let idx = state.preferences.excludePoolURLs.indexOf(poolURL)
      if ( idx > -1) {
        state.preferences.excludePoolURLs.splice(idx,1)
      } else {
        state.preferences.excludePoolURLs.push(poolURL)
      }
    },
    toggleTargetPool(state,poolURL) {
      if (state.preferences.targetPoolURL == poolURL) {
        state.preferences.targetPoolURL = ""
      } else {
        state.preferences.targetPoolURL = poolURL
      }
    },
    setFatalError(state, err) {
      state.fatal = err
    },
    setError(state, err) {
      state.error = err
    },
    setConfig(state, cfg) {
      state.searchAPI = cfg.searchAPI
    },
    setSearching(state, flag) {
      state.searching = flag
    },
    toggleResultsPicker(state) {
      state.showResultsPicker = !state.showResultsPicker
    },
    switchResultsPool(state, idx) {
      state.currPoolIdx = idx
    },
    setPoolSearchResults(state, results) {
      // These results are from a single pool; generally a call to get next page
      let info = state.results[state.currPoolIdx]
      info.hits = results.record_list
    },
    setSearchResults(state, results) {
      // this is called from top level search; resets results from all pools
      let poolHitCnt = 0    
      state.total = -1
      state.currPoolIdx = -1
      state.results = []

      // Push all results into the results structure. Reset paging for each
      var best = -1
      results.pool_results.forEach( function(pr, idx) {
        console.log(pr.service_url+" time "+ pr.elapsed_ms)
        if (pr.record_list) {
          state.results.push({ url: pr.service_url, 
            name: poolNameFromURL(pr.service_url, state.pools),
            total: pr.pagination.total,
            hits: pr.record_list,
            page: 0
          })
          if (state.preferences.targetPoolURL == "" && pr.pagination.total > best) {
              state.currPoolIdx = idx
              best = pr.pagination.total
          }
          poolHitCnt++
        } else {
          state.results.push({ url: pr.service_url, 
            name: poolNameFromURL(pr.service_url, state.pools),
            total: 0, hits: [], page: 0})
        }
        if (state.preferences.targetPoolURL == pr.service_url) {
          state.currPoolIdx = idx
        }
      })

      // No hits found, just call head as the current pool
      if (state.currPoolIdx == -1 ) {
        state.currPoolIdx = 0
      }
      state.searchSummary = results.pools_searched+ " pools searched in "+
        results.total_time_ms+"ms. "+results.total_hits+" hits from "+poolHitCnt+" pools."
      state.total = results.total_hits
    },
    gotoFirstPage(state) {
      state.results[state.currPoolIdx].page = 0
    },
    gotoLastPage(state) {
      let info = state.results[state.currPoolIdx]
      info.page = Math.floor( info.total / state.pageSize)
      state.results[state.currPoolURL] = info
    },
    nextPage(state) {
      state.results[state.currPoolIdx].page++
    },
    prevPage(state) {
      state.results[state.currPoolIdx].page--
    },
    resetSearchResults(state) {
      state.results = []
      state.currPoolIdx = -1
      state.total = -1
    },
    clearAdvancedSearch(state) {
      state.query.keyword = ""
      state.query.author = ""
      state.query.title = ""
      state.query.subject = ""
    }
  },

  actions: {
    firstPage( ctx ) {
      ctx.commit('gotoFirstPage')
      ctx.dispatch("doPoolSearch")
    },
    prevPage( ctx ) {
      ctx.commit('prevPage')
      ctx.dispatch("doPoolSearch")
    },
    nextPage( ctx ) {
      ctx.commit('nextPage')
      ctx.dispatch("doPoolSearch")
    },
    lastPage( ctx ) {
      ctx.commit('gotoLastPage')
      ctx.dispatch("doPoolSearch")
    },
    doSearch(ctx) {
      ctx.commit('setError', "")
      ctx.commit('setSearching', true)
      let req = {
        query: buildQueryString(ctx.state.query),
        pagination: {start: 0, rows: ctx.state.pageSize},
        preferences: {
          target_pool: ctx.state.preferences.targetPoolURL,
          exclude_pool: ctx.state.preferences.excludePoolURLs,
        }
      }
      let url = ctx.state.searchAPI+"/api/search"
      axios.post(url, req).then((response)  =>  {
        ctx.commit('setSearchResults', response.data)
        ctx.commit('setSearching', false)
      }).catch((error) => {
        ctx.commit('setError', error) 
        ctx.commit('setSearching', false)
      })
    },
    doPoolSearch(ctx) {
      ctx.commit('setError', "")
      ctx.commit('setSearching', true)
      let req = {
        query: buildQueryString(ctx.state.query),
        pagination: ctx.getters.getPagination
      }
      let url = ctx.getters.currPool.url+"/api/search"
      axios.post(url, req).then((response)  =>  {
        ctx.commit('setPoolSearchResults', response.data)
        ctx.commit('setSearching', false)
      }).catch((error) => {
        ctx.commit('setError', error) 
        ctx.commit('setSearching', false)
      })
    },
    getConfig(ctx) {
      axios.get("/config").then((response)  =>  {
        ctx.commit('setConfig', response.data )
        ctx.dispatch('getPools' )
      }).catch((error) => {
        ctx.commit('setFatalError', "Unable to get configuration: "+error.response.data) 
      })
    },
    getPools(ctx) {
      let url = ctx.state.searchAPI+"/api/pools"
      axios.get(url).then((response)  =>  {
        ctx.commit('setPools', response.data )
      }).catch((error) => {
        ctx.commit('setFatalError', "Unable to pools: "+error.response.data) 
      })
    }
  },
  plugins: [errorPlugin]
})

const poolNameFromURL = (url, pools) => {
  let name = ""
  pools.forEach( function(p) {
    if (p.url == url) {
      name= p.name
    }
  })
  return name
}

const buildQueryString = (params) => { 
  // params: keyword (no field designation), author, title, subject
  let mapping  = {"title": "title_t", "author": "author_t", "subject": "subject_t", "keyword": "NONE"}
  let q = []
  for (let [key, value] of Object.entries(params)) {
    let qv = value.trim()
    if (qv.length == 0) continue

    if (qv.includes(" ")) {
      qv = `"${value}"`
    }
    let fn = mapping[key]
    if (fn === "NONE") {
      q.push(qv)
    } else {
      q.push(`${fn}:${qv}`)
    }
  }
  return q.join(" +")
}
