<template>
  <div class="notice">
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
  </div>
</template>
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