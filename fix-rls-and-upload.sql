-- RLS 정책 삭제 및 재생성
-- user_profiles 테이블의 순환 참조 문제 해결

-- 1. 기존 RLS 정책 모두 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for all users" ON properties;
DROP POLICY IF EXISTS "Enable update for all users" ON properties;
DROP POLICY IF EXISTS "Enable delete for all users" ON properties;

DROP POLICY IF EXISTS "Enable read access for all users" ON property_audit_logs;
DROP POLICY IF EXISTS "Enable insert for system" ON property_audit_logs;

DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON user_profiles;

-- 2. RLS 비활성화 (일시적으로)
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. 간단한 RLS 정책 재생성 (순환 참조 없이)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for properties" 
ON properties 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. 감사 로그는 읽기만 허용
ALTER TABLE property_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for audit logs" 
ON property_audit_logs 
FOR SELECT 
USING (true);

-- 5. user_profiles는 나중에 처리
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;