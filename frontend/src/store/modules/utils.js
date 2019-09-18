// Each search ppol hit contains an array of field objects. These may be repeated, but for display 
// purposes they need to be merged into a single field object with an array value. Additionally, the fields 
// are classified as basic (show by default) or detailed (hidden by default). Split them into two separate
// arrays of fields. Finally, the preview_url is a special case. It is placed and rendered differently than 
// all others. Pull it out of the fields lists and place it in the top-level of the hit info.
export function preProcessHitFields( hits ) {
   hits.forEach(function(hit) {
     let mergedBasicFields = []
     let mergedDetailFields = []
     hit.fields.forEach(function(field) {
       if (field.value === "") {
         return
       }
       if (field.name == "preview_url") {
         hit.previewURL = field.value
         return
       }
       if (field.name == "id") {
         hit.identifier = field.value
         return
       }
       let tgtMerged = mergedBasicFields 
       if (field.visibility == "detailed") {
         tgtMerged = mergedDetailFields
       }
       let existing = tgtMerged.find(f => f.name === field.name) 
       if (existing) {
         // this field has already been encountered. Convert the value 
         // to an array and push the new value into it
         if (Array.isArray(existing.value)===false) {
           existing.value = [existing.value]
         }
         existing.value.push(field.value)
       } else {
         tgtMerged.push(field)
       }
     })
     hit.basicFields = mergedBasicFields
     hit.detailFields = mergedDetailFields
     delete hit.fields
   })
 }

export function getGroupHitMetadata(group, hit) {
  let groupTitle = getHitField(group.record_list[0], "title")
  let groupAuthor = getHitField(group.record_list[0], "author")
  group.fields.forEach( field => {
    if (field.name == "title") {
      field.value = groupTitle
    }
    if (field.name == "author") {
      field.value = groupAuthor
    }
  })
  hit.metadata = group.fields
 }

 export function getHitField(fields, name ) {
    let val = ""
    fields.basicFields.some( fieldObj=> {
      if (fieldObj.name == name) {
        val = fieldObj.value
      }
      return val != ""
    })
    return val
 }

 // Find a pool by internal identifier
export function findPool(pools, id) {
   let match = null
   pools.some(function (p) {
      if (p.id == id) {
         match = p
      }
      return match != null
   })
   return match
 }
 