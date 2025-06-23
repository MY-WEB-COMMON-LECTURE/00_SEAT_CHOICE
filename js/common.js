console.log('common.js..');

let 조장; 
let 조원; 
let 고정이름 = [];    
let 고정번호 = [];
let draggedElement = null; // 드래그 중인 요소

// JSON 데이터 로드 함수
async function loadDataFromJSON() {
    try {
        // 조장 데이터 로드
        const jojangResponse = await fetch('dataset/jojang.json');
        const jojangData = await jojangResponse.json();
        
        // 조원 데이터 로드
        const jooneResponse = await fetch('dataset/joone.json');
        const jooneData = await jooneResponse.json();
        
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

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromJSON();
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
            fixedIcon.setAttribute('class','material-symbols-outlined');
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
