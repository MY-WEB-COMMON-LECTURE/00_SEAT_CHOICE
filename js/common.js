console.log('common.js..');

// URL 파라미터 파싱 함수
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// URL 파라미터에서 과목 정보 가져오기
function getSubjectInfoFromUrl() {
    const subjectId = getUrlParameter('subjectId');
    const subjectTitle = getUrlParameter('subjectTitle');
    
    console.log('URL에서 받은 과목 정보:', { subjectId, subjectTitle });
    
    return {
        subjectId: subjectId || '',
        subjectTitle: subjectTitle || ''
    };
}

// 페이지 제목 업데이트
function updatePageTitle(subjectTitle) {
    if (subjectTitle) {
        document.title = `${subjectTitle} - 좌석 선택`;
        console.log('페이지 제목 업데이트:', document.title);
    }
}

// 과목 정보를 localStorage에 저장
function saveSubjectInfoToStorage(subjectInfo) {
    try {
        localStorage.setItem('currentSubjectInfo', JSON.stringify(subjectInfo));
        console.log('✅ 과목 정보 localStorage 저장 완료:', subjectInfo);
    } catch (error) {
        console.error('❌ 과목 정보 localStorage 저장 실패:', error);
    }
}

// localStorage에서 과목 정보 가져오기
function loadSubjectInfoFromStorage() {
    try {
        const savedSubjectInfo = localStorage.getItem('currentSubjectInfo');
        if (savedSubjectInfo) {
            const subjectInfo = JSON.parse(savedSubjectInfo);
            console.log('✅ localStorage에서 과목 정보 로드 완료:', subjectInfo);
            return subjectInfo;
        } else {
            console.log('⚠️ localStorage에 저장된 과목 정보 없음');
            return null;
        }
    } catch (error) {
        console.error('❌ localStorage에서 과목 정보 로드 실패:', error);
        return null;
    }
}

// 서버 설정 전역변수
const SERVER_CONFIG = {
    // BASE_URL: 'http://localhost:8095',
    BASE_URL: 'https://exam-all.duckdns.org',
    ENDPOINTS: {
        SEAT: '/seat',
        SAVE_POSITIONS: '/seat/save-positions',
        SAVE_MANAGER: '/seat/save-manager',
        SAVE_MEMBER: '/seat/save-member',
        SAVE_TABLE_CONFIG: '/seat/save-table-config',
        SAVE_ALL: '/seat/save-all'
    }
};

// 서버 요청 공통 함수
async function serverRequest(endpoint, method = 'GET', data = null) {
    try {
        // 과목 정보 가져오기
        const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
        const subjectId = subjectInfo?.subjectId || '';
        
        let url = SERVER_CONFIG.BASE_URL + endpoint;
        
        // GET 요청인 경우 subjectId를 쿼리 파라미터로 추가
        if (method === 'GET' && subjectId) {
            const separator = endpoint.includes('?') ? '&' : '?';
            url += `${separator}subjectId=${encodeURIComponent(subjectId)}`;
        }
        
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'  // JSON 응답 요청
            }
        };
        
        if (data) {
            // POST/PUT 요청인 경우 data에 subjectId 추가
            if (subjectId) {
                data.subjectId = subjectId;
            }
            config.body = JSON.stringify(data);
        }
        
        console.log(`서버 요청: ${method} ${url}`, data);
        
        const response = await fetch(url, config);
        
        // 응답 상태 확인
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        
        // 응답 타입 확인
        const contentType = response.headers.get('content-type');
        console.log('응답 Content-Type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            // JSON 응답 처리
            const result = await response.json();
            console.log('서버 응답 (JSON):', result);
            return result;
        } else if (contentType && contentType.includes('application/xml')) {
            // XML 응답 처리 (XML을 JSON으로 변환 시도)
            const xmlText = await response.text();
            console.warn('서버에서 XML 응답을 받았습니다. JSON으로 변환을 시도합니다.');
            
            try {
                // 간단한 XML to JSON 변환 (Map 형태의 XML)
                const jsonResult = parseXmlToJson(xmlText);
                console.log('XML을 JSON으로 변환한 결과:', jsonResult);
                return jsonResult;
            } catch (parseError) {
                console.error('XML 파싱 실패:', parseError);
                throw new Error('서버에서 XML 응답을 보내고 있습니다. JSON 응답을 요청해주세요.');
            }
        } else {
            // 기타 응답 타입
            const text = await response.text();
            console.warn('서버에서 예상치 못한 응답 타입을 받았습니다:', text.substring(0, 200) + '...');
            throw new Error('서버에서 JSON 응답을 받지 못했습니다. 서버가 실행 중인지 확인해주세요.');
        }
        
    } catch (error) {
        console.error('서버 요청 실패:', error);
        
        // 네트워크 에러인지 확인
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        }
        
        // JSON 파싱 에러인지 확인
        if (error.message.includes('Unexpected token')) {
            throw new Error('서버에서 잘못된 응답을 받았습니다. 서버가 실행 중인지 확인해주세요.');
        }
        
        throw error;
    }
}

// XML을 JSON으로 변환하는 함수 (간단한 Map 형태 XML 처리)
function parseXmlToJson(xmlText) {
    try {
        console.log('XML 파싱 시작:', xmlText.substring(0, 200) + '...');
        
        // Map 형태의 XML을 간단히 파싱
        const result = {};
        
        // <success>true</success> 형태 파싱
        const successMatch = xmlText.match(/<success>(.*?)<\/success>/);
        if (successMatch) {
            result.success = successMatch[1] === 'true';
        }
        
        // <totalCount>1</totalCount> 형태 파싱
        const totalCountMatch = xmlText.match(/<totalCount>(\d+)<\/totalCount>/);
        if (totalCountMatch) {
            result.totalCount = parseInt(totalCountMatch[1]);
        }
        
        // <message>메시지</message> 형태 파싱
        const messageMatch = xmlText.match(/<message>(.*?)<\/message>/);
        if (messageMatch) {
            result.message = messageMatch[1];
        }
        
        // <subjectId>ID</subjectId> 형태 파싱
        const subjectIdMatch = xmlText.match(/<subjectId>(.*?)<\/subjectId>/);
        if (subjectIdMatch) {
            result.subjectId = subjectIdMatch[1];
        }
        
        // <subjectTitle>제목</subjectTitle> 형태 파싱
        const subjectTitleMatch = xmlText.match(/<subjectTitle>(.*?)<\/subjectTitle>/);
        if (subjectTitleMatch) {
            result.subjectTitle = subjectTitleMatch[1];
        }
        
        // <id>숫자</id> 형태 파싱
        const idMatch = xmlText.match(/<id>(\d+)<\/id>/);
        if (idMatch) {
            result.id = parseInt(idMatch[1]);
        }
        
        // seats 배열 파싱 (간단한 형태)
        if (xmlText.includes('<seats>')) {
            result.seats = [];
            // 실제 구현에서는 더 복잡한 파싱이 필요할 수 있음
        }
        
        console.log('XML 파싱 결과:', result);
        return result;
        
    } catch (error) {
        console.error('XML 파싱 중 오류:', error);
        throw new Error('XML 응답을 JSON으로 변환할 수 없습니다.');
    }
}

// 서버에서 위치 정보 가져오기
async function loadPositionsFromServer() {
    try {
        console.log('=== 서버에서 좌석 정보 가져오기 시작 ===');
        
        // 과목 정보 가져오기
        const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
        const subjectId = subjectInfo?.subjectId || '';
        
        if (!subjectId) {
            console.warn('⚠️ subjectId가 없어서 서버 요청을 건너뜁니다.');
            return;
        }
        
        // subjectId로 특정 과목 데이터 조회
        const endpoint = `${SERVER_CONFIG.ENDPOINTS.SEAT}/data/${encodeURIComponent(subjectId)}`;
        const result = await serverRequest(endpoint);
        
        if (result && result.success) {
            console.log('✅ 서버에서 좌석 정보 가져오기 성공');
            
            // 서버 데이터로 localStorage 덮어쓰기
            await overwriteLocalStorageWithServerData(result);
            
        } else {
            console.warn('⚠️ 서버에서 좌석 정보를 찾을 수 없음');
            console.log('서버 응답:', result);
            
            // 서버에 데이터가 없으면 currentSubjectInfo를 제외하고 storage 초기화
            clearLocalStorageExceptSubjectInfo();
        }
        
    } catch (error) {
        console.warn('⚠️ 서버에서 좌석 정보 가져오기 실패');
        console.error('에러 상세:', error.message);
        
        // 사용자에게 서버 연결 실패 알림
        if (error.message.includes('서버에 연결할 수 없습니다') || 
            error.message.includes('서버에서 JSON 응답을 받지 못했습니다') ||
            error.message.includes('서버에서 잘못된 응답을 받았습니다')) {
            
            console.warn('서버 연결 실패로 인해 localStorage에서 데이터를 로드합니다.');
            
            // 기존 localStorage 데이터가 있는지 확인
            const hasExistingData = checkExistingLocalStorageData();
            
            if (hasExistingData) {
                console.log('기존 localStorage 데이터가 있어서 사용합니다.');
                // 기존 데이터 로드 (currentSubjectInfo 제외하고 초기화하지 않음)
                loadExistingLocalStorageData();
            } else {
                console.log('기존 localStorage 데이터가 없어서 초기화합니다.');
                // currentSubjectInfo를 제외하고 storage 초기화
                clearLocalStorageExceptSubjectInfo();
            }
        } else {
            // 기타 에러의 경우 currentSubjectInfo를 제외하고 storage 초기화
            clearLocalStorageExceptSubjectInfo();
        }
    }
    
    console.log('=== 좌석 정보 로드 완료 ===');
}

// 기존 localStorage 데이터 존재 여부 확인
function checkExistingLocalStorageData() {
    const hasPositions = localStorage.getItem('seatPositions') !== null;
    const hasManagerData = localStorage.getItem('managerData') !== null;
    const hasMemberData = localStorage.getItem('memberData') !== null;
    const hasTableConfig = localStorage.getItem('tableConfig') !== null;
    const hasManagerHistory = localStorage.getItem('managerTdNamesHistory') !== null;
    const hasMemberHistory = localStorage.getItem('memberTdNamesHistory') !== null;
    
    return hasPositions || hasManagerData || hasMemberData || hasTableConfig || hasManagerHistory || hasMemberHistory;
}

// 기존 localStorage 데이터 로드
function loadExistingLocalStorageData() {
    try {
        console.log('=== 기존 localStorage 데이터 로드 시작 ===');
        
        // 위치 정보 로드
        const savedPositions = localStorage.getItem('seatPositions');
        if (savedPositions) {
            try {
                positions = JSON.parse(savedPositions);
                console.log('✅ 기존 위치 정보 로드 완료');
            } catch (error) {
                console.error('❌ 기존 위치 정보 파싱 실패:', error);
                setDefaultPositions();
            }
        } else {
            setDefaultPositions();
        }
        
        // 조장 데이터 로드
        const savedManagerData = localStorage.getItem('managerData');
        if (savedManagerData) {
            const managerTextarea = document.querySelector('.manager');
            if (managerTextarea) {
                managerTextarea.value = savedManagerData;
            }
            console.log('✅ 기존 조장 데이터 로드 완료');
        }
        
        // 조원 데이터 로드
        const savedMemberData = localStorage.getItem('memberData');
        if (savedMemberData) {
            const memberTextarea = document.querySelector('.member');
            if (memberTextarea) {
                memberTextarea.value = savedMemberData;
            }
            console.log('✅ 기존 조원 데이터 로드 완료');
        }
        
        // 테이블 설정 로드
        const savedTableConfig = localStorage.getItem('tableConfig');
        if (savedTableConfig) {
            try {
                const tableConfig = JSON.parse(savedTableConfig);
                const rowInput = document.querySelector('.table-row');
                const colInput = document.querySelector('.table-col');
                
                if (rowInput && colInput) {
                    rowInput.value = tableConfig.rows || 3;
                    colInput.value = tableConfig.cols || 6;
                }
                console.log('✅ 기존 테이블 설정 로드 완료');
            } catch (error) {
                console.error('❌ 기존 테이블 설정 파싱 실패:', error);
            }
        }
        
        console.log('✅ 기존 localStorage 데이터 로드 완료');
        
    } catch (error) {
        console.error('❌ 기존 localStorage 데이터 로드 실패:', error);
    }
}

