-- Supabase에 소프트 삭제 기능 추가
-- 1. deleted_at 컬럼 추가
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. is_deleted 계산 컬럼 추가 (deleted_at이 NULL이 아니면 true)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at);
CREATE INDEX IF NOT EXISTS idx_properties_is_deleted ON properties(is_deleted);

-- 4. 기존 '삭제됨' 상태 데이터를 소프트 삭제로 마이그레이션
UPDATE properties 
SET deleted_at = NOW() 
WHERE status = '삭제됨' AND deleted_at IS NULL;

-- 5. RLS (Row Level Security) 정책 업데이트 - 삭제된 항목은 기본적으로 표시하지 않음
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for all users" ON properties;
DROP POLICY IF EXISTS "Enable update for all users" ON properties;
DROP POLICY IF EXISTS "Enable delete for all users" ON properties;

-- 새 정책 생성
CREATE POLICY "Enable read access for non-deleted" ON properties
    FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);

CREATE POLICY "Enable insert for all users" ON properties
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON properties
    FOR UPDATE USING (true);

-- 물리적 삭제는 관리자만 가능하도록 제한 (소프트 삭제는 UPDATE로 처리)
CREATE POLICY "Enable delete for admin only" ON properties
    FOR DELETE USING (false);

-- 6. 뷰 생성 - 삭제되지 않은 매물만 보는 뷰
CREATE OR REPLACE VIEW active_properties AS
SELECT * FROM properties
WHERE is_deleted = false OR is_deleted IS NULL;

-- 7. 트리거 생성 - 삭제 시 자동으로 소프트 삭제로 변환
CREATE OR REPLACE FUNCTION soft_delete_property()
RETURNS TRIGGER AS $$
BEGIN
    -- DELETE 명령을 UPDATE로 변환
    UPDATE properties 
    SET deleted_at = NOW()
    WHERE id = OLD.id;
    -- DELETE 취소
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
DROP TRIGGER IF EXISTS trigger_soft_delete_property ON properties;
CREATE TRIGGER trigger_soft_delete_property
    BEFORE DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete_property();

-- 8. 복구 함수 생성 (삭제된 매물 복구)
CREATE OR REPLACE FUNCTION restore_property(property_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE properties 
    SET deleted_at = NULL,
        status = '거래가능'
    WHERE id = property_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 영구 삭제 함수 생성 (물리적 삭제)
CREATE OR REPLACE FUNCTION permanently_delete_property(property_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM properties WHERE id = property_id;
END;
$$ LANGUAGE plpgsql;

-- 10. 삭제된 매물 조회 함수
CREATE OR REPLACE FUNCTION get_deleted_properties()
RETURNS TABLE(
    id UUID,
    property_number TEXT,
    property_name TEXT,
    manager TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.property_number, p.property_name, p.manager, p.deleted_at
    FROM properties p
    WHERE p.is_deleted = true
    ORDER BY p.deleted_at DESC;
END;
$$ LANGUAGE plpgsql;