import { defineStore } from 'pinia'
import axios from 'axios'
import { useSystemStore } from "@/stores/system"

export const useSearchStore = defineStore('search', {
	state: () => ({
      saved: [],
      history: [],
      working: false,
      searchToken: "",
      showSaveDialog: false,
      duplicate: false,
      searchName: ""
   }),
   actions: {
      setSearches(data) {
         this.saved = data.saved
         this.history.splice(0, this.history.length)
         data.history.forEach( s => {
            let url = stripExclude(s)
            if (url != "/") {
               this.history.push(  url )
            }
         })
      },
      clear() {
         this.$reset()
      },

      async updateVisibility(data) {
         this.working = true
         let url = `/api/users/${data.userID}/searches/${data.id}/publish`
         if (data.public) {
            await axios.post(url)
         } else {
            await axios.delete(url)
         }
        this.working = false
      },

      getAll(userID) {
         this.showSaveDialog = false
         this.working = true
         axios.get(`/api/users/${userID}/searches`).then((response) => {
            this.setSearches(response.data)
            this.working = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
            this.working = false
          })
      },

      async exists( userID, url) {
         this.working = true
         this.duplicate = false
         this.searchName = ""
         this.searchToken = ""
         let encoded = encodeURIComponent(url)
         axios.get(`/api/users/${userID}/searches/exists?tgt=${ encoded }`).then((response) => {
            if (response.data.exists) {
               this.duplicate = true
               this.searchName = response.data.name
               this.searchToken = response.data.token
            }
            this.working = false
         }).catch(() => {
            // just eat the error and let the save go on
            this.working = false
         })
      },

      // data: {name: searchName.value, url: searchURL, isPublic: false, userID: userStore.signedInUser}
      async save(data) {
         this.working = true
         return axios.post(`/api/users/${data.userID}/searches`, data).then((resp) => {
            this.searchToken = resp.data.token
            this.searchName = resp.data.name
            this.working = false
         }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
            this.working = false
         })
      },

      updateHistory(userID, fullPath) {
         if (fullPath != "/" ) {
            let req = {url: fullPath, history: true}
            axios.post(`/api/users/${userID}/searches`, req).catch((error) => {
               console.error("Unable to save search history: "+error)
            })
         }
      },

      async delete( {userID, searchID} ) {
         try {
            await axios.delete(`/api/users/${userID}/searches/${searchID}`)
            this.searchToken = ""
            let idx = this.saved.findIndex(s => s.id == searchID)
            if (idx > -1) {
               this.saved.splice(idx,1)
            }
         } catch (e) {
            const system = useSystemStore()
            system.setError("Unable to delete saved search. Please try again later.")
         }
      },

      deleteAll(userID) {
         this.working = true
         axios.delete(`/api/users/${userID}/searches?type=saved`).then((_response) => {
            this.saved.splice(0, this.saved.length)
            this.working = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
            this.working = false
          })
      },

      clearHistory(userID) {
         this.working = true
         axios.delete(`/api/users/${userID}/searches?type=history`).then((_response) => {
            this.history.splice(0, this.history.length)
            this.working = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
            this.working = false
          })
      }
   }
})

function stripExclude( history ) {
   let url = history.url
   let idx1 = url.indexOf("&exclude")
   if (idx1 > -1) {
      let idx2 = url.indexOf("&", idx1+1)
      if ( idx2 > -1) {
         url = url.substring(0,idx1)+url.substring(idx2)
      } else {
         url = url.substring(0,idx1)
      }
   }
   return url
}
