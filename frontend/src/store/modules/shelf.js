import axios from 'axios'

const shelf = {
   namespaced: true,
   state: {
      lookingUp: false,
      browse: [],
      browseRange: 3,
      showSpinner: true
   },

   getters: {
      hasBrowseData: state => {
         return (state.browse.length > 0 && state.lookingUp == false)
      }
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
         if ( flag == false ) {
            state.showSpinner = true
         }
      },
      setShowSpinner(state, flag) {
         state.showSpinner = flag
      },

      clearBrowseDetails(state) {
         state.browse.splice(0, state.browse.length)
      },
      setBrowseRange( state, range) {
         state.browseRange = range
      },

      setBrowseDetails(state, data) {
         state.browse.splice(0, state.browse.length)
         data.forEach( b => {
            b.cover_image_url = ""
            b.status = "loading"
            b.placeholder_class= placeholderClass(b.id)
            state.browse.push(b)
         })
      },
      setCoverImage(state, data) {
         let idx = state.browse.findIndex( b=>b.id == data.id)
         if ( idx > -1) {
            let b = state.browse[idx]
            if (data.status == "not_found" || data.status=="unprocessed") {
               b.status = "not_found"
               b.placeholder_class= placeholderClass(b.id)
            } else {
               b.status = "ready"
               b.image_base64 = data.image_base64
               b.cover_image_url = data.image_url
            }
            state.browse.splice(idx, 1, b)
         }
      }
   },
   actions: {
      browseNext(ctx) {
         let nextIdx = ctx.state.browseRange
         if ( ctx.state.browseRange == 3) {
            nextIdx++
         } else {
            nextIdx =  ctx.state.browse.length -1
         }
         ctx.state.showSpinner = false
         ctx.dispatch("getBrowseData", ctx.state.browse[nextIdx].id)
      },
      browsePrior(ctx) {
         let nextIdx = ctx.state.browseRange
         if ( ctx.state.browseRange == 3) {
            nextIdx--
         } else {
            nextIdx =  0
         }
         ctx.state.showSpinner = false
         ctx.dispatch("getBrowseData", ctx.state.browse[nextIdx].id)
      },
      async getBrowseData(ctx, centerId) {
         if ( ctx.state.showSpinner) {
            ctx.commit("setLookingUp", true)
         }

         let url = `${ctx.rootState.system.shelfBrowseURL}/api/browse/${centerId}?range=${ctx.state.browseRange}`
         await axios.get(url).then((response) => {
            response.data.items.forEach( b => {
               if ( b.cover_image_url) {
                  let testURL = b.cover_image_url.replace("?", ".json?")
                  axios.get(testURL).then((ciR) => {
                     let ciD = ciR.data
                     ctx.commit("setCoverImage", {
                        id: b.id, image_url: ciD.image_url, image_base64:ciD.image_base64, status: ciD.status})
                  }).catch(() => {
                     ctx.commit("setCoverImage", {
                        id: b.id, image_url: "", image_base64: "", status: "not_found"})
                  })
               }
            })
            ctx.commit("setBrowseDetails", response.data.items)
            ctx.commit("setLookingUp", false)

         }).catch((error) => {
            ctx.commit("setLookingUp", false)
            ctx.commit("clearBrowseDetails")
            if ( error.response && error.response.status == 404) {
               console.warn("No browse data available for "+centerId)
            } else {
               // no negative impact on client; just don't show shelf browse and log error
               ctx.dispatch("system/reportError", error, {root: true})
            }
         })
      },
   }
}

function placeholderClass (src) {
   let hash = 0
   for(let i = 0; i < src.length; i++) {
      hash = Math.imul(31, hash) + src.charCodeAt(i) | 0
   }
   let hashStr = ""+hash
   let cn = `cover${hashStr.substring(hashStr.length-1)}`
   return cn
 };

export default shelf