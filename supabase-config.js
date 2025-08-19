// Supabase 설정 및 초기화
// ⚠️ 보안 개선: API 키를 config.js에서 가져옴

// config.js에서 설정 가져오기
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

// config.js 로드 시도
if (window.__CONFIG__) {
    SUPABASE_URL = window.__CONFIG__.supabase.url;
    SUPABASE_ANON_KEY = window.__CONFIG__.supabase.anonKey;
} else {
    // config.js가 없는 경우 경고
    console.error('⚠️ config.js 파일이 없습니다. config.example.js를 참고하여 config.js를 생성하세요.');
    console.warn('임시로 기본값을 사용합니다. 프로덕션에서는 반드시 config.js를 사용하세요.');
    
    // 개발용 임시값 (프로덕션에서는 사용 금지)
    SUPABASE_URL = 'https://gojajqzajzhqkhmubpql.supabase.co';
    SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvamFqcXphanpocWtobXVicHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjMwODEsImV4cCI6MjA3MDk5OTA4MX0.JPlgJpdA-xVLogQHf1A0a_9qyES8qH3lK1aOLBxXe2A';
}

// Supabase 클라이언트 초기화
let supabaseClient;

// Supabase SDK 로드 확인 및 초기화
function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });
        console.log('Supabase 초기화 완료 (실시간 연동 활성화)');
        return supabaseClient;
    } else {
        console.error('Supabase SDK가 로드되지 않았습니다.');
        return null;
    }
}

// 데이터베이스 작업 함수들

// 유니크한 매물번호 생성 (중복 방지)
async function generateUniquePropertyNumber() {
    const maxAttempts = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 한국시간 (UTC+9) 기준으로 날짜 생성
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        
        const dateStr = koreaTime.getFullYear().toString() + 
                      (koreaTime.getMonth() + 1).toString().padStart(2, '0') + 
                      koreaTime.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const propertyNumber = dateStr + randomNum;
        
        // 중복 확인
        try {
            const { data: existingProperty } = await supabaseClient
                .from('properties')
                .select('property_number')
                .eq('property_number', propertyNumber)
                .single();
                
            if (!existingProperty) {
                // 중복되지 않으면 사용
                console.log(`매물번호 생성 성공 (${attempt + 1}번째 시도): ${propertyNumber}`);
                return propertyNumber;
            }
            
            console.log(`매물번호 중복 발견, 재시도 (${attempt + 1}/${maxAttempts}): ${propertyNumber}`);
        } catch (error) {
            // 존재하지 않으면 사용 가능
            if (error.code === 'PGRST116') {
                console.log(`매물번호 생성 성공 (${attempt + 1}번째 시도): ${propertyNumber}`);
                return propertyNumber;
            }
            throw error;
        }
    }
    
    // 최대 시도 횟수 초과 시 타임스탬프 추가 (한국시간 기준)
    const timestamp = Date.now().toString().slice(-4);
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const dateStr = koreaTime.getFullYear().toString() + 
                  (koreaTime.getMonth() + 1).toString().padStart(2, '0') + 
                  koreaTime.getDate().toString().padStart(2, '0');
    const fallbackNumber = dateStr + timestamp;
    console.log(`매물번호 생성 fallback 사용: ${fallbackNumber}`);
    return fallbackNumber;
}

