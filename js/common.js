console.log('common.js..');

// 서버 설정 전역변수
const SERVER_CONFIG = {
    BASE_URL: 'http://localhost:8095',
    ENDPOINTS: {
        SEAT: '/seat',
        SAVE_POSITIONS: '/seat/save-positions',
        SAVE_MANAGER: '/seat/save-manager',
        SAVE_MEMBER: '/seat/save-member',
        SAVE_TABLE_CONFIG: '/seat/save-table-config'
    }
};

// 서버 요청 공통 함수
async function serverRequest(endpoint, method = 'GET', data = null) {
    try {
        const url = SERVER_CONFIG.BASE_URL + endpoint;
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        console.log(`서버 요청: ${method} ${url}`, data);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('서버 응답:', result);
        return result;
        
    } catch (error) {
        console.error('서버 요청 실패:', error);
        throw error;
    }
}

// 서버에서 위치 정보 가져오기
async function loadPositionsFromServer() {
    try {
        console.log('=== 서버에서 위치 정보 가져오기 시작 ===');
        
        const result = await serverRequest(`${SERVER_CONFIG.ENDPOINTS.SEAT}?id=1`);
        
        if (result && result.positions) {
            // 서버에서 받은 위치 정보를 localStorage에 저장
            positions = result.positions;
            localStorage.setItem('seatPositions', JSON.stringify(positions));
            console.log('✅ 서버에서 위치 정보 가져오기 성공');
            console.log('저장된 위치 정보:', positions);
            console.log('localStorage에 저장 완료');
        } else {
            console.error('❌ 서버 응답이 유효하지 않음');
            console.log('응답 데이터 구조:', result);
            throw new Error('서버에서 유효한 위치 정보를 받지 못했습니다.');
        }
    } catch (error) {
        console.warn('⚠️ 서버에서 위치 정보 가져오기 실패');
        console.error('에러 상세:', error.message);
        
        // 기존 localStorage에서 위치 정보 가져오기
        console.log('=== localStorage에서 위치 정보 가져오기 시도 ===');
        const savedPositions = localStorage.getItem('seatPositions');
        
        if (savedPositions) {
            try {
                positions = JSON.parse(savedPositions);
                console.log('✅ 기존 localStorage에서 위치 정보 로드 성공');
                console.log('로드된 위치 정보:', positions);
            } catch (parseError) {
                console.error('❌ localStorage 위치 정보 파싱 실패');
                console.error('파싱 에러:', parseError);
                console.log('localStorage 원본 데이터:', savedPositions);
                setDefaultPositions();
            }
        } else {
            console.log('⚠️ localStorage에 저장된 위치 정보 없음');
            setDefaultPositions();
        }
    }
    
    console.log('=== 최종 위치 정보 ===');
    console.log('positions 객체:', positions);
    console.log('=== 위치 정보 로드 완료 ===');
}

async function savePositionsToServer() {
    try {
        // 현재 위치 정보 업데이트
        updateCurrentPositions();
        
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_POSITIONS, 'POST', {
            positions: positions,
            timestamp: new Date().toISOString()
        });
        
        console.log('서버 저장 완료:', result);
        alert('위치 정보가 서버에 저장되었습니다.');
        
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
        
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_MANAGER, 'POST', {
            manager: managerData,
            timestamp: new Date().toISOString()
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
        
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_MEMBER, 'POST', {
            member: memberData,
            timestamp: new Date().toISOString()
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
        
        const result = await serverRequest(SERVER_CONFIG.ENDPOINTS.SAVE_TABLE_CONFIG, 'POST', {
            tableConfig: {
                rows: parseInt(rowValue),
                cols: parseInt(colValue)
            },
            timestamp: new Date().toISOString()
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
    if (confirm('모든 위치 정보를 초기화하시겠습니까?')) {
        // localStorage 삭제
        localStorage.removeItem('seatPositions');
        localStorage.removeItem('tdNumbers');
        localStorage.removeItem('tableConfig');
        
        // positions 객체 초기화
        positions = {
            teacher: { x: 10, y: -70 },
            tds: {}
        };
        
        // td 숫자 배열 초기화
        tdNumbers = [];
        
        // 행열 정보 초기화
        const rowInput = document.querySelector('.table-row');
        const colInput = document.querySelector('.table-col');
        if (rowInput && colInput) {
            rowInput.value = 3;
            colInput.value = 6;
        }
        
        // 강사 div 위치 초기화
        const teacherLabel = document.querySelector('.teacher-label');
        if (teacherLabel) {
            teacherLabel.style.left = '10px';
            teacherLabel.style.top = '-70px';
        }
        
        // 모든 TD 위치 초기화
        const tds = document.querySelectorAll('.tbl td');
        tds.forEach(td => {
            td.style.position = '';
            td.style.left = '';
            td.style.top = '';
            td.style.zIndex = '';
        });
        
        console.log('위치 정보, td 숫자 배열, 행열 정보 초기화 완료');
        alert('모든 정보가 초기화되었습니다.');
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
    
    // localStorage에서 행열 정보 먼저 로드
    loadTableConfigFromStorage();
    
    // localStorage에서 td 숫자 배열 로드
    loadTdNumbersFromStorage();
    
    // localStorage에서 삭제된 td 리스트 로드
    loadDeletedTdListFromStorage();
    
    // localStorage에서 조장, 조원 데이터 로드
    loadManagerDataFromStorage();
    loadMemberDataFromStorage();
    
    // textarea 자동 저장 이벤트 리스너 추가
    addTextareaAutoSaveListeners();
    
    loadDataFromJSON().then(() => {
        console.log('=== 데이터 로드 완료, 위치 적용 시작 ===');
        // 데이터 로드 완료 후 위치 적용
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
