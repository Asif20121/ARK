/**
 * 🎯 CFR Subsidy Calculator
 * 
 * Given the pre-subsidy CFR cost of a product, calculate the subsidy (with a cap) 
 * and determine the final CFR cost.
 */

export interface SubsidyCalculationInput {
  preSubsidyCost: number;  // in USD
  subsidyRate: number;     // as decimal, e.g., 0.08
  subsidyCap: number;      // max allowed subsidy in USD, e.g., 0.80
}

export interface SubsidyCalculationOutput {
  preSubsidyCost: number;
  subsidy: number;
  finalCfrCost: number;
}

export class CFRSubsidyCalculator {
  /**
   * Calculate subsidy with cap and final CFR cost
   * 
   * @param input - Input parameters for subsidy calculation
   * @returns Calculation results rounded to 2 decimal places
   */
  static calculateSubsidy(input: SubsidyCalculationInput): SubsidyCalculationOutput {
    const { preSubsidyCost, subsidyRate, subsidyCap } = input;
    
    // Step 1: Calculate Subsidy
    // subsidy = MIN(preSubsidyCost × subsidyRate, subsidyCap)
    const calculatedSubsidy = preSubsidyCost * subsidyRate;
    const subsidy = Math.min(calculatedSubsidy, subsidyCap);
    
    // Step 2: Final CFR Cost
    // finalCfrCost = preSubsidyCost - subsidy
    const finalCfrCost = preSubsidyCost - subsidy;
    
    // Round all values to 2 decimal places
    return {
      preSubsidyCost: Math.round(preSubsidyCost * 100) / 100,
      subsidy: Math.round(subsidy * 100) / 100,
      finalCfrCost: Math.round(finalCfrCost * 100) / 100
    };
  }

  /**
   * Test the calculation with your example
   */
  static testExample(): SubsidyCalculationOutput {
    const input: SubsidyCalculationInput = {
      preSubsidyCost: 13.61,
      subsidyRate: 0.08,
      subsidyCap: 0.80
    };
    
    const result = this.calculateSubsidy(input);
    
    console.log('🧪 CFR Subsidy Test Case:');
    console.log('Input:', input);
    console.log('Output:', result);
    console.log('✅ Expected: { preSubsidyCost: 13.61, subsidy: 0.80, finalCfrCost: 12.81 }');
    
    return result;
  }

  /**
   * Batch calculation for multiple scenarios
   */
  static calculateBatch(inputs: SubsidyCalculationInput[]): SubsidyCalculationOutput[] {
    return inputs.map(input => this.calculateSubsidy(input));
  }

  /**
   * Validate calculation logic
   */
  static validateCalculation(input: SubsidyCalculationInput): boolean {
    const result = this.calculateSubsidy(input);
    
    // Validation checks
    const calculatedSubsidy = input.preSubsidyCost * input.subsidyRate;
    const expectedSubsidy = Math.min(calculatedSubsidy, input.subsidyCap);
    const expectedFinalCfr = input.preSubsidyCost - expectedSubsidy;
    
    return (
      Math.abs(result.subsidy - expectedSubsidy) < 0.01 &&
      Math.abs(result.finalCfrCost - expectedFinalCfr) < 0.01
    );
  }
}

// Example usage and test
const exampleResult = CFRSubsidyCalculator.testExample();
console.log('CFR Subsidy Calculation Result:', exampleResult);