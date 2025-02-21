/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */

define(['N/ui/serverWidget', 'N/record', 'N/file', 'N/search', 'N/runtime'], (serverWidget, record, file, search, runtime) => {
    const render = (params) => {
        const portlet = params.portlet;
        portlet.title = "get saved search test";

        
        const mySearch = search.load({
            id: 'customsearch8693'
        });

        const results = mySearch.run().getRange({ start: 0, end: 100 });
        if (results.length === 0) {
            portlet.html = "<p>No results found.</p>";
            return;
        }
        portlet.html += "Results found";
        
        
        return
    }
        

    return { render };
});
