// Supabase 설정 및 초기화
// 주의: 실제 배포시 환경변수로 관리해야 함

// Supabase 프로젝트 정보
const SUPABASE_URL = 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvamFqcXphanpocWtobXVicHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjMwODEsImV4cCI6MjA3MDk5OTA4MX0.JPlgJpdA-xVLogQHf1A0a_9qyES8qH3lK1aOLBxXe2A';

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

// 매물 목록 조회 (전체 데이터 가져오기)
async function getProperties(limit = null, offset = 0) {
    try {
        let query = supabaseClient
            .from('properties')
            .select('*', { count: 'exact' })
            .order('register_date', { ascending: false })
            .order('created_at', { ascending: false });
        
        // limit이 지정되면 범위 제한, null이면 전체 데이터
        if (limit !== null) {
            query = query.range(offset, offset + limit - 1);
        }
        
        const { data, error, count } = await query;

        if (error) {
            console.error('매물 조회 오류:', error);
            return { data: [], error, count: 0 };
        }

        console.log(`매물 ${data.length}개 조회 완료`);
        return { data, error: null, count };
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

// 매물 등록
async function insertProperty(propertyData) {
    try {
        // 데이터 정리 (빈 문자열을 null로 변환)
        const cleanedData = {};
        for (const [key, value] of Object.entries(propertyData)) {
            cleanedData[key] = value === '' ? null : value;
        }

        const { data, error } = await supabaseClient
            .from('properties')
            .insert([cleanedData])
            .select();

        if (error) {
            console.error('매물 등록 오류:', error);
            return { data: null, error };
        }

        console.log('매물 등록 완료:', data[0]);
        return { data: data[0], error: null };
    } catch (err) {
        console.error('매물 등록 중 예외 발생:', err);
        return { data: null, error: err };
    }
}

// 매물 수정
async function updateProperty(id, propertyData) {
    try {
        // 데이터 정리
        const cleanedData = {};
        for (const [key, value] of Object.entries(propertyData)) {
            cleanedData[key] = value === '' ? null : value;
        }

        const { data, error } = await supabaseClient
            .from('properties')
            .update(cleanedData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('매물 수정 오류:', error);
            return { data: null, error };
        }

        console.log('매물 수정 완료:', data[0]);
        return { data: data[0], error: null };
    } catch (err) {
        console.error('매물 수정 중 예외 발생:', err);
        return { data: null, error: err };
    }
}

// 매물 삭제 (상태값만 변경)
async function deleteProperty(id) {
    try {
        const { data, error } = await supabaseClient
            .from('properties')
            .update({ status: '삭제됨' })
            .eq('id', id)
            .select();

        if (error) {
            console.error('매물 삭제 오류:', error);
            return { success: false, error };
        }

        console.log('매물 삭제 완료 (상태 변경):', data[0]);
        return { success: true, error: null };
    } catch (err) {
        console.error('매물 삭제 중 예외 발생:', err);
        return { success: false, error: err };
    }
}

// 필터링된 매물 조회
async function getFilteredProperties(filters) {
    try {
        let query = supabaseClient.from('properties').select('*', { count: 'exact' });

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