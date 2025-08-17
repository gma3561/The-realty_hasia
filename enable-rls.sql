-- RLS 다시 활성화
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 정책
CREATE POLICY "Allow all operations" 
ON properties 
FOR ALL 
USING (true)
WITH CHECK (true);