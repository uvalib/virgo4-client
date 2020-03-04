import { mapGetters } from "vuex"

export const links = {
   computed: {
      ...mapGetters({
         findProvider: 'pools/findProvider'
      }),
   },
   methods: {
      accessURLDisplay(pool, URLs, full = false) {
         // the access_url value is an array of {provider:name, links:[]}
         let out = ""
         URLs.forEach( p => {
            let pDetail = this.findProvider(pool, p.provider)
            if (p.links.length == 1) {
                out += `<div class='provider'>`
                out += `<a href='${p.links[0].url}' target='_blank'>${pDetail.label}</a>`
                out += `</div>`
            } else {
               out += `<div class='provider logo'>`
               if (full && pDetail.logo_url) {
                  out += `<img class='logo' src='${pDetail.logo_url}'>`
               }
               out += `<span class='provider'>`
               if ( pDetail.homepage_url) {
                  out += `<a href='${pDetail.homepage_url}' target='_blank'>`
               }
               out += pDetail.label
               if ( pDetail.homepage_url) {
                  out += '</a></span>'
               } else {
                  out += '</span>'
               }
               out += `</div>`
               out += `<div class='links'>`
               let pUrls = []
               let links = p.links 
               if ( !full) {
                  links = p.links.slice(0,10)
               }
               links.forEach( l => {
                  let url =`<a href="${l.url}" target="_blank">`
                  if ( l.label ) {
                     url += `${l.label}</a>`
                  } else {
                     url += `${l.url}</a>`
                  }
                  pUrls.push(url)
               })   
               if (p.links.length > 10 && !full ) {
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