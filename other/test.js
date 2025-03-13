/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */


//'N/ui/serverWidget',  serverWidget, 
define(['N/search'], (search) => {
  let html = "";

  const render = (params) => {
    const portlet = params.portlet;

    portlet.title = 'KPI';
    portlet.html = html;
  };

  return {
    render: render,
  };
});
