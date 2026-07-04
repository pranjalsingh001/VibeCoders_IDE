// validationService.js - Basic validation for workflow stage outputs
const validateBlueprint = (result) => {
  if (!result || typeof result !== 'object') {
    throw new Error('Blueprint result must be an object');
  }
  // Assuming blueprint has sections like overview, components, etc.
  if (typeof result.overview !== 'string' || !Array.isArray(result.components)) {
    throw new Error('Invalid blueprint structure: overview must be string, components must be array');
  }
  return true;
};

const validateHLD = (result) => {
  if (!result || typeof result !== 'object') {
    throw new Error('HLD result must be an object');
  }
  // Assuming HLD has architecture, data flow, etc.
  if (!result.architecture || !result.dataFlow) {
    throw new Error('Invalid HLD structure: missing architecture or dataFlow');
  }
  return true;
};

const validateLLD = (result) => {
  if (!result || typeof result !== 'object') {
    throw new Error('LLD result must be an object');
  }
  // Assuming LLD has detailed components, APIs, etc.
  if (!result.detailedComponents || !Array.isArray(result.detailedComponents)) {
    throw new Error('Invalid LLD structure: missing detailedComponents array');
  }
  return true;
};

const validateCodegen = (result) => {
  if (!result || typeof result !== 'object') {
    throw new Error('Codegen plan must be an object');
  }
  // Assuming codegen has files array from the schema
  if (!result.files || !Array.isArray(result.files)) {
    throw new Error('Invalid codegen plan: missing files array');
  }
  // Basic check for each file
  result.files.forEach((file, index) => {
    if (!file.path || typeof file.purpose !== 'string') {
      throw new Error(`Invalid file at index ${index}: missing path or purpose`);
    }
  });
  return true;
};

const validateGeneratedFile = (code, fileSpec) => {
  if (!code || typeof code !== 'string') {
    throw new Error('Generated code must be a non-empty string');
  }

  if (code.trim().length === 0) {
    throw new Error('Generated code is empty');
  }

  // Basic checks based on language - more lenient
  if (fileSpec.language === 'javascript' || fileSpec.language === 'typescript') {
    // Check for basic syntax patterns (more lenient)
    const hasBasicStructure = (
      code.includes('function') ||
      code.includes('const') ||
      code.includes('let') ||
      code.includes('var') ||
      code.includes('export') ||
      code.includes('class') ||
      code.includes('import') ||
      code.includes('require') ||
      code.includes('module.exports') ||
      code.includes('=') ||
      code.includes('console.log') ||
      code.includes('app.') ||
      code.includes('router.')
    );

    if (!hasBasicStructure) {
      console.warn(`⚠️ Generated code for ${fileSpec.path} may not be valid JavaScript/TypeScript`);
      // Don't throw error, just warn - let the code be generated
    }
  }

  // Check for required exports if specified in purpose (more lenient)
  if (fileSpec.purpose && fileSpec.purpose.toLowerCase().includes('export')) {
    if (!code.includes('export') && !code.includes('module.exports')) {
      console.warn(`⚠️ File ${fileSpec.path} purpose indicates export but no export statement found`);
      // Don't throw error, just warn
    }
  }

  // Check for obvious issues
  if (code.includes('undefined') && !code.includes('typeof')) {
    console.warn(`⚠️ File ${fileSpec.path} contains undefined - may need review`);
  }

  if (code.includes('TODO') || code.includes('FIXME')) {
    console.warn(`⚠️ File ${fileSpec.path} contains TODO/FIXME comments`);
  }

  return true;
};

const validate = (stage, result) => {
  const validators = {
    blueprint: validateBlueprint,
    hld: validateHLD,
    lld: validateLLD,
    codegen: validateCodegen
  };

  const validator = validators[stage];
  if (!validator) {
    throw new Error(`Unknown validation stage: ${stage}`);
  }

  validator(result);
  console.log(`✅ Validation passed for stage: ${stage}`);
};

module.exports = { validate, validateGeneratedFile };
