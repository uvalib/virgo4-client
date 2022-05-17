import axios from 'axios'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"

export const useShelfStore = defineStore('shelf', {
	state: () => ({
      lookingUp: true,
      browse: [],
      browseRange: 3,
      showSpinner: true,
      origIdx: -1,
      currIdx: -1
   }),

   getters: {
      hasBrowseData: state => {
         return (state.browse.length > 0 && state.lookingUp == false)
      },
      hasNextItem: state => {
         return (state.currIdx < state.browse.length - 1)
      },
      hasPriorItem: state => {
         return (state.currIdx > 0)
      },
      originalIndex: state => {
         return state.origIdx
      }
   },

   actions: {
      setLookingUp(flag) {
         this.lookingUp = flag
         if ( flag == false ) {
            this.showSpinner = true
         }
      },
      clearBrowseDetails() {
         this.browse.splice(0, this.browse.length)
      },
      setBrowseDetails(data, id) {
         this.browse.splice(0, this.browse.length)
         data.forEach( (b, idx) => {
            b.status = "loading"
            this.browse.push(b)
            if (b.id == id) {
               this.currIdx = idx
               if (this.origIdx < 0) {
                  this.origIdx = idx
               }
            }
         })
      },
      setCoverImage(data) {
         let idx = this.browse.findIndex( b=>b.id == data.id)
         if ( idx > -1) {
            let b = this.browse[idx]
            if (data.status == "not_found" || data.status=="unprocessed") {
               b.status = "not_found"
            } else if (data.status == "iiif") {
               b.status = "url"
               b.cover_image_url = data.image_url
            } else {
               b.status = "ready"
               b.image_base64 = data.image_base64
               b.cover_image_url = data.image_url
            }
            this.browse.splice(idx, 1, b)
         }
      },
      browseNext() {
         if (this.currIdx == this.browse.length - 1) {
            return
         }
         this.showSpinner = false
         this.getBrowseData(this.browse[this.currIdx + 1].id)
      },
      browsePrior() {
         if (this.currIdx == 0) {
            return
         }
         this.showSpinner = false
         this.getBrowseData(this.browse[this.currIdx - 1].id)
      },
      async getBrowseData(id) {
         const system = useSystemStore()
         if ( this.showSpinner) {
            this.setLookingUp(true)
         }

         let url = `${system.shelfBrowseURL}/api/browse/${id}?range=${this.browseRange}`
         await axios.get(url).then((response) => {
            this.setBrowseDetails(response.data.items, id)

            response.data.items.forEach( b => {
               if ( b.cover_image_url) {
                  let testURL = b.cover_image_url.replace("?", ".json?")
                  if ( testURL.includes("iiif.")) {
                     this.setCoverImage({id: b.id, image_url: testURL, image_base64: "", status: "iiif"})
                  } else {
                     axios.get(testURL).then((ciR) => {
                        let ciD = ciR.data
                        this.setCoverImage({id: b.id, image_url: ciD.image_url, image_base64:ciD.image_base64, status: ciD.status})
                     }).catch(() => {
                        this.setCoverImage({id: b.id, image_url: "", image_base64: "", status: "not_found"})
                     })
                  }
               }
            })
            this.setLookingUp(false)
         }).catch((error) => {
            this.setLookingUp(false)
            this.clearBrowseDetails()
            if ( error.response && error.response.status == 404) {
               console.warn("No browse data available for "+id)
            } else {
               // no negative impact on client; just don't show shelf browse and log error
               system.reportError(error)
            }
         })
      },
   }
})
