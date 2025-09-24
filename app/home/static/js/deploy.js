class ThemeFilesDeploy extends JsForm {
    constructor(options) {
        super(options)
        this.objectId = options.fileId||null;
        this.collectionId = options.collectionId||null;
        this.files = JSON.parse(this.options.selectedFiles);
        this.selectedShop = this.options.selectedShop;
        this.themes = []
        this.selectedTheme = null;
        this.shops = JSON.parse(this.options.shops);
        this.fileDetails = {};
        this.targetElement = ".jsapp";
        this.render(false)
        window.folderHandler = new FileFolders({collectionId:window.collectionId,files:this.files});
        if (this.activeShop) {
            this.loadThemes(this.activeShop)
        } else {
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
                        ${this.shops.map(shop=>`<option value="${shop.shopId}" ${shop.shopId==this.activeShop?' selected':''}>${shop.name}</option>`).join("")}
                    </select>
                </div>
                <div class="formField">
                    <label>Theme</label>
                    <select name="themes" class="${this.themes.length<1?'hidden':''}" required>
                        <option value="">Select theme</option>
                        ${this.themes.map(theme=>`<option value="${theme.themeId}">${theme.name}</option>`).join("")}
                    </select>
                </div>
            </div>
    `
    }
    buttons() {
        return [
            [
                {type:"submit",label:"Deploy",action:"deploy-files",class:"deploy-files"}
            ]
        ]
    }
    
    setupEvents() {
        super.setupEvents()
        this.formTarget().querySelector('select[name="shop"]').addEventListener("change",event=>{
            var select = event.target;
            this.activeShop = select.options[select.selectedIndex].value
            this.loaded(false)
            this.get(`/shops/themes/${this.activeShop}`).then(response=>{
                this.themes = response.themeList
                this.render()
            })
        })
        this.formTarget().querySelector('select[name="themes"]').addEventListener("change",event=>{
            var select = event.target;
        })
        this.listenFor(
            "deploy-files",
            event=>{
                let filesSelected = FileFolders.collectFiles()
                if (filesSelected.length<1) {
                    this.showError("no files selected!");
                    return;
                }
                console.error('found',filesSelected)
                
            }
        )

    }
    
    handleResponse(response,formData) {
        this.fileDetails = response.fileContents
        this.ojbjectId = this.fileDetails.id;
        this.loadFolders(this.fileDetails.collection,this.fileId)
        document.querySelector("#formHeader").textContent = 
        history.replaceState(null, "", `/files?fileId=${this.fileId}`);
    }
    
}