console.log('common.js..');

let 조장; 
let 조원; 
let 고정이름 = [];    
let 고정번호 = [];
let draggedElement = null; // 드래그 중인 요소
let positions = {}; // 위치 정보 저장

// JSON 데이터 로드 함수
async function loadDataFromJSON() {
    try {
        // 조장 데이터 로드
        const jojangResponse = await fetch('dataset/jojang.json');
        const jojangData = await jojangResponse.json();
        
        // 조원 데이터 로드
        const jooneResponse = await fetch('dataset/joone.json');
        const jooneData = await jooneResponse.json();
        
        // localStorage에서 위치 데이터 로드
        const savedPositions = localStorage.getItem('seatPositions');
        if (savedPositions) {
            positions = JSON.parse(savedPositions);
        } else {
            // 기본 위치 정보 설정
            positions = {
                teacher: { x: 10, y: -70 },
                tds: {}
            };
        }
        
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
    const teacherLabel = document.querySelector('.teacher-label');
    if (teacherLabel && positions.teacher) {
        teacherLabel.style.left = positions.teacher.x + 'px';
        teacherLabel.style.top = positions.teacher.y + 'px';
    }
}

// TD 위치 적용 함수
function applyTdPositions() {
    const tds = document.querySelectorAll('.tbl td');
    tds.forEach(td => {
        const dataNo = td.getAttribute('data-no');
        if (dataNo && positions.tds && positions.tds[dataNo]) {
            td.style.position = 'absolute';
            td.style.left = positions.tds[dataNo].x + 'px';
            td.style.top = positions.tds[dataNo].y + 'px';
            td.style.zIndex = '1000';
        }
    });
}

// 위치 초기화 함수
function resetPositions() {
    if (confirm('모든 위치 정보를 초기화하시겠습니까?')) {
        // localStorage 삭제
        localStorage.removeItem('seatPositions');
        
        // positions 객체 초기화
        positions = {
            teacher: { x: 10, y: -70 },
            tds: {}
        };
        
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
        
        console.log('위치 정보 초기화 완료');
        alert('위치 정보가 초기화되었습니다.');
    }
}

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromJSON().then(() => {
        // 데이터 로드 완료 후 위치 적용
        setTimeout(() => {
            applyTeacherPosition();
            applyTdPositions();
        }, 100);
    });
    initTeacherMove();
    initTdMove();
});

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
                // 체크박스 상태 저장
                const draggedCheckbox = draggedElement.querySelector('input[type="checkbox"]');
                const targetCheckbox = this.querySelector('input[type="checkbox"]');
                const draggedChecked = draggedCheckbox ? draggedCheckbox.checked : false;
                const targetChecked = targetCheckbox ? targetCheckbox.checked : false;
                
                // 두 td의 내용을 교환
                const tempHTML = this.innerHTML;
                const tempDataNo = this.getAttribute('data-no');
                const tempClassList = this.className;
                
                this.innerHTML = draggedElement.innerHTML;
                this.setAttribute('data-no', draggedElement.getAttribute('data-no'));
                this.className = draggedElement.className;
                
                draggedElement.innerHTML = tempHTML;
                draggedElement.setAttribute('data-no', tempDataNo);
                draggedElement.className = tempClassList;
                
                // 체크박스 상태 복원
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

    let cnt = 1;
    for(i=0;i<row;i++){

        const tr = document.createElement('tr');
       
        for(j=0;j<col;j++){

            const td = document.createElement("td");
            td.innerHTML=cnt;
            td.setAttribute("data-no",cnt);
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

            const input = document.createElement('input');
            input.setAttribute('type','text');
            td.appendChild(input);



            td.classList.add('active');
            
            tr.appendChild(td);

           
            cnt++;
        }
        tbl.appendChild(tr);
    }
    
    // 테이블 생성 후 드래그 앤 드롭 리스너 추가
    addDragAndDropListeners();
    
    // 위치 정보 적용
    setTimeout(() => {
        applyTdPositions();
    }, 100);
}
createTd();










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
            isTdMoving = !isTdMoving;
            currentTd = e.target.parentNode;
            
            if (isTdMoving) {
                e.target.textContent = 'close';
                e.target.style.color = '#ff4444';
                currentTd.style.cursor = 'grabbing';
                document.body.style.cursor = 'crosshair';
            } else {
                e.target.textContent = 'arrows_output';
                e.target.style.color = '#666';
                currentTd.style.cursor = 'grab';
                document.body.style.cursor = 'default';
                isTdDragging = false;
                currentTd = null;
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