// 서버 데이터로 localStorage 덮어쓰기
async function overwriteLocalStorageWithServerData(serverData) {
    try {
        console.log('=== 서버 데이터로 localStorage 덮어쓰기 시작 ===');
        console.log('서버에서 받은 데이터:', serverData);
        console.log('서버 데이터 키들:', Object.keys(serverData));
        
        // 위치 정보 덮어쓰기
        if (serverData.positions) {
            try {
                positions = typeof serverData.positions === 'string' ? 
                    JSON.parse(serverData.positions) : serverData.positions;
                localStorage.setItem('seatPositions', JSON.stringify(positions));
                console.log('✅ 위치 정보 덮어쓰기 완료:', positions);
            } catch (error) {
                console.error('❌ 위치 정보 파싱 실패:', error);
            }
        }
        
        // 조장 데이터 덮어쓰기 (서버 필드명: manager)
        console.log('조장 데이터 확인:', {
            'serverData.manager': serverData.manager,
            'serverData.managerData': serverData.managerData,
            'serverData.managerList': serverData.managerList
        });
        
        let managerDataToSet = null;
        if (serverData.manager) {
            managerDataToSet = serverData.manager;
        } else if (serverData.managerData) {
            managerDataToSet = serverData.managerData;
        } else if (serverData.managerList) {
            managerDataToSet = serverData.managerList;
        }
        
        if (managerDataToSet) {
            localStorage.setItem('managerData', managerDataToSet);
            
            // textarea 요소 찾기 (여러 방법 시도)
            let managerTextarea = document.querySelector('.manager');
            if (!managerTextarea) {
                managerTextarea = document.querySelector('textarea.manager');
            }
            if (!managerTextarea) {
                managerTextarea = document.querySelector('.input-name .manager');
            }
            if (!managerTextarea) {
                managerTextarea = document.querySelector('.right .manager');
            }
            
            if (managerTextarea) {
                managerTextarea.value = managerDataToSet;
                console.log('✅ 조장 입력폼에 데이터 설정 완료:', managerDataToSet);
            } else {
                console.warn('⚠️ 조장 입력폼을 찾을 수 없음, DOM 준비 후 재시도');
                // DOM이 준비되지 않았을 수 있으므로 지연 후 재시도
                setTimeout(() => {
                    const retryTextarea = document.querySelector('.manager');
                    if (retryTextarea) {
                        retryTextarea.value = managerDataToSet;
                        console.log('✅ 지연 후 조장 입력폼에 데이터 설정 완료:', managerDataToSet);
                    } else {
                        console.error('❌ 조장 입력폼을 찾을 수 없음 (재시도 실패)');
                    }
                }, 500);
            }
            console.log('✅ 조장 데이터 덮어쓰기 완료:', managerDataToSet);
        }
        
        // 조원 데이터 덮어쓰기 (서버 필드명: member)
        console.log('조원 데이터 확인:', {
            'serverData.member': serverData.member,
            'serverData.memberData': serverData.memberData,
            'serverData.memberList': serverData.memberList
        });
        
        let memberDataToSet = null;
        if (serverData.member) {
            memberDataToSet = serverData.member;
        } else if (serverData.memberData) {
            memberDataToSet = serverData.memberData;
        } else if (serverData.memberList) {
            memberDataToSet = serverData.memberList;
        }
        
        if (memberDataToSet) {
            localStorage.setItem('memberData', memberDataToSet);
            
            // textarea 요소 찾기 (여러 방법 시도)
            let memberTextarea = document.querySelector('.member');
            if (!memberTextarea) {
                memberTextarea = document.querySelector('textarea.member');
            }
            if (!memberTextarea) {
                memberTextarea = document.querySelector('.input-name .member');
            }
            if (!memberTextarea) {
                memberTextarea = document.querySelector('.right .member');
            }
            
            if (memberTextarea) {
                memberTextarea.value = memberDataToSet;
                console.log('✅ 조원 입력폼에 데이터 설정 완료:', memberDataToSet);
            } else {
                console.warn('⚠️ 조원 입력폼을 찾을 수 없음, DOM 준비 후 재시도');
                // DOM이 준비되지 않았을 수 있으므로 지연 후 재시도
                setTimeout(() => {
                    const retryTextarea = document.querySelector('.member');
                    if (retryTextarea) {
                        retryTextarea.value = memberDataToSet;
                        console.log('✅ 지연 후 조원 입력폼에 데이터 설정 완료:', memberDataToSet);
                    } else {
                        console.error('❌ 조원 입력폼을 찾을 수 없음 (재시도 실패)');
                    }
                }, 500);
            }
            console.log('✅ 조원 데이터 덮어쓰기 완료:', memberDataToSet);
        }
        
        // 테이블 설정 덮어쓰기
        if (serverData.tableConfig) {
            try {
                const tableConfig = typeof serverData.tableConfig === 'string' ? 
                    JSON.parse(serverData.tableConfig) : serverData.tableConfig;
                
                localStorage.setItem('tableConfig', JSON.stringify(tableConfig));
                
                const rowInput = document.querySelector('.table-row');
                const colInput = document.querySelector('.table-col');
                
                if (rowInput && colInput) {
                    rowInput.value = tableConfig.rows || 3;
                    colInput.value = tableConfig.cols || 6;
                }
                console.log('✅ 테이블 설정 덮어쓰기 완료:', tableConfig);
                
                // 테이블 설정 적용 후 테이블 다시 생성
                setTimeout(() => {
                    createTd();
                }, 100);
                
            } catch (error) {
                console.error('❌ 테이블 설정 파싱 실패:', error);
            }
        }
        
        // 조장 TD 이름 히스토리 덮어쓰기
        if (serverData.managerTdNamesHistory) {
            try {
                const managerHistory = typeof serverData.managerTdNamesHistory === 'string' ? 
                    JSON.parse(serverData.managerTdNamesHistory) : serverData.managerTdNamesHistory;
                localStorage.setItem('managerTdNamesHistory', JSON.stringify(managerHistory));
                console.log('✅ 조장 히스토리 덮어쓰기 완료:', managerHistory);
            } catch (error) {
                console.error('❌ 조장 히스토리 파싱 실패:', error);
            }
        }
        
        // 조원 TD 이름 히스토리 덮어쓰기
        if (serverData.memberTdNamesHistory) {
            try {
                const memberHistory = typeof serverData.memberTdNamesHistory === 'string' ? 
                    JSON.parse(serverData.memberTdNamesHistory) : serverData.memberTdNamesHistory;
                localStorage.setItem('memberTdNamesHistory', JSON.stringify(memberHistory));
                console.log('✅ 조원 히스토리 덮어쓰기 완료:', memberHistory);
            } catch (error) {
                console.error('❌ 조원 히스토리 파싱 실패:', error);
            }
        }
        
        // 삭제된 TD 리스트 덮어쓰기
        if (serverData.deletedTdList) {
            try {
                const deletedList = typeof serverData.deletedTdList === 'string' ? 
                    JSON.parse(serverData.deletedTdList) : serverData.deletedTdList;
                localStorage.setItem('deletedTdList', JSON.stringify(deletedList));
                console.log('✅ 삭제된 TD 리스트 덮어쓰기 완료:', deletedList);
            } catch (error) {
                console.error('❌ 삭제된 TD 리스트 파싱 실패:', error);
            }
        }
        
        // 히스토리에서 원본 리스트 추출하여 textarea에 설정 (백업 방법)
        if (!serverData.manager && serverData.managerTdNamesHistory) {
            try {
                const managerHistory = typeof serverData.managerTdNamesHistory === 'string' ? 
                    JSON.parse(serverData.managerTdNamesHistory) : serverData.managerTdNamesHistory;
                
                if (managerHistory.length > 0) {
                    const latestManagerData = managerHistory[managerHistory.length - 1];
                    if (latestManagerData.originalList) {
                        const managerTextarea = document.querySelector('.manager');
                        if (managerTextarea) {
                            managerTextarea.value = latestManagerData.originalList;
                            localStorage.setItem('managerData', latestManagerData.originalList);
                            console.log('✅ 히스토리에서 조장 원본 리스트 추출하여 설정:', latestManagerData.originalList);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ 히스토리에서 조장 원본 리스트 추출 실패:', error);
            }
        }
        
        if (!serverData.member && serverData.memberTdNamesHistory) {
            try {
                const memberHistory = typeof serverData.memberTdNamesHistory === 'string' ? 
                    JSON.parse(serverData.memberTdNamesHistory) : serverData.memberTdNamesHistory;
                
                if (memberHistory.length > 0) {
                    const latestMemberData = memberHistory[memberHistory.length - 1];
                    if (latestMemberData.originalList) {
                        const memberTextarea = document.querySelector('.member');
                        if (memberTextarea) {
                            memberTextarea.value = latestMemberData.originalList;
                            localStorage.setItem('memberData', latestMemberData.originalList);
                            console.log('✅ 히스토리에서 조원 원본 리스트 추출하여 설정:', latestMemberData.originalList);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ 히스토리에서 조원 원본 리스트 추출 실패:', error);
            }
        }
        
        console.log('✅ 서버 데이터로 localStorage 덮어쓰기 완료');
        
    } catch (error) {
        console.error('❌ 서버 데이터로 localStorage 덮어쓰기 실패:', error);
    }
}

// currentSubjectInfo를 제외하고 localStorage 초기화
function clearLocalStorageExceptSubjectInfo() {
    try {
        console.log('=== currentSubjectInfo를 제외하고 localStorage 초기화 시작 ===');
        
        // currentSubjectInfo 백업
        const currentSubjectInfo = localStorage.getItem('currentSubjectInfo');
        
        // localStorage 전체 초기화
        localStorage.clear();
        
        // currentSubjectInfo 복원
        if (currentSubjectInfo) {
            localStorage.setItem('currentSubjectInfo', currentSubjectInfo);
            console.log('✅ currentSubjectInfo 복원 완료');
        }
        
        // 기본값으로 초기화
        setDefaultPositions();
        
        // 화면 초기화
        const managerTextarea = document.querySelector('.manager');
        const memberTextarea = document.querySelector('.member');
        const rowInput = document.querySelector('.table-row');
        const colInput = document.querySelector('.table-col');
        
        if (managerTextarea) managerTextarea.value = '';
        if (memberTextarea) memberTextarea.value = '';
        if (rowInput) rowInput.value = '3';
        if (colInput) colInput.value = '6';
        
        console.log('✅ localStorage 초기화 완료 (currentSubjectInfo 제외)');
        
    } catch (error) {
        console.error('❌ localStorage 초기화 실패:', error);
    }
}

async function savePositionsToServer() {
    try {
        // 현재 위치 정보는 이미 positions 객체에 저장되어 있으므로 업데이트하지 않음
        // updateCurrentPositions(); // 이 줄을 제거하여 위치 변경 방지
        
        // 과목 정보 가져오기
        const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
        
        // localStorage에서 모든 데이터 수집
        const allData = {
            positions: positions,
            timestamp: new Date().toISOString(),
            subjectId: subjectInfo?.subjectId || '',
            subjectTitle: subjectInfo?.subjectTitle || ''
        };
        
        // 조장 데이터 추가
        const managerTextarea = document.querySelector('.manager');
        if (managerTextarea && managerTextarea.value.trim()) {
            allData.manager = managerTextarea.value.trim();
        }
        
        // 조원 데이터 추가
        const memberTextarea = document.querySelector('.member');
        if (memberTextarea && memberTextarea.value.trim()) {
            allData.member = memberTextarea.value.trim();
        }
        
        // 테이블 설정 추가
        const rowInput = document.querySelector('.table-row');
        const colInput = document.querySelector('.table-col');
        if (rowInput && colInput) {
            allData.tableConfig = {
                rows: parseInt(rowInput.value) || 3,
                cols: parseInt(colInput.value) || 6
            };
        }
        
        // 삭제된 TD 리스트 추가
        const deletedTdListData = localStorage.getItem('deletedTdList');
        if (deletedTdListData) {
            try {
                allData.deletedTdList = JSON.parse(deletedTdListData);
            } catch (error) {
                console.warn('삭제된 TD 리스트 파싱 실패:', error);
            }
        }
        
        // 조장 TD 이름 히스토리 추가
        const managerHistory = localStorage.getItem('managerTdNamesHistory');
        if (managerHistory) {
            try {
                allData.managerTdNamesHistory = JSON.parse(managerHistory);
            } catch (error) {
                console.warn('조장 히스토리 파싱 실패:', error);
            }
        }
        
        // 조원 TD 이름 히스토리 추가
        const memberHistory = localStorage.getItem('memberTdNamesHistory');
        if (memberHistory) {
            try {
                allData.memberTdNamesHistory = JSON.parse(memberHistory);
            } catch (error) {
                console.warn('조원 히스토리 파싱 실패:', error);
            }
        }
        
        console.log('서버로 전송할 모든 데이터:', allData);
        
        // 모든 데이터를 한 번에 서버로 전송
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_ALL, 'POST', allData);
        
        console.log('서버 저장 완료:', result);
        alert('모든 좌석 정보가 서버에 저장되었습니다.');
        
    } catch (error) {
        console.error('서버 저장 오류:', error);
        alert('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
}

// localStorage에서 조장 데이터 로드
function loadManagerDataFromStorage() {
    try {
        const managerTextarea = document.querySelector('.manager');
        const savedManagerData = localStorage.getItem('managerData');
        
        if (savedManagerData && managerTextarea) {
            managerTextarea.value = savedManagerData;
            console.log('✅ localStorage에서 조장 데이터 로드 완료:', savedManagerData);
        } else {
            console.log('⚠️ localStorage에 저장된 조장 데이터 없음');
        }
    } catch (error) {
        console.error('❌ localStorage에서 조장 데이터 로드 실패:', error);
    }
}

// localStorage에서 조원 데이터 로드
function loadMemberDataFromStorage() {
    try {
        const memberTextarea = document.querySelector('.member');
        const savedMemberData = localStorage.getItem('memberData');
        
        if (savedMemberData && memberTextarea) {
            memberTextarea.value = savedMemberData;
            console.log('✅ localStorage에서 조원 데이터 로드 완료:', savedMemberData);
        } else {
            console.log('⚠️ localStorage에 저장된 조원 데이터 없음');
        }
    } catch (error) {
        console.error('❌ localStorage에서 조원 데이터 로드 실패:', error);
    }
}

// localStorage에 저장된 조장/조원 정보를 td에 배치하는 함수
function loadTdNamesFromStorage() {
    try {
        console.log('=== localStorage에서 td 이름 정보 로드 시작 ===');
        
        // 가장 최근 조장 배치 정보 가져오기
        const managerHistory = localStorage.getItem('managerTdNamesHistory');
        if (managerHistory) {
            const managerHistoryData = JSON.parse(managerHistory);
            if (managerHistoryData.length > 0) {
                const latestManagerData = managerHistoryData[managerHistoryData.length - 1];
                console.log('최근 조장 배치 정보:', latestManagerData);
                applyTdNamesToTable(latestManagerData.managerData, 'ban');
            }
        }
        
        // 가장 최근 조원 배치 정보 가져오기
        const memberHistory = localStorage.getItem('memberTdNamesHistory');
        if (memberHistory) {
            const memberHistoryData = JSON.parse(memberHistory);
            if (memberHistoryData.length > 0) {
                const latestMemberData = memberHistoryData[memberHistoryData.length - 1];
                console.log('최근 조원 배치 정보:', latestMemberData);
                applyTdNamesToTable(latestMemberData.memberData, 'active');
            }
        }
        
        console.log('✅ localStorage에서 td 이름 정보 로드 완료');
        
    } catch (error) {
        console.error('❌ localStorage에서 td 이름 정보 로드 실패:', error);
    }
}

// td 이름 정보를 테이블에 적용하는 함수
function applyTdNamesToTable(nameData, targetClass) {
    try {
        console.log(`=== ${targetClass} 클래스 td에 이름 적용 시작 ===`);
        console.log('적용할 이름 데이터:', nameData);
        
        Object.keys(nameData).forEach(tdNumber => {
            const td = document.querySelector(`.tbl td[data-no="${tdNumber}"]`);
            if (td) {
                const input = td.querySelector('input[type="text"]');
                const checkbox = td.querySelector('input[type="checkbox"]');
                
                if (input) {
                    input.value = nameData[tdNumber];
                    console.log(`TD ${tdNumber}에 "${nameData[tdNumber]}" 적용 완료`);
                    
                    // 조장(ban 클래스)인 경우 체크박스도 체크
                    if (targetClass === 'ban' && checkbox) {
                        checkbox.checked = true;
                        td.classList.add('ban');
                        td.classList.remove('active');
                        input.disabled = true;
                        console.log(`TD ${tdNumber} 체크박스 체크 완료`);
                    }
                }
            } else {
                console.warn(`TD ${tdNumber}를 찾을 수 없음`);
            }
        });
        
        console.log(`✅ ${targetClass} 클래스 td 이름 적용 완료`);
        
    } catch (error) {
        console.error(`❌ ${targetClass} 클래스 td 이름 적용 실패:`, error);
    }
}

// localStorage에 조장 데이터 저장
function saveManagerDataToStorage() {
    try {
        const managerTextarea = document.querySelector('.manager');
        if (managerTextarea) {
            localStorage.setItem('managerData', managerTextarea.value);
            console.log('✅ 조장 데이터 localStorage 저장 완료:', managerTextarea.value);
        }
    } catch (error) {
        console.error('❌ 조장 데이터 localStorage 저장 실패:', error);
    }
}

// localStorage에 조원 데이터 저장
function saveMemberDataToStorage() {
    try {
        const memberTextarea = document.querySelector('.member');
        if (memberTextarea) {
            localStorage.setItem('memberData', memberTextarea.value);
            console.log('✅ 조원 데이터 localStorage 저장 완료:', memberTextarea.value);
        }
    } catch (error) {
        console.error('❌ 조원 데이터 localStorage 저장 실패:', error);
    }
}

// 조장 데이터 저장 함수
async function saveManagerData() {
    try {
        const managerTextarea = document.querySelector('.manager');
        const managerData = managerTextarea.value;
        
        console.log('조장 데이터 저장 시작:', managerData);
        
        // localStorage에도 저장
        saveManagerDataToStorage();
        
        // 과목 정보 가져오기
        const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
        
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_MANAGER, 'POST', {
            manager: managerData,
            timestamp: new Date().toISOString(),
            subjectId: subjectInfo?.subjectId || '',
            subjectTitle: subjectInfo?.subjectTitle || ''
        });
        
        console.log('조장 데이터 저장 완료:', result);
        alert('조장 데이터가 서버에 저장되었습니다.');
        
    } catch (error) {
        console.error('조장 데이터 저장 오류:', error);
        alert('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
}

// 조원 데이터 저장 함수
async function saveMemberData() {
    try {
        const memberTextarea = document.querySelector('.member');
        const memberData = memberTextarea.value;
        
        console.log('조원 데이터 저장 시작:', memberData);
        
        // localStorage에도 저장
        saveMemberDataToStorage();
        
        // 과목 정보 가져오기
        const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
        
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_MEMBER, 'POST', {
            member: memberData,
            timestamp: new Date().toISOString(),
            subjectId: subjectInfo?.subjectId || '',
            subjectTitle: subjectInfo?.subjectTitle || ''
        });
        
        console.log('조원 데이터 저장 완료:', result);
        alert('조원 데이터가 서버에 저장되었습니다.');
        
    } catch (error) {
        console.error('조원 데이터 저장 오류:', error);
        alert('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
}

// 테이블 설정 저장 함수
async function saveTableConfig() {
    try {
        const rowInput = document.querySelector('.table-row');
        const colInput = document.querySelector('.table-col');
        const rowValue = rowInput.value;
        const colValue = colInput.value;
        
        console.log('테이블 설정 저장 시작:', { row: rowValue, col: colValue });
        
        // 과목 정보 가져오기
        const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
        
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_TABLE_CONFIG, 'POST', {
            tableConfig: {
                rows: parseInt(rowValue),
                cols: parseInt(colValue)
            },
            timestamp: new Date().toISOString(),
            subjectId: subjectInfo?.subjectId || '',
            subjectTitle: subjectInfo?.subjectTitle || ''
        });
        
        console.log('테이블 설정 저장 완료:', result);
        alert('테이블 설정이 서버에 저장되었습니다.');
        
    } catch (error) {
        console.error('테이블 설정 저장 오류:', error);
        alert('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
}

let 조장; 
let 조원; 
let 고정이름 = [];    
let 고정번호 = [];
let draggedElement = null; // 드래그 중인 요소
let positions = {}; // 위치 정보 저장
let tdNumbers = []; // td 숫자 배열 저장
let deletedTdList = []; // 삭제된 td 번호 리스트

// localStorage에서 td 숫자 배열 로드
function loadTdNumbersFromStorage() {
    try {
        const savedTdNumbers = localStorage.getItem('tdNumbers');
        if (savedTdNumbers) {
            tdNumbers = JSON.parse(savedTdNumbers);
            console.log('✅ localStorage에서 td 숫자 배열 로드 완료:', tdNumbers);
        } else {
            console.log('⚠️ localStorage에 저장된 td 숫자 배열 없음');
            tdNumbers = [];
        }
    } catch (error) {
        console.error('❌ localStorage에서 td 숫자 배열 로드 실패:', error);
        tdNumbers = [];
    }
}

// localStorage에 td 숫자 배열 저장
function saveTdNumbersToStorage() {
    try {
        localStorage.setItem('tdNumbers', JSON.stringify(tdNumbers));
        console.log('✅ td 숫자 배열 localStorage 저장 완료:', tdNumbers);
    } catch (error) {
        console.error('❌ td 숫자 배열 localStorage 저장 실패:', error);
    }
}

// localStorage에서 행열 정보 로드
function loadTableConfigFromStorage() {
    try {
        const savedConfig = localStorage.getItem('tableConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            const rowInput = document.querySelector('.table-row');
            const colInput = document.querySelector('.table-col');
            
            if (rowInput && colInput) {
                rowInput.value = config.rows || 3;
                colInput.value = config.cols || 6;
                console.log('✅ localStorage에서 행열 정보 로드 완료:', config);
            }
        } else {
            console.log('⚠️ localStorage에 저장된 행열 정보 없음');
        }
    } catch (error) {
        console.error('❌ localStorage에서 행열 정보 로드 실패:', error);
    }
}

// localStorage에 행열 정보 저장
function saveTableConfigToStorage() {
    try {
        const rowInput = document.querySelector('.table-row');
        const colInput = document.querySelector('.table-col');
        
        if (rowInput && colInput) {
            const config = {
                rows: parseInt(rowInput.value) || 3,
                cols: parseInt(colInput.value) || 6
            };
            localStorage.setItem('tableConfig', JSON.stringify(config));
            console.log('✅ 행열 정보 localStorage 저장 완료:', config);
        }
    } catch (error) {
        console.error('❌ 행열 정보 localStorage 저장 실패:', error);
    }
}

// td 숫자 배열 확인 함수 (디버깅용)
function showTdNumbers() {
    console.log('=== 현재 td 숫자 배열 ===');
    console.log('tdNumbers:', tdNumbers);
    console.log('localStorage에서 로드:', localStorage.getItem('tdNumbers'));
    console.log('=== td 숫자 배열 확인 완료 ===');
}

// 행열 정보 확인 함수 (디버깅용)
function showTableConfig() {
    console.log('=== 현재 행열 정보 ===');
    const rowInput = document.querySelector('.table-row');
    const colInput = document.querySelector('.table-col');
    console.log('현재 입력값 - 행:', rowInput?.value, '열:', colInput?.value);
    console.log('localStorage에서 로드:', localStorage.getItem('tableConfig'));
    console.log('=== 행열 정보 확인 완료 ===');
}

// JSON 데이터 로드 함수
async function loadDataFromJSON() {
    try {
        // 조장 데이터 로드
        const jojangResponse = await fetch('dataset/jojang.json');
        const jojangData = await jojangResponse.json();
        
        // 조원 데이터 로드
        const jooneResponse = await fetch('dataset/joone.json');
        const jooneData = await jooneResponse.json();
        
        // 서버에서 위치 데이터 가져오기
        await loadPositionsFromServer();
        
        // 입력란에 데이터 설정
        const managerTextarea = document.querySelector('.manager');
        const memberTextarea = document.querySelector('.member');
        
        if (managerTextarea && jojangData.jojang) {
            managerTextarea.value = jojangData.jojang.join(',');
        }
        
        if (memberTextarea && jooneData.joone) {
            memberTextarea.value = jooneData.joone.join(',');
        }
        
        console.log('JSON 데이터 로드 완료');
    } catch (error) {
        console.error('JSON 데이터 로드 실패:', error);
    }
}

// 기본 위치 정보 설정
function setDefaultPositions() {
    console.log('=== 기본 위치 정보 설정 ===');
    positions = {
        teacher: { x: 10, y: -70 },
        tds: {}
    };
    console.log('기본 위치 정보:', positions);
    console.log('=== 기본 위치 정보 설정 완료 ===');
}

// 위치 정보 저장 함수
function savePositions() {
    try {
        localStorage.setItem('seatPositions', JSON.stringify(positions));
        console.log('위치 정보 저장 완료');
    } catch (error) {
        console.error('위치 정보 저장 오류:', error);
    }
}

// 강사 위치 적용 함수
function applyTeacherPosition() {
    console.log('=== 강사 위치 적용 시작 ===');
    const teacherLabel = document.querySelector('.teacher-label');
    if (teacherLabel && positions.teacher) {
        teacherLabel.style.left = positions.teacher.x + 'px';
        teacherLabel.style.top = positions.teacher.y + 'px';
        console.log('✅ 강사 위치 적용 완료:', positions.teacher);
    } else {
        console.warn('⚠️ 강사 요소를 찾을 수 없거나 위치 정보가 없음');
        console.log('teacherLabel 존재:', !!teacherLabel);
        console.log('positions.teacher:', positions.teacher);
    }
    console.log('=== 강사 위치 적용 완료 ===');
}

// TD 위치 적용 함수
function applyTdPositions() {
    console.log('=== TD 위치 적용 시작 ===');
    const tds = document.querySelectorAll('.tbl td');
    console.log('찾은 TD 개수:', tds.length);
    
    let appliedCount = 0;
    tds.forEach(td => {
        const dataNo = td.getAttribute('data-no');
        if (dataNo && positions.tds && positions.tds[dataNo] && !positions.tds[dataNo].deleted) {
            td.style.position = 'absolute';
            td.style.left = positions.tds[dataNo].x + 'px';
            td.style.top = positions.tds[dataNo].y + 'px';
            td.style.zIndex = '1000';
            appliedCount++;
            console.log(`TD ${dataNo} 위치 적용:`, positions.tds[dataNo]);
        }
    });
    
    console.log(`✅ TD 위치 적용 완료: ${appliedCount}개 적용됨`);
    console.log('=== TD 위치 적용 완료 ===');
}

// 위치 초기화 함수
function resetPositions() {
    if (confirm('위치 정보만 초기화하시겠습니까? (조장/조원 데이터, 테이블 설정 등은 유지됩니다)')) {
        console.log('=== 위치 정보만 초기화 시작 ===');
        
        // 위치 정보만 localStorage에서 삭제
        localStorage.removeItem('seatPositions');
        
        // positions 객체만 초기화
        positions = {
            teacher: { x: 10, y: -70 },
            tds: {}
        };
        
        // 강사 div 위치만 초기화
        const teacherLabel = document.querySelector('.teacher-label');
        if (teacherLabel) {
            teacherLabel.style.left = '10px';
            teacherLabel.style.top = '-70px';
            console.log('✅ 강사 위치 초기화 완료');
        }
        
        // 모든 TD 위치만 초기화 (내용은 유지)
        const tds = document.querySelectorAll('.tbl td');
        tds.forEach(td => {
            td.style.position = '';
            td.style.left = '';
            td.style.top = '';
            td.style.zIndex = '';
        });
        console.log(`✅ TD 위치 초기화 완료: ${tds.length}개`);
        
        console.log('✅ 위치 정보만 초기화 완료');
        console.log('=== 위치 정보만 초기화 완료 ===');
        alert('위치 정보가 초기화되었습니다. (조장/조원 데이터, 테이블 설정 등은 유지됩니다)');
    }
}

// 현재 위치 정보 업데이트 함수
function updateCurrentPositions() {
    // 강사 div 현재 위치 업데이트
    const teacherLabel = document.querySelector('.teacher-label');
    if (teacherLabel) {
        const rect = teacherLabel.getBoundingClientRect();
        const sectionRect = teacherLabel.closest('section').getBoundingClientRect();
        positions.teacher = {
            x: rect.left - sectionRect.left,
            y: rect.top - sectionRect.top
        };
    }
    
    // TD들 현재 위치 업데이트
    const tds = document.querySelectorAll('.tbl td');
    if (!positions.tds) positions.tds = {};
    
    tds.forEach(td => {
        const dataNo = td.getAttribute('data-no');
        if (dataNo) {
            const rect = td.getBoundingClientRect();
            const sectionRect = td.closest('section').getBoundingClientRect();
            positions.tds[dataNo] = {
                x: rect.left - sectionRect.left,
                y: rect.top - sectionRect.top
            };
        }
    });
}

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== 페이지 로드 시작 ===');
    console.log('DOM 로드 완료, 데이터 로드 시작...');
    
    // URL에서 과목 정보 가져오기
    const subjectInfo = getSubjectInfoFromUrl();
    if (subjectInfo.subjectId || subjectInfo.subjectTitle) {
        console.log('URL에서 과목 정보 감지:', subjectInfo);
        
        // 페이지 제목 업데이트
        updatePageTitle(subjectInfo.subjectTitle);
        
        // 과목 정보를 localStorage에 저장
        saveSubjectInfoToStorage(subjectInfo);
        
        // 과목 정보를 화면에 표시 (선택사항)
        displaySubjectInfo(subjectInfo);
    } else {
        // URL에 과목 정보가 없으면 localStorage에서 가져오기
        const savedSubjectInfo = loadSubjectInfoFromStorage();
        if (savedSubjectInfo) {
            console.log('localStorage에서 과목 정보 로드:', savedSubjectInfo);
            updatePageTitle(savedSubjectInfo.subjectTitle);
            displaySubjectInfo(savedSubjectInfo);
        }
    }
    
    // textarea 자동 저장 이벤트 리스너 추가
    addTextareaAutoSaveListeners();
    
    // 서버에서 과목별 데이터 로드 (subjectId가 있는 경우에만)
    loadPositionsFromServer().then(() => {
        console.log('=== 서버 데이터 로드 완료, 위치 적용 시작 ===');
        // 서버 데이터 로드 완료 후 위치 적용
        setTimeout(() => {
            console.log('위치 적용 지연 실행 시작...');
            applyTeacherPosition();
            applyTdPositions();
            
            // localStorage에서 저장된 조장/조원 정보를 td에 배치
            loadTdNamesFromStorage();
            
            console.log('=== 페이지 로드 완료 ===');
        }, 100);
    });
    
    console.log('이동 기능 초기화 시작...');
    initTeacherMove();
    initTdMove();
    console.log('이동 기능 초기화 완료');
    
    // 기본 테이블 생성 (페이지 로드 시)
    createTd();
});

// 과목 정보를 화면에 표시하는 함수 (선택사항)
function displaySubjectInfo(subjectInfo) {
    try {
        // 페이지 상단에 과목 정보 표시 영역이 있다면 업데이트
        const subjectDisplay = document.querySelector('.subject-info') || document.querySelector('.top-header');
        if (subjectDisplay && subjectInfo.subjectTitle) {
            subjectDisplay.innerHTML = `
                <div style="padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                    <strong>과목:</strong> ${subjectInfo.subjectTitle}
                    ${subjectInfo.subjectId ? `<br><strong>과목 ID:</strong> ${subjectInfo.subjectId}` : ''}
                </div>
            `;
            console.log('과목 정보 화면 표시 완료');
        }
    } catch (error) {
        console.error('과목 정보 화면 표시 실패:', error);
    }
}

// textarea 자동 저장 이벤트 리스너 추가
function addTextareaAutoSaveListeners() {
    const managerTextarea = document.querySelector('.manager');
    const memberTextarea = document.querySelector('.member');
    
    if (managerTextarea) {
        managerTextarea.addEventListener('input', function() {
            saveManagerDataToStorage();
        });
        console.log('✅ 조장 textarea 자동 저장 이벤트 리스너 추가 완료');
    }
    
    if (memberTextarea) {
        memberTextarea.addEventListener('input', function() {
            saveMemberDataToStorage();
        });
        console.log('✅ 조원 textarea 자동 저장 이벤트 리스너 추가 완료');
    }
}

// 드래그 앤 드롭 관련 함수들
function addDragAndDropListeners() {
    const tds = document.querySelectorAll('.tbl td');
    
    tds.forEach(td => {
        // 드래그 시작
        td.addEventListener('dragstart', function(e) {
            draggedElement = this;
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
        });
        
        // 드래그 종료
        td.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
            draggedElement = null;
        });
        
        // 드래그 오버 (드롭 영역 표시)
        td.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });
        
        // 드래그 리브 (드롭 영역 표시 제거)
        td.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });
        
        // 드롭
        td.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (draggedElement && draggedElement !== this) {
                // 드래그된 요소의 opacity 해제
                draggedElement.style.opacity = '1';
                
                // 체크박스 상태 저장 (빈칸 TD는 체크박스가 없을 수 있음)
                const draggedCheckbox = draggedElement.querySelector('input[type="checkbox"]');
                const targetCheckbox = this.querySelector('input[type="checkbox"]');
                const draggedChecked = draggedCheckbox ? draggedCheckbox.checked : false;
                const targetChecked = targetCheckbox ? targetCheckbox.checked : false;
                
                // 두 td의 내용을 교환
                const tempHTML = this.innerHTML;
                const tempDataNo = this.getAttribute('data-no');
                const tempClassList = this.className;
                const tempDraggable = this.getAttribute('draggable');
                const tempStyle = this.getAttribute('style');
                
                this.innerHTML = draggedElement.innerHTML;
                this.setAttribute('data-no', draggedElement.getAttribute('data-no'));
                this.className = draggedElement.className;
                this.setAttribute('draggable', draggedElement.getAttribute('draggable'));
                this.setAttribute('style', draggedElement.getAttribute('style'));
                
                draggedElement.innerHTML = tempHTML;
                draggedElement.setAttribute('data-no', tempDataNo);
                draggedElement.className = tempClassList;
                draggedElement.setAttribute('draggable', tempDraggable);
                draggedElement.setAttribute('style', tempStyle);
                
                // 체크박스 상태 복원 (체크박스가 있는 경우에만)
                const newDraggedCheckbox = draggedElement.querySelector('input[type="checkbox"]');
                const newTargetCheckbox = this.querySelector('input[type="checkbox"]');
                
                if (newDraggedCheckbox) {
                    newDraggedCheckbox.checked = targetChecked;
                    // 체크박스 상태에 따른 클래스 업데이트
                    if (targetChecked) {
                        draggedElement.classList.add("ban");
                        draggedElement.classList.remove('active');
                        newDraggedCheckbox.disabled = true;
                    } else {
                        draggedElement.classList.remove("ban");
                        draggedElement.classList.add('active');
                        newDraggedCheckbox.disabled = false;
                    }
                    // 체크박스 이벤트 리스너 다시 연결
                    addCheckboxEventListener(newDraggedCheckbox);
                }
                
                if (newTargetCheckbox) {
                    newTargetCheckbox.checked = draggedChecked;
                    // 체크박스 상태에 따른 클래스 업데이트
                    if (draggedChecked) {
                        this.classList.add("ban");
                        this.classList.remove('active');
                        newTargetCheckbox.disabled = true;
                    } else {
                        this.classList.remove("ban");
                        this.classList.add('active');
                        newTargetCheckbox.disabled = false;
                    }
                    // 체크박스 이벤트 리스너 다시 연결
                    addCheckboxEventListener(newTargetCheckbox);
                }
                
                // 고정 상태 업데이트
                updateFixedStatus();
                
                // draggedElement 초기화
                draggedElement = null;
            }
        });
    });
}

