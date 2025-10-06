class Esc {
    defaults() {
        return {
            "debug":true,
            "injection_point":".Esc-app",
        };
    }
    constructor(options) {
        this.config = {...this.defaults(),...options}
    }
    async get(url) {
        return fetch(
            url,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name="csrfmiddlewaretoken"]').value,
                },
            }
        ).then(response=>response.json())
    }
    async postRaw(url,body) {
        try {
        return fetch(
            url,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name="csrfmiddlewaretoken"]').value,
                },
                body:body
            }
        )
        } catch(e) {
            console.error(e)
        }
    }
    async post(url,payload) {
        return this.postRaw(
            url,
            JSON.stringify(payload)
        ).then(response=>response.json())
    }
    


    gid2id(gid) {
        return parseInt(gid.split("/").pop())
    }
    static sortArrayofObjects(objects,sortKey) {
        return objects.sort((a,b)=>a[sortKey].localeCompare(b[sortKey]))
        // return objects.map(object=>object[sortKey]).sort().reduce((a,b)=>a[b]=objects[b],{})
    }
        
}

class EscModal extends Esc {
    static show(content,config={}) {
        let modal = document.querySelector(".esc-modal");
        if (!modal) {
            modal = document.createElement("DIV");
            modal.classList.add("esc-modal");
            document.querySelector("body").appendChild(modal);
        }
        modal.style.width = `${window.innerWidth}px`;
        modal.style.height = `${window.innerHeight}px`;
        modal.style.top = `${window.scrollY}px`
        modal.innerHTML = `
        <div class="modal-content">
            <span class="close">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" role="presentation"><path d="M5.86123 14.1073L5.21766 14.1073L3.67204 12.5617L3.67204 11.9181L6.68057 8.90959L3.6521 5.88112L3.6521 5.23755L5.2376 3.65205L5.88117 3.65204L8.90964 6.68052L11.9182 3.67199L12.5617 3.67199L14.1074 5.21761L14.1074 5.86118L11.0988 8.86971L14.1273 11.8982L14.1273 12.5417L12.5418 14.1273H11.8982L8.86976 11.0988L5.86123 14.1073Z" fill="#af3939"></path></svg>
            </span>
            <div class="modal-text text-left color-foreword-primary body1">
                ${content}
            </div>
        </div>
        `;
        if (config.cantClose){
            modal.querySelector(".close").style.display="none";
        } else {
          modal.querySelector(".close").style.display="block";
          modal.querySelector(".close").addEventListener("click",event=>{
              modal.classList.remove("active");
              modal.innerHTML = "";
              document.querySelector("body").classList.remove("stop-scrolling");
              document.dispatchEvent(new CustomEvent("esc:modal:closed",{bubbles:true}))
          });
          modal.addEventListener("click",event=>{
            if (event.target.classList.contains("esc-modal")) {
                modal.classList.remove("active");
                modal.style.top = "0px";
                modal.innerHTML = "";
                document.querySelector("body").classList.remove("stop-scrolling");
                document.dispatchEvent(new CustomEvent("esc:modal:closed",{bubbles:true}))
                if(config.onClose) {
                    
                    config.onClose()
                }
            }
          })
        } 
        document.querySelector("body").classList.add("stop-scrolling");
        modal.classList.add("active");
        return modal;
    }
    static close() {
    let modal = document.querySelector(".esc-modal");
    modal.classList.remove("active");
    modal.innerHTML = "";
    document.querySelector("body").classList.remove("stop-scrolling");
    return modal
    }
}

class JsForm extends Esc {
    constructor(options) {
        super(options);
        this.uuid = crypto.randomUUID()
        this.options=options;
        this.targetElement = ".jsapp";
        this.objectId = options.objectId||null;
    }
    disappear() {
        this.target().innerHTML = ``;
    }
    serializeForm(form) {
        return Object.fromEntries(new FormData(form).entries())
    }
    target() {    
        return document.querySelector(this.targetElement);
    }
    formName() {
        return "form"
    }
    formTarget() {
        return document.querySelector(`#${this.formName()}`)
    }
    formHeader() {
        return "a form"
    }
    buttons() {
        return []
    }
    subtitle() {
        return ''
    }
    hasObjectId() {
        return (this.objectId!=null && this.objectId!="");
    }
    valueOf(fieldValue) {
        return fieldValue||"";
    }
    hiddenField(name,value) {
        if (value) {
            return `<input type="hidden" name="${name}" value="${this.objectId}">`
        }
        return ''
    }
    objectIdField() {
        return this.hiddenField("objectId",this.objectId);
    }
    fieldValue(field)  {

    }
    render(isLoaded=true) {
        this.target().innerHTML = `
            <form id="${this.formName()}" class="jsform ${isLoaded?'loaded':''}">
                ${this.objectIdField()}
                <div class="form-loading">
                    <img src="/static/img/loading.gif">
                </div>
                <div class="form-progress"></div>
                <div>
                    <h1 id="formHeader">
                        ${this.formHeader()}
                    </h1>
                </div>
                <div class="subtitle">${this.subtitle()}</div>
                <div class="request-response"></div>
                <div class="formBody">
                    ${this.formContents()}
                </div> 
                <div class="formfooter">
                    ${this.buttons().map(row=>`
                        <div class="buttons">
                            ${row.map(button=>`
                            <button class="${button.class?button.class:''}" data-action="${button.action}" type="${button.type?button.type:'button'}">
                                ${button.label}
                            </button>
                            `
                        ).join("")}
                        </div>
                        `
                    ).join("")}
                </div>
            </form>
        `
        this.setupEvents();
    }
    formContents() {
        return ""
    }
    eventsPrefix() {
        return `ywm:${this.formName()}`
    }
    eventName(eventName) {
        return `${this.eventsPrefix()}:${eventName}`
    }
    listenFor(eventName,callBack=null) {
        this.formTarget().addEventListener(
            this.eventName(eventName),
            event=>{
                
                if (callBack) {
                    callBack(event);
                }
                event.stopPropagation()
            }
        )
    }
    showToast(message,type) {
        window.toastManager.addToast(message,type);
        document.querySelector(".toaster-ui-lib-container").style.top="35%";
    }
    showWarning(message,isError=false) {
        this.showToast(message,"warning")
    }
    showMessage(message,isError=false) {
        this.showToast(message,"info")
    }
    showError(message,permanent=false) {
        this.showToast(message,"error");
        if (this.formTarget()) {
            this.loaded()
        }
    }
    