// 매물 목록 조회 (전체 데이터 가져오기 - 삭제된 항목 제외)
async function getProperties(limit = null, offset = 0, includeDeleted = false) {
    try {
        let query = supabaseClient
            .from('properties')
            .select('*', { count: 'exact' });
        
        // 삭제된 항목 제외 (기본값)
        if (!includeDeleted) {
            query = query.or('deleted_at.is.null,is_deleted.is.false');
        }
        
        query = query
            .order('register_date', { ascending: false })
            .order('created_at', { ascending: false });
        
        // limit이 지정되면 범위 제한, null이면 전체 데이터를 페이지별로 가져오기
        if (limit !== null) {
            query = query.range(offset, offset + limit - 1);
            const { data, error, count } = await query;
            
            if (error) {
                console.error('매물 조회 오류:', error);
                return { data: [], error, count: 0 };
            }
            
            console.log(`매물 ${data.length}개 조회 완료`);
            return { data, error: null, count };
        } else {
            // 전체 데이터를 페이지별로 가져오기 (성능 최적화)
            let allData = [];
            let currentOffset = 0;
            const pageSize = 1000; // Supabase 기본 페이지 크기
            let hasMore = true;
            
            while (hasMore) {
                const { data: pageData, error, count } = await supabaseClient
                    .from('properties')
                    .select(`
                        id, property_number, register_date, manager, 
                        property_name, property_type, trade_type, 
                        price, address, dong, ho, status,
                        supply_area_sqm, supply_area_pyeong, floor_current,
                        completion_date, direction, rooms,
                        management_fee, special_notes, 
                        created_at
                    `, { count: 'exact' })
                    .order('register_date', { ascending: false })
                    .order('created_at', { ascending: false })
                    .range(currentOffset, currentOffset + pageSize - 1);
                
                if (error) {
                    console.error('매물 조회 오류:', error);
                    return { data: [], error, count: 0 };
                }
                
                if (pageData && pageData.length > 0) {
                    allData = allData.concat(pageData);
                    currentOffset += pageSize;
                    
                    // 더 이상 데이터가 없으면 중단
                    if (pageData.length < pageSize) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }
            
            console.log(`매물 ${allData.length}개 조회 완료 (전체 데이터)`);
            return { data: allData, error: null, count: allData.length };
            
            if (error) {
                console.error('매물 조회 오류:', error);
                return { data: [], error, count: 0 };
            }
            
            console.log(`매물 ${data?.length || 0}개 조회 완료 (최적화됨)`);
            return { data: data || [], error: null, count: count || 0 };
        }
    } catch (err) {
        console.error('매물 조회 중 예외 발생:', err);
        return { data: [], error: err, count: 0 };
    }
}

// 단일 매물 조회
async function getPropertyById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('매물 상세 조회 오류:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('매물 상세 조회 중 예외 발생:', err);
        return { data: null, error: err };
    }
}

// 매물 ID로 단일 조회 (최적화됨)
async function getPropertyById(id) {
    try {
        console.log('getPropertyById 함수 시작, ID:', id);
        
        if (!supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않음');
            return { success: false, error: new Error('데이터베이스 연결이 필요합니다.'), data: null };
        }

        const { data, error } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('매물 조회 오류:', error);
            return { success: false, error, data: null };
        }

        console.log('매물 조회 완료:', data?.property_number || 'Unknown');
        return { success: true, error: null, data };
    } catch (err) {
        console.error('매물 조회 중 예외 발생:', err);
        return { success: false, error: err, data: null };
    }
}

