class ThemeFilesDeploy extends JsForm {
    constructor(options) {
        super(options)
        this.objectId = options.fileId||null;
        this.collectionId = options.collectionId||null;
        this.files = JSON.parse(this.options.selectedFiles);
        this.explicitFiles = JSON.parse(this.options.explicitFiles)
        this.selectedShop = this.options.selectedShop;
        this.themes = []
        this.selectedTheme = null;
        this.shops = JSON.parse(this.options.shops);
        this.fileDetails = {};
        this.targetElement = ".jsapp";
        this.rules = []
        this.selectedRules = []
        window.folderHandler = new FileFolders({
            collectionId:window.collectionId,
            explicitFiles:this.explicitFiles,
            files:this.files,
            noclick:true,
            selectedFile:this.options.selectedFile}
        );
        if (this.activeShop) {
            this.loadThemes(this.activeShop)
        } else {
            this.render()
            this.loaded()
        }
    }
    loadThemes(shopId) {
        this.get("/shops/themes/${this.activeShop}").then(response=>{
            this.themes = response.themeList;
            this.render()
        })
    }
    loadFolders(collectionId,fileId) {
        document.dispatchEvent(
            new CustomEvent(
                "ywm:folders:load",
                {bubbles:true,detail:{collectionId:collectionId,fileId:fileId}}
            )
        )
    }
    formHeader() {
        return "Deploy Files"
    }
    formContents() {
        return `
            <div class="formRow">
                <div class="formField">
                    <label>Shop Name</label>
                    <select name="shop" required>
                        <option value="">Select Shop</option>
                        ${this.shops.map(shop=>`<option value="${shop.shopId}" ${shop.shopId==this.selectedShop?' selected':''}>${shop.name}</option>`).join("")}
                    </select>
                </div>
                <div class="formField">
                    <label>Theme</label>
                    <select name="themes" class="${this.themes.length<1?'hidden':''} ${this.selectedTheme?'':'unselected'}" required>
                        <option value="">Select theme</option>
                        ${this.themes.map(theme=>`<option value="${theme.themeId}" ${this.selectedTheme==theme.themeId?' selected':''}>${theme.name}</option>`).join("")}
                    </select>
                </div>
            </div>
            <div class="formRow requires-theme">
                <div class="formField">
                    <label>Deploying Files</label>
                    <div class="files-to-deploy">
                        ${FileFolders.collectFilenames().map(file=>`<div class="deploy-file">${file}</div>`).join("")}
                    </div>
                </div>
            </div>
            <div class="formRow requires-theme">
                <div class="formField">
                    <label>Apply Template Transforms</label>
                    <div class="applyTransforms">
                        ${this.rules.map(rule=>`
                            <div class="selector">
                                <label for="rule-${rule.id}">
                                   <div class="on"><img src="/static/img/checkbox-on.png"></div>
                                    <div class="off"><img src="/static/img/checkbox-off.png"></div>
                                    <div>${rule.ruleName} on ${rule.filePath}</div>
                                    <input type="checkbox" id="rule-${rule.id}" data-file-path="${rule.filePath}" name="rule" value="${rule.id}" ${this.selectedRules.includes(rule.id)?'checked':''}>
                                </label>
                            </div>
                        `).join("")}    
                    </div>
                    
                </div>
            </div>
        `
    }
    buttons() {
        return [
            [
                {type:"submit",label:"Deploy",action:"deploy-files",class:"deploy-files requires-theme"}    
            ]
        ]
    }
    loadThemes(shopId) {
        this.loaded(false);
        this.get(`/shops/themes/${this.selectedShop}`).then(response=>{
            this.themes = response.themeList
            this.render()
        })
    }
    formName() {
        return "deployForm";
    }
    setupEvents() {
        super.setupEvents()
        if (this.selectedShop && !this.themes.length) {
            
            setTimeout(
                ()=>{
                    this.loadThemes(this.selectedShop);
                }
            )
            
        }
        this.formTarget().querySelector('select[name="shop"]').addEventListener("change",event=>{
            var select = event.target;
            this.selectedShop = select.options[select.selectedIndex].value
            this.selectedTheme = null;
            this.loaded(false)
            this.loadThemes(this.selectedShop)
        })
        this.formTarget().querySelector('select[name="themes"]').addEventListener("change",event=>{
            var select = event.target;
            if (select.options[select.selectedIndex].value) {
                this.selectedTheme = select.options[select.selectedIndex].value;
                if (this.rules.length<1) {
                    this.get("/rules/active").then(response=>{
                        console.error(response)
                        this.rules = response.rules;
                        this.render()
                    }).catch(error=>this.showError(error.message))
                } else {
                    this.render()
                }

                select.classList.remove("unselected")
            } else {
                select.classList.add("unselected")
            }
        })
        this.listenFor(
            "deploy-files",
            event=>{
                
                this.deploy()
            }
        )
        this.formTarget().addEventListener(
             "ywm:deploy:render",event=>{
                this.render()
             }
        )
        this.formTarget().querySelectorAll('[name="rule"]').forEach(rule=>rule.addEventListener("change",event=>{
            if (rule.checked) {
                this.selectedRules.push(rule.value)
            } else {
                this.selectedRules = this.selectedRules.filter(selectedRule=>rule!=rule.value)
            }
        }))
    }
    deploy() {
        let getSelectDetail = (selector)=>{
            try {
                let select = document.querySelector(`select[name="${selector}"]`)
                let selectedOption = select.options[select.selectedIndex]
                return {
                    name:selectedOption.textContent,
                    id:selectedOption.value
                };
            } catch(e) {
                return {name:"N/A",id:""}
            }
        };
        let shop = getSelectDetail("shop")
        let theme = getSelectDetail("themes");
        let queue = Array.from(
                document.querySelectorAll('.sidebar-options.files input[name="fileId"]:checked')
            ).map(file=>{
                return {
                    "type":"file",
                    "file":{
                        "name":file.dataset.fileName,
                        "id":file.value
                    },
                    "shop":getSelectDetail("shop"),
                    "theme":getSelectDetail("themes")
                }
            });
        Array.from(this.formTarget().querySelectorAll('[name="rule"]:checked')).forEach(input=>{
            queue.push(
                {
                    "type":"rule",
                    "rule":{
                        "id":input.value,
                        "filePath":input.dataset.filePath
                    },
                    "shop":getSelectDetail("shop"),
                    "theme":getSelectDetail("themes")
                }
            )
        })
        
        if (queue.length<1) {
            this.showError("You must select at least one file or file transform to continue")
            return;
        }
        console.error(queue);
        return;
        let taskOptions = {
            queue:queue,
            id:"deploy-queue",
            owner:this.formTarget(),
        }
        this.formTarget().addEventListener(
            "deploy-queue-complete",
            event=>{
                this.formTarget().classList.remove("track-progress")
            }
        )
        this.listenFor(
            "deploy-queue-complete",
            (event)=>{
                
            }
        )
        let deployQueue = new DepoymentQueue(taskOptions);
    }
    
    
    handleResponse(response,formData) {
        this.fileDetails = response.fileContents
        this.ojbjectId = this.fileDetails.id;
        this.loadFolders(this.fileDetails.collection,this.fileId)
        document.querySelector("#formHeader").textContent = 
        history.replaceState(null, "", `/files?fileId=${this.fileId}`);
    }
}

