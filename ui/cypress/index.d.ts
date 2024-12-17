///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

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
    waitForCreateTask(action: () => void): Chainable<any>;
    waitForTaskTicketAssociation(action: () => void): Chainable<any>;
    waitForProductLoad(branch: string): Chainable<void>;
    waitForTicketProductsLoad(ticketKey: number): Chainable<void>;
    waitForBulkTicketProductsLoad(ticketKey: number): Chainable<void>;
    waitForTicketProductLoad(ticketKey: number): Chainable<void>;
    waitForMedicationLoad(branch: string): Chainable<void>;
    waitForBulkPackLoad(branch: string): Chainable<void>;
    waitForBulkBrandLoad(branch: string): Chainable<void>;
    waitForDeviceLoad(branch: string): Chainable<void>;
    waitForCalculateMedicationLoad(branch: string): Chainable<void>;
    waitForCalculateDeviceLoad(branch: string): Chainable<void>;
    waitForCalculateBrandPackLoad(branch: string): Chainable<void>;
    waitForCreateMedication(branch: string): Chainable<void>;
    waitForCreateDevice(branch: string): Chainable<void>;
    waitForCreateTpBrand(branch: string): Chainable<void>;
    waitForCreateBulkBrandPack(branch: string): Chainable<void>;
    waitForGetTasks(): Chainable<void>;
    waitForBranchCreation(): Chainable<void>;
    waitForGetTaskDetails(key: string): Chainable<void>;
    waitForConceptSearch(branch: string): Chainable<void>;
    waitForOntoSearch(branch: string): Chainable<void>;
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
    interceptGetTicketFilter(): Chainable<any>;
    setUpIteration(): Chainable<any>;
    setUpExternalRequestor(): Chainable<any>;
    interceptPostTicketFilter(): Chainable<any>;
    interceptPostCreateTask(): Chainable<any>;
    interceptPutTask(key: string): Chainable<any>;
    interceptPutProduct(key: number): Chainable<any>;
    interceptGetLogout(): Chainable<any>;
    interceptGetLabels(): Chainable<any>;
    interceptPostLabels(): Chainable<any>;
    interceptGetIterations(): Chainable<any>;
    interceptPostIterations(): Chainable<any>;
    interceptGetExternalRequestors(): Chainable<any>;
    interceptPostExternalRequestors(): Chainable<any>;
  }
}
