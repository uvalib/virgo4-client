// Each search pool hit contains an array of field objects. These may be repeated, but for display
// purposes they need to be merged into a single field object with an array value.
// title, subtitle and author are special and get put into a header object.
// Identifer and cover image are pulled into the top-level  data
export const preProcessHitFields = ((poolURL, hits) => {
   hits.forEach(function (hit) {
      var processedFields = []
      hit.holdings = {}
      hit.header = {}
      hit.fields.forEach( field => {
         // Handle special redirect field.  This field may be present in item details,
         // or in the only search result of an advanced search for a single identifier.
         if (field.type == "redirect" && field.value != "") {
            window.location.href = field.value
            return
         }

         // throw away blank valued fields, except for holdings where a blank value is important
         if (field.value === "" && field.name != "summary_holdings") {
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
               hit.header.author = {label: field.label, separator: sep, value: [], alternate_value: []}
            }
            hit.header.author.label = field.label
            hit.header.author.value.push(field.value)

            // track alternate values for use when creating author links.  if provided, these alternate
            // values will be the author name, without any relators ['(advisor)', '(editor)', etc.]
            if (field.alternate_value) {
              hit.header.author.alternate_value.push(field.alternate_value)
            } else {
              hit.header.author.alternate_value.push(field.value)
            }
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
            let existing = processedFields.find(f => f.name === field.name)
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
               processedFields.push(newF)
            }
            return
         }

         // related-url is special. it has repeated value (url) & item (label) data
         // preserve it as an object in the field values array
         if (field.type == "related-url") {
            let val = {url: field.value, label: field.item}
            let existing = processedFields.find(f => f.name === field.name)
            if (existing) {
               existing.value.push( val )
            } else {
               let f = Object.assign({}, field)
               delete f.item
               delete f.value
               f.value = [val]
               processedFields.push(f)
            }
            return
         }

         if ( field.name == "summary_holdings") {
            hit.holdings = field.structured_value.holdings
            return
         }

         // convert existing field values to arrays if multiple values found
         let existing = processedFields.find(f => f.name === field.name)
         if (existing) {
            if (Array.isArray(existing.value) === false) {
               existing.value = [existing.value]
            }
            if ( field.type == "highlighted-match") {
               // limit highlighted text hits to 5. Note this can be removed when VIRGONEW-2394 is fixed
               if ( existing.value.length < 5) {
                  existing.value.push(field.value)
               }
            } else {
               existing.value.push(field.value)
            }
         } else {
            // for ease of use later, these fields are always an array
            let arrayFields = ["subject", "oclc", "isbn", "lccn", "digital_collection"]
            if (arrayFields.includes(field.name) ) {
               field.value = [field.value]
            }
            processedFields.push(field)
         }
      })

      if (!hit.header.author_display && hit.header.author) {
         hit.header.author_display = hit.header.author.value.join(hit.header.author.separator)
      }

      delete hit.fields
      hit.fields = processedFields
   })
})

export const fieldValueString =((field) => {
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
})

export const getGroupHitMetadata = ((group, hit) => {
   hit.header = {}
   if (group.record_list) {
      hit.header = group.record_list[0].header
      hit.fields = group.record_list[0].fields
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
})

export const scrollToItem = (( tgtID, focus=false ) => {
   setTimeout( () => {
      let tgtEle = document.getElementById(tgtID)
      if (tgtEle) {
         let nav = document.getElementById("v4-navbar")
         var headerOffset = nav.offsetHeight
         var elementPosition = tgtEle.getBoundingClientRect().top
         let pad = window.getComputedStyle(tgtEle, null).getPropertyValue('padding-top')
         var offsetPosition = elementPosition - headerOffset - parseInt(pad)
         window.scrollBy({
            top: offsetPosition,
            behavior: "smooth"
         })
         if ( focus == true ) {
            tgtEle.focus({preventScroll:true})
         }
      }
   }, 250)
})

export const setFocusID = ((eleID) => {
   setTimeout( () => {
      let ele = document.getElementById(eleID)
      if (ele) {
         ele.focus()
      }
   }, 50)
})
export const setFocusClass = ((className) => {
   setTimeout( () => {
      let eles = document.getElementsByClassName(className)
      if (eles) {
         eles[0].focus()
      }
   }, 50)
})

export const formatNum = ((num) => {
   if (num == 0) {
      return "0"
   }
   if (num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
   }
   return ""
})
