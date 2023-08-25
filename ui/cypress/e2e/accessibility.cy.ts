import {login} from "./LoginSpec.cy";

const axeRunContext = {
    exclude: [[".prism-code"]],
};

const axeRunOptions = {
    includedImpacts: ["critical", "serious", "moderate"],
};

describe("Accessibility tests", () => {
    it('loads the page', () => {
        cy.visit(Cypress.env('frontend_url'));
    });
    it('logs in to ims', () => {
        login('login');
        cy.injectAxe();
    });


    it("Has no detectable accessibility violations on load", () => {
        cy.checkA11y(null, axeRunOptions);
    });

});