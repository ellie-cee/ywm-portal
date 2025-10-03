class RulesCrud extends JsForm {
    constructor(options) {
        super(options)
        console.error("hey now")
        this.objectId = options.objectId||null;
        this.object = {}
        this.data = options
        
        if (this.objectId) {
            this.get(`/rules/get/${this.objectId}`).then(response=>{
                this.object = response.object;
                this.data = response.data;
                this.render()
                this.loaded()
            })
        } else {
            this.get("/rules/config").then(response=>{
                this.data = response.data;
                this.render()
                this.loaded()
            })
        }
    }
    formName() {
        return "rulesForm"
    }
    formHeader() {
        if (this.objectId) {
            return `Update ${this.object.ruleName}`
        }
        return "Create Rule"
    }
    formContents() {
        return `
            <div class="formRow">
                <div class="formField">
                    <label>Rule Name</label>
                    ${Fields.textField({name:"ruleName",value:this.object.ruleName,required:true})}
                </div>
                <div class="formField">
                    <label>File Path</label>
                    ${Fields.textField({name:"filePath",value:this.object.filePath,required:true})}
                </div>
                <div class="formField">
                    <label>Rule Type</label>
                    ${Fields.selectBox({name:"ruleType",values:this.data.ruleTypes,required:true,selectedValue:this.object.ruleType,dataset:{"ruleset":'unselected'}})}
                </div>

            </div>
            ${this.renderConditionalFields()}
    `
    }
    renderConditionalFields() {
        let typeSelectValue = this.data.ruleTypes?.find(rule=>rule.id==this.object.ruleType)?.name
        if (!typeSelectValue) {
            let typeSelect = this.formTarget()?.querySelector('[name="ruleType"]')
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
                {label:`Update ${this.object.ruleName}`,action:"update",class:'requires-id',type:"submit"},
                {label:'Create Rule',action:"create",class:'create-only',type:"submit"},
                {label:`Delete ${this.object.ruleName}`,action:"delete",class:'requires-id'},
            ],
        ]
    }
    setupEvents() {
        super.setupEvents()
        this.formTarget().querySelector('select[name="ruleType"]').addEventListener("change",event=>{
            let select = event.target;
            this.object.ruleType = select.options[select.selectedIndex]?.value
            select.dataset.ruleset=this.ruleType?"selected":"unselected"
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
            this.get(`/rules/delete/${this.objectId}`).then(response=>{
                    this.loaded()
                    this.showMessage(`Deleted ${this.object.ruleName}`)
                    location.href="/rules"
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
        
        console.error(formData);
        this.post(
                "/rules/upsert",
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
        history.replaceState(null, "", `/rules?ruleId=${this.objectId}`);
        this.render()
        document.dispatchEvent(
            new CustomEvent(
                "ywm:rules:load",
                {bubbles:true}
            )
        )

    }
}

class RulesListing {
    constructor() {
        document.addEventListener("ywm:rules:load",event=>{
            this.loadRules()
        })
        this.loadRules()
    }
    loadRules() {
        fetch("/rules/active").then(response=>response.json()).then(response=>{
            document.querySelector(".sidebar-options").innerHTML = response.rules.map(rule=>`
                <li data-rule-id="${rule.id}"  data-clickable>${rule.ruleName}</li>
            `).join("")
            document.querySelectorAll('[data-rule-id]').forEach(rule=>rule.addEventListener("click",event=>{
                console.error("what")
                window.rulesForm = new RulesCrud({objectId:rule.dataset.ruleId})            
            }))
        })
        
    }
}