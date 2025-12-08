// Re-export all schemas from @repo/zod for use in the API
export {
  setupSchema,
  signinSchema,
  changePasswordSchema,
  createUserSchema,
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema,
  type SetupInput,
  type SigninInput,
  type ChangePasswordInput,
  type CreateUserInput,
  type CreateLeadInput,
  type UpdateLeadInput,
  type ConvertLeadInput,
} from "@repo/zod";