// 고정 상태 업데이트 함수
function updateFixedStatus() {
    const tds = document.querySelectorAll('.tbl td');
    고정이름 = [];
    고정번호 = [];
    
    tds.forEach(td => {
        const fixedIcon = td.querySelector('.material-symbols-outlined');
        const input = td.querySelector('input[type="text"]');
        
        if (fixedIcon && fixedIcon.classList.contains('fixed')) {
            const std_name = input.value;
            const no = td.getAttribute('data-no');
            
            if (std_name && !고정이름.includes(std_name)) {
                고정이름.push(std_name);
            }
            if (no && !고정번호.includes(no)) {
                고정번호.push(no);
            }
        }
    });
    
    console.log('고정이름 업데이트:', 고정이름);
    console.log('고정번호 업데이트:', 고정번호);
}

// 체크박스 이벤트 리스너 함수
function addCheckboxEventListener(checkbox) {
    const parentNode = checkbox.parentNode;
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    checkbox.removeEventListener('change', checkbox.changeHandler);
    
    // 새로운 이벤트 리스너 추가
    checkbox.changeHandler = function() {
        if (checkbox.checked) {
            parentNode.classList.add("ban");
            parentNode.classList.remove('active');
            
            const textField = parentNode.querySelector('input[type="text"]');
            if (textField) textField.disabled = true;
        } else {
            parentNode.classList.remove("ban");
            parentNode.classList.add('active');
            
            const textField = parentNode.querySelector('input[type="text"]');
            if (textField) textField.disabled = false;
        }
    };
    
    checkbox.addEventListener("change", checkbox.changeHandler);
}

