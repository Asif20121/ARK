import React, { useState, useEffect } from 'react';
import { Calculator, Info, Download, CheckCircle } from 'lucide-react';
import { CostingCalculator } from '../services/costingCalculator';
import jsPDF from 'jspdf';

export function CostingDemo() {
  const [sizeRange, setSizeRange] = useState<string>('14-20');
  const [glazingPercentage, setGlazingPercentage] = useState<string>('80');
  const [referenceWeight, setReferenceWeight] = useState<string>('855');
  const [result, setResult] = useState<any>(null);

  // Mock rates data matching your example
  const mockRates = [
    { id: 1, name: 'A', low: 1, high: 4, rate: 2200 },
    { id: 2, name: 'B', low: 5, high: 9, rate: 2050 },
    { id: 3, name: 'C', low: 10, high: 13, rate: 1750 },
    { id: 4, name: 'D', low: 14, high: 19, rate: 1600 },
    { id: 5, name: 'E', low: 20, high: 25, rate: 1380 },
    { id: 6, name: 'F', low: 26, high: 32, rate: 1100 }
  ];

  const constants = {
    usd_rate: 122,
    variable_overhead: 80,
    fixed_overhead: 70,
    freight: 0.20, // Flat USD amount $0.20
    insurance: 0.15, // Flat USD amount $0.15
    subsidy_rate: 0.08, // 8%
    subsidy_cap: 0.80 // $0.80
  };

  useEffect(() => {
    if (sizeRange && glazingPercentage && referenceWeight && 
        !isNaN(parseFloat(glazingPercentage)) && 
        !isNaN(parseFloat(referenceWeight))) {
      
      try {
        // Parse size range (e.g., "14-20")
        const [lowStr, highStr] = sizeRange.split('-');
        const low = parseInt(lowStr);
        const high = parseInt(highStr);
        
        if (isNaN(low) || isNaN(high)) return;
        
        // Step 1: Calculate Reference RM Cost using your exact specification
        const referenceRMCost = CostingCalculator.calculateReferenceRMCost(mockRates, low, high);
        
        const glazingPercent = parseFloat(glazingPercentage) / 100; // Convert to decimal
        const refWeight = parseFloat(referenceWeight);
        
        // Step 2: Apply GLAZING PERCENTAGE-BASED formula + Final CFR calculation
        const breakdown = CostingCalculator.calculateWithGlazingPercentage(referenceRMCost, glazingPercent, refWeight, constants);
        
        // Add additional details for display
        const detailedResult = {
          ...breakdown,
          sizeRange: `${low}-${high}`,
          lowRange: low,
          highRange: high,
          applicableRates: mockRates.filter(r => 
            (low >= r.low && low <= r.high) ||
            (high >= r.low && high <= r.high) ||
            (r.low >= low && r.low <= high) ||
            (r.high >= low && r.high <= high)
          )
        };
        
        setResult(detailedResult);
      } catch (error) {
        console.error('Calculation error:', error);
      }
    }
  }, [sizeRange, glazingPercentage, referenceWeight]);

  const exportToPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('Final CFR Cost Calculation - Complete Breakdown', 20, 20);
    
    // Input
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Size Range: ${result.sizeRange}`, 20, 40);
    doc.text(`Glazing: ${glazingPercentage}%`, 20, 47);
    doc.text(`Reference Weight: ${referenceWeight}g`, 20, 54);
    
    // Step 1 - Reference RM Cost calculation
    doc.setFontSize(10);
    doc.text('Step 1 - Reference RM Cost Calculation:', 20, 69);
    result.applicableRates.forEach((rate: any, index: number) => {
      doc.text(`Size ${rate.low}-${rate.high}: ৳${rate.rate}`, 25, 79 + (index * 7));
    });
    doc.text(`Average: ৳${result.referenceRMCost}`, 25, 79 + (result.applicableRates.length * 7));
    
    // Step 2 - GLAZING PERCENTAGE-BASED formula
    doc.setFontSize(10);
    doc.text('Step 2 - GLAZING PERCENTAGE-BASED Formula:', 20, 120);
    doc.text(`Net Weight: ${glazingPercentage}% × 1000 = ${result.netWeight}g`, 25, 130);
    doc.text(`RM Cost per gram: ৳${result.rmCostPerGram}`, 25, 137);
    doc.text(`Adjusted RM Cost: ${result.netWeight} × ${result.rmCostPerGram} = ৳${result.adjustedRMCost}`, 25, 144);
    
    // Final CFR Steps
    let yPos = 160;
    doc.text('Step 3 - Final CFR Calculation:', 20, yPos);
    yPos += 10;
    doc.text(`BDT Cost: ৳${result.subtotalBDT}`, 25, yPos);
    yPos += 7;
    doc.text(`USD Cost: ৳${result.subtotalBDT} ÷ ${constants.usd_rate} = $${result.usdCost}`, 25, yPos);
    yPos += 7;
    doc.text(`Gross CFR: $${result.usdCost} + $${result.freightCostUSD} + $${result.insuranceCostUSD} = $${result.grossCFR}`, 25, yPos);
    yPos += 7;
    doc.text(`Final CFR: $${result.grossCFR} - $${result.subsidyAmount} = $${result.finalCFRCostUSD}`, 25, yPos);
    
    doc.save('final-cfr-cost-calculation.pdf');
  };

  // Check if result matches expected value ($12.81 for Final CFR Cost)
  const isCorrectResult = result && Math.abs(result.finalCFRCostUSD - 12.81) < 0.01;

  // Calculate the correct USD values for display
  const totalBDTCost = result ? result.subtotalBDT : 0;
  const totalUSDCost = result ? parseFloat((totalBDTCost / constants.usd_rate).toFixed(2)) : 0;
  const unitUSDCost = totalUSDCost; // Since quantity = 1

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <Calculator className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Final CFR Cost Calculator</h2>
            <p className="text-gray-600 mt-1">Complete calculation: GLAZING PERCENTAGE-BASED + Final CFR Cost</p>
          </div>
        </div>

        {/* Success indicator */}
        {isCorrectResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">✅ Final CFR Cost matches expected result: $12.81</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size Range (e.g., 14-20)
              </label>
              <input
                type="text"
                value={sizeRange}
                onChange={(e) => setSizeRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter size range like 14-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glazing Percentage (%)
              </label>
              <input
                type="number"
                value={glazingPercentage}
                onChange={(e) => setGlazingPercentage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter glazing percentage"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Weight (grams)
              </label>
              <input
                type="number"
                value={referenceWeight}
                onChange={(e) => setReferenceWeight(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter reference weight"
              />
            </div>

            {/* Final CFR Formula Display */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-600" />
                Final CFR Cost Formula
              </h3>
              <div className="space-y-2 text-sm">
                <div className="font-mono bg-white p-2 rounded border text-xs">
                  <div>1. USD Cost = BDT Cost ÷ USD Rate</div>
                  <div>2. Gross CFR = USD Cost + Freight + Insurance</div>
                  <div>3. Final CFR = Gross CFR - min(Subsidy Cap, Eligible Subsidy)</div>
                </div>
                {result && (
                  <div className="bg-blue-100 p-2 rounded">
                    <div className="text-blue-800 font-medium">Current Calculation:</div>
                    <div className="text-blue-700 text-xs space-y-1">
                      <div>USD Cost: ৳{result.subtotalBDT} ÷ {constants.usd_rate} = ${result.usdCost}</div>
                      <div>Gross CFR: ${result.usdCost} + ${result.freightCostUSD} + ${result.insuranceCostUSD} = ${result.grossCFR}</div>
                      <div>Final CFR: ${result.grossCFR} - ${result.subsidyAmount} = ${result.finalCFRCostUSD}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Constants Display */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Constants Used</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">USD Rate:</span>
                  <span className="ml-2 font-medium">{constants.usd_rate}</span>
                </div>
                <div>
                  <span className="text-gray-600">Variable OH:</span>
                  <span className="ml-2 font-medium">৳{constants.variable_overhead}</span>
                </div>
                <div>
                  <span className="text-gray-600">Fixed OH:</span>
                  <span className="ml-2 font-medium">৳{constants.fixed_overhead}</span>
                </div>
                <div>
                  <span className="text-gray-600">Freight:</span>
                  <span className="ml-2 font-medium">${constants.freight}</span>
                </div>
                <div>
                  <span className="text-gray-600">Insurance:</span>
                  <span className="ml-2 font-medium">${constants.insurance}</span>
                </div>
                <div>
                  <span className="text-gray-600">Subsidy Cap:</span>
                  <span className="ml-2 font-medium">${constants.subsidy_cap}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Complete Calculation Breakdown</h3>
                <button
                  onClick={exportToPDF}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </button>
              </div>

              {/* Step 1 - Reference RM Cost */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Step 1 - Calculate Reference RM Cost</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-600">Size Range: {result.sizeRange}</div>
                  <div className="text-gray-600">Applicable Rates:</div>
                  {result.applicableRates.map((rate: any, index: number) => (
                    <div key={index} className="ml-4 flex justify-between">
                      <span>Sizes {rate.low}-{rate.high}:</span>
                      <span className="font-medium">৳{rate.rate}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Average (Reference RM Cost):</span>
                    <span className="text-blue-600">৳{result.referenceRMCost?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Step 2 - GLAZING PERCENTAGE-BASED Formula */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Step 2 - Apply GLAZING PERCENTAGE-BASED Formula</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Weight:</span>
                    <span className="font-medium">{glazingPercentage}% × 1000 = {result.netWeight}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">RM Cost per gram:</span>
                    <span className="font-medium">৳{result.rmCostPerGram?.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Adjusted RM Cost:</span>
                    <span className="font-medium text-green-600">৳{result.adjustedRMCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">+ Variable Overhead:</span>
                    <span className="font-medium">৳{result.variableOverhead}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">+ Fixed Overhead:</span>
                    <span className="font-medium">৳{result.fixedOverhead}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span className="text-gray-900">BDT Cost:</span>
                    <span className="text-green-600">৳{result.subtotalBDT?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Step 3 - Final CFR Calculation */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Step 3 - Final CFR Cost Calculation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">1. Convert to USD:</span>
                    <span className="font-medium">৳{result.subtotalBDT?.toFixed(2)} ÷ {constants.usd_rate} = ${result.usdCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">2. + Freight:</span>
                    <span className="font-medium">${result.freightCostUSD?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">3. + Insurance:</span>
                    <span className="font-medium">${result.insuranceCostUSD?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Gross CFR:</span>
                    <span className="font-medium text-purple-600">${result.grossCFR?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">4. - Subsidy:</span>
                    <span className="font-medium">${result.subsidyAmount?.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between border-t pt-2 text-lg font-bold ${isCorrectResult ? 'bg-green-100 p-2 rounded' : ''}`}>
                    <span className="text-gray-900">Final CFR Cost:</span>
                    <span className={isCorrectResult ? 'text-green-600' : 'text-purple-600'}>
                      ${result.finalCFRCostUSD?.toFixed(2)}
                      {isCorrectResult && ' ✅'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CORRECTED USD Cost Summary */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">✅ CORRECTED USD Cost Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">BDT Cost:</span>
                    <span className="font-medium">৳{totalBDTCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">USD Rate:</span>
                    <span className="font-medium">{constants.usd_rate}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span className="text-gray-900">Total USD:</span>
                    <span className="text-orange-600">${totalUSDCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900">Unit USD:</span>
                    <span className="text-orange-600">${unitUSDCost.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-orange-700 mt-2 p-2 bg-orange-100 rounded">
                    <strong>Formula:</strong> Total USD = {totalBDTCost.toFixed(2)} ÷ {constants.usd_rate} = ${totalUSDCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Example Verification:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>BDT Cost:</strong> 1617.67</p>
                  <p><strong>USD Rate:</strong> 122</p>
                  <p><strong>Freight:</strong> $0.20</p>
                  <p><strong>Insurance:</strong> $0.15</p>
                  <p><strong>Subsidy Cap:</strong> $0.80</p>
                  <p className="border-t pt-2"><strong>Expected Final CFR:</strong> <span className="font-bold text-green-600">$12.81</span></p>
                  <p><strong>Your Result:</strong> <span className={`font-bold ${isCorrectResult ? 'text-green-600' : 'text-red-600'}`}>${result.finalCFRCostUSD?.toFixed(2)}</span></p>
                  <p className="border-t pt-2"><strong>Expected Total USD:</strong> <span className="font-bold text-orange-600">$13.26</span></p>
                  <p><strong>Your Total USD:</strong> <span className="font-bold text-orange-600">${totalUSDCost.toFixed(2)}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}