// 잘못된 유니코드 문자 정리 함수
function cleanInvalidUnicode(str) {
    if (!str || typeof str !== 'string') return str;
    
    try {
        // 잘못된 서로게이트 페어 제거
        str = str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
        str = str.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
        
        // 제어 문자 제거 (탭, 줄바꿈 제외)
        str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        return str;
    } catch (error) {
        console.warn('문자열 정리 중 오류:', error);
        return str.replace(/[^\x20-\x7E\n\r\t가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
    }
}

// 매물 등록
async function insertProperty(propertyData) {
    try {
        console.log('insertProperty 함수 시작');
        
        if (!supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않음');
            return { success: false, error: new Error('데이터베이스 연결이 필요합니다.'), data: null };
        }

        // 데이터 정리 (빈 문자열을 null로 변환 + 유니코드 정리)
        const cleanedData = {};
        for (const [key, value] of Object.entries(propertyData)) {
            if (value === '') {
                cleanedData[key] = null;
            } else if (typeof value === 'string') {
                cleanedData[key] = cleanInvalidUnicode(value);
            } else {
                cleanedData[key] = value;
            }
        }
        
        // 매물번호 자동 생성 (중복 방지 포함)
        if (!cleanedData.property_number) {
            cleanedData.property_number = await generateUniquePropertyNumber();
            console.log('매물번호 자동 생성:', cleanedData.property_number);
        }

        const { data, error } = await supabaseClient
            .from('properties')
            .insert([cleanedData])
            .select();

        if (error) {
            console.error('매물 등록 오류:', error);
            return { success: false, error, data: null };
        }

        console.log('매물 등록 완료:', data[0]);
        
        // 슬랙 알림 전송 (새 매물 등록)
        try {
            if (window.notifyNewProperty) {
                await window.notifyNewProperty(data[0]);
                console.log('새 매물 등록 슬랙 알림 전송 완료');
            }
        } catch (slackError) {
            console.warn('슬랙 알림 전송 실패 (무시됨):', slackError);
        }
        
        return { success: true, error: null, data: data[0] };
    } catch (err) {
        console.error('매물 등록 중 예외 발생:', err);
        return { success: false, error: err, data: null };
    }
}

// 매물 수정
async function updateProperty(id, propertyData) {
    try {
        console.log('updateProperty 함수 시작, ID:', id);
        
        if (!supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않음');
            return { success: false, error: new Error('데이터베이스 연결이 필요합니다.'), data: null };
        }

        // 이전 상태 조회 (상태 변경 감지용)
        let oldStatus = null;
        try {
            const { data: oldProperty } = await getPropertyById(id);
            oldStatus = oldProperty?.status;
        } catch (error) {
            console.warn('이전 상태 조회 실패:', error);
        }

        // 데이터 정리 (빈 문자열을 null로 변환 + 유니코드 정리)
        const cleanedData = {};
        for (const [key, value] of Object.entries(propertyData)) {
            if (value === '') {
                cleanedData[key] = null;
            } else if (typeof value === 'string') {
                cleanedData[key] = cleanInvalidUnicode(value);
            } else {
                cleanedData[key] = value;
            }
        }

        const { data, error } = await supabaseClient
            .from('properties')
            .update(cleanedData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('매물 수정 오류:', error);
            return { success: false, error, data: null };
        }

        console.log('매물 수정 완료:', data[0]);
        
        // 상태 변경 시 슬랙 알림 전송
        if (oldStatus && oldStatus !== data[0].status) {
            try {
                if (window.notifyStatusChange) {
                    await window.notifyStatusChange(data[0], oldStatus, data[0].status);
                    console.log('매물 상태 변경 슬랙 알림 전송 완료');
                }
            } catch (slackError) {
                console.warn('슬랙 알림 전송 실패 (무시됨):', slackError);
            }
        }
        
        return { success: true, error: null, data: data[0] };
    } catch (err) {
        console.error('매물 수정 중 예외 발생:', err);
        return { success: false, error: err, data: null };
    }
}

// 매물 삭제 (소프트 삭제)
async function deleteProperty(id) {
    try {
        console.log('deleteProperty 함수 시작, ID:', id);
        
        if (!supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않음');
            return { success: false, error: new Error('데이터베이스 연결이 필요합니다.') };
        }

        // 소프트 삭제: deleted_at 필드 설정
        const { data, error } = await supabaseClient
            .from('properties')
            .update({ 
                deleted_at: new Date().toISOString(),
                status: '삭제됨' 
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('매물 삭제 오류:', error);
            return { success: false, error };
        }

        console.log('매물 소프트 삭제 완료, ID:', id);
        return { success: true, error: null, data: data[0] };
    } catch (err) {
        console.error('매물 삭제 중 예외 발생:', err);
        return { success: false, error: err };
    }
}

// 매물 복구 (소프트 삭제된 항목 복구)
async function restoreProperty(id) {
    try {
        console.log('restoreProperty 함수 시작, ID:', id);
        
        if (!supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않음');
            return { success: false, error: new Error('데이터베이스 연결이 필요합니다.') };
        }

        const { data, error } = await supabaseClient
            .from('properties')
            .update({ 
                deleted_at: null,
                status: '거래가능' 
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('매물 복구 오류:', error);
            return { success: false, error };
        }

        console.log('매물 복구 완료, ID:', id);
        return { success: true, error: null, data: data[0] };
    } catch (err) {
        console.error('매물 복구 중 예외 발생:', err);
        return { success: false, error: err };
    }
}

// 매물 영구 삭제 (물리적 삭제 - 관리자 전용)
async function permanentlyDeleteProperty(id) {
    try {
        console.log('permanentlyDeleteProperty 함수 시작, ID:', id);
        
        if (!supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않음');
            return { success: false, error: new Error('데이터베이스 연결이 필요합니다.') };
        }

        // 관리자 권한 확인
        const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
        if (!isAdmin) {
            return { success: false, error: new Error('관리자 권한이 필요합니다.') };
        }

        const { error } = await supabaseClient
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('매물 영구 삭제 오류:', error);
            return { success: false, error };
        }

        console.log('매물 영구 삭제 완료, ID:', id);
        return { success: true, error: null };
    } catch (err) {
        console.error('매물 영구 삭제 중 예외 발생:', err);
        return { success: false, error: err };
    }
}

// 삭제된 매물 목록 조회 (관리자 전용)
async function getDeletedProperties() {
    try {
        if (!supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않음');
            return { success: false, error: new Error('데이터베이스 연결이 필요합니다.'), data: [] };
        }

        // 관리자 권한 확인
        const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
        if (!isAdmin) {
            return { success: false, error: new Error('관리자 권한이 필요합니다.'), data: [] };
        }

        const { data, error } = await supabaseClient
            .from('properties')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });

        if (error) {
            console.error('삭제된 매물 조회 오류:', error);
            return { success: false, error, data: [] };
        }

        console.log(`삭제된 매물 ${data.length}개 조회 완료`);
        return { success: true, error: null, data };
    } catch (err) {
        console.error('삭제된 매물 조회 중 예외 발생:', err);
        return { success: false, error: err, data: [] };
    }
}

// 필터링된 매물 조회
async function getFilteredProperties(filters) {
    try {
        let query = supabaseClient.from('properties').select('*', { count: 'exact' });

        // 삭제된 항목 제외 (기본값)
        if (!filters.includeDeleted) {
            query = query.or('deleted_at.is.null,is_deleted.is.false');
        }

        // 필터 적용
        if (filters.property_type) {
            query = query.eq('property_type', filters.property_type);
        }
        if (filters.trade_type) {
            query = query.eq('trade_type', filters.trade_type);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.manager) {
            query = query.eq('manager', filters.manager);
        }
        if (filters.search) {
            // 텍스트 검색 (매물명, 주소)
            query = query.or(`property_name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
        }

        // 정렬
        query = query.order('register_date', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('필터링 조회 오류:', error);
            return { data: [], error, count: 0 };
        }

        return { data, error: null, count };
    } catch (err) {
        console.error('필터링 조회 중 예외 발생:', err);
        return { data: [], error: err, count: 0 };
    }
}

// 실시간 구독 (매물 변경사항 감지)
function subscribeToProperties(callback) {
    const subscription = supabaseClient
        .channel('properties_realtime')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'properties',
                filter: 'is_deleted=eq.false' // 삭제되지 않은 매물만
            },
            (payload) => {
                console.log('매물 변경 감지:', payload);
                
                // 변경 타입에 따른 처리
                switch(payload.eventType) {
                    case 'INSERT':
                        console.log('새 매물 추가:', payload.new);
                        callback({
                            type: 'insert',
                            data: payload.new
                        });
                        break;
                    case 'UPDATE':
                        console.log('매물 수정:', payload.old, '->', payload.new);
                        callback({
                            type: 'update',
                            old: payload.old,
                            new: payload.new
                        });
                        break;
                    case 'DELETE':
                        console.log('매물 삭제:', payload.old);
                        callback({
                            type: 'delete',
                            data: payload.old
                        });
                        break;
                }
            }
        )
        .subscribe((status) => {
            console.log('실시간 구독 상태:', status);
        });

    return subscription;
}

// 감사 로그 실시간 구독 (관리자용)
function subscribeToAuditLogs(callback) {
    // 관리자만 감사 로그 구독 가능
    const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
    if (!isAdmin) {
        console.log('관리자가 아니므로 감사 로그 구독을 건너뜀');
        return null;
    }

    const subscription = supabaseClient
        .channel('audit_logs_realtime')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public', 
                table: 'property_audit_logs'
            },
            (payload) => {
                console.log('감사 로그 추가:', payload.new);
                callback({
                    type: 'audit_log',
                    data: payload.new
                });
            }
        )
        .subscribe();

    return subscription;
}

// 구독 해제
function unsubscribeFromProperties(subscription) {
    if (subscription) {
        supabaseClient.removeChannel(subscription);
    }
}

// 연결 테스트
async function testConnection() {
    try {
        const { error } = await supabaseClient
            .from('properties')
            .select('count')
            .limit(1);

        if (error) {
            console.error('연결 테스트 실패:', error);
            return false;
        }

        console.log('Supabase 연결 성공');
        return true;
    } catch (err) {
        console.error('연결 테스트 예외:', err);
        return false;
    }
}

// 전역 변수로 노출
window.supabaseClient = null;
window.getProperties = getProperties;
window.getPropertyById = getPropertyById;
window.insertProperty = insertProperty;
window.updateProperty = updateProperty;
window.deleteProperty = deleteProperty;
window.restoreProperty = restoreProperty;
window.permanentlyDeleteProperty = permanentlyDeleteProperty;
window.getDeletedProperties = getDeletedProperties;
window.getFilteredProperties = getFilteredProperties;
window.subscribeToProperties = subscribeToProperties;
window.subscribeToAuditLogs = subscribeToAuditLogs;
window.unsubscribeFromProperties = unsubscribeFromProperties;
window.testConnection = testConnection;

// 초기화 시 연결 테스트
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        const client = initSupabase();
        if (client) {
            window.supabaseClient = client;
            const connected = await testConnection();
            if (connected) {
                console.log('Supabase 연결 및 테스트 완료');
            } else {
                console.error('Supabase 연결 실패 - 스키마가 생성되지 않았을 수 있습니다.');
            }
        }
    });
}