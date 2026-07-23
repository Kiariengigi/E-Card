var ProjectApp = ProjectApp || {};

// ── Top level — always listening, not inside any function ────────────────────
window.addEventListener("message", function (event) {
    if (!event.data || event.data.source !== "ProjectIframe") return;
    if (event.data.ready && ProjectApp._formContext) {
        console.log("IFRAME ready signal received — sending data now");
        ProjectApp.postToIframe(ProjectApp._formContext);
    }
});

// ── Store formContext globally so the listener above can reach it ─────────────
ProjectApp._formContext = null;

// ── postToIframe ─────────────────────────────────────────────────────────────
ProjectApp.postToIframe = function (formContext) {
    var iframeControl = formContext.getControl("WebResource_new_1");
    if (!iframeControl) {
        console.error("IFRAME control not found");
        return;
    }

    var iframeEl = iframeControl.getObject();
    if (!iframeEl || !iframeEl.contentWindow) {
        console.error("IFRAME element not ready");
        return;
    }

    var nameAttr      = formContext.getAttribute("cre85_project_name");
    var statusAttr    = formContext.getAttribute("kia_status");
    var budgetAttr    = formContext.getAttribute("kia_budget");
    var startDateAttr = formContext.getAttribute("kia_start_date");
    var customerAttr  = formContext.getAttribute("kia_customer");

    var payload = {
        source:       "ProjectFormJS",
        projectName:  nameAttr      ? nameAttr.getValue()                       : null,
        statusLabel:  statusAttr    ? (statusAttr.getSelectedOption()
                                        ? statusAttr.getSelectedOption().text
                                        : null)                                 : null,
        budget:       budgetAttr    ? budgetAttr.getValue()                     : null,
        startDate:    startDateAttr ? (startDateAttr.getValue()
                                        ? startDateAttr.getValue()
                                            .toLocaleDateString()
                                        : null)                                 : null,
        customerName: customerAttr  ? (customerAttr.getValue()
                                        ? customerAttr.getValue()[0].name
                                        : null)                                 : null
    };

    console.log("Sending payload to IFRAME:", payload);
    iframeEl.contentWindow.postMessage(payload, "*");
};

// ── OnLoad ───────────────────────────────────────────────────────────────────
ProjectApp.onLoad = function (executionContext) {
    var formContext = executionContext.getFormContext();

    // Store formContext globally so the top-level listener can use it
    ProjectApp._formContext = formContext;
    console.log("formContext stored — waiting for IFRAME ready signal");
};

// ── OnChange (Status) ────────────────────────────────────────────────────────
ProjectApp.onChange = function (executionContext) {
    var formContext = executionContext.getFormContext();
    ProjectApp._formContext = formContext;

    var statusAttr = formContext.getAttribute("kia_status");
    if (statusAttr && statusAttr.getSelectedOption()) {
        console.log("Status changed to:", statusAttr.getSelectedOption().text);
    }

    ProjectApp.postToIframe(formContext);
};

// ── OnSave ───────────────────────────────────────────────────────────────────
ProjectApp.onSave = function (executionContext) {
    var formContext = executionContext.getFormContext();
    var nameAttr = formContext.getAttribute("cre85_project_name");

    if (nameAttr && nameAttr.getValue() && nameAttr.getValue().length < 5) {
        executionContext.getEventArgs().preventDefault();
        alert("Cannot save: Project name must be at least 5 characters.");
        return;
    }

    ProjectApp.postToIframe(formContext);
    console.log("Form saved.");
};