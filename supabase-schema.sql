-- 더부동산 매물관리시스템 Supabase 스키마
-- 실행 순서: 1. 테이블 생성 → 2. 함수 생성 → 3. 트리거 생성 → 4. RLS 정책 → 5. 실시간 구독

-- ============================================
-- 1. 확장 기능 활성화
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. 사용자 관리 테이블
-- ============================================

-- 사용자 프로필 테이블 (Supabase Auth와 연동)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 매물번호 시퀀스 테이블
-- ============================================

-- 일별 매물번호 시퀀스
CREATE TABLE daily_property_sequence (
    date_key DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    last_sequence INTEGER DEFAULT 0
);

-- 매물번호 생성 함수
CREATE OR REPLACE FUNCTION generate_property_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    today DATE := CURRENT_DATE;
    sequence_num INTEGER;
    formatted_date VARCHAR(8);
    property_number VARCHAR(20);
BEGIN
    -- 날짜를 YYYYMMDD 형식으로 변환
    formatted_date := TO_CHAR(today, 'YYYYMMDD');
    
    -- 해당 날짜의 시퀀스 업데이트 또는 생성
    INSERT INTO daily_property_sequence (date_key, last_sequence)
    VALUES (today, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET last_sequence = daily_property_sequence.last_sequence + 1
    RETURNING last_sequence INTO sequence_num;
    
    -- 매물번호 생성: YYYYMMDD + 3자리 시퀀스
    property_number := formatted_date || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN property_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 매물 마스터 테이블
-- ============================================

CREATE TABLE properties (
    -- 기본 키
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_number VARCHAR(20) UNIQUE NOT NULL DEFAULT generate_property_number(),
    
    -- 기본 정보
    property_name VARCHAR(200),
    property_type VARCHAR(50),
    trade_type VARCHAR(50),
    status VARCHAR(20) DEFAULT '거래가능' CHECK (status IN ('거래가능', '거래완료', '거래보류', '거래철회', '삭제됨')),
    
    -- 위치 정보
    address TEXT,
    dong VARCHAR(50),
    ho VARCHAR(50),
    
    -- 거래 정보
    price VARCHAR(100),
    
    -- 면적 정보
    supply_area_sqm VARCHAR(50),
    supply_area_pyeong VARCHAR(50),
    floor_current VARCHAR(10),
    floor_total VARCHAR(10),
    rooms VARCHAR(50),
    direction VARCHAR(50),
    
    -- 추가 정보
    management_fee VARCHAR(100),
    parking VARCHAR(100),
    move_in_date DATE,
    approval_date DATE,
    
    -- 소유자 정보
    owner_name VARCHAR(100),
    owner_id VARCHAR(50),
    owner_contact VARCHAR(50),
    contact_relation VARCHAR(50),
    
    -- 거래 완료 정보
    completion_date DATE,
    resident VARCHAR(100),
    rent_type VARCHAR(50),
    rent_amount VARCHAR(100),
    contract_period VARCHAR(50),
    
    -- 광고/공동중개 정보
    has_photo BOOLEAN DEFAULT false,
    has_video BOOLEAN DEFAULT false,
    has_appearance BOOLEAN DEFAULT false,
    joint_brokerage VARCHAR(200),
    joint_contact VARCHAR(100),
    ad_status VARCHAR(20),
    ad_period VARCHAR(50),
    registration_number VARCHAR(100),
    
    -- 메모
    special_notes TEXT,
    manager_memo TEXT,
    re_register_reason TEXT,
    
    -- 시스템 정보
    manager VARCHAR(100), -- 담당자명
    shared BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false, -- 소프트 삭제
    
    -- 생성/수정 정보
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    register_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 감사추적 테이블
-- ============================================

-- 매물 변경 이력 테이블
CREATE TABLE property_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    property_number VARCHAR(20) NOT NULL,
    
    -- 변경 정보
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')),
    changed_fields JSONB, -- 변경된 필드 목록
    old_values JSONB, -- 변경 전 값들
    new_values JSONB, -- 변경 후 값들
    
    -- 변경 주체
    changed_by UUID REFERENCES user_profiles(id),
    change_reason TEXT,
    
    -- 시스템 정보
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 활동 로그
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- 'property', 'user', 'system'
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 자동 타임스탬프 업데이트 함수
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- properties 테이블에 updated_at 자동 업데이트 트리거
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_profiles 테이블에 updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 감사추적 자동화 함수
-- ============================================

-- 매물 변경사항 추적 함수
CREATE OR REPLACE FUNCTION track_property_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB := '{}';
    old_vals JSONB := '{}';
    new_vals JSONB := '{}';
    field_name TEXT;
BEGIN
    -- INSERT 처리
    IF TG_OP = 'INSERT' THEN
        INSERT INTO property_audit_logs (
            property_id, property_number, action_type, 
            new_values, changed_by, created_at
        ) VALUES (
            NEW.id, NEW.property_number, 'CREATE',
            to_jsonb(NEW), NEW.created_by, NOW()
        );
        RETURN NEW;
    END IF;
    
    -- UPDATE 처리
    IF TG_OP = 'UPDATE' THEN
        -- 변경된 필드 감지
        FOR field_name IN 
            SELECT jsonb_object_keys(to_jsonb(NEW)) 
            WHERE jsonb_object_keys(to_jsonb(NEW)) != 'updated_at'
        LOOP
            IF to_jsonb(OLD) ->> field_name IS DISTINCT FROM to_jsonb(NEW) ->> field_name THEN
                changed_fields := changed_fields || jsonb_build_object(field_name, true);
                old_vals := old_vals || jsonb_build_object(field_name, to_jsonb(OLD) ->> field_name);
                new_vals := new_vals || jsonb_build_object(field_name, to_jsonb(NEW) ->> field_name);
            END IF;
        END LOOP;
        
        -- 변경사항이 있으면 로그 저장
        IF jsonb_object_keys(changed_fields) IS NOT NULL THEN
            INSERT INTO property_audit_logs (
                property_id, property_number, action_type,
                changed_fields, old_values, new_values,
                changed_by, created_at
            ) VALUES (
                NEW.id, NEW.property_number, 'UPDATE',
                changed_fields, old_vals, new_vals,
                auth.uid(), NOW()
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- DELETE 처리 (실제로는 사용하지 않지만 안전장치)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO property_audit_logs (
            property_id, property_number, action_type,
            old_values, changed_by, created_at
        ) VALUES (
            OLD.id, OLD.property_number, 'DELETE',
            to_jsonb(OLD), auth.uid(), NOW()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 매물 테이블에 감사추적 트리거 설정
CREATE TRIGGER track_property_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION track_property_changes();

-- ============================================
-- 8. RLS (Row Level Security) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 매물 테이블 정책 (삭제된 매물은 관리자만 조회 가능)
CREATE POLICY "매물 조회 정책" ON properties
    FOR SELECT USING (
        is_deleted = false OR 
        (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "매물 삽입 정책" ON properties
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "매물 업데이트 정책" ON properties
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 감사 로그는 읽기 전용 (관리자만 조회)
CREATE POLICY "감사로그 조회 정책" ON property_audit_logs
    FOR SELECT USING (
        (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- 사용자 프로필 정책
CREATE POLICY "사용자 프로필 정책" ON user_profiles
    FOR ALL USING (auth.uid() = id OR 
        (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- ============================================
-- 9. 인덱스 생성 (성능 최적화)
-- ============================================

-- 매물 테이블 인덱스
CREATE INDEX idx_properties_number ON properties(property_number);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_manager ON properties(manager);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_register_date ON properties(register_date);
CREATE INDEX idx_properties_deleted ON properties(is_deleted);
CREATE INDEX idx_properties_type_trade ON properties(property_type, trade_type);

-- 감사 로그 인덱스
CREATE INDEX idx_audit_property_id ON property_audit_logs(property_id);
CREATE INDEX idx_audit_created_at ON property_audit_logs(created_at);
CREATE INDEX idx_audit_action_type ON property_audit_logs(action_type);

-- ============================================
-- 10. 실시간 구독 활성화
-- ============================================

-- Realtime 활성화 (Supabase Dashboard에서도 설정 가능)
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE property_audit_logs;

-- ============================================
-- 11. 초기 데이터 삽입
-- ============================================

-- 관리자 사용자 생성 (실제 사용 시 Supabase Auth를 통해 생성)
-- 이 부분은 실제 사용자 등록 후 수동으로 user_profiles에 추가

-- 담당자 목록을 위한 뷰 생성
CREATE VIEW manager_list AS
SELECT DISTINCT manager 
FROM properties 
WHERE manager IS NOT NULL 
ORDER BY manager;

-- ============================================
-- 12. 유틸리티 뷰
-- ============================================

-- 활성 매물 뷰 (삭제되지 않은 매물만)
CREATE VIEW active_properties AS
SELECT * FROM properties 
WHERE is_deleted = false
ORDER BY register_date DESC, created_at DESC;

-- 매물 통계 뷰
CREATE VIEW property_statistics AS
SELECT 
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE status = '거래가능') as available_count,
    COUNT(*) FILTER (WHERE status = '거래완료') as completed_count,
    COUNT(*) FILTER (WHERE status = '거래보류') as pending_count,
    COUNT(*) FILTER (WHERE is_deleted = true) as deleted_count,
    COUNT(DISTINCT manager) as manager_count
FROM properties;

-- ============================================
-- 스키마 생성 완료
-- ============================================

-- 실행 후 확인 쿼리
SELECT 'Schema created successfully' as status;