// 테이블 생성 함수
const createTd = ()=>{
    const row = document.querySelector('.table-row').value;
    const col = document.querySelector('.table-col').value;
    const tbl = document.querySelector('.tbl');
    
    //기존테이블삭제
    // 자식 노드가 있는지 판별
    if(tbl.hasChildNodes()){
        // 모든 자식 노드를 삭제한다.
        tbl.replaceChildren();
    }

    // 행열생성 버튼 클릭 시 tdNumbers와 tableConfig만 삭제 (positions는 유지)
    console.log('=== 행열생성 버튼 클릭 - tdNumbers, tableConfig 초기화 ===');
    localStorage.removeItem('tdNumbers');
    localStorage.removeItem('tableConfig');
    
    // positions는 유지 (기존 위치 정보 보존)
    console.log('기존 positions 정보 유지:', positions);
    
    // td 숫자 배열만 초기화
    tdNumbers = [];
    
    // 삭제된 td 리스트 로드 (유지)
    loadDeletedTdListFromStorage();
    
    console.log('✅ tdNumbers, tableConfig 초기화 완료 (positions, deletedTdList 유지)');
    
    // 새로운 td 숫자 배열 생성
    const totalCells = row * col;
    for (let i = 1; i <= totalCells; i++) {
        tdNumbers.push(i);
    }
    console.log('새로운 td 숫자 배열 생성:', tdNumbers);
    console.log('삭제된 td 리스트:', deletedTdList);
    
    // localStorage에 새로운 td 숫자 배열 저장
    saveTdNumbersToStorage();
    
    // localStorage에 행열 정보 저장
    saveTableConfigToStorage();

    let cnt = 1;
    for(i=0;i<row;i++){
        const tr = document.createElement('tr');
       
        for(j=0;j<col;j++){
            const td = document.createElement("td");
            // 새로운 tdNumbers 배열의 해당 인덱스 값 사용
            const tdNumber = tdNumbers[cnt - 1] || cnt;
            
            // 삭제 리스트에 있는 번호인지 확인
            if (deletedTdList.includes(tdNumber)) {
                // 삭제된 TD는 빈칸으로 표시
                td.innerHTML = '';
                td.setAttribute("data-no", tdNumber);
                td.classList.add('deleted');
                td.style.backgroundColor = '#f8f9fa';
                td.style.border = '1px dashed #dee2e6';
                td.style.color = '#6c757d';
                
                // 복원 버튼 생성 함수
                function createRestoreButton() {
                    const restoreButton = document.createElement('button');
                    restoreButton.innerHTML = "↺";
                    restoreButton.setAttribute('class','td-restore-btn');
                    restoreButton.setAttribute('style','position:absolute;right:0px;top:0px;width:20px;height:20px;border-radius:0 5px 0 5px;background-color:#28a745;color:white;border:none;font-size:14px;font-weight:bold;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);');
                    
                    restoreButton.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (confirm(`TD ${tdNumber}를 복원하시겠습니까?`)) {
                            // 삭제 리스트에서 제거
                            const index = deletedTdList.indexOf(tdNumber);
                            if (index > -1) {
                                deletedTdList.splice(index, 1);
                                saveDeletedTdListToStorage();
                                console.log(`TD ${tdNumber}가 삭제 리스트에서 제거됨`);
                            }
                            
                            // localStorage에서 해당 TD 위치 정보의 삭제 상태 해제
                            if (positions.tds && positions.tds[tdNumber]) {
                                delete positions.tds[tdNumber].deleted;
                                localStorage.setItem('seatPositions', JSON.stringify(positions));
                            }
                            
                            // TD를 정상 상태로 복원
                            td.innerHTML = tdNumber;
                            td.classList.remove('deleted');
                            td.classList.add('non-fixed', 'active');
                            td.style.backgroundColor = '';
                            td.style.border = '';
                            td.style.color = '';
                            td.setAttribute('draggable', 'true');
                            
                            // 복원 버튼 제거
                            restoreButton.remove();
                            
                            // 정상 TD 요소들 추가
                            const chk = document.createElement('input');
                            chk.setAttribute('type','checkbox');
                            td.appendChild(chk);
                            addCheckboxEventListener(chk);

                            //FIXED 자리 지정
                            const fixedIcon = document.createElement('span');
                            fixedIcon.innerHTML = "push_pin";
                            fixedIcon.setAttribute('class','material-symbols-outlined pin-icon');
                            fixedIcon.setAttribute('style','position:absolute;left:80%;top:5px;font-size.0.5rem;z-index:5;cursor:pointer;font-size:1.25rem;color:green');

                            fixedIcon.addEventListener('click',function(){
                                
                                if(fixedIcon.classList.contains('fixed')){
                                   
                                    fixedIcon.style.color="green";
                                    fixedIcon.classList.remove('fixed');
                                    const tdEl = fixedIcon.parentNode;
                                    const std_name =  tdEl.querySelector("input[type='text']").value;
                                    고정이름.pop(std_name);
                                    const no = tdEl.getAttribute('data-no');
                                    고정번호.pop(no);

                                    tdEl.classList.remove('fixed');
                                    tdEl.classList.add('non-fixed');

                                    

                                    console.log(고정이름)
                                    console.log(고정번호)

                                }else{
                                    fixedIcon.style.color="red";
                                    fixedIcon.classList.add('fixed');

                                    const tdEl = fixedIcon.parentNode;
                                    const std_name =  tdEl.querySelector("input[type='text']").value;
                                    const no = tdEl.getAttribute('data-no');
                                    고정이름.push(std_name);
                                    고정번호.push(no);
                                    tdEl.classList.add('fixed');
                                    tdEl.classList.remove('non-fixed');

                                    console.log(고정이름)
                                    console.log(고정번호)
                                }
                            })

                            td.appendChild(fixedIcon);

                            // 이동 아이콘 추가
                            const moveIcon = document.createElement('span');
                            moveIcon.innerHTML = "arrows_output";
                            moveIcon.setAttribute('class','material-symbols-outlined td-move-icon');
                            moveIcon.setAttribute('style','position:absolute;right:2px;top:2px;font-size:14px;z-index:5;cursor:pointer;color:#666;transition:color 0.2s ease;');

                            td.appendChild(moveIcon);

                            // X 버튼 추가 (삭제 버튼)
                            const deleteButton = document.createElement('button');
                            deleteButton.innerHTML = "×";
                            deleteButton.setAttribute('class','td-delete-btn');
                            deleteButton.setAttribute('style','position:absolute;right:0px;top:0px;width:20px;height:20px;border-radius:0 5px 0 5px;background-color:#ff4444;color:white;border:none;font-size:14px;font-weight:bold;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);');
                            
                            deleteButton.addEventListener('click', function(e) {
                                e.stopPropagation();
                                if (confirm(`TD ${tdNumber}를 삭제하시겠습니까?`)) {
                                    // 삭제 리스트에 추가
                                    addToDeletedList(tdNumber);
                                    
                                    // localStorage에서 해당 TD 위치 정보를 삭제 상태로 표시
                                    if (!positions.tds) positions.tds = {};
                                    positions.tds[tdNumber] = { deleted: true };
                                    localStorage.setItem('seatPositions', JSON.stringify(positions));
                                    
                                    console.log(`TD ${tdNumber}가 삭제 리스트에 추가되고 localStorage에 저장됨`);
                                    
                                    // TD 요소를 빈칸으로 변경
                                    td.innerHTML = '';
                                    td.classList.remove('non-fixed', 'active');
                                    td.classList.add('deleted');
                                    td.style.backgroundColor = '#f8f9fa';
                                    td.style.border = '1px dashed #dee2e6';
                                    td.style.color = '#6c757d';
                                    td.removeAttribute('draggable');
                                    
                                    // 복원 버튼 다시 추가
                                    const newRestoreButton = createRestoreButton();
                                    td.appendChild(newRestoreButton);
                                    
                                    console.log(`TD ${tdNumber} 삭제됨 (빈칸으로 표시)`);
                                }
                            });

                            td.appendChild(deleteButton);

                            const input = document.createElement('input');
                            input.setAttribute('type','text');
                            td.appendChild(input);

                            console.log(`TD ${tdNumber} 복원 완료`);
                        }
                    });
                    
                    return restoreButton;
                }
                
                // 복원 버튼 추가
                const restoreButton = createRestoreButton();
                td.appendChild(restoreButton);
                console.log(`TD ${tdNumber}는 삭제된 상태로 빈칸 표시`);
            } else {
                // 정상 TD 표시
                td.innerHTML = tdNumber;
                td.setAttribute("data-no", tdNumber);
            td.classList.add('non-fixed');
            
            // 드래그 가능하도록 설정
            td.setAttribute('draggable', 'true');

            const chk = document.createElement('input');
            chk.setAttribute('type','checkbox');
            td.appendChild(chk);
            
            // 체크박스 이벤트 리스너 연결
            addCheckboxEventListener(chk);

            //FIXED 자리 지정
            const fixedIcon = document.createElement('span');
            fixedIcon.innerHTML = "push_pin";
            fixedIcon.setAttribute('class','material-symbols-outlined pin-icon');
            fixedIcon.setAttribute('style','position:absolute;left:80%;top:5px;font-size.0.5rem;z-index:5;cursor:pointer;font-size:1.25rem;color:green');

            fixedIcon.addEventListener('click',function(){
                
                if(fixedIcon.classList.contains('fixed')){
                   
                    fixedIcon.style.color="green";
                    fixedIcon.classList.remove('fixed');
                    const tdEl = fixedIcon.parentNode;
                    const std_name =  tdEl.querySelector("input[type='text']").value;
                    고정이름.pop(std_name);
                    const no = tdEl.getAttribute('data-no');
                    고정번호.pop(no);

                    tdEl.classList.remove('fixed');
                    tdEl.classList.add('non-fixed');

                    

                    console.log(고정이름)
                    console.log(고정번호)

                }else{
                    fixedIcon.style.color="red";
                    fixedIcon.classList.add('fixed');

                    const tdEl = fixedIcon.parentNode;
                    const std_name =  tdEl.querySelector("input[type='text']").value;
                    const no = tdEl.getAttribute('data-no');
                    고정이름.push(std_name);
                    고정번호.push(no);
                    tdEl.classList.add('fixed');
                    tdEl.classList.remove('non-fixed');

                    console.log(고정이름)
                    console.log(고정번호)
                }
            })

            td.appendChild(fixedIcon);

            // 이동 아이콘 추가
            const moveIcon = document.createElement('span');
            moveIcon.innerHTML = "arrows_output";
            moveIcon.setAttribute('class','material-symbols-outlined td-move-icon');
            moveIcon.setAttribute('style','position:absolute;right:2px;top:2px;font-size:14px;z-index:5;cursor:pointer;color:#666;transition:color 0.2s ease;');

            td.appendChild(moveIcon);

            // X 버튼 추가 (삭제 버튼)
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = "×";
            deleteButton.setAttribute('class','td-delete-btn');
            deleteButton.setAttribute('style','position:absolute;right:0px;top:0px;width:20px;height:20px;border-radius:0 5px 0 5px;background-color:#ff4444;color:white;border:none;font-size:14px;font-weight:bold;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);');
            
            deleteButton.addEventListener('click', function(e) {
                e.stopPropagation();
                    if (confirm(`TD ${tdNumber}를 삭제하시겠습니까?`)) {
                        // 삭제 리스트에 추가
                        addToDeletedList(tdNumber);
                        
                    // localStorage에서 해당 TD 위치 정보를 삭제 상태로 표시
                    if (!positions.tds) positions.tds = {};
                        positions.tds[tdNumber] = { deleted: true };
                    localStorage.setItem('seatPositions', JSON.stringify(positions));
                        
                        console.log(`TD ${tdNumber}가 삭제 리스트에 추가되고 localStorage에 저장됨`);
                        
                        // TD 요소를 빈칸으로 변경
                        td.innerHTML = '';
                        td.classList.remove('non-fixed', 'active');
                        td.classList.add('deleted');
                        td.style.backgroundColor = '#f8f9fa';
                        td.style.border = '1px dashed #dee2e6';
                        td.style.color = '#6c757d';
                        td.removeAttribute('draggable');
                        
                        console.log(`TD ${tdNumber} 삭제됨 (빈칸으로 표시)`);
                }
            });

            td.appendChild(deleteButton);

            const input = document.createElement('input');
            input.setAttribute('type','text');
            td.appendChild(input);

            td.classList.add('active');
            }
            
            tr.appendChild(td);

            cnt++;
        }
        tbl.appendChild(tr);
    }
    
    // 테이블 생성 후 드래그 앤 드롭 리스너 추가
    addDragAndDropListeners();
    
    // 위치 정보 적용 (기존 positions 정보 사용)
    setTimeout(() => {
        applyTdPositions();
    }, 100);
    
    console.log('✅ 새로운 테이블 생성 완료. td 숫자 배열:', tdNumbers);
    console.log('기존 positions 정보 유지됨:', positions);
    console.log('삭제된 td 리스트:', deletedTdList);
}

