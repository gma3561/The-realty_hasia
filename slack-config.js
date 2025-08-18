// 슬랙 웹훅 설정 및 알림 시스템
// Slack App 설정: https://api.slack.com/apps 에서 Incoming Webhooks 생성

const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

// 알림 설정 (사용자별 커스터마이징 가능)
const notificationSettings = {
    newProperty: true,      // 새 매물 등록 알림 (테스트를 위해 활성화)
    statusChange: true,     // 상태 변경 알림 (활성화)
    slackSend: true,        // 슬랙 전송 알림 (테스트를 위해 활성화)
    channels: {
        default: 'C099TN2BW6R',  // 기본 채널 (사용자 제공 채널 ID)
        urgent: 'C099TN2BW6R'    // 긴급 채널 (동일 채널)
    }
};

// ===== 1. 매물 등록 알림 =====
async function notifyNewProperty(property) {
    if (!notificationSettings.newProperty) return true;
    
    try {
        const message = formatNewPropertyMessage(property);
        return await sendSlackMessage(message);
    } catch (error) {
        console.error('새 매물 알림 전송 실패:', error);
        return false;
    }
}

function formatNewPropertyMessage(property) {
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `🆕 새 매물이 등록되었습니다!`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `🏠 *매물 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*매물명:*\n${property.property_name || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*매물번호:*\n${property.property_number || property.id || '-'}`
                },
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
                text: `📐 *기본 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*면적:*\n${property.supply_area_sqm || '-'}㎡ / ${property.supply_area_pyeong || '-'}평`
                },
                {
                    type: "mrkdwn",
                    text: `*층수:*\n${property.floor_current || '-'}/${property.floor_total || '-'}층`
                },
                {
                    type: "mrkdwn",
                    text: `*방/욕실:*\n${property.rooms || '-'}개`
                }
            ]
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `👤 *담당자 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*담당자:*\n${property.manager || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*등록일:*\n${formatDate(property.register_date)}`
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `🏢 더부동산중개법인 | 🕐 ${new Date().toLocaleString('ko-KR')}`
                }
            ]
        }
    ];

    return {
        text: `🆕 새 매물이 등록되었습니다! - ${property.property_name || property.id}`,
        blocks: blocks
    };
}

// ===== 2. 매물 상태 변경 알림 =====
async function notifyStatusChange(property, oldStatus, newStatus) {
    if (!notificationSettings.statusChange) return true;
    
    try {
        const message = formatStatusChangeMessage(property, oldStatus, newStatus);
        return await sendSlackMessage(message);
    } catch (error) {
        console.error('상태 변경 알림 전송 실패:', error);
        return false;
    }
}

function formatStatusChangeMessage(property, oldStatus, newStatus) {
    const statusEmoji = {
        '거래가능': '🟢',
        '거래완료': '🔴',
        '거래철회': '⚫',
        '매물검토': '🟡',
        '삭제됨': '🗑️'
    };

    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `🔄 매물 상태가 변경되었습니다!`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `🏠 *매물 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*매물명:*\n${property.property_name || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*매물번호:*\n${property.property_number || property.id || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*거래유형:*\n${property.trade_type || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*담당자:*\n${property.manager || '-'}`
                }
            ]
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `📋 *상태 변경 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*변경 항목:*\n매물 상태`
                },
                {
                    type: "mrkdwn",
                    text: `*이전 상태:*\n${statusEmoji[oldStatus] || ''} ${oldStatus || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*새로운 상태:*\n${statusEmoji[newStatus] || ''} ${newStatus || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*변경일시:*\n${new Date().toLocaleString('ko-KR')}`
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `🏢 더부동산중개법인 | 🕐 ${new Date().toLocaleString('ko-KR')}`
                }
            ]
        }
    ];

    return {
        text: `🔄 매물 상태 변경: ${oldStatus} → ${newStatus} - ${property.property_name || property.id}`,
        blocks: blocks
    };
}

// ===== 3. 슬랙 전송 버튼 클릭 알림 =====
async function notifySlackSend(property, sender = '시스템') {
    if (!notificationSettings.slackSend) return true;
    
    try {
        const message = formatSlackSendMessage(property, sender);
        return await sendSlackMessage(message);
    } catch (error) {
        console.error('슬랙 전송 알림 전송 실패:', error);
        return false;
    }
}

function formatSlackSendMessage(property, sender) {
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `📤 매물 정보가 슬랙으로 전송되었습니다!`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `🏠 *매물 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*매물명:*\n${property.property_name || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*매물번호:*\n${property.property_number || property.id || '-'}`
                },
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
                text: `👤 *담당자 정보*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*담당자:*\n${property.manager || '-'}`
                },
                {
                    type: "mrkdwn",
                    text: `*전송일시:*\n${new Date().toLocaleString('ko-KR')}`
                }
            ]
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `📤 *전송 상세*`
            },
            fields: [
                {
                    type: "mrkdwn",
                    text: `*전송 채널:*\n${notificationSettings.channels.default}`
                },
                {
                    type: "mrkdwn",
                    text: `*전송자:*\n${sender}`
                },
                {
                    type: "mrkdwn",
                    text: `*전송 목적:*\n고객 문의/팀 공유`
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `🏢 더부동산중개법인 | 🕐 ${new Date().toLocaleString('ko-KR')}`
                }
            ]
        }
    ];

    return {
        text: `📤 매물 정보 슬랙 전송 완료 - ${property.property_name || property.id}`,
        blocks: blocks
    };
}

// ===== 공통 함수들 =====

// 슬랙 메시지 전송
async function sendSlackMessage(message) {
    try {
        const payload = {
            ...message,
            channel: notificationSettings.channels.default
        };

        const response = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('슬랙 알림 전송 성공');
            return true;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('슬랙 메시지 전송 오류:', error);
        return false;
    }
}

// 간단한 메시지 전송 (알림용)
async function sendSimpleSlackMessage(text, channel = null) {
    try {
        const payload = {
            text: text
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

// 날짜 포맷
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    } catch (error) {
        return dateString;
    }
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

// 알림 설정 업데이트
function updateNotificationSettings(newSettings) {
    Object.assign(notificationSettings, newSettings);
    console.log('알림 설정이 업데이트되었습니다:', notificationSettings);
}

// 전역 함수로 노출
window.notifyNewProperty = notifyNewProperty;
window.notifyStatusChange = notifyStatusChange;
window.notifySlackSend = notifySlackSend;
window.sendSlackMessage = sendSlackMessage;
window.sendSimpleSlackMessage = sendSimpleSlackMessage;
window.testSlackConnection = testSlackConnection;
window.updateNotificationSettings = updateNotificationSettings;
window.notificationSettings = notificationSettings;

// 웹훅 URL도 전역으로 노출
window.SLACK_WEBHOOK_URL = SLACK_WEBHOOK_URL;

console.log('✅ 슬랙 알림 시스템 로드 완료');
console.log('상태 변경 알림:', notificationSettings.statusChange ? '활성화' : '비활성화');