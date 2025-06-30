export interface CostingConstants {
  usd_rate: number;
  variable_overhead: number;
  fixed_overhead: number;
  freight: number; // Flat USD amount
  insurance: number; // Flat USD amount
  subsidy_rate: number;
  subsidy_cap: number;
}

export interface CostingBreakdown {
  // BDT calculations
  baseCostBDT: number;
  variableOverhead: number;
  fixedOverhead: number;
  subtotalBDT: number;
  totalBDT: number;
  
  // USD calculations
  usdCost: number; // BDT Cost converted to USD
  freightCostUSD: number; // Flat freight cost
  insuranceCostUSD: number; // Flat insurance cost
  preSubsidyCost: number; // USD Cost + Freight + Insurance (before subsidy)
  calculatedSubsidy: number; // Subsidy based on rate
  appliedSubsidy: number; // Actual subsidy applied (respects cap)
  grossCFR: number; // USD Cost + Freight + Insurance
  subsidyAmount: number;
  finalCFRCostUSD: number; // Final CFR Cost
  
  // Additional fields for detailed breakdown
  referenceRMCost?: number;
  glazingPercentage?: number;
  netWeight?: number;
  referenceWeight?: number;
  rmCostPerGram?: number;
  adjustedRMCost?: number;
  actualWeight?: number;
  adjustmentRatio?: number;
}

export interface CostingResult {
  product: {
    id: number;
    species: string;
    specification: string;
    size: string;
    glazing: number;
    referenceWeight: number;
  };
  quantity: number;
  rate: number;
  rateName: string;
  breakdown: CostingBreakdown;
  constants: CostingConstants;
}

export class CostingCalculator {
  /**
   * Calculate Reference RM Cost by averaging rates across a size range
   */
  static calculateReferenceRMCost(rates: any[], lowRange: number, highRange: number): number {
    // Create an array of all individual sizes in the range
    const sizeRange: number[] = [];
    for (let size = lowRange; size <= highRange; size++) {
      sizeRange.push(size);
    }

    // For each size, find the applicable rate
    const applicableRates: number[] = [];
    
    sizeRange.forEach(size => {
      const rate = rates.find(r => size >= r.low && size <= r.high);
      if (rate) {
        applicableRates.push(rate.rate);
      }
    });

    if (applicableRates.length === 0) {
      throw new Error(`No rates found for size range ${lowRange}-${highRange}`);
    }

    // Calculate average rate across all sizes in the range
    const averageRate = applicableRates.reduce((sum, rate) => sum + rate, 0) / applicableRates.length;
    
    return averageRate;
  }

  /**
   * CORRECTED: Calculate Final CFR Cost following your exact specification:
   * 
   * 🔢 Steps:
   * 1. Convert BDT to USD: usdCost = bdtCost / usdRate
   * 2. Add Freight and Insurance: preSubsidyCost = usdCost + freight + insurance
   * 3. Apply Subsidy: appliedSubsidy = Math.min(calculatedSubsidy, subsidyCap)
   * 4. Final CFR Cost: cfrCost = preSubsidyCost - appliedSubsidy
   */
  static calculateFinalCFR(
    bdtCost: number,
    constants: CostingConstants
  ): CostingBreakdown {
    // Step 1: Convert BDT Cost to USD
    const usdCost = bdtCost / constants.usd_rate;
    
    // Step 2: Add Freight & Insurance (flat USD amounts)
    const freightCostUSD = constants.freight; // e.g., $0.20
    const insuranceCostUSD = constants.insurance; // e.g., $0.15
    const preSubsidyCost = usdCost + freightCostUSD + insuranceCostUSD;
    
    // Step 3: Apply Subsidy (CORRECTED LOGIC)
    const subsidyRate = constants.subsidy_rate; // e.g., 0.08 (8%)
    const subsidyCap = constants.subsidy_cap; // e.g., 0.80 ($0.80)
    
    // Calculate subsidy based on rate
    const calculatedSubsidy = preSubsidyCost * subsidyRate;
    
    // Apply the lower of calculated subsidy or subsidy cap
    const appliedSubsidy = Math.min(calculatedSubsidy, subsidyCap);
    
    // Step 4: Final CFR Cost
    const finalCFRCostUSD = preSubsidyCost - appliedSubsidy;
    
    return {
      baseCostBDT: Math.round(bdtCost * 100) / 100,
      variableOverhead: constants.variable_overhead,
      fixedOverhead: constants.fixed_overhead,
      subtotalBDT: Math.round(bdtCost * 100) / 100,
      totalBDT: Math.round(bdtCost * 100) / 100,
      usdCost: Math.round(usdCost * 100) / 100,
      freightCostUSD: Math.round(freightCostUSD * 100) / 100,
      insuranceCostUSD: Math.round(insuranceCostUSD * 100) / 100,
      preSubsidyCost: Math.round(preSubsidyCost * 100) / 100,
      calculatedSubsidy: Math.round(calculatedSubsidy * 100) / 100,
      appliedSubsidy: Math.round(appliedSubsidy * 100) / 100,
      grossCFR: Math.round(preSubsidyCost * 100) / 100, // Same as preSubsidyCost
      subsidyAmount: Math.round(appliedSubsidy * 100) / 100,
      finalCFRCostUSD: Math.round(finalCFRCostUSD * 100) / 100
    };
  }

