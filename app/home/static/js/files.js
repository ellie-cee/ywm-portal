class ThemeFileEditor extends JsForm {
    constructor(options) {
        super(options)
        this.target = document.querySelector(".jsapp");
        console.error(options)
        this.fileId = options.fileId||null;
        this.collectionId = options.collectionId||null
        this.fileDetails = {}
        if (this.fileId!=null && this.fileId!="") {
            this.get(`/files/load/${this.fileId}`).then(payload=>{
                switch(payload.status) {
                    case 200:
                        history.replaceState(null, "", `/files?fileId=${this.fileId}`);
                        this.fileDetails = payload
                        this.collectionId = payload.collection
                        if (document.querySelector(".sidebar-options.files").childElementCount<1) {
                            this.loadFolders(payload.collection,this.fileId)
                        }
                        this.render()
                        break;
                    case 404:
                        break;
                }
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
    closer() {
        return ()=>this.render()
    }
    render() {
        this.target.innerHTML = `
            <form id="fileForm" class="jsform">
                <div><h1 id="formHeader">${this.formHeader()}</h1></div>
                <input type="hidden" name="collectionId" value="${this.collectionId}">
                <div class="request-response"></div>
                <div class="formRow">
                    <div class="formField">
                        <label>Folder</label>
                        <div><input type="text" name="folder" value="${this.fileDetails.folder||""}" required></div>
                    </div>
                    <div class="formField">
                        <label>Filename</label>
                        <div><input type="text" name="fileName" value="${this.fileDetails.fileName||""}" required></div>
                    </div>
                </div>
                 
                <div>
                    <label>Contents</label>
                    <textarea name="contents" class="fileText" required>${this.fileDetails.contents||""}</textarea>
                </div>

                
                
                <div class="formfooter">
                    <div class="buttons">
                    <button class="crud-button">${this.fileId?"Update":"Create"}</button>
                    <button type="button" class="check-button requires-id">Recheck Scopes</button>
                    <button type="button" class="delete-button requires-id">Delete</button>
                    </div>
                </div>
            </form>
        `
        
        this.setfileId(this.fileId);
        
        document.querySelector("#fileForm").addEventListener("submit",event=>{
            event.preventDefault();
            event.stopPropagation()
            let formData = this.serializeForm(document.querySelector("#fileForm"))
            console.error(formData)
                this.post(
                    "/files/upsert",
                    formData
                ).then(response=>{
                    console.error(response)
                   this.handleResponse(response,formData)
                })
        })
        /*
        document.querySelector(".check-button").addEventListener("click",event=>{
            this.get(`/shops/recheck/${this.fileId}`).then(response=>{
                switch(response.status) {
                    case 404:
                        EscModal.show(
                        `
                            <h3>Warning</h3>
                            The credientials you have supplied are incomplete. Please make sure the following scopes are enabled:
                            <ul>${response.scopesMissing.map(scope=>`<li>${scope}</li>`).join("")}
                        `
                        );
                    break;
                    case 200:
                        EscModal.show(
                        `
                            <h3>Success</h3>
                            ${response.shop.shopName} has all the required scopes
                                `
                        )    
                    break;
                        
                }
            })
        })
        document.querySelector(".delete-button").addEventListener("click",event=>{
            let closeFunction = ()=>location.reload()
            this.get(`/shops/delete/${this.fileId}`).then(response=>{
                EscModal.show(
                    `
                    <h4>${this.fileDetails.shopName} deleted</h4>
                    `,
                    {onClose:()=>{
                        console.error
                        location.reload()
                    }}
                )
                
            })
        })
        */

    }
    handleResponse(response,formData) {
        this.fileDetails = response.fileContents
        this.fileId = this.fileDetails.id;
        this.loadFolders(this.fileDetails.collection,this.fileId)
        document.querySelector("#formHeader").textContent = `Editing ${response.fileContents.folder}/${response.fileContents.fileName}`
        history.replaceState(null, "", `/files?fileId=${this.fileId}`);
    }
    formHeader() {
        
        if (this.fileDetails.fileName) {
             return `Editing ${this.fileDetails.folder}/${this.fileDetails.fileName}`
        } else{
            return `Add File`
        }
    }
    setfileId(id) {
        if (id==null) {
            return
        }
        this.fileId = id;
        let form  = document.querySelector("#fileForm")
        let idInput = form.querySelector('[name="fileId]')
        
        if (idInput!=null) {
            idInput.value = id;
        } else {
            let input = document.createElement("input");
            input.type="hidden";
            input.name="fileId";
            input.value = id;
            form.appendChild(input)
        }

    }
}
