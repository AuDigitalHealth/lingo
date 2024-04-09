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
    interceptFetchTicket(): Chainable<any>;
    interceptPutTicket(): Chainable<any>;
  }
}
