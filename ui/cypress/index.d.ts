declare namespace Cypress {
  interface Chainable {
    login(email: string, password: string): Chainable<void>;
    drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
    dismiss(
      subject: string,
      options?: Partial<TypeOptions>,
    ): Chainable<Element>;
    visit(
      originalFn: CommandOriginalFn<any>,
      url: string,
      options: Partial<VisitOptions>,
    ): Chainable<Element>;
    checkPageA11y(): Chainable<Element>;
    waitForGetTicketList(action: () => void): Chainable<void>;
    waitForGetUsers(): Chainable<void>;
    waitForCreateTicket(action: () => void): Chainable<any>;
    waitForProductLoad(branch:string): Chainable<void>;
    waitForConceptSearch(branch:string): Chainable<void>;
    interceptFetchTicket(): Chainable<any>;
    interceptPutTicket(): Chainable<any>;
    interceptPutTicketLabel(): Chainable<any>;
    interceptPutTicketIteration(): Chainable<any>;
    interceptPutTicketState(): Chainable<any>;
    interceptPutTicketSchedule(): Chainable<any>;
    interceptPutTicketPriority(): Chainable<any>;
    interceptPostAdditionalFieldValue(): Chainable<any>;
    interceptPostComment(): Chainable<any>;
    interceptDeleteComment(): Chainable<any>;
    interceptPostAttachment(): Chainable<any>;
    interceptDeleteAttachment(): Chainable<any>;
  }
}
