// Each search ppol hit contains an array of field objects. These may be repeated, but for display
// purposes they need to be merged into a single field object with an array value. Additionally, the fields
// are classified as header (special rendering), basic (show by default),
// detailed (hidden by default). Split them into separate sections of the hit. Identifer and
// cover image are also special and get pulled to top level of hit data
export function preProcessHitFields(poolURL, hits) {
   hits.forEach(function (hit) {
      hit.basicFields = []
      hit.detailFields = []
      hit.holdings = {}
      hit.header = {}
      hit.fields.forEach(function (field) {
         if (field.value === "" && field.name != "summary_holdings") {
            return
         }
         if ( field.name == "iiif_manifest_url") {
            // not supporting this field for now
            return
         }

         // Special fields are cover image and identifer. Move them to top level
         if (field.type == "cover-image-url") {
            hit.cover_image = field.value
            return
         }
         if (field.type == "identifier" || field.name == "id") {
            hit.identifier = field.value
            hit.itemURL = poolURL + "/api/resource/" + hit.identifier
            return
         }

         // Special handling for key fields; put them in the hit header
         if (field.type == "title") {
            hit.header.title = field.value
            return
         }
         if (field.type == "subtitle") {
            hit.header.subtitle = field.value
            return
         }
         if (field.type == "author") {
            if ( !hit.header.author) {
               let sep = field.separator
               if (!sep) {
                  sep = "; "
               }
               hit.header.author = {label: field.label, separator: sep, value: []}
            }
            hit.header.author.label = field.label
            hit.header.author.value.push(field.value)
            return
         }
         if (field.type == "author-display") {
            hit.header.author_display = field.value
            return
         }

         // Access_url is a special case. Instead of just repeated value, it also
         // has provider and item. preserve the data, grouped by provider. Ex:
         // { name: access_url, label: "Online Access", value: [
         //    {provider: "hathitrust", links: [ {url: url, label: "v4. 1988"} ] }
         // ]}
         if (field.name=="access_url") {
            let existing = hit.basicFields.find(f => f.name === field.name)
            if (existing) {
               let provider = field.provider
               let newLink = {url: field.value}
               if ( field.item ) {
                  newLink.label = field.item
               }
               let provData = existing.value.find( f => f.provider == provider)
               if (!provData) {
                  // a provider group does not exist; create one and set it to currProvider
                  provData = {provider: provider, links: []}
                  existing.value.push(provData)
               }
               provData.links.push(newLink)
            } else {
               let newF = {name: field.name, type: field.type, label: field.label,
                  visibility: "basic", value: []}
               let newVal = {provider: field.provider, links: []}
               let newLink = {url: field.value}
               if ( field.item ) {
                  newLink.label = field.item
               }
               newVal.links.push( newLink )
               newF.value.push( newVal )
               hit.basicFields.push(newF)
            }
            return
         }

         // related-url is special. it has repeated value (url) & item (label) data
         // preserve it as an object in the field values array
         if (field.type == "related-url") {
            let val = {url: field.value, label: field.item}
            let existing = hit.detailFields.find(f => f.name === field.name)
            if (existing) {
               existing.value.push( val )
            } else {
               let f = Object.assign({}, field)
               delete f.item
               delete f.value
               f.value = [val]
               hit.detailFields.push(f)
            }
            return
         }

         if ( field.name == "summary_holdings") {
            hit.holdings = field.structured_value.holdings
            return
         }

         // Pick which group the fields belong to
         let tgtMerged = hit.basicFields
         if (field.visibility == "detailed" && field.name != "format") {
            tgtMerged = hit.detailFields
         }

         // convert existing field values to arrays if multiple values found
         let existing = tgtMerged.find(f => f.name === field.name)
         if (existing) {
            if (Array.isArray(existing.value) === false) {
               existing.value = [existing.value]
            }
            existing.value.push(field.value)
         } else {
            // for ease of use later, these fields are always an array
            let arrayFields = ["subject", "oclc", "isbn", "lccn"]
            if (arrayFields.includes(field.name) ) {
               field.value = [field.value]
            }
            tgtMerged.push(field)
         }
      })

      if (!hit.header.author_display && hit.header.author) {
         hit.header.author_display = hit.header.author.value.join(hit.header.author.separator)
      }

      delete hit.fields
   })
}

export function fieldValueString(field) {
   if ( Array.isArray(field.value)) {
      let sep = field.separator
      if (sep == "paragraph") {
         let out = "<p>"
         field.value.forEach( (v,idx) => {
            out += v
            if (idx === field.value.length - 1) {
               out += "</p>"
            } else {
               out += "</p><p>"
            }
         })
         return out
      }

      if (!sep) {
         sep = ", "
      }
      return field.value.join(sep)

   }
   return field.value
}

export function getGroupHitMetadata(group, hit) {
   hit.header = {}
   if (group.record_list) {
      hit.header = group.record_list[0].header
      hit.basicFields = group.record_list[0].basicFields
      hit.detailFields = group.record_list[0].detailFields
      hit.cover_image = group.record_list[0].cover_image
      hit.identifier = group.record_list[0].identifier
      hit.itemURL = group.record_list[0].itemURL
      group.record_list.shift()
      hit.group = group.record_list
      hit.group.forEach( (h,idx) => {
         h.groupParent = hit.identifier
         h.number = hit.number+idx+1
      })
   } else {
      hit.header.title = "ERROR: Missing group data"
   }
   delete group.fields
}

export function scrollToItem( tgtEle ) {
   let nav = document.getElementById("v4-navbar")
   var headerOffset = nav.offsetHeight
   var elementPosition = tgtEle.getBoundingClientRect().top
   var offsetPosition = elementPosition - headerOffset
   window.scrollBy({
     top: offsetPosition,
     behavior: "smooth"
   })
 }

 // Convert a click on bookmark while not signed in into a data structure that can be used
 // to restore the add bookmark after sign in has completed.
 // Pool is the pool where hit is located, origin is the place where the bookmark started.
 // Options: SEARCH, DETAIL, COLLECTION, SHELF_BROWSE
 export function toBookmarkData( pool, hit, origin ) {
    let bmData = {identifier: hit.identifier, title: hit.header.title, pool: pool, origin: origin}
    if (hit.groupParent) {
       bmData.groupParent = hit.groupParent
    }
    return bmData
 }

export function formatNum(num) {
   if (num == 0) {
      return "0"
   }
   if (num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
   }
   return ""
}

export function truncateTitle( title ) {
   if ( title.length <= 90) {
      return title
   }
   let spaceIdx = 90
   let found = false
   while ( !found && spaceIdx >0 ) {
      if ( title[spaceIdx] == ' ') {
         found = true
      } else {
         spaceIdx--
      }
   }
   if ( found) {
      return `${title.substring(0,spaceIdx).trim()}&nbsp;[&nbsp;&hellip;&nbsp;]`
   }
   return title
}