    loaded(loaded=true) {
        if (loaded) {
            this.formTarget().classList.add("loaded")
        } else {
            this.formTarget().classList.remove("loaded")
        }
    }
    dispatchEvent(thisEventName,detail=null) {
        
        this.formTarget().dispatchEvent(
            new CustomEvent(
                thisEventName,
                {bubbles:true,detail:detail}
            )
        )
    }
    setupEvents() {
        let form = this.formTarget()
        form.addEventListener("submit",event=>{
            event.preventDefault();
            event.stopPropagation();

            let submitAction =this.formTarget().querySelector(`button[type="submit"]`).dataset.action;
            this.dispatchEvent(this.eventName(submitAction));
            event.stopPropagation()
            return;
        })
        this.formTarget().querySelectorAll("button[data-action]").forEach(button=>{
            
            if (button.type=="submit") {
                return;
            }
            button.addEventListener("click",event=>{
                
                this.dispatchEvent(this.eventName(button.dataset.action))
                event.stopPropagation()
            })
        });
        this.formTarget().querySelectorAll(".peeker").forEach(peeker=>peeker.addEventListener("click",event=>{
            let input = document.querySelector(`input[name="${peeker.dataset.for}"]`)

            if (input.type=="password") {
                input.type="text";
            } else {
                input.type="password";
            }
            }));
    }
    setObjectId(id) {
        if (id==null) {
            return
        }
        this.fileId = id;
        let form  = document.querySelector(`#${this.formName()}`)
        let idInput = form.querySelector('[name="objectId]')
        if (idInput!=null) {
            idInput.value = id;
        } else {
            let input = document.createElement("input");
            input.type="hidden";
            input.name="objectId";
            input.value = id;
            form.appendChild(input)
        }
    }
}



class TaskQueue extends JsForm {
    constructor(options) {
        super(options);
        this.options = options;
        this.processedItems = [];
        this.queue = this.options.queue;
        this.queueLength = this.queue.length;
        this.currentItem = null;
        this.target = this.options.owner.querySelector(".form-progress");
        this.toggleVisibility()
        this.nextTask()
        

    }
    
    toggleVisibility() {
        let form = this.options.owner;
        form.classList.toggle("track-progress")
    }
    finalize() {

    }
    nextTask() {
        this.render()
        if (this.queue.length<1) {
            setTimeout(
                ()=>{
                    this.finalize()
                },
                1000
            )
            return;
        }
        
        this.currentItem = this.queue.shift();
        
        if (this.currentItem) {
            
            this.processedItems.push(this.currentItem)
        }
        this.processTask(this.currentItem)
    }
    processTask(currentItem) {
        this.nextTask()
    }
    taskDescription() {
        return '';
    }
    title() {
        return '';
    }
    queueProgressPercent() {
        return Math.ceil((this.processedItems.length/this.queueLength)*100);
    }
    render() {
        
        this.target.innerHTML = ` 
            <div class="progress-box">
                <div class="content">
                    <h3>${this.title()}</h3>
                    <div class="progress-bar">
                        <div class="inner" style="width:${this.queueProgressPercent()}%"></div>
                    </div>
                    <div class="progress-text">
                        ${this.taskDescription()}
                    </div>
                </div>
            </div>
        `
    }
}

class Fields {
    static textField({name,value,required=false,dataset={}}) {
        return `<input type="text" name="${name}" value="${value?value:''}" ${required?'required':''} ${Fields.renderDataSet(dataset)}>`
    }
    static renderDataSet(dataset={}) {
        
        return Object.entries(dataset).map(kvp=>`data-${kvp[0]}="${kvp[1]}"`).join(" ")
    }
    static flatSelectBox({name,values,selectedValue=null,required=false}) {
        return `
            <select name="${name}" ${required?'required':''}>
                <option value="">Select</option>
                ${values.map(entry=>`<option value="${entry}" ${entry.id==selectedValue?'selected':''}>${entry}</option>`).join("n")}
            </select>
        `
    }
    static selectBox({name,values,selectedValue=null,required=false,label="name",dataset={}}) {
        return `
            <select name="${name}" ${required?'required':''} ${Fields.renderDataSet(dataset)}>
                <option value="">Select</option>
                ${values.map(entry=>`<option value="${entry.id}" ${entry.id==selectedValue?'selected':''}>${entry[label]}</option>`).join("n")}
            </select>
        `
    }
    static checkbox(name,label,checked=false,radio=false,required=false,dataset={}) {
        return `
        <div class="selector">
            <label for="checkbox-${name}">

                <div class="on"><img src="/static/img/checkbox-on.png"></div>
                <div class="off"><img src="/static/img/checkbox-off.png"></div>
                <input type="checkbox" name="${name}" value="${value}" class="" id="checkbox-${name}" ${fields.renderDataSet(dataset)}>
                <div class="label">${label}</div>
            </label>
        </div>
        `
    }
}
