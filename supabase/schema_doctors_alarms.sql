-- =========================================================================
-- NeuroNexus ICU: Doctor Management & Critical Patient Telemetry Schema
-- =========================================================================

-- 1. Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL DEFAULT 'Critical Care Medicine',
    phone TEXT DEFAULT '+1 (555) 019-2834',
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ON_CALL' CHECK (status IN ('ON_CALL', 'IN_SURGERY', 'OFF_DUTY')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and public policies for doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to doctors" 
    ON public.doctors FOR SELECT USING (true);

CREATE POLICY "Allow public insert to doctors" 
    ON public.doctors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to doctors" 
    ON public.doctors FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to doctors" 
    ON public.doctors FOR DELETE USING (true);

-- 2. Update patients table to support assigned doctor
ALTER TABLE public.patients 
    ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_doctor_name TEXT DEFAULT 'Dr. Evelyn Reed';

-- 3. Seed initial primary on-call critical care physicians
INSERT INTO public.doctors (name, specialization, phone, email, status)
VALUES 
    ('Dr. Evelyn Reed', 'Chief of Critical Care & Cardiology', '+1 (555) 234-5678', 'evelyn.reed@srm.hosp', 'ON_CALL'),
    ('Dr. Marcus Vance', 'Trauma Surgery & Resuscitation', '+1 (555) 345-6789', 'marcus.vance@srm.hosp', 'IN_SURGERY'),
    ('Dr. Sarah Chen', 'Pulmonary Critical Care & ARDS', '+1 (555) 456-7890', 'sarah.chen@srm.hosp', 'ON_CALL'),
    ('Dr. Ben Carter', 'Neurocritical Care Specialist', '+1 (555) 567-8901', 'ben.carter@srm.hosp', 'OFF_DUTY')
ON CONFLICT (email) DO NOTHING;