//셔플함수
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      // 현재 인덱스와 무작위 인덱스의 요소를 교환
      [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
    }
    return array;
}

function randomSeat(array,sel){

    let name = array.split(',');

    //고정이름은 제거하기(!!!!!!!!!!!)
    console.log("고정조원제거전 : " +  name);
    name = name.filter(x => !고정이름.includes(x));
    console.log("고정조원제거후 : " +  name);


    const shuffle = shuffleArray(name);

    i=0;
    const activeEls = document.querySelectorAll(sel+' input[type="text"]');
    activeEls.forEach(input=>{
        

        input.value=shuffle[i];
        i++;
    })

    
}

const start =  document.querySelector('.start');
let interValObj;
start.addEventListener('click',function(){

    // const textArea =  document.querySelector('.textarea');
    // console.log(textArea.value);
    // randomSeat(textArea.value);

    //조장 : 김규호 ,이재형,박민석,김민산,최원준,정대민,이종일
    //조원

    
    
    조원=document.querySelector('.member').value;

    if(interValObj==null){
        interValObj=setInterval(function(){
            //고정조원은 제외하고 전달
            randomSeat(조원,".active.non-fixed");
        },50);
    
    }else{
        alert("조원 랜덤셔플중입니다..")
      
    }

})

const stop =  document.querySelector('.stop');
stop.addEventListener("click",function(){

    clearInterval(interValObj);
    interValObj=null;
    
    // 조원랜덤 중지 시 현재 td번호와 이름을 localStorage에 저장
    saveCurrentMemberTdNamesToStorage();
})




