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
    async post(url,content) {
        return window.fetch(
            url,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body:JSON.stringify(content)
            }
        )
        .then(response=>response.json())
    }

    gid2id(gid) {
        return parseInt(gid.split("/").pop())
    }
}

class EscModal extends Esc {
    static show(content,closeable=true) {
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
        if (closeable){
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
            }
          })
        } else {
          modal.querySelector(".close").style.display="none";
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