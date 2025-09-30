class ThemeFileEditor extends JsForm {
    constructor(options) {
        super(options)
        this.objectId = options.fileId||null;
        this.collectionId = options.collectionId||null;
        this.fileDetails = {};
        this.targetElement = ".jsapp";
        this.render(false)
        
        if (this.hasObjectId()) {
            this.get(`/files/load/${this.objectId}`).then(payload=>{
                switch(payload.status) {
                    case 200:
                        history.replaceState(null, "", `/files?fileId=${this.fileId}`);
                        this.fileDetails = payload
                        this.collectionId = payload.collection;
                        //if (!document.querySelector("#fileFolder")) {
                            this.loadFolders(payload.collection,this.objectId)
                        //}
                        this.render()
                        break;
                    case 404:
                        break;
                }
            }).catch(error=>{
                this.showError(e.message)
            })
        }
        this.render()
    }
    loadFolders(collectionId,fileId) {
        document.dispatchEvent(
            new CustomEvent(
                "ywm:folders:load",
                {bubbles:true,detail:{collectionId:collectionId,fileId:fileId}}
            )
        )
    }
    folders() {
        return [
            "assets",
            "blocks",
            "config",
            "layout",
            "locales",
            "sections",
            "snippets",
            "templates",
            "templates/customer",
            "templates/metaobject"
        ]
    }
    formContents() {
        return `
            <input type="hidden" name="collectionId" value="${this.collectionId}">
            <div class="formRow">
                <div class="formField">
                    <label>Folder</label>
                    <div>
                        <select name="folder" required>
                            <option>Select Folder</option>
                            ${this.folders().map(folder=>`<option value="${folder}"${this.fileDetails.folder==folder?' selected':''}>${folder}</option>`).join("\n")}
                        </select>
                     </div>
                </div>
                <div class="formField">
                    <label>Filename</label>
                    <div><input type="text" name="fileName" value="${this.valueOf(this.fileDetails.fileName)}" required></div>
                </div>
            </div>
                
            <div>
                <label>Contents</label>
                <textarea name="contents" class="fileText" required>${this.valueOf(this.fileDetails.contents)}</textarea>
            </div>
            <div class="formRow">
                <div class="formField">
                    <label>Last Updated</label>
                    <div>
                        <input type="date" name="updated" value="${this.valueOf(this.fileDetails.updated)}">
                    </div>
                </div>
                <div class="checkboxField">
                    <label>&nbsp;</label>
                    <div class="selector">
                        <div>Common File</div>
                        <label for="isCommonFile">
                            <div class="on"><img src="/static/img/checkbox-on.png"></div>
                            <div class="off"><img src="/static/img/checkbox-off.png"></div>
                            <input type="checkbox" name="isCommonFile" value="1" id="isCommonFile" ${this.fileDetails.isCommonFile?'checked':''}>
                        </label>
                    </div>
                </div>
            </div>
            <div>
                <label>Github Link</label>
                <input type="text" name="githubLink" value="${this.valueOf(this.fileDetails.githubLink)}">
            </div>

            


    `
    }
    buttons() {
        return [
            [
                {type:"submit",label:"Create",action:"create-file",class:"create-only",type:"submit"},
                {type:"submit",label:"Save",action:"update-file",class:"requires-id"},
                {type:"button",label:"Delete",action:"delete-file",class:"requires-id delete"}
            ],
            [
                {type:"button",label:"Deploy",action:"deploy-file",class:"requires-id"}
            ]
        ]
    }
    fileExists(folder,fileName,fileId) {
        console.error(folder,fileName)
        try {
            let file = document.querySelector(`li.folder[data-name="${folder}"]`)
                .querySelector(`li.file[data-name="${fileName}"]`);
            if (file==null) {
                return false;
            }
                if (file.dataset.id==fileId) {
                    return false;
                } else {
                    return true;
                }
        } catch(e) {
            console.error(e);
            return false;
        }

    }
    setupEvents() {
        super.setupEvents()
        this.listenFor(
            "create-file",
            (event)=>{
                let formData = this.serializeForm(this.formTarget())
                if (this.fileExists(formData.folder,formData.fileName,formData.objectId)) {
                    this.showError(`${formData.folder}/${formData.fileName} already exists.`)
                    return;
                }
                this.loaded(false);
                this.post(
                    "/files/upsert",
                    formData
                ).then(response=>{
                    this.handleResponse(response,formData)
                }).catch(error=>this.showError(error.message))

            }
        )
        this.listenFor(
            "update-file",
            (event)=>{
                let formData = this.serializeForm(this.formTarget())
                if (this.fileExists(formData.folder,formData.fileName,formData.objectId)) {
                    this.showError(`${formData.folder}/${formData.filemName} already exists.`)
                    return;
                }
                this.loaded(false)
                
                this.post(
                    "/files/upsert",
                    formData
                ).then(response=>{
                    
                    this.handleResponse(response,formData)
                }).catch(error=>{
                    this.showError(error.message)
                })
            }
        )
        this.listenFor(
            "delete-file",
            (event)=>{
                 
                this.get(`/files/delete/${this.objectId}`).then(response=>{
                    this.showMessage(`${response.message} has been deleted`)
                    history.replaceState(null,"","/files");
                    this.loadFolders(this.collectionId)
                    setTimeout(
                        this.disappear(),
                        5000
                    )
                })
            }
        )
        this.listenFor(
            "deploy-file",
            event=>{

                let fileForm = document.querySelector("#fileFolder")
                fileForm.querySelectorAll(`input[name="fileId"]`).forEach(input=>{
                    if (input.value!=this.objectId) {
                        if (input.checked) {
                            input.checked = false;
                        }
                    } else {
                        input.checked=true;
                    }
                })
                let formData = this.serializeForm(this.formTarget())
                if (this.fileExists(formData.folder,formData.fileName,formData.objectId)) {
                    this.showError(`${formData.folder}/${formData.filemName} already exists.`)
                    return;
                }
                this.loaded(false)
                
                this.post(
                    "/files/upsert",
                    formData
                ).then(response=>{
                    
                    this.loaded()    
                    fileForm.submit()
                }).catch(error=>error.message)
                
            }
        )
    }
    formHeader() {
        print("formHeader")
        if (this.hasObjectId()) {
            return `Editing ${response.fileContents.folder}/${response.fileContents.fileName}`
        } else {
            return 'Create File';
        }
    }
    handleResponse(response,formData) {
        this.fileDetails = response.fileContents;
        this.objectId = response.fileContents.id;
        this.loadFolders(this.fileDetails.collection,this.fileId);
        window.setTimeout(
            ()=>{
                history.replaceState(null, "", `/files?fileId=${this.objectId}`);
                this.render()
            },1000
        )
        

    }
    formHeader() {
        
        if (this.fileDetails.fileName) {
             return `Editing ${this.fileDetails.folder}/${this.fileDetails.fileName}`
        } else{
            return `Add File`
        }
    }
}
class FileFolders extends Esc {
    constructor(options) {
        super(options);        
        this.options = options;
        this.files = this.options.files||[];
        document.querySelector(".sidebarHolder").querySelectorAll("[data-action-type]").forEach(button=>{
            
            switch(button.dataset.actionType) {
                
                case "create":
                    window.fileEditor = new ThemeFileEditor({collectionId:window.collectionId})
                    break;
                case "upload":
                    break;
                case "deploy":
                    break;       
            }
        })
       
        if (this.options.fileId) {
            window.fileEditor = new ThemeFileEditor({
                fileId:this.options.fileId,
                collectionId:this.options.collectionId
            })
            this.loadFolders()
        } else {
            this.loadFolders(null,this.collectionId)
        }
    }
    formTarget() {
        return document.querySelector("#fileFolder")
    }
    target() {
        return document.querySelector(".sidebar-options.files")
    }
    loadFolders(fileId,collectionId) {
        window.fetch(
            `/files/folders/${this.options.collectionId}`).then(response=>response.json()).then(response=>{
                
                this.render(response,fileId)
            }).catch(error=>{
                this.showError(error.message)
            })
    }
    autoUncheckable(file) {
        if (file.isCommonFile) {
            if (file!=this.options.selectedFile || !this.options.explicitFiles.includes(file.id)) {
                return true;
            }
        }
        return false
    }
    render(response,fileId) {
        
        let filesList = document.querySelector(".sidebarHolder");
        if (filesList) {
            filesList.innerHTML = `
                <form id="fileFolder" method="post" action="/deploy/files">
                <input type='hidden' name="csrfmiddlewaretoken" value="${document.querySelector('[name="csrfmiddlewaretoken"]').value}">
                    ${Esc.sortArrayofObjects(response.files,"folder").map(folder=>`
                <ul class="ul sidebar-options files">
                    <li class="folder open" data-collection-id="${this.options.collectionId}" data-name="${folder.folder}">
                        <div class="iconDiv">
                            <div class="clicker"><img src="/static/img/folder.png"></div>
                            <div class="label">${folder.folder}</div>
                        </div>
                        <ul class="fileList">
                        ${Esc.sortArrayofObjects(folder.files,"fileName").map(file=>`
                            <li class="file ${file.id==fileId?'selected':''}" data-name="${file.fileName}" data-id="${file.id}">
                                    <div class="selector">
                                    <label for="${file.id}">
                                        <div class="on"><img src="/static/img/checkbox-on.png"></div>
                                        <div class="off"><img src="/static/img/checkbox-off.png"></div>
                                        <input type="checkbox" name="fileId" value="${file.id}" class="${this.autoUncheckable(file)?'autoUncheck':''}" id="${file.id}" data-file-name="${folder.folder}/${file.fileName}" ${this.files.includes(file.id)?'checked':''}>
                                    </label>
                                    </div>
                                    <div class="name ${file.isCommonFile?' common-file':''}" id="${file.id}" data-file-id="${file.id}" data-collection-id="${ file.collection}" data-binary="${file.binaryFile}">
                                        ${file.fileName}
                                    </div>
                                </div>
                            </li>`).join('')}
                        </ul>
                    </li>
                </ul>`).join("")}
                </form>
            `
        }
        this.setupEvents()

    }
    setupEvents() {
        this.formTarget().addEventListener("ywm:folders:load",(event=>{
            this.fileId = null;
            this.loadFolders(event.detail.fileId,event.detail.collectionId)
        }))
        
        this.formTarget().addEventListener("ywm:folders:collect-files",event=>{
            document.dispatchEvent(
                new CustomEvent(
                    "ywm:folders:files-collected",
                    {
                        detail:this.target().querySelectorAll("input:checked").map(check=>check.value),
                        bubbles:true
                    }
                )
            )
        })
        this.formTarget().addEventListener("ywm:folders:uncheck",event=>{
            this.formTarget().querySelectorAll(".autoUncheck").forEach(file=>{
                if (!this.options.explicitFiles.includes(file.value))
                file.checked=!file.checked;
            })
        })
        let folders = Array.from(document.querySelectorAll("li.folder"));
        document.querySelectorAll("li.folder").forEach((folder,index)=>{
        
            folder.querySelector(".clicker").addEventListener("click",(event)=>{
        
                folder.classList.toggle("open")
            });
            folder.querySelectorAll("li.file .name").forEach(file=>file.addEventListener("click",event=>{
                event.stopPropagation()
                document.dispatchEvent(
                    new CustomEvent(
                        "ywm:file:selected",
                        {bubbles:true,detail:file}
                    )
                )
            }))
        })
    }
    static collectFiles() {
        return Array.from(document.querySelectorAll("#fileFolder input:checked")).map(checked=>checked.value)

    }
}
