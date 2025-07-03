export interface ProblemDetail {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
  }
  
  export const isProblemDetail = (data: any): data is ProblemDetail => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.title === 'string' &&
      typeof data.status === 'number' &&
      typeof data.detail === 'string' &&
      typeof data.instance === 'string'
    );
  };

  export const isAtomicDataValidationProblem = (data: any): data is ProblemDetail => {
    const isPD = isProblemDetail(data);
    debugger;
    return (
      isPD &&
      data.type === 'http://lingo.csiro.au/problem/atomic-data-validation-problem'
    );
  };