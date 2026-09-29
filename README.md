# NeuroNexus — Hospital Management + ICU Clinical Intelligence Platform

**AI-Assisted ICU Deterioration Anticipation & Hospital Management System**

[![Platform](https://img.shields.io/badge/Platform-React%2019%20%7C%20Vite%206%20%7C%20TypeScript-blue)](https://vitejs.dev/)
[![ML Model](https://img.shields.io/badge/Model-Calibrated%20LightGBM%20v1.0-emerald)](ml/models/)
[![Dataset](https://img.shields.io/badge/Dataset-PhysioNet%202012%20%283%2C200%20ICU%20Cohort%29-purple)](Dataset%202/train/)
[![Temporal Integrity](https://img.shields.io/badge/Temporal%20Leakage-0%25%20Verified-brightgreen)](ml/test_leakage.py)

---

## 1. Executive Summary & Problem Statement
### "The Silent Window: Anticipating Patient Deterioration in Intensive Care"
In intensive care units (ICUs), patient deterioration frequently occurs insidiously before overt physiological collapse. Physiological telemetry is notoriously:
- **Noisy & irregularly sampled**: Vital signs and laboratory tests occur at sporadic intervals with varying latencies.
- **Incomplete with sensor artifacts**: Disconnections, patient movement, and technical spikes trigger frequent false alarms.
- **Alarm Fatigue**: Up to 85–99% of hospital monitor alarms are clinically non-actionable, desensitizing clinical teams.

**NeuroNexus** transforms raw, noisy, incomplete ICU telemetry into calibrated deterioration risk trajectories and controlled, explainable early-warning signals, enabling clinicians to intervene during the crucial *silent window* before irreversible decompensation.

---

## 2. Platform Architecture
NeuroNexus unifies end-to-end hospital administration with advanced ICU clinical intelligence:

```
+-----------------------------------------------------------------------------------+
|                                    NEURONEXUS                                     |
+-----------------------------------------+-----------------------------------------+
|        HOSPITAL MANAGEMENT SUITE        |       CLINICAL INTELLIGENCE (ICU)       |
+-----------------------------------------+-----------------------------------------+
| • Patient Registration & Receptionist   | • ICU Early Warning Command Center      |
| • Doctor & Nurse Head Portals           | • Chronological Replay Simulator        |
| • Intern Triage & Assessment Queue      | • 48-Hour Risk Trajectory Forecasting   |
| • Department Portals (Cardio, Neuro...) | • Multi-Channel Physiological Telemetry |
| • Pharmacy & Digital Prescriptions      | • Model Explainability (Driving Factors)|
| • Lab Information System (LIS)          | • 4-Tier Alert Engine & Clinician Audit |
| • Ward & Bed Management                 | • Offline Benchmark & Threshold Curve   |
| • Hospital Billing, MLC, & Analytics    | • Telemetry Data Quality Engine         |
+-----------------------------------------+-----------------------------------------+
```

---

## 3. Dataset Audit & Statistics (Actual Supplied Data)
Audited programmatically via `python ml/dataset_report.py` across `Dataset 2/train/`:

- **Total Patient Telemetry Files**: 3,200
- **Total Outcomes Records**: 3,200
- **In-Hospital Deaths**: 443 (13.84%)
- **Survivors**: 2,757 (86.16%)
- **Telemetry Duration Statistics**:
  - Minimum: `0.00` hours
  - 25th Percentile (Q1): `47.23` hours
  - Median: `47.55` hours
  - 75th Percentile (Q3): `47.80` hours
  - Maximum: `48.00` hours
- **Observations Per Patient**:
  - Min: `6`
  - Median: `427`
  - Mean: `438.5`
  - Max: `1,502`
- **Tracked Clinical Parameters (37 total)**:
  - *Demographics*: `Age`, `Gender`, `Height`, `Weight`, `ICUType`
  - *Hemodynamics*: `HR`, `SysABP`, `DiasABP`, `MAP`, `NISysABP`, `NIDiasABP`, `NIMAP`, `RespRate`, `Temp`
  - *Neurological*: `GCS` (Glasgow Coma Scale)
  - *Respiratory / Blood Gas*: `FiO2`, `MechVent`, `pH`, `PaCO2`, `PaO2`, `SaO2`
  - *Renal / Metabolic*: `Urine`, `Creatinine`, `BUN`, `Glucose`, `Lactate`, `Na`, `K`, `Mg`, `HCO3`
  - *Hematology / Hepatic*: `HCT`, `WBC`, `Platelets`, `Albumin`, `ALP`, `ALT`, `AST`, `Bilirubin`
  - *Cardiac Biomarkers*: `TroponinI`, `TroponinT`, `Cholesterol`

---

## 4. Preprocessing & Chronological Feature Engineering
1. **Sentinel Value (-1) Masking**: Sentinel values like `-1` in demographic and laboratory parameters are masked to missing/NaN rather than treated as numeric values.
2. **Strict Chronological Boundary Enforcement**:
   $$\text{Features}(t) = f(\{\text{observation} \mid \text{time} \le t\})$$
   No future data from $(t, 48\text{h}]$ enters preprocessing, feature scaling, trend calculation, or imputation. Verified by automated test suite `ml/test_leakage.py`.
3. **Temporal Features Engineered (236 total per window)**:
   - Latest observed value ($x_{\text{last}}$)
   - Rolling statistics: mean, min, max, standard deviation
   - Trajectory slope / rate of change over recent 6-hour windows
   - Measurement freshness & time since last observation ($\Delta t$)
   - Composite Clinical Indices:
     - **Shock Index**: $\text{HR} / \text{SysABP}$
     - **BUN/Creatinine Ratio**: $\text{BUN} / \text{Creatinine}$
     - **GCS Neurological Decline Indicator**
     - **Metabolic Distress / Lactate Elevation Flag**

---

## 5. Model Architecture & Offline Validation Results
Trained with **Patient-Level Stratified Splitting** (70% Train, 15% Validation, 15% Test) across 480 unseen test patients and 1,904 temporal windows:

| Model Architecture | AUROC | AUPRC | Brier Score | Optimal Operating Threshold | Sensitivity (Recall) | Specificity | F1 Score |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **Baseline Logistic Regression** | 0.7911 | 0.4207 | 0.1598 | 0.48 | 75.8% | 68.2% | 0.4712 |
| **Random Forest (150 trees)** | 0.8434 | 0.4777 | 0.1186 | 0.35 | 81.8% | 71.4% | 0.5094 |
| **Calibrated LightGBM (Production)** | **0.8137** | **0.4456** | **0.0985** | **0.28** | **84.8%** | **67.8%** | **0.5287** |

### Probability Calibration
Raw model outputs are scaled via **Platt Sigmoid Calibration** (`CalibratedClassifierCV`) so that predicted risk probabilities accurately match true observed decompensation frequencies.

---

## 6. Alarm Fatigue & False Alarm Mitigation
NeuroNexus implements an intelligent **Alert Engine**:
1. **4-Tier Interface Risk States**:
   - `LOW`: $<25\%$
   - `MONITOR`: $25\% - 44\%$
   - `HIGH`: $45\% - 69\%$
   - `CRITICAL`: $\ge 70\%$
2. **Persistence Verification**: Risk must sustain above threshold across 2 consecutive time steps or demonstrate a rapid acute spike ($>0.20$ increase) to prevent false triggers from single noisy spikes.
3. **4-Hour Cooldown Logic**: Suppresses repeated alarms within 4 hours unless severity escalates from HIGH to CRITICAL.
4. **Data Quality Gating**: Alarms are suppressed and flagged as `DATA_QUALITY` warnings if telemetry latency exceeds 6 hours.
5. **Full Audit Trail**: Every alert generated, viewed, acknowledged, and resolved is timestamped and recorded with clinician ID.

---

## 7. Demo Replay Simulator Walkthrough
To demonstrate end-to-end functionality:
1. Navigate to **Clinical Intelligence (ICU)** &rarr; **Chronological Replay**.
2. Select any actual patient from the cohort (e.g., deteriorating patient `132588` or stable survivor `132539`).
3. Click **Start Replay** or step by **+15 min** / **+1 hour**.
4. Telemetry rows arrive strictly chronologically in real-time.
5. The ML engine recalculates deterioration risk at each timestep.
6. When alert conditions are met, an interactive **Critical Alert** appears in real-time with contributing driving factors and 1-click **Acknowledge** action.

---

## 8. Safety, Regulatory & Clinical Limitations Notice
- **Decision Support Prototype**: NeuroNexus is a clinical decision-support research prototype. It does not provide autonomous medical diagnosis, treatment planning, or replacement for clinician oversight.
- **Offline Benchmark Distinction**: Reported AUROC, AUPRC, and lead-time metrics reflect offline evaluation on the retrospective PhysioNet 2012 dataset. Prospective clinical validation across diverse hospital systems is required prior to live clinical deployment.
- **Non-Causal Interpretability**: Model contributing signals represent statistical feature importance (e.g. SHAP / split weights), not causal etiology.

---

## 9. Quick Start & Execution

### Prerequisites
- Node.js (v18+)
- Python (v3.10+) with `numpy`, `pandas`, `scikit-learn`, `lightgbm`, `joblib`

### Running the Web Application
```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
Open [http://localhost:3000/](http://localhost:3000/) in your browser.

### Running the Machine Learning Pipeline
```bash
# 1. Generate dataset audit report
python ml/dataset_report.py

# 2. Train, calibrate, and evaluate all models
python ml/train.py

# 3. Execute temporal leakage & data integrity test suite
python ml/test_leakage.py

# 4. Run standalone patient prediction
python ml/predict.py
```
