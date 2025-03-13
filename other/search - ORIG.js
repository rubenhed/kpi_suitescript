/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */

define(['N/ui/serverWidget', 'N/record', 'N/file', 'N/search', 'N/runtime'], (serverWidget, record, file, search, runtime) => {
    const render = (params) => {
        const portlet = params.portlet;
        portlet.title = "get saved search test";

        const results = search.create({
            type: 'CUSTOMRECORD_FORMATC',
            filters: [
                ["custrecord_formatc_totalling_account", 'is', "9"],
                "AND",
                ["custrecord_formatc_department", "is", "14"],
                "AND",
                ["custrecord_formatc_total", "is", "T"]
            ],
            columns: ['internalid', "created"]
        }).run().getRange({ start: 0, end: 10 });
        
        const mySearch = search.load({
            id: 'customsearch8693'
        });

        const item = results[0];


        portlet.html = `hello ${item.getValue('internalid')} ${item.getValue("created")} `;

        const user = runtime.getCurrentUser();
        const departmentRecord = record.load({
            type: record.Type.DEPARTMENT,
            id: user.department
        });
        portlet.html += departmentRecord.getValue('name');
        
        return

        const htmlFile = file.load({
            id: 'SuiteScripts/dashboard_custom/search/search.html'
        });
        let htmlContent = htmlFile.getContents();



        const rec = record.load({
            type: 'CUSTOMRECORD_FORMATC',
            id: 382875 // Revenues
        });

        htmlContent = load_record(record, 382875, htmlContent); // Revenues

        portlet.html = htmlContent;

    
        const monthActual = rec.getValue({ fieldId: 'custrecord_formatc_current_month_actual' });
        const monthBudget = rec.getValue({ fieldId: 'custrecord_formatc_current_month_budget' });
        const name = rec.getText({ fieldId: 'custrecord_formatc_totalling_account' });
        let monthDiff = {};
    }
        

    return { render };
});
