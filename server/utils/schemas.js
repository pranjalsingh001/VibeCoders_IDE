// utils/schemas.js
const { z } = require("zod");

// Blueprint Schema
const BlueprintSchema = z.object({
  content: z.string(),
  versions: z.array(z.string()).optional(),
});

// HLD Schema
const HLDschema = z.object({
  hld: z.string(),
  designDocId: z.string().optional(),
});

// LLD Schema
const LLDschema = z.object({
  lld: z.string(),
  designDocId: z.string().optional(),
});

// Codegen Plan Schema
const CodegenPlanSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    description: z.string().optional(),
  })),
});

module.exports = { BlueprintSchema, HLDschema, LLDschema, CodegenPlanSchema };
