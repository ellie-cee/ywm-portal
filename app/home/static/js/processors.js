class FileProcessorCrud extends JsForm {
    constructor(options) {
        super(options)
        
        this.objectId = options.objectId||null;
        this.object = {}
        this.data = options
        
        if (this.objectId) {
            this.get(`/fileProcessors/get/${this.objectId}`).then(response=>{
                this.object = response.object;
                history.replaceState(null,"",`/fileProcessors?processorId=${this.objectId}`)
                this.updateData(response.data)
                this.render()
                this.loaded()
            })
        } else {
            this.get("/fileProcessors/config").then(response=>{
                this.updateData(response.data)
                
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
        console.error(this.object.tested)
        return `
            <input type="hidden" value="${this.object.tested?1:0}" name="tested">
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
                    ${Fields.selectBox({name:"processorType",values:this.data.processorTypes,required:true,selectedValue:this.object.processorType,dataset:{"fileProcessor":'unselected'}})}
                </div>

            </div>
            ${this.renderConditionalFields()}
            <div class="formRow ${this.object.tested?'tested':''} requires-id">
                <div class="formField">
                    <label>Shop Name</label>
                    <select name="shop" id="shopSelector">
                        <option value="">Select Shop</option>
                        ${this.data.shops.map(shop=>`<option value="${shop.shopId}" ${shop.shopId==this.data.selectedShop?' selected':''}>${shop.name}</option>`).join("")}
                    </select>
                </div>
                <div class="formField" id="themeSelector">
                    <label>Theme</label>
                    <select name="theme" class="${this.data.themes.length<1?'hidden':''} ${this.data.selectedTheme?'':'unselected'}">
                        <option value="">Select theme</option>
                        ${this.data.themes.map(theme=>`<option value="${theme.themeId}" ${this.data.selectedTheme==theme.themeId?' selected':''}>${theme.name}</option>`).join("")}
                    </select>
                </div>
            </div>
    `
    }
    renderConditionalFields() {
        let typeSelectValue = this.data.processorTypes?.find(processor=>processor.id==this.object.processorType)?.name
        if (!typeSelectValue) {
            let typeSelect = this.formTarget()?.querySelector('[name="processorType"]')
            typeSelectValue = typeSelect?.options[typeSelect.selectedIndex]?.textContent
        }
        console.error(this.object)
        switch(typeSelectValue) {
            
            case "Search and Replace":
                return `
                    <div class="formRow">
                        <div class="formField">
                            <label>Search For</label>
                            <textarea name="searchFor" class="serialize">${this.object.configuration?.searchFor||''}</textarea>
                        </div>
                        <div class="formField">
                            <label>Replace With</label>
                            <textarea name="replaceWith" class="serialize">${this.object.configuration?.replaceWith||''}</textArea>
                        </div>
                    </div>
                    <div class="formRow">
                        <div class="formField">
                            <label>Match Case</label>
                            ${Fields.checkbox({name:"matchCase",label:"",checked:this.object.configuration?.matchCase=="true",value:"true",serialize:true,boolean:true})}
                        </div>
                        <div class="formField">
                            <label>Application Strategy</label>
                            <select name="applicationStrategy" class="serialize">
                                <option value="ONCE">Replace Once</option>
                                <option value="ALL" ${this.object.configuration?.applicationStrategy=="ALL"?'selected':''}>Replace All</option>
                            </select>
                

                        </div>
                    </div>

                `
        }
        return ``
    }
    buttons() {
        return [
            [
                {label:`Test ${this.object.processorName}`,action:"test-processor",class:`requires-id ${this.object.tested?'tested':''}`,type:"button"},
            ],
            [
                {label:`Update ${this.object.processorName}`,action:"update",class:'requires-id',type:"submit"},
                {label:'Create Rule',action:"create",class:'create-only',type:"submit"},
                {label:`Delete ${this.object.processorName}`,action:"delete",class:'requires-id'},
            ],
        ]
    }
    setupEvents() {
        super.setupEvents()
        this.formTarget().querySelector('select[name="processorType"]').addEventListener("change",event=>{
            let select = event.target;
            this.object.processorType = select.options[select.selectedIndex]?.value
            select.dataset.fileProcessor=this.processorType?"selected":"unselected"
            this.render()
        })
        this.formTarget().querySelector('select[name="theme"]').addEventListener("change",event=>{
            let select = event.target;
            this.data.selectedTheme = select.options[select.selectedIndex]?.value
             
            this.render()
        })
        this.formTarget().querySelectorAll("input[required]").forEach(input=>input.addEventListener("change",event=>{
                this.object[input.name] = input.value;
            })
        )
        this.formTarget().querySelectorAll(".serialize").forEach(field=>field.addEventListener("change",event=>{
            this.formTarget().querySelector('[name="tested"').value="0";
            this.object.configuration[field.name] = field.value;
            this.object.tested = false;
            this.render()
            console.error(this.object)
        }))

        this.formTarget().querySelector('#shopSelector').addEventListener("change",event=>{
            this.loading()
            let selectValue = event.target.options[event.target.selectedIndex].value;
            this.get(`/shops/themes/${selectValue}`).then(response=>{
                this.data.selectedShop = selectValue;
                
                this.data.themes = response.themeList;
                
                this.render()
                this.loaded()
            }).catch(error=>this.showError(error.message))
        })
        this.listenFor(
            "test-processor",event=>{

                let formData = this.serializeWithConfig()
                if (formData.shop=="" || formData.theme=="") {
                    this.showWarning("Please select Shop & Theme to continue")
                }
                this.upsert(response=>{
                    this.object = response.object
                    this.objectId = response.objectId  
                    this.post("/fileProcessors/test",formData).then(response=>{
                        
                        switch(response.code) {
                            case "APPLIED":
                                this.showWarning("This has already been applied to this theme. Please choose another.")
                                break;
                            case "NOTFOUND":
                                this.showError("This file does not exist on the selected theme")
                                break;
                            case "SUCCESS":
                                let modal = EscModal.show(`
                                    <h1> Check File Contents</h1>
                                    <form class="jsform">
                                        <div class="formBody">
                                            <div class="formRow">
                                                <div class="formField">
                                                    <label>Output</label>
                                                    <textarea rows="15">${response.data.processed}</textarea>
                                                </div>
                                            </div>
                                            <div class="buttons">
                                                <button type="button" class="valid">Looks Good</button>
                                                <button type="button" class="invalid">Edit</button>
                                            </div>
                                        </div>
                                    </form>
                                `)
                                modal.querySelector(".valid").addEventListener("click",event=>{
                                    this.formTarget().querySelector('[name="tested"]').value="1";
                                    EscModal.close()
                                    this.upsert()
                                })
                                modal.querySelector(".invalid").addEventListener("click",event=>{
                                    this.object.tested=false;
                                    EscModal.close()
                                    this.render()
                                })
                        }
                    })
                })
            }
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
            this.get(`/fileProcessors/delete/${this.objectId}`).then(response=>{
                    this.loaded()
                    this.showMessage(`Deleted ${this.object.processorName}`)
                    location.href="/fileProcessors"
                }).catch(error=>this.showError(error.message))
            }
        )
    }
    serializeWithConfig() {
        let formData = this.serializeForm(this.formTarget())
        formData.configuration = {}
        this.formTarget().querySelectorAll(".serialize").forEach(item=>{
            if (item.classList.contains("boolean-field")) {
                
                if (item.checked) {
                    formData.configuration[item.name] = true
                } else {
                    formData.configuration[item.name] = false
                }
            } else {
                formData.configuration[item.name]=formData[item.name]
            }
            
            delete formData[item.name]
        })
        
        return formData;
    }
    upsert(callback=null) {
        this.loaded(false)
        let formData = this.serializeWithConfig()
        console.error(formData)
        this.post(
                "/fileProcessors/upsert",
                formData
        ).then(response=>{
            this.loaded()
            if (callback) {
                callback(response);
            } else {
                this.handleResponse(response,formData,`${formData.shopName} Updated`)
            }
            
        }).catch(error=>{
            this.showError(error.message);
        })
    }

    handleResponse(response,formData) {
        this.object = response.object
        this.objectId = response.objectId
        history.replaceState(null, "", `/fileProcessors?processorId=${this.objectId}`);
        this.showMessage("updated successfully")
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
        fetch("/fileProcessors/active").then(response=>response.json()).then(response=>{
            document.querySelector(".sidebar-options").innerHTML = response.processors.map(processor=>`
                <li data-processor-id="${processor.id}"  data-clickable>${processor.processorName}</li>
            `).join("")
            document.querySelectorAll('[data-processor-id]').forEach(processor=>processor.addEventListener("click",event=>{
                
                window.fileProcessorForm = new FileProcessorCrud({objectId:processor.dataset.processorId})            
            }))
        })
        
    }
}