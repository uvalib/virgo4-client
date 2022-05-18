import axios from 'axios'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"

export const useShelfStore = defineStore('shelf', {
	state: () => ({
      lookingUp: true,
      browse: [],
      browseRange: 3,
      showSpinner: true,
      originalId: "",
      currentIndex: -1
   }),

   getters: {
      hasBrowseData: state => {
         return (state.browse.length > 0 && state.lookingUp == false)
      },
      hasNextItem: state => {
         return (state.currentIndex < state.browse.length - 1)
      },
      hasPriorItem: state => {
         return (state.currentIndex > 0)
      },
      isOriginalItem: state => {
         return (state.browse[state.currentIndex].id == state.originalId)
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
               this.currentIndex = idx
               if (this.originalId == "") {
                  this.originalId = id
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
      browseNext(idx) {
         if (this.currentIndex == this.browse.length - 1) {
            return
         }
         this.showSpinner = false
         this.getBrowseData(this.browse[idx].id)
      },
      browsePrior(idx) {
         if (this.currentIndex == 0) {
            return
         }
         this.showSpinner = false
         this.getBrowseData(this.browse[idx].id)
      },
      browseNextItem() {
         this.browseNext(this.currentIndex + 1)
      },
      browsePriorItem() {
         this.browseNext(this.currentIndex - 1)
      },
      browseNextPage() {
         this.browseNext(this.browse.length - 1)
      },
      browsePriorPage() {
         this.browseNext(0)
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
