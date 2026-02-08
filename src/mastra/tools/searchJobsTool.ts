import axios from 'axios';
import { z } from 'zod';
import { Tool } from '@mastra/core/tools';
import { tryCatch } from '../../../../lib/utils';
import { JobSchema, JSearchErrorSchema, JSearchSuccessSchema } from './searchJobsTool.validation';

export const searchJobsTool = new Tool({
    id: 'searchJobsTool',
    description: 'Searches for jobs by title and location using a jobs API',
    inputSchema: z.object({
        title: z.string().describe("Job title or keywords, e.g. 'frontend developer'"),
        location: z.string().describe("Location, e.g. 'Dubai, United Arab Emirates' or 'remote'"),
        limit: z.number().int().min(1).max(20).nullable().default(5),
    }),
    outputSchema: z.object({
        jobs: z.array(JobSchema),
    }),
    execute: async (inputData) => {
        // Read required environment variables.
        const jobsApiUrl = process.env.JOBS_API_URL;
        const jobsApiKey = process.env.JOBS_API_KEY;

        if (!jobsApiUrl) {
            throw new Error('Missing JOBS_API_URL environment variable');
        }
        if (!jobsApiKey) {
            throw new Error('Missing JOBS_API_KEY environment variable');
        }

        // Build a JSearch-compatible query and request params.
        const query = `${inputData.title} in ${inputData.location}`;
        const params = {
            query,
            page: 1,
            num_pages: 1,
        };

        // JSearch uses RapidAPI headers; keep host optional for flexibility.
        const headers: Record<string, string> = {
            'x-api-key': jobsApiKey,
        };

        const { data: response, error } = await tryCatch(
            axios.get(jobsApiUrl + '/search', { headers, params }),
        );

        if (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const statusText = status ? ` (status ${status})` : '';
                const errorParse = JSearchErrorSchema.safeParse(error.response?.data);
                const responseMessage = errorParse.success ? errorParse.data.message : null;
                const fallbackMessage = responseMessage ?? error.message;
                throw new Error(`Jobs API request failed: ${fallbackMessage}${statusText}`);
            }
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Jobs API request failed: ${message}`);
        }

        const parsedResponse = JSearchSuccessSchema.safeParse(response?.data);
        if (!parsedResponse.success) {
            throw new Error('Jobs API response validation failed');
        }

        const rawJobs = parsedResponse.data.data;

        // Map raw jobs into the clean tool schema.
        const jobs = rawJobs.map((job) => {
            const salary =
                job.job_salary_min ??
                    job.job_salary_max ??
                    job.job_salary_currency ??
                    job.job_salary_period
                    ? {
                        min: job.job_salary_min ?? undefined,
                        max: job.job_salary_max ?? undefined,
                        currency: job.job_salary_currency ?? undefined,
                        period: job.job_salary_period ?? undefined,
                    }
                    : undefined;

            return {
                title: job.job_title,
                company: job.employer_name ?? undefined,
                location: job.job_city ?? job.job_state ?? job.job_country ?? undefined,
                description: job.job_description ?? undefined,
                url: job.job_apply_link ?? undefined,
                salary,
            };
        });

        return { jobs: jobs.slice(0, inputData.limit ?? 5) };
    },
});
