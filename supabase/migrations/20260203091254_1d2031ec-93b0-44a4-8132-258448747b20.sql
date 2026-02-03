-- Add verification_enabled to programs table
ALTER TABLE public.programs 
ADD COLUMN verification_enabled boolean NOT NULL DEFAULT false;

-- Add verification fields to program_registrations table
ALTER TABLE public.program_registrations 
ADD COLUMN verification_scores jsonb DEFAULT NULL,
ADD COLUMN total_score numeric DEFAULT NULL,
ADD COLUMN max_score numeric DEFAULT NULL,
ADD COLUMN percentage numeric DEFAULT NULL,
ADD COLUMN verified_by uuid DEFAULT NULL,
ADD COLUMN verified_at timestamp with time zone DEFAULT NULL,
ADD COLUMN verification_status text NOT NULL DEFAULT 'pending';

-- Add check constraint for verification_status
ALTER TABLE public.program_registrations 
ADD CONSTRAINT program_registrations_verification_status_check 
CHECK (verification_status IN ('pending', 'verified'));

-- Add RLS policy for admins to update registrations for verification
CREATE POLICY "Admins can update registrations for verification"
ON public.program_registrations
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM programs p 
    WHERE p.id = program_registrations.program_id 
    AND p.division_id = get_user_division(auth.uid())
  )
);

-- Super admin can also update registrations
CREATE POLICY "Super admin can update all registrations"
ON public.program_registrations
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));