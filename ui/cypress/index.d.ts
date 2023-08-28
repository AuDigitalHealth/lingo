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
  }
}
