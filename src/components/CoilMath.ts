import { CoilInputs, CoilCalculationResults, MATERIALS } from '../types';

export const MU_0 = 4 * Math.PI * 1e-7; // T * m / A (magnetic permeability of vacuum)

/**
 * Calculates the geometry, electrical properties, and magnetic properties of a wound coil.
 * Supports tight multi-layer winding or sparse single-layer winding when wire is too short.
 */
export function calculateCoil(inputs: CoilInputs): CoilCalculationResults {
  const { wireLength: L, wireDiameter: d, frameDiameter: D, frameLength: l, current: I, material: matId } = inputs;

  // Convert inputs to SI units (meters)
  const d_m = d * 1e-3;
  const D_m = D * 1e-3;
  const l_m = l * 1e-3;

  const mat = MATERIALS.find(m => m.id === matId) || MATERIALS[0];

  // 1. Calculate physical maximum length for a tight single layer
  // A tight single layer uses: L = N_row * pi * (D + d) = (l / d) * pi * (D + d)
  // Therefore, the maximum length that can be fully wound with a single tight layer is:
  const l_phys_max = (L * d_m) / (Math.PI * (D_m + d_m));

  let layers = 0;
  let totalTurns = 0;
  let outerDiameter = 0;
  let windingThickness = 0;
  let isSparse = false;

  if (l_m <= l_phys_max) {
    // Tightly wound coil (multi-layer, k >= 1)
    // Solve the quadratic equation for k layers:
    // d_m * k^2 + D_m * k - (L * d_m) / (pi * l_m) = 0
    const a = d_m;
    const b = D_m;
    const c = -(L * d_m) / (Math.PI * l_m);

    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      layers = (-b + Math.sqrt(discriminant)) / (2 * a);
    } else {
      layers = 1; // fallback
    }

    windingThickness = layers * d_m;
    outerDiameter = D_m + 2 * windingThickness;
    totalTurns = layers * (l_m / d_m);
  } else {
    // Sparse single-layer coil (k < 1 layer, wound uniformly over length l_m)
    isSparse = true;
    layers = L / (Math.PI * (D_m + d_m) * (l_m / d_m)); // average layers (fractional)
    
    // Total turns is limited by wire length:
    // L = N_total * pi * (D + d)  =>  N_total = L / [pi * (D + d)]
    totalTurns = L / (Math.PI * (D_m + d_m));
    windingThickness = d_m;
    outerDiameter = D_m + 2 * d_m;
  }

  // Winding division for visual animations
  const layersInt = Math.floor(layers);
  const layersFrac = layers - layersInt;
  const turnsPerLayer = isSparse ? totalTurns : (l_m / d_m);

  // Mean radius (a_m) and diameters (m)
  const meanDiameter = D_m + windingThickness;
  const meanRadius = meanDiameter / 2;

  // 2. Electrical calculations
  const wireCrossSection = (Math.PI * d_m * d_m) / 4;
  const resistance = mat.resistivity * (L / wireCrossSection);
  const voltage = I * resistance;
  const power = I * I * resistance;
  
  // Wire mass: Volume * Density
  const wireVolume = L * wireCrossSection;
  const mass = wireVolume * mat.density;

  // 3. Magnetic field continuous calculation
  // Continuous integral for multi-layer coil field B at center:
  // B = (mu_0 * l_m * I) / (2 * d_m^2) * ln( (D_outer + sqrt(l_m^2 + D_outer^2)) / (D_inner + sqrt(l_m^2 + D_inner^2)) )
  let magneticFieldContinuous = 0;
  if (!isSparse && l_m > 0 && d_m > 0) {
    const num = outerDiameter + Math.sqrt(l_m * l_m + outerDiameter * outerDiameter);
    const den = D_m + Math.sqrt(l_m * l_m + D_m * D_m);
    magneticFieldContinuous = ((MU_0 * l_m * I) / (2 * d_m * d_m)) * Math.log(num / den);
  } else if (l_m > 0) {
    // Single layer sparse solenoid formula
    magneticFieldContinuous = (MU_0 * totalTurns * I) / Math.sqrt(l_m * l_m + meanDiameter * meanDiameter);
  }

  // 4. Inductance (Wheeler Multi-layer Formula)
  // L_ind (uH) = (31.5 * a^2 * N^2) / (6*a + 9*l + 10*h), where physical dimensions are in meters.
  // L_ind (H) = (3.15e-5 * a^2 * N^2) / (6*a + 9*l + 10*h)
  let inductanceH = 0;
  if (totalTurns > 0) {
    const a = meanRadius; // mean radius in meters
    const l_coil = l_m;   // coil length in meters
    const h = windingThickness; // winding depth in meters
    
    // Avoid division by zero
    const denom = 6 * a + 9 * l_coil + 10 * h;
    if (denom > 0) {
      inductanceH = (3.15e-5 * a * a * totalTurns * totalTurns) / denom;
    }
  }

  return {
    lengthM: l_m,
    diameterM: meanDiameter,
    wireDiameterM: d_m,
    frameDiameterM: D_m,
    layers,
    layersInt,
    layersFrac,
    turnsPerLayer,
    totalTurns,
    outerDiameter,
    meanDiameter,
    meanRadius,
    windingThickness,
    resistance,
    voltage,
    power,
    mass,
    magneticFieldContinuous,
    inductanceH
  };
}

