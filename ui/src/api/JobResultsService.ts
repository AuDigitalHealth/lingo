import { AxiosResponse } from 'axios';
import { api } from './api';
import { JobResult } from '../types/tickets/jobs';

const JobResultsService = {
  // eslint-disable-next-line
  handleErrors: (response: AxiosResponse<any, any>) => {
    console.log(response);
    throw new Error('invalid task response');
  },

  async getJobResults(): Promise<JobResult[]> {
    const response = await api.get('/api/tickets/jobResults');
    const statusCode = response.status;

    if (statusCode !== 200) {
      this.handleErrors(response);
    }
    return response.data as JobResult[];
  },

  async acknowledgeJobResult(jobResult: JobResult): Promise<JobResult> {
    const response = await api.post(`/api/tickets/jobResults/${jobResult.id}`);

    const statusCode = response.status;

    if (statusCode !== 200) {
      this.handleErrors(response);
    }
    return response.data as JobResult;
  },
};

export default JobResultsService;
