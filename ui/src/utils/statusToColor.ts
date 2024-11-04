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

import {
  ClassificationStatus,
  TaskStatus,
  ValidationStatus,
} from '../types/task';
import { ValidationColor } from '../types/validationColor';

const statusToColor = (value: string): ValidationColor => {
  // default
  let type: ValidationColor = ValidationColor.Info;
  if (Object.values(ValidationStatus).includes(value as ValidationStatus)) {
    type = validationStatusToColor(value);
  }
  if (Object.values(TaskStatus).includes(value as TaskStatus)) {
    type = taskStatusToColor(value);
  }
  if (
    Object.values(ClassificationStatus).includes(value as ClassificationStatus)
  ) {
    type = classificationStatusToColor(value);
  }

  return type;
};

const validationStatusToColor = (value: string): ValidationColor => {
  let type: ValidationColor;

  switch (value) {
    case ValidationStatus.NotTriggered:
      type = ValidationColor.Error;
      break;
    case ValidationStatus.Failed:
      type = ValidationColor.Error;
      break;
    case ValidationStatus.Pending:
      type = ValidationColor.Warning;
      break;
    case ValidationStatus.Stale:
      type = ValidationColor.Warning;
      break;
    case ValidationStatus.Scheduled:
      type = ValidationColor.Success;
      break;
    case ValidationStatus.Completed:
      type = ValidationColor.Success;
      break;

    default:
      type = ValidationColor.Info;
  }
  return type;
};

const taskStatusToColor = (value: string): ValidationColor => {
  let type: ValidationColor;

  switch (value) {
    case TaskStatus.Deleted:
      type = ValidationColor.Error;
      break;
    case TaskStatus.Unknown:
      type = ValidationColor.Error;
      break;
    case TaskStatus.New:
      type = ValidationColor.Warning;
      break;
    case TaskStatus.InReview:
      type = ValidationColor.Info;
      break;
    case TaskStatus.ReviewCompleted:
      type = ValidationColor.Success;
      break;
    case TaskStatus.Completed:
      type = ValidationColor.Success;
      break;
    case TaskStatus.InProgress:
      type = ValidationColor.Info;
      break;
    case TaskStatus.Promoted:
      type = ValidationColor.Success;
      break;
    default:
      type = ValidationColor.Info;
  }
  return type;
};

const classificationStatusToColor = (value: string): ValidationColor => {
  let type: ValidationColor;

  switch (value) {
    case ClassificationStatus.Cancelled:
      type = ValidationColor.Error;
      break;
    case ClassificationStatus.Failed:
      type = ValidationColor.Error;
      break;
    case ClassificationStatus.Stale:
      type = ValidationColor.Error;
      break;
    case ClassificationStatus.Running:
      type = ValidationColor.Warning;
      break;
    case ClassificationStatus.Scheduled:
      type = ValidationColor.Success;
      break;
    case ClassificationStatus.Completed:
      type = ValidationColor.Success;
      break;
    case ClassificationStatus.Saved:
      type = ValidationColor.Success;
      break;
    default:
      type = ValidationColor.Info;
  }
  return type;
};

export default statusToColor;
