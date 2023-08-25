
    declare namespace Cypress {
      interface Chainable {
          checkAxeViolations(context, options, label): Chainable<Element>
        login(email: string, password: string): Chainable<void>
        drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
        dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
        visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
      }
    }
  