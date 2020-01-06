// Each search ppol hit contains an array of field objects. These may be repeated, but for display 
// purposes they need to be merged into a single field object with an array value. Additionally, the fields 
// are classified as header (special rendering), basic (show by default), 
// detailed (hidden by default). Split them into separate sections of the hit. Identifer and
// cover image are also special and get pulled to top level of hit data
export function preProcessHitFields(hits) {
  hits.forEach(function (hit) {
    hit.basicFields = []
    hit.detailFields  = []
    hit.header = {}
    hit.fields.forEach(function (field) {
      if (field.value === "") {
        return
      }

      // Special fields are cover image and identifer. Move them to top level
      if (field.name == "cover_image") {
        hit.cover_image = field.value
        return
      }
      if (field.type == "identifier" || field.name == "id") {
        hit.identifier = field.value
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
        if (Array.isArray(hit.header.author) === false) {
          hit.header.author = [field.value]
        } else {
          hit.header.author.push(field.value)
        }
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
        tgtMerged.push(field)
      }
    })

    delete hit.fields
  })
}

// Find value for the given field name in detailed or basic hit fields
export function getFieldValue(fieldName, hit) {
  let out = ""
  let fieldsSources = [hit.basicFields, hit.detailFields]
  fieldsSources.some( fields=> {
    fields.some( f=> {
      if (f.name == fieldName) {
        if (Array.isArray(f.value)) {
          out = f.value.join(", ")
        } else {
          out = f.value
        }
      }
      return out != ""
    })
    return out != ""
  })
  if (out == "") {
    out = "Unknown"
  }
  return out
}

export function getGroupHitMetadata(group, hit) {
  hit.header = {}
  if ( group.record_list) {
    hit.header = group.record_list[0].header
    hit.basicFields = group.record_list[0].basicFields
    hit.cover_image = group.record_list[0].cover_image
    hit.identifier = group.record_list[0].identifier
    group.record_list.shift()
    hit.group = group.record_list
    hit.group.forEach( h=> {
      h.groupParent = hit.identifier
    })
  } else {
    hit.header.title = "ERROR: Mising group data"
  }
  delete group.fields
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
