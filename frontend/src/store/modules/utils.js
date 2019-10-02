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
        // while in flux, toss the cover image stuff. it currently breaks the UI
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
        if (Array.isArray(hit.author) === false) {
          hit.header.author = [field.value]
        } else {
          hit.header.author.push(field.value)
        }
        return
      }
      if (field.type == "availability") {
        if (Array.isArray(hit.availability) === false) {
          hit.header.availability = [field.value]
        } else {
          hit.header.availability.push(field.value)
        }
        return
      }
      if (field.name == "format") {
        if (Array.isArray(hit.format) === false) {
          hit.header.format = [field.value]
        } else {
          hit.header.format.push(field.value)
        }
        return
      }

      // Pick which group the fields belong to
      let tgtMerged = hit.basicFields
      if (field.visibility == "detailed") {
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

export function getGroupHitMetadata(group, hit) {
  hit.header = {}
  hit.header.title = group.record_list[0].header.title
  hit.header.subtitle = group.record_list[0].header.subtitle
  hit.header.author = group.record_list[0].header.author
  group.fields.forEach(field => {
    if (field.name == "format") {
      if (Array.isArray(group.format) === false) {
        hit.header.format = [field.value]
      } else {
        hit.header.format.push(field.value)
      }
      return
    }
  })
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