  /**
   * Calculate costing with GLAZING PERCENTAGE-BASED formula + CORRECTED Final CFR
   */
  static calculateWithGlazingPercentage(
    referenceRMCost: number,
    glazingPercentage: number, // e.g., 0.80 for 80%
    referenceWeight: number,
    constants: CostingConstants
  ): CostingBreakdown {
    // Step 1: Convert glazing percentage to net weight
    const netWeight = glazingPercentage * 1000; // e.g., 0.80 × 1000 = 800g
    
    // Step 2: Calculate RM Cost per gram
    const rmCostPerGram = referenceRMCost / referenceWeight; // e.g., 1,568.571429 ÷ 855 = 1.8348
    
    // Step 3: Calculate Adjusted RM Cost using the formula
    const adjustedRMCost = netWeight * rmCostPerGram; // e.g., 800 × 1.8348 = ৳1,467.67
    
    // Step 4: Add variable and fixed overhead to get BDT Cost
    const bdtCost = adjustedRMCost + constants.variable_overhead + constants.fixed_overhead;
    
    // Step 5: Calculate CORRECTED Final CFR using your exact specification
    const cfrResult = this.calculateFinalCFR(bdtCost, constants);
    
    // Combine all results
    return {
      ...cfrResult,
      baseCostBDT: Math.round(adjustedRMCost * 100) / 100,
      subtotalBDT: Math.round(bdtCost * 100) / 100,
      totalBDT: Math.round(bdtCost * 100) / 100,
      // Additional breakdown details
      referenceRMCost: Math.round(referenceRMCost * 100) / 100,
      glazingPercentage: glazingPercentage,
      netWeight: netWeight,
      referenceWeight: referenceWeight,
      rmCostPerGram: Math.round(rmCostPerGram * 10000) / 10000,
      adjustedRMCost: Math.round(adjustedRMCost * 100) / 100
    };
  }

  /**
   * Calculate costing with weight adjustment (for actual weight vs reference weight)
   */
  static calculateWithWeightAdjustment(
    referenceRMCost: number,
    actualWeight: number,
    referenceWeight: number,
    constants: CostingConstants
  ): CostingBreakdown {
    // Step 1: Calculate weight adjustment ratio
    const adjustmentRatio = actualWeight / referenceWeight;
    
    // Step 2: Calculate Adjusted RM Cost
    const adjustedRMCost = referenceRMCost * adjustmentRatio;
    
    // Step 3: Add variable and fixed overhead to get BDT Cost
    const bdtCost = adjustedRMCost + constants.variable_overhead + constants.fixed_overhead;
    
    // Step 4: Calculate CORRECTED Final CFR
    const cfrResult = this.calculateFinalCFR(bdtCost, constants);
    
    return {
      ...cfrResult,
      baseCostBDT: Math.round(adjustedRMCost * 100) / 100,
      subtotalBDT: Math.round(bdtCost * 100) / 100,
      totalBDT: Math.round(bdtCost * 100) / 100,
      // Additional breakdown details
      referenceRMCost: Math.round(referenceRMCost * 100) / 100,
      actualWeight: actualWeight,
      referenceWeight: referenceWeight,
      adjustmentRatio: Math.round(adjustmentRatio * 100000) / 100000,
      adjustedRMCost: Math.round(adjustedRMCost * 100) / 100
    };
  }

