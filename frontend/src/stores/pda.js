import { defineStore } from 'pinia'
import axios from 'axios'

export const usePDAStore = defineStore('pda', {
	state: () => ({
      working: false,
      error: "",
      report: []
   }),
   getters: {
   },
   actions: {
      getRecentOrders() {
         this.working = true
         axios.get("/api/pda").then(response => {
            this.report = response.data
         }).catch(e => {
            this.working = false
            this.error = e
         })
      }
   }
})