class ShopifySite extends JsForm {
    constructor(options) {
        super(options)
        this.target = document.querySelector(".jsapp");
        this.shopId = options.shopId;
        this.shopDetails = {}
        if (this.shopId!=null && this.shopId!="") {
            this.get(`/shops/load/${this.shopId}`).then(payload=>{
                switch(payload.status) {
                    case 200:
                        this.shopDetails = payload
                        this.render()
                        break;
                    case 404:
                        break;
                }
            })
        }
        this.render()
    }
    render() {
        this.target.innerHTML = `
            <form id="siteForm" class="jsform">
                <div><h1>Log In</h1></div>
                <div class="request-response"></div>
                <div class="formRow">
                    <div class="formField">
                        <label>Shop Name</label>
                        <div><input type="text" name="shopName" value="${this.shopDetails.shopName||""}" required></div>
                    </div>
                    <div class="formField">
                        <label>Shop Domain</label>
                        <div class="labelledInput"><input type="text" name="shopDomain" value="${this.shopDetails.shopDomain||""}" required>.myshopify.com</div>
                    </div>
                </div>
                 <div class="formRow">
                    <div class="formField">
                        <label>App Key</label>
                        <div><input type="text" name="appKey" value="${this.shopDetails.appKey||""}" required></div>
                    </div>
                    <div class="formField">
                        <label>Access Token</label>
                        <div class="labelledInput">
                            <input type="password" name="authToken" value="${this.shopDetails.authToken||""}" required>
                            <img src="/static/img/peek.png" data-for="authToken" class="peeker">
                        </div>
                    </div>
                </div>
                
                <div class="formfooter">
                    <div class="buttons">
                    <button class="crud-button">${this.shopId?"Update":"Create"}</button>
                    <button type="button" class="check-button requires-id">Recheck Scopes</button>
                    <button type="button" class="delete-button requires-id">Delete</button>
                    </div>
                </div>
            </form>
        `
        this.setShopId(this.shopId);
        document.querySelector(".peeker").addEventListener("click",event=>{
            let input = document.querySelector(`input[name="${event.target.dataset.for}"]`)
            if (input.type=="password") {
                input.type="text";
            } else {
                input.type="password";
            }
        })
        document.querySelector("#siteForm").addEventListener("submit",event=>{
            console.error(event.target)
            let formData = this.serializeForm(document.querySelector("#siteForm"))

            event.preventDefault();
            this.post(
                "/shops/upsert",
                formData
            ).then(response=>{
                this.handleResponse(response,formData)
            })
        })
        document.querySelector(".check-button").addEventListener("click",event=>{
            this.get(`/shops/recheck/${this.shopId}`).then(response=>{
                console.error(response)
                this.handleResponse(response,response.shop)
            })
        })
        document.querySelector(".delete-button").addEventListener("click",event=>{
            this.get(`/shops/delete/${this.shopId}`).then(response=>{
                location.reload()
            })
        })

    }
    handleResponse(response,formData) {
        let crudButton = document.querySelector(".crud-button")
        switch(response.status) {
            case 401:
                EscModal.show(
                    `
                        <h3>Error</h3>
                        The credentials you have supplied to ${formData.shopDomain}.myshopify.com are incorrect. Please check them and try again.
                    `
                )
                break;
            case 404:
                this.setShopId(response.shop.id)
                crudButton.textContent = "I have added the permissions"
                EscModal.show(
                    `
                        <h3>Warning</h3>
                        The credientials you have supplied are incomplete. Please make sure the following scopes are enabled:
                        <ul>${response.scopesMissing.map(scope=>`<li>${scope}</li>`).join("")}
                    `
                )
                break;
            case 200:
                if (this.shopId!=null && this.shopId!="") {
                    EscModal.show(
                        `
                        <h3>Success</h3>
                        ${formData.shopName} has all the required scopes
                        `
                    )    
                } else {
                    this.setShopId(response.shop.id)
                    EscModal.show(
                        `
                        <h3>Success</h3>
                        ${formData.shopName} has been updated successfully 
                        `
                    )
                }
                
                break;
        }

    }
    setShopId(id) {
        if (id==null) {
            return
        }
        this.shopId = id;
        let form  = document.querySelector("#siteForm")
        let idInput = form.querySelector('[name="shopId]')
        
        if (idInput!=null) {
            idInput.value = id;
        } else {
            let input = document.createElement("input");
            input.type="hidden";
            input.name="shopId";
            input.value = id;
            form.appendChild(input)
        }

    }
}