// 조장 랜덤
const start2 =  document.querySelector('.start2');
let interValObj2;
start2.addEventListener('click',function(){

    // const textArea =  document.querySelector('.textarea');
    // console.log(textArea.value);
    // randomSeat(textArea.value);

    //조장 : 
    //조원

    조장=document.querySelector('.manager').value;
    
    if(interValObj2==null){
        interValObj2=setInterval(function(){
            randomSeat(조장,'.ban.non-fixed');
        },50);
    }else{  
        alert("조장 랜덤셔플중입니다!.");
    }

})

const stop2 =  document.querySelector('.stop2');
stop2.addEventListener("click",function(){

    clearInterval(interValObj2);
    interValObj2=null;
    
    // 조장랜덤 중지 시 현재 조장 td번호와 이름을 localStorage에 저장
    saveCurrentManagerTdNamesToStorage();
})


//정처산기 반 배정위한 FIX ITEM 선정(지울예정)

// 테이블 회전 기능
function rotateTable() {
    const tableBlock = document.querySelector('.table-block');
    tableBlock.classList.toggle('rotated');
}

// 강사 div 이동 기능
function initTeacherMove() {
    const teacherLabel = document.querySelector('.teacher-label');
    const moveIcon = document.querySelector('.move-icon');
    
    if (!teacherLabel || !moveIcon) return;
    
    let isMoving = false;
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    // 이동 아이콘 클릭 시 이동 모드 시작
    moveIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        isMoving = !isMoving;
        
        if (isMoving) {
            teacherLabel.style.cursor = 'grabbing';
            moveIcon.textContent = 'close';
            moveIcon.style.color = '#ff4444';
            document.body.style.cursor = 'crosshair';
        } else {
            teacherLabel.style.cursor = 'move';
            moveIcon.textContent = 'arrows_output';
            moveIcon.style.color = '#666';
            document.body.style.cursor = 'default';
            isDragging = false;
        }
    });
    
    // 마우스 다운 이벤트 (드래그 시작)
    teacherLabel.addEventListener('mousedown', function(e) {
        if (!isMoving) return;
        e.preventDefault();
        
        isDragging = true;
        const teacherSection = teacherLabel.closest('section');
        const sectionRect = teacherSection.getBoundingClientRect();
        
        // 현재 위치 저장
        const currentLeft = parseInt(teacherLabel.style.left) || 0;
        const currentTop = parseInt(teacherLabel.style.top) || -70;
        
        // 마우스 시작 위치와 div 시작 위치의 차이
        startX = e.clientX - currentLeft;
        startY = e.clientY - currentTop;
        
        teacherLabel.style.cursor = 'grabbing';
    });
    
    // 마우스 무브 이벤트 (드래그 중)
    document.addEventListener('mousemove', function(e) {
        if (!isMoving || !isDragging) return;
        
        const teacherSection = teacherLabel.closest('section');
        const sectionRect = teacherSection.getBoundingClientRect();
        const teacherRect = teacherLabel.getBoundingClientRect();
        
        // 새로운 위치 계산
        const newLeft = e.clientX - startX;
        const newTop = e.clientY - startY;
        
        // 화면 경계 내에서만 이동
        const maxLeft = sectionRect.width - teacherRect.width;
        const maxTop = sectionRect.height - teacherRect.height;
        
        const finalLeft = Math.max(0, Math.min(newLeft, maxLeft));
        const finalTop = Math.max(-70, Math.min(newTop, maxTop));
        
        teacherLabel.style.left = finalLeft + 'px';
        teacherLabel.style.top = finalTop + 'px';
        teacherLabel.style.right = 'auto';
        
        // 위치 정보 업데이트
        positions.teacher = { x: finalLeft, y: finalTop };
    });
    
    // 마우스 업 이벤트 (드래그 종료)
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            teacherLabel.style.cursor = 'move';
            
            // 위치 정보 저장
            savePositions();
        }
    });
    
    // ESC 키로 이동 모드 취소
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMoving) {
            isMoving = false;
            isDragging = false;
            teacherLabel.style.cursor = 'move';
            moveIcon.textContent = 'arrows_output';
            moveIcon.style.color = '#666';
            document.body.style.cursor = 'default';
        }
    });
}

