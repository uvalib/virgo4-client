<template>
  <div class="notice">
    <template v-if="type == 'research'">
      <p class="head">
        <strong>Important Copyright Information<br/>
        NOTICE OF WARNING CONCERNING COPYRIGHT RESTRICTIONS
        </strong>
      </p>
      <p>
        The copyright law of the United States (Title 17, United States Code) governs the making of
        photocopies or other reproductions of copyrighted materials.
      </p>
      <p>
        Under certain conditions specified in the law, libraries and archives are authorized to
        furnish a photocopy or other reproduction. One of these specified conditions is that the
        photocopy or reproduction is not to be "used for any purpose other than private study, scholarship, or research".
        If a user makes a request for, or later uses, a photocopy or reproduction for purposes in excess of "fair use",
        that user may be liable for copyright infringement.
      </p>
      <p>
        This institution reserves the right to refuse to accept a copying order if, in its judgment,
        fulfillment of the order would involve violation of copyright law.
      </p>
    </template>

    <template v-else-if="type == 'instruction'">
      <p class="head">
        <strong>Important Copyright Information<br/>
        NOTICE OF WARNING CONCERNING COPYRIGHT RESTRICTIONS
        </strong>
      </p>
      <p>
        N.B. The Fair Use guidelines for Copyright Law are broad in scope and can be difficult to interpret.
        For this reason, the Library has come up with the following recommendations:
      </p>
      <p>
        Materials which may be scanned for the Collab for a course without obtaining copyright permissions:
        <ul>
            <li>One chapter from a book</li>
            <li>One article from a journal issue</li>
            <li>Government publications</li>
            <li>Exams, homework solutions, lecture notes, student papers, etc.</li>
            <li>Anything for which you own the copyright</li>
            <li>Anything in the public domain</li>
        </ul>
      </p>
      <p>
        If you wish to go outside of these guidelines, or if you wish to use materials for more than one semester,
        copyright permission may be sought from the publisher of the journal or book. The Copyright Clearance Center
        offers a quick and convenient method of obtaining permission. More information on the University's copyright
        policy is available. The copyright law of the United States (Title 17, US Code) governs the making of photocopies
        or other reproduction of copyrighted material. Under certain conditions specified in the law, libraries and
        archives are authorized to furnish a photocopy or other reproduction. One of these specified conditions is that the
        photocopy or reproduction is not to be used for any other purpose other than private study, scholarship, or research.
        If a user makes a request for, or later uses, a photocopy or reproduction for purposes in excess of "fair use," that user
        may be liable for copyright infringement. This institution reserves the right to refuse to accept a copying order if,
        in its judgment, fulfillment of the order would involve violation of copyright law.
      </p>
      <p>
        SUBMISSION OF THIS REQUEST IS CONFIRMATION THAT you understand the University's Policy on Copying of Copyrighted Material,
        and that the material requested for reserve either complies with these guidelines or it may be copied because you have
        received written permission from the copyright holder.
      </p>
      <p>
        Instructors are responsible for compliance with copyright law.
      </p>
    </template>
  </div>
</template>
<script>
export default {
  props: {
    type: {
      validator: (value)=>{
        return ['instruction', 'research'].indexOf(value) !== -1
      }
    }
  }

}
</script>
<style lang="scss" scoped>
.notice {
   font-size:0.95em;
   padding: 0;
   border: 1px solid var(--uvalib-red-emergency);
   p {
      margin: 10px 15px;
   }
   p.head {
      margin: 0;
      padding: 5px 15px;
      background: var(--uvalib-red-lightest);
      border-bottom: 1px solid var(--uvalib-red-emergency);
   }
}
</style>