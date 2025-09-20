class Login extends JsForm {
    constructor(options) {
        super(options)
        this.options = options;
        this.target = document.querySelector(".jsapp");
        this.post(
            "/auth/login/status",
            {}
        ).then(response=>{
            console.error(response)
            switch(response.status) {
                case 404:
                    this.renderLoginForm()
                    break;
                case 200:
                    this.renderCodeForm(response)        
                    break;
                case 302:
                    location.ref = response.url;
                default:
                    this.renderLoginForm()
            }
        })
        let state = sessionStorage.getItem("loginState")
    }
    
    renderLoginForm() {
        this.target.innerHTML = `
            <form id="loginForm" class="jsform loginforms">
                <div><h1>Log In</h1></div>
                <div class="request-response"></div>
                <div>
                    <input type="email" placeholder="Enter your email address" name="email" required="true">
                    <button class="login-button">Log In</button>
                </div>
                
                <div class="formfooter"></div>
            </form>
        `
        document.querySelector("#loginForm").addEventListener("submit",event=>{
            event.preventDefault()
            this.post(
                "/auth/login",
                this.serializeForm(event.target)
            ).then(response=>{
                switch(response.status) {
                    case 200:
                        this.renderCodeForm(response)
                        break;
                    case 302:
                        location.href="/";
                    case 404:
                        this.showError(response.message)
                        break;
                }
            })
            
            console.error(payload)
        })
    }
    renderCodeForm(payload) {
        this.target.innerHTML = `
            <form id="validateCode" class="jsform loginforms">
                <div><h1>Log In</h1></div>
                <div>Please enter the code sent to ${payload.userEmail}</div>
                <div class="request-response"></div>
                <div>
                    <input type="text" placeholder="Enter login code" name="authCode" required="true">
                    <button class="validate-button">Validate Code</button>
                </div>
                
                <div class="formfooter">
                    <div class="buttons">
                        <button class="link codes" data-type="resend">Resend Code</button>
                        <button class="link codes" data-type="restart">User a different email address</button>
                    </div>
                </div>
            </form>
        `
        document.querySelector("#validateCode").addEventListener("submit",event=>{
            event.preventDefault();
            this.post(
                "auth/code/validate",
                this.serializeForm(event.target)
            ).then(response=>{
                    switch(response.status) {
                        case 302:
                            location.href=response.url;
                            break;
                        case 404:
                            this.showError(response.message);
                            break;
                    }
                }
            )
        })
        document.querySelectorAll(".link.codes").forEach(button=>{
            button.addEventListener("click",event=>{
                switch (event.target.dataset.type) {
                    case "resend":
                        this.post(
                            "/auth/code/resend",
                            {}
                        ).then(response=>{
                            this.showMessage("code resent")
                        })
                        break;
                    case "restart":
                        this.post(
                            "/auth/code/restart",
                            {}
                        ).then(response=>this.renderLoginForm())
                }

            })

            
        })
    }
}
console.error("hey now")