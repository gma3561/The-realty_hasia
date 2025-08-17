-- Supabase 테이블 생성 쿼리
-- 더부동산 매물관리시스템

-- 기존 테이블 삭제 (필요한 경우)
DROP TABLE IF EXISTS properties CASCADE;

-- 매물 정보 테이블 생성
CREATE TABLE properties (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- 기본 정보
  register_date DATE NOT NULL,
  shared BOOLEAN DEFAULT false,
  manager VARCHAR(100),
  status VARCHAR(50) CHECK (status IN ('거래완료', '거래가능', '매물검토', '매물철회', '확인필요')),
  re_register_reason TEXT,
  
  -- 매물 정보
  property_type VARCHAR(50) CHECK (property_type IN ('아파트', '빌라/연립', '단독주택', '오피스텔', '상가', '타운하우스')),
  property_name VARCHAR(200) NOT NULL,
  dong VARCHAR(50),
  ho VARCHAR(50),
  address TEXT,
  
  -- 거래 정보
  trade_type VARCHAR(50) CHECK (trade_type IN ('매매', '전세', '월세', '렌트')),
  price VARCHAR(100),
  
  -- 면적 정보
  supply_area_sqm VARCHAR(100),
  supply_area_pyeong VARCHAR(100),
  floor_current VARCHAR(50),
  floor_total VARCHAR(50),
  
  -- 구조 정보
  rooms VARCHAR(50),
  direction VARCHAR(50),
  
  -- 관리 정보
  management_fee VARCHAR(100),
  parking VARCHAR(100),
  move_in_date DATE,
  approval_date DATE,
  
  -- 추가 정보
  special_notes TEXT,
  manager_memo TEXT,
  
  -- 거래 완료 정보
  completion_date DATE,
  resident VARCHAR(50) CHECK (resident IN ('소유주', '임차인', '공실', NULL)),
  lease_type VARCHAR(50),
  lease_amount VARCHAR(100),
  contract_period VARCHAR(100),
  
  -- 미디어
  photos TEXT[],
  videos TEXT[],
  
  -- 광고/공동중개
  ad_status VARCHAR(50),
  ad_period VARCHAR(100),
  joint_brokerage VARCHAR(200),
  joint_contact VARCHAR(50),
  
  -- 임시/등록 번호
  temp_number VARCHAR(50),
  registration_number VARCHAR(50),
  
  -- 소유자 정보
  owner_name VARCHAR(100),
  owner_id VARCHAR(50),
  owner_contact VARCHAR(50),
  contact_relation VARCHAR(50)
);

-- 인덱스 생성
CREATE INDEX idx_properties_register_date ON properties(register_date DESC);
CREATE INDEX idx_properties_manager ON properties(manager);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_trade_type ON properties(trade_type);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE
    ON properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 모든 사용자 읽기 허용
CREATE POLICY "Enable read access for all users" ON properties
    FOR SELECT USING (true);

-- 모든 사용자 쓰기 허용 (개발 단계, 프로덕션에서는 인증 추가 필요)
CREATE POLICY "Enable insert for all users" ON properties
    FOR INSERT WITH CHECK (true);

-- 모든 사용자 업데이트 허용 (개발 단계)
CREATE POLICY "Enable update for all users" ON properties
    FOR UPDATE USING (true) WITH CHECK (true);

-- 모든 사용자 삭제 허용 (개발 단계)
CREATE POLICY "Enable delete for all users" ON properties
    FOR DELETE USING (true);

-- 샘플 데이터 삽입 (선택사항)
INSERT INTO properties (
    register_date, manager, status, property_type, property_name,
    dong, ho, address, trade_type, price, supply_area_sqm, supply_area_pyeong,
    floor_current, floor_total, rooms, direction, parking, special_notes
) VALUES 
(
    '2024-01-15', '박소현', '거래가능', '아파트', '래미안 강남',
    '101', '1502', '강남구 대치동 123', '매매', '35억',
    '120/100', '36.3/30.25', '15', '25', '4/2', '남향', '2대',
    '역세권, 학군 우수, 리모델링 완료'
),
(
    '2024-01-20', '정윤식', '거래완료', '빌라/연립', '청담빌라',
    NULL, '301', '강남구 청담동 456', '전세', '15억',
    '85/70', '25.7/21.2', '3', '5', '3/2', '동향', '1대',
    '한강뷰, 올수리, 즉시입주 가능'
),
(
    '2024-02-01', '박소현', '매물검토', '오피스텔', '갤러리아 포레',
    'A', '2103', '강남구 역삼동 789', '월세', '5000/300',
    '45/35', '13.6/10.6', '21', '30', '1/1', '서향', '1대',
    '풀옵션, 신축, 역세권'
);

-- 테이블 생성 확인
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'properties'
ORDER BY 
    ordinal_position;