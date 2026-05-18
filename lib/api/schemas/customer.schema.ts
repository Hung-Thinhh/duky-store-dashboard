import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";
import { CustomerStatus, CustomerType } from "./enums";

export const CustomerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  status: z.nativeEnum(CustomerStatus).default("ACTIVE"),
  type: z.nativeEnum(CustomerType).default("NEW"),
  totalOrders: z.number().default(0),
  totalSpent: z.number().default(0),
  lastOrderAt: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  ward: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const UpdateCustomerPayloadSchema = z.object({
  status: z.nativeEnum(CustomerStatus).optional(),
  type: z.nativeEnum(CustomerType).optional(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const CustomerListResponseSchema = createPaginatedResponseSchema(CustomerSchema);
export const CustomerDetailResponseSchema = createResponseSchema(CustomerSchema);

export type Customer = z.infer<typeof CustomerSchema>;
export type UpdateCustomerPayload = z.infer<typeof UpdateCustomerPayloadSchema>;
export type CustomerListResponse = z.infer<typeof CustomerListResponseSchema>;
export type CustomerDetailResponse = z.infer<typeof CustomerDetailResponseSchema>;
