export interface CoilInputs {
  wireLength: number;     // m (L)
  wireDiameter: number;   // mm (d)
  frameDiameter: number;  // mm (D)
  frameLength: number;    // mm (l)
  current: number;        // A (I)
  material: string;
}

export interface Material {
  id: string;
  name: string;
  nameRu: string;
  resistivity: number; // Ohm * m
  density: number;     // kg/m^3
}

export interface CoilCalculationResults {
  lengthM: number;
  diameterM: number;
  wireDiameterM: number;
  frameDiameterM: number;
  
  // Winding results
  layers: number;          // k (real list)
  layersInt: number;       // full layers count
  layersFrac: number;      // fractional part of the last layer
  turnsPerLayer: number;   // N_layer
  totalTurns: number;      // N
  outerDiameter: number;   // D_outer (m)
  meanDiameter: number;    // D_mean (m)
  meanRadius: number;      // a_m (m)
  windingThickness: number;// h (m)
  
  // Electrical results
  resistance: number;      // Ohm
  voltage: number;         // V
  power: number;           // W
  mass: number;            // kg
  
  // Magnetic results
  magneticFieldContinuous: number; // B at center in Tesla
  inductanceH: number;            // L_ind in Henries
}

export const MATERIALS: Material[] = [
  { id: 'copper', name: 'Copper', nameRu: 'Медь', resistivity: 1.72e-8, density: 8960 },
  { id: 'aluminum', name: 'Aluminum', nameRu: 'Алюминий', resistivity: 2.65e-8, density: 2700 },
  { id: 'silver', name: 'Silver', nameRu: 'Серебро', resistivity: 1.59e-8, density: 10490 },
  { id: 'gold', name: 'Gold', nameRu: 'Золото', resistivity: 2.44e-8, density: 19300 },
];
