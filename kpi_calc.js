/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */

MONTHS_TO_DISPLAY = 6;

define(['N/ui/serverWidget', 'N/search'], (serverWidget, search) => {
  let html = "";
  
  const getCapital = (savedSearchId) => { //正味運転資本額
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //65 items as of 20250220

    const finalResults = {};
    const orderedDates = [];
    let capitalTotal = 0;

    range.reverse().forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';

      const formulaCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;

      capitalTotal += parseFloat(formulaCurrencyMonth) || 0;
      
      finalResults[tranDate] = { capitalTotal };
      orderedDates.push(tranDate);
    });
    
    return [orderedDates.reverse(), finalResults]; //to here
  };

  const getAverage = (orderedDates, finalResults) => {
    //const capitalCurrency = capitalResults.map(capitalResults => capitalResults.formulaCurrencyTotal);
    const AVERAGE_PERIOD = 2;
    //const averageResults = {};
    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      const keys = orderedDates.slice(i, i + AVERAGE_PERIOD);
      const values = keys.map(key => finalResults[key]?.capitalTotal || 0);
      const sum = values.reduce((acc, value) => acc + value, 0);
      const capitalAverage = sum / AVERAGE_PERIOD; 
      //const average = capitalCurrency.slice(i, i + AVERAGE_PERIOD).reduce((acc, value) => acc + value, 0) / AVERAGE_PERIOD;
      finalResults[orderedDates[i]].capitalAverage = capitalAverage;
    }

    return finalResults;
  };

  const getInventory = (savedSearchId, finalResults) => { //棚卸資産
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //7 items as of 20250220

    const results = [];
    let inventoryCurrencyTotal = 0;

    range.reverse().forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';

      const formulaCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;

      inventoryCurrencyTotal += parseFloat(formulaCurrencyMonth) || 0;
      if (finalResults[tranDate]){
        finalResults[tranDate].inventory = inventoryCurrencyTotal;
      }
      

      //results.push({ tranDate, formulaCurrencyTotal });
    });
    
    return finalResults;
  };

  const getDepreciation = (savedSearchId, finalResults) => { //減価償却費
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //7 items as of 20250220

    range.forEach((result) => {
      const tranDate = result.getValue({ name: 'trandate', summary: search.Summary.GROUP }) || 'No Date found';

      const depreciationCurrencyMonth = result.getValue({ name: 'formulacurrency', summary: search.Summary.SUM }) || 0;

      //results.push({ tranDate, depreciationCurrencyMonth : parseFloat(depreciationCurrencyMonth) });
      if (finalResults[tranDate]){
        finalResults[tranDate].depreciation = parseFloat(depreciationCurrencyMonth);
      }
    });

    return finalResults;
  };

  const getCostOfGoods = (savedSearchId, finalResults) => { //売上原価and営業利益 id is 10 and 26
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //15 items as of 20250220

    range.forEach((result) => {
      const tranDate = result.getValue({ name: 'formulatext' }) || 'No Date found';

      const currentMonth = result.getValue({ name: 'custrecord_formatc_current_month_actual' }) || 0;
      

      //results.push(tranDate);
      if (finalResults[tranDate]){
        finalResults[tranDate].cog = currentMonth;
      }
    });
  }

  const getOperatingIncome = (savedSearchId, finalResults) => { //売上原価and営業利益 id is 10 and 26
    const mySearch = search.load({ id: savedSearchId });
    const resultSet = mySearch.run();
    const range = resultSet.getRange({ start: 0, end: 200 }); //15 items as of 20250220

    range.forEach((result) => {
      const tranDate = result.getValue({ name: 'formulatext' }) || 'No Date found';

      const currentMonth = result.getValue({ name: 'custrecord_formatc_current_month_actual' }) || 0;
      

      //results.push(tranDate);
      if (finalResults[tranDate]){
        finalResults[tranDate].oi = currentMonth;
      }
    });
  }

  const render = (params) => {
    const portlet = params.portlet;

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8705
    const capitalSavedSearchId = '8705';
    const [orderedDates, finalResults] = getCapital(capitalSavedSearchId);

    getAverage(orderedDates, finalResults);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8707
    const inventorySavedSearchId = '8707';
    getInventory(inventorySavedSearchId, finalResults);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8708
    const depreciationSavedSearchId = '8708';
    getDepreciation(depreciationSavedSearchId, finalResults);

    // dates = capitalResults.map(capitalResults => capitalResults.tranDate);

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8718
    const goodsCostSavedSearchId = '8718';
    getCostOfGoods(goodsCostSavedSearchId, finalResults);
    //portlet.html = test.join(', ');
    //return;

    // https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8719
    const operatingIncomeSavedSearchId = '8719';
    getOperatingIncome(operatingIncomeSavedSearchId, finalResults);


    // Create the HTML content with styling
    html += `
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid black;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>`;

    html += `<table>`;
    html += `<tr>
      <th>日付</th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8705" target="_blank">正味運転資本額</a></th>
      <th>正味運転資本額 (R12) (2 months)</th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8707" target="_blank">棚卸資産</a></th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8708" target="_blank">減価償却費</a></th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8718" target="_blank">売上原価</a></th>
      <th><a href="https://6317455.app.netsuite.com/app/common/search/searchresults.nl?searchid=8719" target="_blank">営業利益</a></th>
    </tr>`;

    for (let i = 0; i < MONTHS_TO_DISPLAY; i++) {
      const date = orderedDates[i];
      const result = finalResults[date];

      const capital = result.capitalTotal;
      const average = result.capitalAverage;
      const inventory = result.inventory;
      const depreciation = result.depreciation;
      const cog = result.cog;
      const oi = result.oi;

      html += `<tr>
        <td>${date}</td>
        <td>${capital?.toLocaleString()}¥</td>
        <td>${parseInt(average)?.toLocaleString()}¥</td>
        <td>${inventory?.toLocaleString()}¥</td>
        <td>${depreciation?.toLocaleString()}¥</td>
        <td>${parseInt(cog)?.toLocaleString()}¥</td>
        <td>${parseInt(oi)?.toLocaleString()}¥</td>
      </tr>`;
    }

    html += '</table>';

    portlet.title = 'KPI numbers';
    portlet.html = html;
  };

  return {
    render: render,
  };
});