// TD 요소 이동 기능
function initTdMove() {
    let isTdMoving = false;
    let isTdDragging = false;
    let currentTd = null;
    let startX, startY, initialLeft, initialTop;
    
    // TD 이동 아이콘 클릭 이벤트 위임
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('td-move-icon')) {
            e.stopPropagation();

            // 이미 다른 td가 이동 모드였다면 강제 종료
            if (isTdMoving && currentTd && currentTd !== e.target.parentNode) {
                const prevIcon = currentTd.querySelector('.td-move-icon');
                if (prevIcon) {
                    prevIcon.textContent = 'arrows_output';
                    prevIcon.style.color = '#666';
                }
                currentTd.style.cursor = 'grab';
                currentTd.style.zIndex = 'auto';
                isTdDragging = false;
            }

            // 토글 이동 모드
            if (currentTd === e.target.parentNode && isTdMoving) {
                // 같은 td를 다시 클릭하면 이동 모드 종료
                e.target.textContent = 'arrows_output';
                e.target.style.color = '#666';
                currentTd.style.cursor = 'grab';
                document.body.style.cursor = 'default';
            } else {
                // 새 td 이동 모드 시작
                isTdMoving = true;
                currentTd = e.target.parentNode;
                e.target.textContent = 'close';
                e.target.style.color = '#ff4444';
                currentTd.style.cursor = 'grabbing';
            }
        }
    });
    
    // TD 마우스 다운 이벤트
    document.addEventListener('mousedown', function(e) {
        if (!isTdMoving || !currentTd) return;
        if (e.target.classList.contains('td-move-icon')) return;
        
        e.preventDefault();
        isTdDragging = true;
        
        const tdRect = currentTd.getBoundingClientRect();
        const tableRect = currentTd.closest('table').getBoundingClientRect();
        
        // 현재 위치 저장 (테이블 내에서의 상대 위치)
        const currentLeft = tdRect.left - tableRect.left;
        const currentTop = tdRect.top - tableRect.top;
        
        // 마우스 시작 위치와 td 시작 위치의 차이
        startX = e.clientX - currentLeft;
        startY = e.clientY - currentTop;
        
        currentTd.style.cursor = 'grabbing';
    });
    
    // TD 마우스 무브 이벤트
    document.addEventListener('mousemove', function(e) {
        if (!isTdMoving || !isTdDragging || !currentTd) return;
        
        const sectionRect = currentTd.closest('section').getBoundingClientRect();
        const tdRect = currentTd.getBoundingClientRect();
        
        // 새로운 위치 계산
        const newLeft = e.clientX - startX;
        const newTop = e.clientY - startY;
        
        // 섹션 전체 영역에서 이동 가능하도록 경계 확장 (테이블 영역을 벗어날 수 있음)
        const maxLeft = sectionRect.width - tdRect.width;
        const maxTop = sectionRect.height - tdRect.height;
        
        // 음수 값도 허용하여 테이블 영역을 벗어날 수 있도록 함
        const finalLeft = Math.max(-100, Math.min(newLeft, maxLeft + 100));
        const finalTop = Math.max(-100, Math.min(newTop, maxTop + 100));
        
        currentTd.style.position = 'absolute';
        currentTd.style.left = finalLeft + 'px';
        currentTd.style.top = finalTop + 'px';
        currentTd.style.zIndex = '1000';
        
        // 위치 정보 업데이트
        const dataNo = currentTd.getAttribute('data-no');
        if (dataNo) {
            if (!positions.tds) positions.tds = {};
            positions.tds[dataNo] = { x: finalLeft, y: finalTop };
        }
    });
    
    // TD 마우스 업 이벤트
    document.addEventListener('mouseup', function() {
        if (isTdDragging && currentTd) {
            isTdDragging = false;
            currentTd.style.cursor = 'grab';
            currentTd.style.zIndex = 'auto';
            
            // 위치 정보 저장
            savePositions();
        }
    });
    
    // ESC 키로 TD 이동 모드 취소
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isTdMoving) {
            isTdMoving = false;
            isTdDragging = false;
            if (currentTd) {
                currentTd.style.cursor = 'grab';
                currentTd.style.zIndex = 'auto';
                const moveIcon = currentTd.querySelector('.td-move-icon');
                if (moveIcon) {
                    moveIcon.textContent = 'arrows_output';
                    moveIcon.style.color = '#666';
                }
            }
            document.body.style.cursor = 'default';
            currentTd = null;
        }
    });
}

// localStorage에서 삭제된 td 리스트 로드
function loadDeletedTdListFromStorage() {
    try {
        const savedDeletedList = localStorage.getItem('deletedTdList');
        if (savedDeletedList) {
            deletedTdList = JSON.parse(savedDeletedList);
            console.log('✅ localStorage에서 삭제된 td 리스트 로드 완료:', deletedTdList);
        } else {
            console.log('⚠️ localStorage에 저장된 삭제된 td 리스트 없음');
            deletedTdList = [];
        }
    } catch (error) {
        console.error('❌ localStorage에서 삭제된 td 리스트 로드 실패:', error);
        deletedTdList = [];
    }
}

// localStorage에 삭제된 td 리스트 저장
function saveDeletedTdListToStorage() {
    try {
        localStorage.setItem('deletedTdList', JSON.stringify(deletedTdList));
        console.log('✅ 삭제된 td 리스트 localStorage 저장 완료:', deletedTdList);
    } catch (error) {
        console.error('❌ 삭제된 td 리스트 localStorage 저장 실패:', error);
    }
}

// td를 삭제 리스트에 추가
function addToDeletedList(tdNumber) {
    if (!deletedTdList.includes(tdNumber)) {
        deletedTdList.push(tdNumber);
        saveDeletedTdListToStorage();
        console.log(`TD ${tdNumber}가 삭제 리스트에 추가됨`);
    }
}

// 삭제된 td 리스트 확인 함수 (디버깅용)
function showDeletedTdList() {
    console.log('=== 삭제된 td 리스트 ===');
    console.log('deletedTdList:', deletedTdList);
    console.log('localStorage에서 로드:', localStorage.getItem('deletedTdList'));
    console.log('=== 삭제된 td 리스트 확인 완료 ===');
}

// 현재 조원 td번호와 이름을 localStorage에 저장하는 함수
function saveCurrentMemberTdNamesToStorage() {
    try {
        const tds = document.querySelectorAll('.tbl td.active.non-fixed');
        const currentMemberData = {};
        
        tds.forEach(td => {
            const dataNo = td.getAttribute('data-no');
            const input = td.querySelector('input[type="text"]');
            
            if (dataNo && input && input.value.trim() !== '') {
                currentMemberData[dataNo] = input.value.trim();
            }
        });
        
        // 기존 조원 데이터 로드
        const existingData = localStorage.getItem('memberTdNamesHistory');
        let historyData = existingData ? JSON.parse(existingData) : [];
        
        // 새로운 데이터 추가 (타임스탬프 포함)
        const newEntry = {
            timestamp: new Date().toISOString(),
            memberData: currentMemberData
        };
        
        historyData.push(newEntry);
        
        // localStorage에 저장
        localStorage.setItem('memberTdNamesHistory', JSON.stringify(historyData));
        
        console.log('✅ 현재 조원 td번호와 이름이 localStorage에 저장됨:', currentMemberData);
        console.log('저장된 조원 히스토리 개수:', historyData.length);
        
    } catch (error) {
        console.error('❌ 조원 td번호와 이름 저장 실패:', error);
    }
}

// 현재 조장 td번호와 이름을 localStorage에 저장하는 함수
function saveCurrentManagerTdNamesToStorage() {
    try {
        const tds = document.querySelectorAll('.tbl td.ban.non-fixed');
        const currentManagerData = {};
        
        tds.forEach(td => {
            const dataNo = td.getAttribute('data-no');
            const input = td.querySelector('input[type="text"]');
            
            if (dataNo && input && input.value.trim() !== '') {
                currentManagerData[dataNo] = input.value.trim();
            }
        });
        
        // 기존 조장 데이터 로드
        const existingData = localStorage.getItem('managerTdNamesHistory');
        let historyData = existingData ? JSON.parse(existingData) : [];
        
        // 새로운 데이터 추가 (타임스탬프 포함)
        const newEntry = {
            timestamp: new Date().toISOString(),
            managerData: currentManagerData
        };
        
        historyData.push(newEntry);
        
        // localStorage에 저장
        localStorage.setItem('managerTdNamesHistory', JSON.stringify(historyData));
        
        console.log('✅ 현재 조장 td번호와 이름이 localStorage에 저장됨:', currentManagerData);
        console.log('저장된 조장 히스토리 개수:', historyData.length);
        
    } catch (error) {
        console.error('❌ 조장 td번호와 이름 저장 실패:', error);
    }
}

// 저장된 조원 td번호와 이름 히스토리 확인 함수 (디버깅용)
function showMemberTdNamesHistory() {
    console.log('=== 저장된 조원 td번호와 이름 히스토리 ===');
    const historyData = localStorage.getItem('memberTdNamesHistory');
    if (historyData) {
        const history = JSON.parse(historyData);
        console.log('총 저장된 조원 히스토리 개수:', history.length);
        history.forEach((entry, index) => {
            console.log(`[${index + 1}] ${entry.timestamp}:`, entry.memberData);
        });
    } else {
        console.log('저장된 조원 히스토리가 없습니다.');
    }
    console.log('=== 조원 히스토리 확인 완료 ===');
}

// 저장된 조장 td번호와 이름 히스토리 확인 함수 (디버깅용)
function showManagerTdNamesHistory() {
    console.log('=== 저장된 조장 td번호와 이름 히스토리 ===');
    const historyData = localStorage.getItem('managerTdNamesHistory');
    if (historyData) {
        const history = JSON.parse(historyData);
        console.log('총 저장된 조장 히스토리 개수:', history.length);
        history.forEach((entry, index) => {
            console.log(`[${index + 1}] ${entry.timestamp}:`, entry.managerData);
        });
    } else {
        console.log('저장된 조장 히스토리가 없습니다.');
    }
    console.log('=== 조장 히스토리 확인 완료 ===');
}

