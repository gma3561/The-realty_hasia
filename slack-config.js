// 슬랙 웹훅 설정
// Slack App 설정: https://api.slack.com/apps 에서 Incoming Webhooks 생성

const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL'; // 실제 웹훅 URL로 교체 필요

// 슬랙 메시지 포맷팅
function formatPropertyForSlack(property) {
    // 매물 상태에 따른 이모지
    const statusEmoji = {
        '거래가능': '🟢',
        '거래완료': '🔴',
        '거래철회': '⚫',
        '매물검토': '🟡'
    };
    
    // 거래 유형에 따른 이모지
    const tradeEmoji = {
        '매매': '🏠',
        '전세': '🔑',
        '월세/렌트': '💰',
        '분양': '🏗️',
        '단기': '📅'
    };
    
    const emoji = statusEmoji[property.status] || '📋';
    const tradeIcon = tradeEmoji[property.trade_type] || '📍';
    
    // 슬랙 메시지 블록 구성
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `${emoji} ${property.property_name || '매물 정보'}`,
                emoji: true
            }
        },
        {
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*매물번호:*\n${property.id || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*등록일:*\n${formatDate(property.register_date)}`
                },
                {
                    type: "mrkdwn",
                    text: `*매물상태:*\n${property.status || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*담당자:*\n${property.manager || '-'}`
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `${tradeIcon} *거래 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*거래유형:*\n${property.trade_type || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*금액:*\n${property.price || '-'}`
                }
            ]
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `📍 *위치 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*주소:*\n${property.address || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*동/호:*\n${property.dong || '-'}동 ${property.ho || '-'}호`
                }
            ]
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `📐 *면적 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*공급/전용(㎡):*\n${property.supply_area_sqm || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*공급/전용(평):*\n${property.supply_area_pyeong || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*층수:*\n${property.floor_current || '-'}/${property.floor_total || '-'}층`
                },
                {
                    type: "mrkdwn",
                    text: `*방/욕실:*\n${property.rooms || '-'}`
                }
            ]
        }
    ];
    
    // 특이사항이 있으면 추가
    if (property.special_notes) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `📝 *특이사항*\n${property.special_notes}`
            }
        });
    }
    
    // 담당자 메모가 있으면 추가
    if (property.manager_memo) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `💬 *담당자 메모*\n${property.manager_memo}`
            }
        });
    }
    
    // 푸터 추가
    blocks.push({
        type: "context",
        elements: [
            {
                type: "mrkdwn",
                text: `🏢 더부동산중개법인 | 📅 ${new Date().toLocaleString('ko-KR')}`
            }
        ]
    });
    
    return blocks;
}

// 슬랙으로 매물 정보 전송
async function sendPropertyToSlack(property) {
    try {
        // 로딩 표시
        showSlackLoading(true);
        
        // 메시지 블록 생성
        const blocks = formatPropertyForSlack(property);
        
        // 슬랙 페이로드 구성
        const payload = {
            text: `매물 정보: ${property.property_name || property.id}`,
            blocks: blocks,
            attachments: [
                {
                    color: getStatusColor(property.status),
                    fields: []
                }
            ]
        };
        
        // 웹훅으로 전송
        const response = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showSlackSuccess();
            return true;
        } else {
            throw new Error('슬랙 전송 실패');
        }
        
    } catch (error) {
        console.error('슬랙 전송 오류:', error);
        showSlackError(error.message);
        return false;
    } finally {
        showSlackLoading(false);
    }
}

// 간단한 메시지 전송 (알림용)
async function sendSimpleSlackMessage(message, channel = null) {
    try {
        const payload = {
            text: message
        };
        
        if (channel) {
            payload.channel = channel;
        }
        
        const response = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        return response.ok;
        
    } catch (error) {
        console.error('슬랙 메시지 전송 오류:', error);
        return false;
    }
}

// 매물 등록 알림
async function notifyNewProperty(property) {
    const message = `🆕 새 매물이 등록되었습니다!\n` +
                   `• 매물명: ${property.property_name}\n` +
                   `• 거래유형: ${property.trade_type}\n` +
                   `• 금액: ${property.price}\n` +
                   `• 담당자: ${property.manager}`;
    
    return sendSimpleSlackMessage(message);
}

// 매물 상태 변경 알림
async function notifyStatusChange(property, oldStatus, newStatus) {
    const message = `🔄 매물 상태가 변경되었습니다!\n` +
                   `• 매물명: ${property.property_name}\n` +
                   `• 변경: ${oldStatus} → ${newStatus}\n` +
                   `• 담당자: ${property.manager}`;
    
    return sendSimpleSlackMessage(message);
}

// 유틸리티 함수들

// 날짜 포맷
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// 상태별 색상
function getStatusColor(status) {
    const colors = {
        '거래가능': '#36a64f',  // 녹색
        '거래완료': '#ff0000',  // 빨강
        '거래철회': '#000000',  // 검정
        '매물검토': '#ffcc00'   // 노랑
    };
    return colors[status] || '#808080';
}

// UI 피드백 함수들

function showSlackLoading(show) {
    const button = document.querySelector('.slack-send-btn');
    if (button) {
        if (show) {
            button.disabled = true;
            button.textContent = '전송 중...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.textContent = '슬랙으로 전송';
            button.classList.remove('loading');
        }
    }
}

function showSlackSuccess() {
    // 성공 토스트 메시지
    const toast = document.createElement('div');
    toast.className = 'slack-toast success';
    toast.innerHTML = `
        <span>✅ 슬랙으로 전송되었습니다!</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showSlackError(message) {
    // 에러 토스트 메시지
    const toast = document.createElement('div');
    toast.className = 'slack-toast error';
    toast.innerHTML = `
        <span>❌ 전송 실패: ${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// 슬랙 연결 테스트
async function testSlackConnection() {
    const testMessage = '🔧 슬랙 연결 테스트 메시지입니다.';
    const result = await sendSimpleSlackMessage(testMessage);
    
    if (result) {
        console.log('✅ 슬랙 연결 성공');
        return true;
    } else {
        console.error('❌ 슬랙 연결 실패');
        return false;
    }
}