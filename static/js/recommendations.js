/**
 * SPARK - Energy Saving Recommendation Engine
 * Evaluates household appliance usage profiles against empirical benchmarks
 * and generates actionable advice with customized Rupee savings estimates.
 */

const RECOMMENDATION_THRESHOLDS = {
  acHours: 2.0,                  // Threshold for Air Conditioner runtime (hours/day)
  fanHours: 18.0,                // Threshold for Ceiling Fan runtime (hours/day)
  tvHours: 15.0,                 // Threshold for Television runtime (hours/day)
  monitorHours: 6.0,             // Threshold for Computer Monitor runtime (hours/day)
  fridgeHours: 22.0,             // Threshold for Refrigerator continuous runtime (hours/day)
  overallConsumptionHours: 600.0 // Threshold for top quartile alert (MonthlyHours)
};

const SPARK_RECOMMENDATIONS = (function() {
  /**
   * Generates tailored recommendations based on household inputs & prediction result
   */
  function generateRecommendations(inputData, predictionResult) {
    const recommendations = [];
    const tariff = predictionResult.tariff || 8.4;
    const fan = parseFloat(inputData.fan) || 0;
    const fridge = parseFloat(inputData.refrigerator) || 0;
    const ac = parseFloat(inputData.air_conditioner) || 0;
    const tv = parseFloat(inputData.television) || 0;
    const monitor = parseFloat(inputData.monitor) || 0;
    const predictedHours = predictionResult.predicted_hours || 515;

    // 1. Air Conditioner Optimization (High Impact)
    if (ac >= RECOMMENDATION_THRESHOLDS.acHours) {
      const reducedHours = 1.0; // saving 1 hour per day
      const kwhSaved = Math.round(reducedHours * 1.5 * 30); // 1.5 kW * 30 days
      const rupeeSaved = Math.round(kwhSaved * tariff);
      recommendations.push({
        id: 'ac_optimize',
        category: 'Cooling',
        priority: 'high',
        icon: 'fa-snowflake',
        title: 'Optimize Air Conditioner Temperature & Schedule',
        description: `Your AC runs for ${ac} hrs/day (1,500W load). Setting your thermostat to BEE-recommended 24°C instead of 18–20°C and setting a 1-hour sleep timer can curtail heavy compressor load without sacrificing comfort.`,
        action: 'Raise thermostat to 24°C & reduce runtime by 1 hour daily',
        kwhSaved: kwhSaved,
        rupeeSaved: rupeeSaved
      });
    }

    // 2. Ceiling Fan BLDC Upgrade or Idle Reduction
    if (fan >= RECOMMENDATION_THRESHOLDS.fanHours) {
      const hoursToCut = Math.max(2, Math.round(fan - 14));
      // Reducing 2-4 hrs idle fan or switching to 28W BLDC (saving 47W per hour for 14h)
      const kwhSaved = Math.round(((45 * fan * 30) / 1000));
      const rupeeSaved = Math.round(kwhSaved * tariff);
      recommendations.push({
        id: 'fan_bldc',
        category: 'Air Circulation',
        priority: 'medium',
        icon: 'fa-fan',
        title: 'Upgrade to 5-Star BLDC Ceiling Fans',
        description: `Fans operate ${fan} hrs/day. Standard induction fans consume ~75W, while Brushless DC (BLDC) fans consume just 28W at peak speed, slashing motor wattage by over 60%.`,
        action: 'Switch to BEE 5-Star BLDC fans or turn off in unoccupied rooms',
        kwhSaved: kwhSaved,
        rupeeSaved: rupeeSaved
      });
    }

    // 3. Television & Entertainment Standby Parasitic Load
    if (tv >= RECOMMENDATION_THRESHOLDS.tvHours) {
      const kwhSaved = Math.round((2 * 0.1 * 30)); // 2 hrs reduction
      const rupeeSaved = Math.round(kwhSaved * tariff);
      recommendations.push({
        id: 'tv_standby',
        category: 'Electronics',
        priority: 'medium',
        icon: 'fa-tv',
        title: 'Mitigate TV Standby & Screen Brightness',
        description: `Television is active for ${tv} hrs/day. Smart TVs and connected set-top boxes draw 15–25W continuous phantom standby power even when idle.`,
        action: 'Use a master switchboard to cut phantom standby power completely',
        kwhSaved: kwhSaved,
        rupeeSaved: rupeeSaved
      });
    }

    // 4. Computer Monitor Sleep Mode & Brightness
    if (monitor >= RECOMMENDATION_THRESHOLDS.monitorHours) {
      const kwhSaved = Math.round((2 * 0.03 * 30));
      const rupeeSaved = Math.round(kwhSaved * tariff);
      recommendations.push({
        id: 'monitor_power',
        category: 'Home Office',
        priority: 'low',
        icon: 'fa-desktop',
        title: 'Configure OS Auto-Display Sleep Timer',
        description: `Computer monitor operates ${monitor} hrs/day. Configuring aggressive OS display sleep (after 10 mins idle) prevents display backlights from drawing power during breaks.`,
        action: 'Set PC display timeout to 10 minutes and activate Eco brightness mode',
        kwhSaved: kwhSaved,
        rupeeSaved: rupeeSaved
      });
    }

    // 5. Refrigerator Compressor Efficiency
    if (fridge >= RECOMMENDATION_THRESHOLDS.fridgeHours) {
      const kwhSaved = Math.round((0.15 * 2 * 30)); // savings from defrosting and door seal
      const rupeeSaved = Math.round(kwhSaved * tariff);
      recommendations.push({
        id: 'fridge_efficiency',
        category: 'Refrigeration',
        priority: 'medium',
        icon: 'fa-temperature-low',
        title: 'Refrigerator Seal & Defrost Maintenance',
        description: `Refrigerator operates continuously (${fridge} hrs/day). Dust accumulation on rear condenser coils and loose door gaskets force the compressor to cycle 25% more frequently.`,
        action: 'Clean rear coils, inspect rubber gasket seals, and avoid placing hot food inside',
        kwhSaved: kwhSaved,
        rupeeSaved: rupeeSaved
      });
    }

    // 6. Overall High Consumption Alert (Top Quartile > 600 Hours)
    if (predictedHours >= RECOMMENDATION_THRESHOLDS.overallConsumptionHours) {
      const potentialReductionKwh = Math.round((predictedHours - 515) * 0.4);
      const potentialRupeeSaved = Math.round(potentialReductionKwh * tariff);
      recommendations.unshift({
        id: 'high_consumption_alert',
        category: 'Critical Alert',
        priority: 'critical',
        icon: 'fa-bolt',
        title: 'Household in Upper Quartile (> 600 Units)',
        description: `Your predicted consumption of ${predictedHours} hours places your household in the highest 25% of energy users in ${inputData.city || 'your area'}. High slab tariffs may apply.`,
        action: 'Audit simultaneous appliance runtime and shift heavy loads off peak hours',
        kwhSaved: potentialReductionKwh,
        rupeeSaved: potentialRupeeSaved
      });
    }

    // Always ensure at least 2 beneficial tips even for low users
    if (recommendations.length < 2) {
      recommendations.push({
        id: 'star_rating_appliances',
        category: 'General Efficiency',
        priority: 'low',
        icon: 'fa-award',
        title: 'Opt for BEE 5-Star Rated Appliances',
        description: 'Your consumption is already well-managed! When replacing legacy household equipment, look for the Bureau of Energy Efficiency (BEE) 5-star label for maximum lifetime savings.',
        action: 'Check star ratings on upcoming purchases',
        kwhSaved: 25,
        rupeeSaved: Math.round(25 * tariff)
      });
      recommendations.push({
        id: 'solar_rooftop',
        category: 'Renewables',
        priority: 'low',
        icon: 'fa-solar-panel',
        title: 'Explore PM Surya Ghar Muft Bijli Yojana',
        description: 'Rooftop solar installations under government subsidy schemes can offset daytime residential baseline consumption by up to 80%.',
        action: 'Review DISCOM net-metering eligibility',
        kwhSaved: 120,
        rupeeSaved: Math.round(120 * tariff)
      });
    }

    return recommendations;
  }

  return {
    generateRecommendations,
    RECOMMENDATION_THRESHOLDS
  };
})();
