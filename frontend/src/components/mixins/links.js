import { mapGetters } from "vuex"

export const links = {
   computed: {
      ...mapGetters({
         findProvider: 'pools/findProvider'
      }),
   },
   methods: {
      accessURLDisplay(pool, URLs) {
         // the access_url value is an array of {provider:name, links:[]}
         let out = ""
         URLs.forEach( p => {
            let pDetail = this.findProvider(pool, p.provider)
            if (p.links.length == 1) {
                out += `<div class='provider'>`
                out += `<a href='${p.links[0].url}' target='_blank'>${pDetail.label}</a>`
                out += `</div>`
            } else {
               out += `<div class='provider'><span class='provider'>${pDetail.label}</span><div class='links'>`
               let pUrls = []
               p.links.slice(0,10).forEach( l => {
                  let url =`<a href="${l.url}" target="_blank">`
                  if ( l.label ) {
                     url += `${l.label}</a>`
                  } else {
                     url += `${l.url}</a>`
                  }
                  pUrls.push(url)
               })   
               if (p.links.length > 10 ) {
                  pUrls.push(`see ${p.links.length -10} more on details page`)   
               }
               out += pUrls.join(" | ")
               out += '</div></div>' 
            }
         })
         return out
      },
   }
}