// 현재 td번호와 이름을 localStorage에 저장하는 함수 (기존 함수 - 모든 td 저장)
function saveCurrentTdNamesToStorage() {
    try {
        const tds = document.querySelectorAll('.tbl td');
        const currentTdData = {};
        
        tds.forEach(td => {
            const dataNo = td.getAttribute('data-no');
            const input = td.querySelector('input[type="text"]');
            
            if (dataNo && input && input.value.trim() !== '') {
                currentTdData[dataNo] = input.value.trim();
            }
        });
        
        // 기존 데이터 로드
        const existingData = localStorage.getItem('tdNamesHistory');
        let historyData = existingData ? JSON.parse(existingData) : [];
        
        // 새로운 데이터 추가 (타임스탬프 포함)
        const newEntry = {
            timestamp: new Date().toISOString(),
            tdData: currentTdData
        };
        
        historyData.push(newEntry);
        
        // localStorage에 저장
        localStorage.setItem('tdNamesHistory', JSON.stringify(historyData));
        
        console.log('✅ 현재 td번호와 이름이 localStorage에 저장됨:', currentTdData);
        console.log('저장된 히스토리 개수:', historyData.length);
        
    } catch (error) {
        console.error('❌ td번호와 이름 저장 실패:', error);
    }
}

// 저장된 td번호와 이름 히스토리 확인 함수 (디버깅용)
function showTdNamesHistory() {
    console.log('=== 저장된 td번호와 이름 히스토리 ===');
    const historyData = localStorage.getItem('tdNamesHistory');
    if (historyData) {
        const history = JSON.parse(historyData);
        console.log('총 저장된 히스토리 개수:', history.length);
        history.forEach((entry, index) => {
            console.log(`[${index + 1}] ${entry.timestamp}:`, entry.tdData);
        });
    } else {
        console.log('저장된 히스토리가 없습니다.');
    }
    console.log('=== 히스토리 확인 완료 ===');
}

// 현재 과목 정보 확인 함수 (디버깅용)
function showCurrentSubjectInfo() {
    console.log('=== 현재 과목 정보 ===');
    
    // URL에서 가져온 정보
    const urlSubjectInfo = getSubjectInfoFromUrl();
    console.log('URL에서 가져온 과목 정보:', urlSubjectInfo);
    
    // localStorage에서 가져온 정보
    const storageSubjectInfo = loadSubjectInfoFromStorage();
    console.log('localStorage에서 가져온 과목 정보:', storageSubjectInfo);
    
    // 현재 페이지 제목
    console.log('현재 페이지 제목:', document.title);
    
    console.log('=== 과목 정보 확인 완료 ===');
}

// 서버 요청 파라미터 확인 함수 (디버깅용)
function showServerRequestInfo() {
    console.log('=== 서버 요청 파라미터 정보 ===');
    
    // 과목 정보 가져오기
    const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
    const subjectId = subjectInfo?.subjectId || '';
    
    console.log('현재 subjectId:', subjectId);
    
    // 각 엔드포인트별 요청 URL 예시
    const endpoints = [
        { name: '위치 정보 조회', endpoint: `${SERVER_CONFIG.ENDPOINTS.SEAT}?id=1` },
        { name: '위치 정보 저장', endpoint: SERVER_CONFIG.ENDPOINTS.SAVE_POSITIONS, method: 'POST' },
        { name: '조장 데이터 저장', endpoint: SERVER_CONFIG.ENDPOINTS.SAVE_MANAGER, method: 'POST' },
        { name: '조원 데이터 저장', endpoint: SERVER_CONFIG.ENDPOINTS.SAVE_MEMBER, method: 'POST' },
        { name: '테이블 설정 저장', endpoint: SERVER_CONFIG.ENDPOINTS.SAVE_TABLE_CONFIG, method: 'POST' }
    ];
    
    endpoints.forEach(item => {
        let url = SERVER_CONFIG.BASE_URL + item.endpoint;
        
        if (item.method === 'GET' && subjectId) {
            const separator = item.endpoint.includes('?') ? '&' : '?';
            url += `${separator}subjectId=${encodeURIComponent(subjectId)}`;
        }
        
        console.log(`${item.name}: ${item.method || 'GET'} ${url}`);
        
        if (item.method === 'POST' && subjectId) {
            console.log(`  - POST 데이터에 subjectId 포함: ${subjectId}`);
        }
    });
    
    console.log('=== 서버 요청 파라미터 정보 완료 ===');
}

// localStorage에 저장된 모든 데이터 확인 함수 (디버깅용)
function showAllLocalStorageData() {
    console.log('=== localStorage에 저장된 모든 데이터 ===');
    
    // 과목 정보
    const subjectInfo = loadSubjectInfoFromStorage();
    console.log('과목 정보:', subjectInfo);
    
    // 위치 정보
    const positions = localStorage.getItem('seatPositions');
    console.log('위치 정보:', positions ? JSON.parse(positions) : null);
    
    // 조장 데이터
    const managerData = localStorage.getItem('managerData');
    console.log('조장 데이터:', managerData);
    
    // 조원 데이터
    const memberData = localStorage.getItem('memberData');
    console.log('조원 데이터:', memberData);
    
    // 테이블 설정
    const tableConfig = localStorage.getItem('tableConfig');
    console.log('테이블 설정:', tableConfig ? JSON.parse(tableConfig) : null);
    
    // 조장 히스토리
    const managerHistory = localStorage.getItem('managerTdNamesHistory');
    console.log('조장 히스토리:', managerHistory ? JSON.parse(managerHistory) : null);
    
    // 조원 히스토리
    const memberHistory = localStorage.getItem('memberTdNamesHistory');
    console.log('조원 히스토리:', memberHistory ? JSON.parse(memberHistory) : null);
    
    // TD 숫자 배열
    const tdNumbers = localStorage.getItem('tdNumbers');
    console.log('TD 숫자 배열:', tdNumbers ? JSON.parse(tdNumbers) : null);
    
    // 삭제된 TD 리스트
    const deletedTdList = localStorage.getItem('deletedTdList');
    console.log('삭제된 TD 리스트:', deletedTdList ? JSON.parse(deletedTdList) : null);
    
    console.log('=== localStorage 데이터 확인 완료 ===');
}

// 서버 데이터 로드 상태 확인 함수 (디버깅용)
function checkServerDataLoadStatus() {
    console.log('=== 서버 데이터 로드 상태 확인 ===');
    
    // 과목 정보 확인
    const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
    console.log('현재 과목 정보:', subjectInfo);
    
    if (!subjectInfo?.subjectId) {
        console.warn('⚠️ subjectId가 없어서 서버 데이터를 로드할 수 없습니다.');
        return;
    }
    
    // 서버 요청 URL 확인
    const endpoint = `${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.ENDPOINTS.SEAT}/data/${encodeURIComponent(subjectInfo.subjectId)}`;
    console.log('서버 요청 URL:', endpoint);
    
    // localStorage 데이터 상태 확인
    const hasPositions = localStorage.getItem('seatPositions') !== null;
    const hasManagerData = localStorage.getItem('managerData') !== null;
    const hasMemberData = localStorage.getItem('memberData') !== null;
    const hasTableConfig = localStorage.getItem('tableConfig') !== null;
    const hasManagerHistory = localStorage.getItem('managerTdNamesHistory') !== null;
    const hasMemberHistory = localStorage.getItem('memberTdNamesHistory') !== null;
    
    console.log('localStorage 데이터 상태:');
    console.log('  - 위치 정보:', hasPositions ? '있음' : '없음');
    console.log('  - 조장 데이터:', hasManagerData ? '있음' : '없음');
    console.log('  - 조원 데이터:', hasMemberData ? '있음' : '없음');
    console.log('  - 테이블 설정:', hasTableConfig ? '있음' : '없음');
    console.log('  - 조장 히스토리:', hasManagerHistory ? '있음' : '없음');
    console.log('  - 조원 히스토리:', hasMemberHistory ? '있음' : '없음');
    
    // 화면 데이터 상태 확인
    const managerTextarea = document.querySelector('.manager');
    const memberTextarea = document.querySelector('.member');
    const rowInput = document.querySelector('.table-row');
    const colInput = document.querySelector('.table-col');
    
    console.log('화면 데이터 상태:');
    console.log('  - 조장 textarea:', managerTextarea?.value || '빈 값');
    console.log('  - 조원 textarea:', memberTextarea?.value || '빈 값');
    console.log('  - 행 입력:', rowInput?.value || '빈 값');
    console.log('  - 열 입력:', colInput?.value || '빈 값');
    
    console.log('=== 서버 데이터 로드 상태 확인 완료 ===');
}

// 서버 연결 테스트 함수 (디버깅용)
async function testServerConnection() {
    console.log('=== 서버 연결 테스트 시작 ===');
    
    try {
        // 기본 서버 상태 확인
        const testUrl = SERVER_CONFIG.BASE_URL + '/seat/list';
        console.log('테스트 URL:', testUrl);
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'  // JSON 응답 요청
            }
        });
        
        console.log('응답 상태:', response.status, response.statusText);
        console.log('응답 헤더:', response.headers.get('content-type'));
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log('✅ 서버 연결 성공 (JSON):', result);
            } else if (contentType && contentType.includes('application/xml')) {
                const xmlText = await response.text();
                console.warn('⚠️ 서버에서 XML 응답을 받았습니다.');
                console.log('XML 응답 (처음 200자):', xmlText.substring(0, 200) + '...');
                
                try {
                    const jsonResult = parseXmlToJson(xmlText);
                    console.log('✅ XML을 JSON으로 변환 성공:', jsonResult);
                } catch (parseError) {
                    console.error('❌ XML 파싱 실패:', parseError);
                }
            } else {
                const text = await response.text();
                console.warn('⚠️ 서버에서 예상치 못한 응답 타입:', text.substring(0, 200) + '...');
            }
        } else {
            console.error('❌ 서버 응답 오류:', response.status, response.statusText);
        }
        
    } catch (error) {
        console.error('❌ 서버 연결 테스트 실패:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('네트워크 에러: 서버가 실행되지 않았거나 URL이 잘못되었습니다.');
            console.log('현재 서버 URL:', SERVER_CONFIG.BASE_URL);
        }
    }
    
    console.log('=== 서버 연결 테스트 완료 ===');
}

// 테스트 데이터 생성 함수 (디버깅용)
async function createTestData() {
    try {
        console.log('=== 테스트 데이터 생성 시작 ===');
        
        // 과목 정보 가져오기
        const subjectInfo = loadSubjectInfoFromStorage() || getSubjectInfoFromUrl();
        const subjectId = subjectInfo?.subjectId || 'test123';
        const subjectTitle = subjectInfo?.subjectTitle || '테스트 과목';
        
        console.log('테스트 데이터 생성 정보:', { subjectId, subjectTitle });
        
        const testData = {
            subjectId: subjectId,
            subjectTitle: subjectTitle
        };
        
        const result = await serverRequest('/seat/create-test-data', 'POST', testData);
        
        if (result && result.success) {
            console.log('✅ 테스트 데이터 생성 성공:', result);
            alert('테스트 데이터가 생성되었습니다. 페이지를 새로고침하여 데이터를 확인하세요.');
        } else {
            console.error('❌ 테스트 데이터 생성 실패:', result);
            alert('테스트 데이터 생성에 실패했습니다: ' + (result?.message || '알 수 없는 오류'));
        }
        
    } catch (error) {
        console.error('❌ 테스트 데이터 생성 중 오류:', error);
        alert('테스트 데이터 생성 중 오류가 발생했습니다: ' + error.message);
    }
    
    console.log('=== 테스트 데이터 생성 완료 ===');
}