class DepoymentQueue extends TaskQueue {
    constructor(options) {
        super(options);
    }
    title() {
        return "Deploying files";
    }
    finalize() {
        this.target.querySelector(".progress-text").textContent = "Deployment Complete"
        
        setTimeout(()=>{
            
            this.options.owner.dispatchEvent(
                new CustomEvent(
                    `${this.options.id}-complete`
                )
            )
        },1000)

    }
    taskDescription() {
        /*
        if (this.queue.length<1) {
            if(!this.currentItem) {
                return "Starting deployment..."
            }
            return `Deploying files to ${this.currentItem.shop.name} completed`
        }
            */
        if (this.currentItem) {
            return `<div class="headline">deploying ${this.currentItem.file.name}</div> <div class="subtitle">${this.currentItem.shop.name} (${this.currentItem.theme.name})</div>`
        }
        

        return 'Starting deployment...'
        
    }
    processTaskTest(item) {
        
        
        setTimeout(()=>{
            this.nextTask()
        },2000)
    }
    processTask(item) {
        this.post(
            "/deploy/execute",
            {
                fileId:item.file.id,
                shopId:item.shop.id,
                themeId: item.theme.id
            }
        ).then(response=>{
            
            this.nextTask()
        }).catch(error=>this.showError(error.message))
    }
    
}