describe('Digital Content Links Test', () => {
  it('checks for known PDF titles', () => {
    cy.visit('/sources/archival/items/u3930379')

    cy.contains('PDF').next().should('contain', 'MSS')
  })
})
