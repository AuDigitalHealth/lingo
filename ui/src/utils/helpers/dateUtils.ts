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

export function timeSince(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    return date.toLocaleDateString('en-AU');
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return date.toLocaleDateString('en-AU');
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return date.toLocaleDateString('en-AU');
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval).toString() + ' hours';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval).toString() + ' minutes';
  }
  return Math.floor(seconds).toString() + ' seconds';
}
