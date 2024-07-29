console.log('common.js..');

let 조장; 
let 조원; 
let 고정이름 = [];    
let 고정번호 = [];

 
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

            const chk = document.createElement('input');
            chk.setAttribute('type','checkbox');
            td.appendChild(chk);
            // 체크박스이벤트
             const parentNode =  chk.parentNode;
                chk.addEventListener("change",function(){
                   
                    if(chk.checked){
                        
                        parentNode.classList.add("ban");
                        parentNode.classList.remove('active');
            
                        const texetField = parentNode.querySelector('input[type="text"]');
                        texetField.disabled=true;
            
                        
            
                    }else{
                      
                        parentNode.classList.remove("ban");
                        parentNode.classList.add('active');
            
                        const texetField = parentNode.querySelector('input[type="text"]');
                        texetField.disabled=false;
                    }
            
            })
          



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
                    고정이름.push(std_name);
                    const no = tdEl.getAttribute('data-no');
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