/**
 * Sweeps the frame length l over a range to find where the magnetic field is maximized,
 * and builds a list of points for the chart.
 */
export function getFieldSweepData(inputs: CoilInputs, pointsCount = 100) {
  const d_m = inputs.wireDiameter * 1e-3;
  const D_m = inputs.frameDiameter * 1e-3;
  
  // Physical maximum length for 1 layer tight pack
  const l_phys_max = (inputs.wireLength * d_m) / (Math.PI * (D_m + d_m));

  // Determine the sweep range of length (in mm)
  // We want to sweep from a minimum of 1.5 wire diameters up to a reasonably large value.
  const minL = inputs.wireDiameter * 1.5;
  
  // Let the maximum sweep length be the larger of 4x the optimal, or 1.5x the current length, capped nicely
  // We will run a quick preliminary numerical search to locate the peak first
  let tempOptimalL = minL;
  let maxField = -1;
  
  // Scan 100 points to find rough optimal
  const scanLimit = Math.max(l_phys_max * 1000, inputs.frameLength * 2.5, 300); // scan up to 300mm or more
  const step = scanLimit / 100;
  for (let i = 1; i <= 100; i++) {
    const tempL = minL + i * step;
    const res = calculateCoil({ ...inputs, frameLength: tempL });
    if (res.magneticFieldContinuous > maxField) {
      maxField = res.magneticFieldContinuous;
      tempOptimalL = tempL;
    }
  }

  // Choose chart limits based on optimal L and active L
  const chartMaxL = Math.max(tempOptimalL * 2.2, inputs.frameLength * 1.5, 50); // at least 50mm
  const chartMinL = minL;

  const sweepPoints: { l: number; B: number; B_mT: number; L_uH: number; layers: number }[] = [];
  let optimalLength = tempOptimalL;
  let exactMaxField = maxField;

  // Now calculate clean, evenly spaced sweep points
  for (let i = 0; i < pointsCount; i++) {
    const fraction = i / (pointsCount - 1);
    const tempL = chartMinL + fraction * (chartMaxL - chartMinL);
    const res = calculateCoil({ ...inputs, frameLength: tempL });
    
    sweepPoints.push({
      l: tempL,
      B: res.magneticFieldContinuous,
      B_mT: res.magneticFieldContinuous * 1000, // converted to mT
      L_uH: res.inductanceH * 1e6, // converted to uH
      layers: res.layers,
    });
  }

  // Refine biological peak using bisection search or high-res scan
  let low = chartMinL;
  let high = chartMaxL;
  // Simple golden section search to find exact optimal frameLength (l_opt)
  const gr = (Math.sqrt(5) + 1) / 2;
  for (let iter = 0; iter < 30; iter++) {
    const l1 = high - (high - low) / gr;
    const l2 = low + (high - low) / gr;
    const f1 = calculateCoil({ ...inputs, frameLength: l1 }).magneticFieldContinuous;
    const f2 = calculateCoil({ ...inputs, frameLength: l2 }).magneticFieldContinuous;
    if (f1 > f2) {
      high = l2;
    } else {
      low = l1;
    }
  }
  optimalLength = (low + high) / 2;
  exactMaxField = calculateCoil({ ...inputs, frameLength: optimalLength }).magneticFieldContinuous;

  return {
    sweepPoints,
    optimalLength,
    maxField: exactMaxField,
    chartMinL,
    chartMaxL,
    l_phys_max: l_phys_max * 1000, // back to mm
  };
}
