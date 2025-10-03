class FileProcessorCrud extends JsForm {
    constructor(options) {
        super(options)
        this.objectId = options.objectId||null;
        this.object = {}
        this.data = options
        
        if (this.objectId) {
            this.get(`fileProcessors/get/${this.objectId}`).then(response=>{
                this.object = response.object;
                this.data = response.data;
                this.render()
                this.loaded()
            })
        } else {
            this.get("fileProcessors/config").then(response=>{
                this.data = response.data;
                this.render()
                this.loaded()
            })
        }
    }
    formName() {
        return "fileProcessorForm"
    }
    formHeader() {
        if (this.objectId) {
            return `Update ${this.object.processorName}`
        }
        return "Create Processor"
    }
    formContents() {
        return `
            <div class="formRow">
                <div class="formField">
                    <label>Rule Name</label>
                    ${Fields.textField({name:"processorName",value:this.object.processorName,required:true})}
                </div>
                <div class="formField">
                    <label>File Path</label>
                    ${Fields.textField({name:"filePath",value:this.object.filePath,required:true})}
                </div>
                <div class="formField">
                    <label>Rule Type</label>
                    ${Fields.selectBox({name:"processorType",values:this.data.processorTypes,required:true,selectedValue:this.object.processorType,dataset:{"fileProcessoret":'unselected'}})}
                </div>

            </div>
            ${this.renderConditionalFields()}
    `
    }
    renderConditionalFields() {
        let typeSelectValue = this.data.processorTypes?.find(processor=>processor.id==this.object.processorType)?.name
        if (!typeSelectValue) {
            let typeSelect = this.formTarget()?.querySelector('[name="processorType"]')
            typeSelectValue = typeSelect?.options[typeSelect.selectedIndex]?.textContent
        }
        switch(typeSelectValue) {
            case "Search and Replace":
                return `
                    <div class="formRow">
                        <div class="formField">
                            <label>Search For</label>
                            <textarea name="searchFor" class="serialize" required>${this.object.configuration?.searchFor||''}</textarea>
                        </div>
                        <div class="formField">
                            <label>Replace With</label>
                            <textarea name="replaceWith" class="serialize" required>${this.object.configuration?.replaceWith||''}</textArea>
                        </div>
                    </div>
                `
        }
        return ``
    }
    buttons() {
        return [
            [
                {label:`Update ${this.object.processorName}`,action:"update",class:'requires-id',type:"submit"},
                {label:'Create Processor',action:"create",class:'create-only',type:"submit"},
                {label:`Delete ${this.object.processorName}`,action:"delete",class:'requires-id'},
            ],
        ]
    }
    setupEvents() {
        super.setupEvents()
        this.formTarget().querySelector('select[name="processorType"]').addEventListener("change",event=>{
            let select = event.target;
            this.object.processorType = select.options[select.selectedIndex]?.value
            select.dataset.fileProcessoret=this.processorType?"selected":"unselected"
            this.render()
        })
        this.formTarget().querySelectorAll("input[required]").forEach(input=>input.addEventListener("change",event=>{
                this.object[input.name] = input.value;
            })
        )

        this.listenFor(
            "create",
            event=>{
                this.upsert()
            }
        )
        this.listenFor(
            "update",
            event=>{
                this.upsert()
            }
        )
        this.listenFor("delete",event=>{
            this.loaded(false)
            this.get(`fileProcessors/delete/${this.objectId}`).then(response=>{
                    this.loaded()
                    this.showMessage(`Deleted ${this.object.processorName}`)
                    location.href="fileProcessors"
                }).catch(error=>this.showError(error.message))
            }
        )
    }
    upsert() {
        this.loaded(false)
        let formData = this.serializeForm(this.formTarget())
        formData.configuration = {}
        this.formTarget().querySelectorAll(".serialize").forEach(item=>{
            formData.configuration[item.name]=formData[item.name]
            delete formData[item.name]
        })
        
        
        this.post(
                "fileProcessors/upsert",
                formData
        ).then(response=>{
            this.loaded()
            this.handleResponse(response,formData,`${formData.shopName} Updated`)
        }).catch(error=>{
            this.showError(error.message);
        })
    }

    handleResponse(response,formData) {
        this.object = response.object
        this.objectId = response.objectId
        history.replaceState(null, "", `fileProcessors?processorId=${this.objectId}`);
        this.render()
        document.dispatchEvent(
            new CustomEvent(
                "ywm:fileProcessor:load",
                {bubbles:true}
            )
        )

    }
}

class FileProcessorListing {
    constructor() {
        document.addEventListener("ywm:fileProcessor:load",event=>{
            this.loadfileProcessor()
        })
        this.loadfileProcessor()
    }
    loadfileProcessor() {
        fetch("fileProcessors/active").then(response=>response.json()).then(response=>{
            
            document.querySelector(".sidebar-options").innerHTML = response.processors.map(processor=>`
                <li data-processor-id="${processor.id}"  data-clickable>${processor.processorName}</li>
            `).join("")
            document.querySelectorAll('[data-processor-id]').forEach(processor=>processor.addEventListener("click",event=>{
                
                window.fileProcessorForm = new FileProcessorCrud({objectId:processor.dataset.processorId})            
            }))
        })
        
    }
}