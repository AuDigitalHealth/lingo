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

import { Concept } from '../types/concept.ts';

import { BrandCreationDetails } from '../types/product.ts';

import { api } from './api.ts';

const QualifierService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid product response');
  },
  async createBrand(
    creationDetails: BrandCreationDetails,
    branch: string,
  ): Promise<Concept> {
    const response = await api.post(
      `/api/${branch}/qualifier/product-name`,
      creationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const createdBrand = response.data as Concept;
    return createdBrand;
  },
};
export default QualifierService;
