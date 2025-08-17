-- Supabase 스키마 제약 조건 수정
-- properties_status_check 제약 조건을 더 유연하게 변경하고 VARCHAR 길이 제한 해제

-- 1. 기존 상태 체크 제약 조건 제거
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;

-- 2. 새로운 유연한 상태 체크 제약 조건 추가 (더 많은 상태 허용)
ALTER TABLE properties ADD CONSTRAINT properties_status_check 
CHECK (status IN (
    '거래가능', '거래완료', '거래보류', '거래철회', '확인필요',
    '매물철회', '보류', '완료', '가능', '대기중', '검토중',
    '협의중', '진행중', '중단', '취소', '연기', '임시보류'
));

-- 3. VARCHAR 길이 제한을 TEXT로 변경하여 길이 제한 해제
ALTER TABLE properties 
ALTER COLUMN property_name TYPE TEXT,
ALTER COLUMN address TYPE TEXT,
ALTER COLUMN dong TYPE TEXT,
ALTER COLUMN ho TYPE TEXT,
ALTER COLUMN price TYPE TEXT,
ALTER COLUMN supply_area_sqm TYPE TEXT,
ALTER COLUMN supply_area_pyeong TYPE TEXT,
ALTER COLUMN floor_current TYPE TEXT,
ALTER COLUMN rooms TYPE TEXT,
ALTER COLUMN direction TYPE TEXT,
ALTER COLUMN management_fee TYPE TEXT,
ALTER COLUMN parking TYPE TEXT,
ALTER COLUMN owner_name TYPE TEXT,
ALTER COLUMN owner_id TYPE TEXT,
ALTER COLUMN owner_contact TYPE TEXT,
ALTER COLUMN contact_relation TYPE TEXT,
ALTER COLUMN resident TYPE TEXT,
ALTER COLUMN rent_type TYPE TEXT,
ALTER COLUMN rent_amount TYPE TEXT,
ALTER COLUMN contract_period TYPE TEXT,
ALTER COLUMN joint_brokerage TYPE TEXT,
ALTER COLUMN joint_contact TYPE TEXT,
ALTER COLUMN ad_status TYPE TEXT,
ALTER COLUMN ad_period TYPE TEXT,
ALTER COLUMN registration_number TYPE TEXT,
ALTER COLUMN manager TYPE TEXT,
ALTER COLUMN property_type TYPE TEXT,
ALTER COLUMN trade_type TYPE TEXT,
ALTER COLUMN re_register_reason TYPE TEXT;