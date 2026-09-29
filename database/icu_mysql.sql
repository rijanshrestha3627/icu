CREATE DATABASE IF NOT EXISTS neuronexus_icu;
USE neuronexus_icu;

DROP TABLE IF EXISTS icu_audit_logs;
DROP TABLE IF EXISTS icu_alert_signals;
DROP TABLE IF EXISTS icu_alerts;
DROP TABLE IF EXISTS icu_trajectory_points;
DROP TABLE IF EXISTS icu_raw_observations;
DROP TABLE IF EXISTS icu_patient_records;

CREATE TABLE icu_patient_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id VARCHAR(20) NOT NULL UNIQUE,
  bed_id VARCHAR(20) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(20) NOT NULL,
  icu_type VARCHAR(50) NOT NULL,
  outcome VARCHAR(30) NOT NULL,
  is_death TINYINT NOT NULL DEFAULT 0,
  total_observations INT NOT NULL DEFAULT 0,
  telemetry_duration_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  final_risk_score DECIMAL(5,4) NOT NULL DEFAULT 0,
  final_severity ENUM('LOW','MONITOR','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE icu_raw_observations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  record_id VARCHAR(20) NOT NULL,
  time_hours DECIMAL(6,2) NOT NULL,
  parameter VARCHAR(60) NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  is_valid TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (record_id) REFERENCES icu_patient_records(record_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_record_time (record_id, time_hours),
  INDEX idx_parameter (parameter)
) ENGINE=InnoDB;

CREATE TABLE icu_trajectory_points (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  record_id VARCHAR(20) NOT NULL,
  time_hours DECIMAL(6,2) NOT NULL,
  risk_score DECIMAL(5,4) NOT NULL,
  risk_percentage DECIMAL(5,2) NOT NULL,
  severity ENUM('LOW','MONITOR','HIGH','CRITICAL') NOT NULL,
  data_quality DECIMAL(5,4) NOT NULL DEFAULT 0,
  contributing_signals JSON,
  FOREIGN KEY (record_id) REFERENCES icu_patient_records(record_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_record_trajectory (record_id, time_hours)
) ENGINE=InnoDB;

CREATE TABLE icu_alerts (
  id VARCHAR(60) PRIMARY KEY,
  patient_id VARCHAR(20) NOT NULL,
  bed_id VARCHAR(20) NOT NULL,
  timestamp DATETIME NOT NULL,
  simulation_time_hours DECIMAL(6,2) DEFAULT NULL,
  severity ENUM('HIGH','CRITICAL') NOT NULL,
  risk_score DECIMAL(5,4) NOT NULL,
  confidence DECIMAL(4,3) NOT NULL,
  status ENUM('NEW','ACKNOWLEDGED','RESOLVED','SUPPRESSED') NOT NULL DEFAULT 'NEW',
  explanation TEXT NOT NULL,
  data_quality DECIMAL(5,4) NOT NULL DEFAULT 0,
  model_version VARCHAR(50) NOT NULL DEFAULT 'early-warning-v1.0',
  acknowledged_by VARCHAR(100) DEFAULT NULL,
  acknowledged_at DATETIME DEFAULT NULL,
  resolved_by VARCHAR(100) DEFAULT NULL,
  resolved_at DATETIME DEFAULT NULL,
  FOREIGN KEY (patient_id) REFERENCES icu_patient_records(record_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_alert_patient (patient_id),
  INDEX idx_alert_severity (severity),
  INDEX idx_alert_time (timestamp)
) ENGINE=InnoDB;

CREATE TABLE icu_alert_signals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  alert_id VARCHAR(60) NOT NULL,
  signal_name VARCHAR(120) NOT NULL,
  signal_value VARCHAR(120) NOT NULL,
  trend VARCHAR(80) NOT NULL,
  category VARCHAR(30) NOT NULL,
  FOREIGN KEY (alert_id) REFERENCES icu_alerts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_alert_signal (alert_id)
) ENGINE=InnoDB;

CREATE TABLE icu_audit_logs (
  id VARCHAR(60) PRIMARY KEY,
  user_id VARCHAR(120) NOT NULL,
  action ENUM('ALERT_VIEWED','ALERT_ACKNOWLEDGED','ALERT_RESOLVED','PATIENT_OPENED','PREDICTION_GENERATED','REPLAY_STARTED','REPLAY_RESET') NOT NULL,
  patient_id VARCHAR(20) NOT NULL,
  timestamp DATETIME NOT NULL,
  metadata JSON,
  FOREIGN KEY (patient_id) REFERENCES icu_patient_records(record_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_audit_patient (patient_id),
  INDEX idx_audit_time (timestamp)
) ENGINE=InnoDB;

CREATE VIEW vw_icu_patient_summary AS
SELECT
  p.record_id,
  p.bed_id,
  p.age,
  p.gender,
  p.icu_type,
  p.outcome,
  p.is_death,
  p.final_risk_score,
  p.final_severity,
  COUNT(o.id) AS total_observations,
  MAX(o.time_hours) AS observed_hours,
  MAX(t.risk_score) AS max_risk_score
FROM icu_patient_records p
LEFT JOIN icu_raw_observations o ON o.record_id = p.record_id
LEFT JOIN icu_trajectory_points t ON t.record_id = p.record_id
GROUP BY p.record_id, p.bed_id, p.age, p.gender, p.icu_type, p.outcome, p.is_death, p.final_risk_score, p.final_severity;

-- Example insert template for records.
-- Use this only as a template. For production, load from your exported JSON data.
INSERT INTO icu_patient_records (
  record_id, bed_id, age, gender, icu_type, outcome, is_death,
  total_observations, telemetry_duration_hours, final_risk_score, final_severity
) VALUES
  ('132588', 'ICU-12A', 64, 'Male', 'Cardiac ICU', 'Died', 1, 431, 48.00, 0.82, 'CRITICAL'),
  ('132539', 'ICU-08B', 52, 'Female', 'Medical ICU', 'Discharged', 0, 402, 47.80, 0.18, 'LOW');

-- Small demo telemetry sample. Replace or extend this with the full exported dataset as needed.
INSERT INTO icu_raw_observations (
  record_id, time_hours, parameter, value, is_valid
) VALUES
  ('132588', 2.00, 'heart_rate', 96, 1),
  ('132588', 2.00, 'map', 78, 1),
  ('132588', 2.00, 'respiratory_rate', 20, 1),
  ('132588', 2.00, 'spo2', 96, 1),
  ('132588', 12.00, 'heart_rate', 108, 1),
  ('132588', 12.00, 'map', 70, 1),
  ('132588', 24.00, 'heart_rate', 121, 1),
  ('132588', 24.00, 'map', 64, 1),
  ('132588', 24.00, 'lactate', 3.2, 1),
  ('132588', 34.00, 'heart_rate', 132, 1),
  ('132588', 34.00, 'map', 58, 1),
  ('132588', 34.00, 'lactate', 5.1, 1),
  ('132539', 8.00, 'heart_rate', 76, 1),
  ('132539', 8.00, 'map', 88, 1),
  ('132539', 8.00, 'spo2', 98, 1),
  ('132539', 24.00, 'heart_rate', 72, 1),
  ('132539', 24.00, 'map', 91, 1),
  ('132539', 24.00, 'spo2', 99, 1);

INSERT INTO icu_trajectory_points (
  record_id, time_hours, risk_score, risk_percentage, severity, data_quality, contributing_signals
) VALUES
  ('132588', 2.00, 0.18, 18.00, 'LOW', 0.88, JSON_ARRAY('HR elevation', 'MAP decline')),
  ('132588', 12.00, 0.42, 42.00, 'MONITOR', 0.84, JSON_ARRAY('HR elevation', 'MAP decline', 'respiratory stress')),
  ('132588', 24.00, 0.68, 68.00, 'HIGH', 0.81, JSON_ARRAY('HR elevation', 'MAP decline', 'lactate elevation')),
  ('132588', 34.00, 0.82, 82.00, 'CRITICAL', 0.88, JSON_ARRAY('HR elevation', 'MAP decline', 'lactate elevation', 'neurological deterioration')),
  ('132539', 8.00, 0.09, 9.00, 'LOW', 0.90, JSON_ARRAY('stable hemodynamics')),
  ('132539', 24.00, 0.12, 12.00, 'LOW', 0.92, JSON_ARRAY('stable hemodynamics', 'normal oxygenation'));

INSERT INTO icu_alerts (
  id, patient_id, bed_id, timestamp, simulation_time_hours, severity, risk_score, confidence,
  status, explanation, data_quality, model_version
) VALUES
  ('ALT-132588-T340', '132588', 'ICU-12A', NOW(), 34.00, 'CRITICAL', 0.82, 0.93, 'NEW',
   'Patient reached critical deterioration risk during telemetry replay. Primary drivers were HR elevation, MAP decline, and lactate trajectory.',
   0.88, 'early-warning-v1.0'),
  ('ALT-132539-T240', '132539', 'ICU-08B', NOW(), 24.00, 'HIGH', 0.12, 0.72, 'RESOLVED',
   'Patient remained clinically stable and no sustained escalation was detected.',
   0.92, 'early-warning-v1.0');

INSERT INTO icu_alert_signals (
  alert_id, signal_name, signal_value, trend, category
) VALUES
  ('ALT-132588-T340', 'HR', 'Elevated', '↑ Escalating trend', 'Hemodynamic'),
  ('ALT-132588-T340', 'MAP', 'Declining', '↓ Declining trend', 'Hemodynamic'),
  ('ALT-132588-T340', 'Lactate', 'High', '↑ Elevated trend', 'Metabolic');

INSERT INTO icu_audit_logs (
  id, user_id, action, patient_id, timestamp, metadata
) VALUES
  ('AUD-1', 'Early Warning Engine (ML)', 'PREDICTION_GENERATED', '132588', NOW(), JSON_OBJECT('severity', 'CRITICAL', 'riskScore', 0.82)),
  ('AUD-2', 'Dr. Evelyn Reed (Attending)', 'ALERT_ACKNOWLEDGED', '132588', NOW(), JSON_OBJECT('alertId', 'ALT-132588-T340', 'bedId', 'ICU-12A'));

-- Useful queries:
-- SELECT * FROM icu_patient_records;
-- SELECT * FROM icu_trajectory_points WHERE record_id = '132588' ORDER BY time_hours;
-- SELECT * FROM icu_alerts WHERE severity = 'CRITICAL';
-- SELECT * FROM vw_icu_patient_summary;

-- To import from local CSV files:
-- LOAD DATA LOCAL INFILE '/path/to/icu_raw_observations.csv'
-- INTO TABLE icu_raw_observations (record_id, time_hours, parameter, value, is_valid);