  /**
   * Calculate costing for a product using CORRECTED logic
   */
  static calculateProductCost(
    product: any,
    rates: any[],
    constants: CostingConstants,
    quantity: number = 1,
    actualWeight?: number
  ): CostingResult {
    // Step 1: Calculate Reference RM Cost
    const referenceRMCost = this.calculateReferenceRMCost(rates, product.low, product.high);
    
    let breakdown: CostingBreakdown;
    
    if (actualWeight !== undefined) {
      // Use weight adjustment method
      breakdown = this.calculateWithWeightAdjustment(
        referenceRMCost,
        actualWeight,
        product.reference_weight,
        constants
      );
    } else {
      // Use glazing percentage method
      const glazingPercentage = product.glazing / 100;
      breakdown = this.calculateWithGlazingPercentage(
        referenceRMCost,
        glazingPercentage,
        product.reference_weight,
        constants
      );
    }
    
    // Adjust for quantity if needed
    if (quantity > 1) {
      // Scale the BDT costs by quantity
      const scaledBdtCost = breakdown.subtotalBDT * quantity;
      const scaledBreakdown = this.calculateFinalCFR(scaledBdtCost, constants);
      
      // Update the breakdown with scaled values
      Object.assign(breakdown, {
        ...scaledBreakdown,
        baseCostBDT: breakdown.baseCostBDT * quantity,
        subtotalBDT: breakdown.subtotalBDT * quantity,
        totalBDT: breakdown.totalBDT * quantity,
        adjustedRMCost: breakdown.adjustedRMCost ? breakdown.adjustedRMCost * quantity : undefined
      });
    }
    
    return {
      product: {
        id: product.id,
        species: product.species,
        specification: product.specification,
        size: product.size,
        glazing: product.glazing,
        referenceWeight: product.reference_weight
      },
      quantity,
      rate: referenceRMCost,
      rateName: `Range ${product.low}-${product.high}`,
      breakdown,
      constants
    };
  }

  /**
   * CORRECTED Example calculation using your exact test case:
   * bdtCost = 1617.67
   * usdRate = 122
   * freight = $0.20
   * insurance = $0.15
   * subsidyCap = $0.80
   * subsidyRate = 8%
   * 
   * Expected Result: Final CFR = $12.81
   */
  static exampleCorrectedCalculation(): CostingBreakdown {
    const constants: CostingConstants = {
      usd_rate: 122,
      variable_overhead: 80,
      fixed_overhead: 70,
      freight: 0.20, // Flat $0.20 USD
      insurance: 0.15, // Flat $0.15 USD
      subsidy_rate: 0.08, // 8%
      subsidy_cap: 0.80 // $0.80
    };

    // Your exact test case: BDT Cost = 1617.67
    const bdtCost = 1617.67;
    
    const result = this.calculateFinalCFR(bdtCost, constants);
    
    // Verify the calculation matches your expected output
    console.log('CORRECTED CFR Calculation Test:');
    console.log(`USD Cost: ${result.usdCost} (expected: 13.26)`);
    console.log(`Pre-Subsidy Cost: ${result.preSubsidyCost} (expected: 13.61)`);
    console.log(`Applied Subsidy: ${result.appliedSubsidy} (expected: 0.80)`);
    console.log(`CFR Cost: ${result.finalCFRCostUSD} (expected: 12.81)`);
    
    return result;
  }
}