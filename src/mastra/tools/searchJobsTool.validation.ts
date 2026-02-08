import { z } from 'zod';

export const JobSchema = z.object({
    title: z.string(),
    company: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    salary: z
        .object({
            min: z.number().optional(),
            max: z.number().optional(),
            currency: z.string().optional(),
            period: z.string().optional(),
        })
        .optional(),
});

export const JSearchJobSchema = z.object({
    job_title: z.string(),
    employer_name: z.string().optional(),
    job_city: z.string().nullable().optional(),
    job_state: z.string().nullable().optional(),
    job_country: z.string().nullable().optional(),
    job_description: z.string().nullable().optional(),
    job_apply_link: z.string().nullable().optional(),
    job_salary_min: z.number().nullable().optional(),
    job_salary_max: z.number().nullable().optional(),
    job_salary_currency: z.string().nullable().optional(),
    job_salary_period: z.string().nullable().optional(),
});

export const JSearchSuccessSchema = z.object({
    data: z.array(JSearchJobSchema),
});

export const JSearchErrorSchema = z.object({
    message: z.string(),
});
