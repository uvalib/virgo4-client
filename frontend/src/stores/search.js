import { defineStore } from 'pinia'
import axios from 'axios'
import { useSystemStore } from "@/stores/system"

export const useSearchStore = defineStore('search', {
	state: () => ({
      saved: [],
      history: [],
      lookingUp: false,
      lastSavedSearchKey: "",
      showSaveDialog: false
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
         this.lookingUp = true
         let url = `/api/users/${data.userID}/searches/${data.id}/publish`
         if (data.public) {
            await axios.post(url)
         } else {
            await axios.delete(url)
         }
        this.lookingUp = false
      },

      getAll(userID) {
         this.lookingUp = true
         axios.get(`/api/users/${userID}/searches`).then((response) => {
            this.setSearches(response.data)
            this.lookingUp = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
            this.lookingUp = false
          })
      },

      async save(data) {
         let resp = await axios.post(`/api/users/${data.userID}/searches`, data)
         this.lastSavedSearchKey = resp.data.token
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
            this.lastSavedSearchKey = ""
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
         this.lookingUp = true
         axios.delete(`/api/users/${userID}/searches?type=saved`).then((_response) => {
            this.saved.splice(0, this.saved.length)
            this.lookingUp = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
            this.lookingUp = false
          })
      },

      clearHistory(userID) {
         this.lookingUp = true
         axios.delete(`/api/users/${userID}/searches?type=history`).then((_response) => {
            this.history.splice(0, this.history.length)
            this.lookingUp = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
            this.lookingUp = false
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
