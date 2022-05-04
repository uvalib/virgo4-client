import { defineStore} from 'pinia'
import axios from 'axios'

export const usePDAStore = defineStore('pda', {
	state: () => ({
      working: false,
      error: "",
      orders: [],
      pagination: {}
   }),
   actions: {
      async getOrders(page = 1) {
         this.working = true
         await axios.get(`/api/pda?page=${page}`).then(response => {
            this.orders = response.data.orders
            this.pagination = response.data.pagination
         }).catch(e => {
            this.working = false
            this.error = e
         })
      }
   }
})